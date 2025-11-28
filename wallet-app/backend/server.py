from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from openpyxl import Workbook
from io import BytesIO
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="No se pudo validar el token")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    type: str  # "income" or "expense"
    amount: float
    category: str
    description: str
    date: str

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    amount: float
    category: str
    description: str
    date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Summary(BaseModel):
    total_income: float
    total_expense: float
    balance: float

class EmailReportRequest(BaseModel):
    email: EmailStr

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token({"sub": user.id, "email": user.email})
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Verify password
    if not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Create token
    token = create_access_token({"sub": user['id'], "email": user['email']})
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name']
        }
    }

# Transaction Routes
@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(user_id: str = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    for tx in transactions:
        if isinstance(tx.get('created_at'), str):
            tx['created_at'] = datetime.fromisoformat(tx['created_at'])
    
    # Sort by date (most recent first)
    transactions.sort(key=lambda x: x['date'], reverse=True)
    
    return transactions

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate, user_id: str = Depends(get_current_user)):
    transaction = Transaction(
        user_id=user_id,
        **transaction_data.model_dump()
    )
    
    tx_dict = transaction.model_dump()
    tx_dict['created_at'] = tx_dict['created_at'].isoformat()
    
    await db.transactions.insert_one(tx_dict)
    
    return transaction

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, user_id: str = Depends(get_current_user)):
    result = await db.transactions.delete_one({"id": transaction_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    
    return {"message": "Transacción eliminada"}

@api_router.delete("/transactions/reset/all")
async def reset_transactions(user_id: str = Depends(get_current_user)):
    result = await db.transactions.delete_many({"user_id": user_id})
    
    return {"message": f"{result.deleted_count} transacciones eliminadas"}

@api_router.get("/transactions/summary", response_model=Summary)
async def get_summary(user_id: str = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    total_income = sum(tx['amount'] for tx in transactions if tx['type'] == 'income')
    total_expense = sum(tx['amount'] for tx in transactions if tx['type'] == 'expense')
    balance = total_income - total_expense
    
    return Summary(
        total_income=total_income,
        total_expense=total_expense,
        balance=balance
    )

@api_router.get("/transactions/export")
async def export_transactions(user_id: str = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    # Sort by date
    transactions.sort(key=lambda x: x['date'], reverse=True)
    
    # Create workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Transacciones"
    
    # Headers
    ws.append(["Fecha", "Tipo", "Categoría", "Descripción", "Monto (USD)"])
    
    # Data
    for tx in transactions:
        ws.append([
            tx['date'],
            "Ingreso" if tx['type'] == 'income' else "Gasto",
            tx['category'],
            tx['description'],
            tx['amount']
        ])
    
    # Summary
    ws.append([])
    total_income = sum(tx['amount'] for tx in transactions if tx['type'] == 'income')
    total_expense = sum(tx['amount'] for tx in transactions if tx['type'] == 'expense')
    balance = total_income - total_expense
    
    ws.append(["RESUMEN"])
    ws.append(["Total Ingresos", "", "", "", total_income])
    ws.append(["Total Gastos", "", "", "", total_expense])
    ws.append(["Balance", "", "", "", balance])
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=transacciones.xlsx"}
    )

@api_router.post("/transactions/email-report")
async def email_report(email_data: EmailReportRequest, user_id: str = Depends(get_current_user)):
    try:
        # Get user
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Get transactions
        transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
        transactions.sort(key=lambda x: x['date'], reverse=True)
        
        # Create Excel
        wb = Workbook()
        ws = wb.active
        ws.title = "Transacciones"
        
        ws.append(["Fecha", "Tipo", "Categoría", "Descripción", "Monto (USD)"])
        
        for tx in transactions:
            ws.append([
                tx['date'],
                "Ingreso" if tx['type'] == 'income' else "Gasto",
                tx['category'],
                tx['description'],
                tx['amount']
            ])
        
        ws.append([])
        total_income = sum(tx['amount'] for tx in transactions if tx['type'] == 'income')
        total_expense = sum(tx['amount'] for tx in transactions if tx['type'] == 'expense')
        balance = total_income - total_expense
        
        ws.append(["RESUMEN"])
        ws.append(["Total Ingresos", "", "", "", total_income])
        ws.append(["Total Gastos", "", "", "", total_expense])
        ws.append(["Balance", "", "", "", balance])
        
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        # Send email via SendGrid
        message = Mail(
            from_email=os.environ.get('SENDGRID_FROM_EMAIL'),
            to_emails=email_data.email,
            subject=f'Reporte de Transacciones - Wallet',
            html_content=f'''<html><body>
                <h2>Hola {user['name']},</h2>
                <p>Adjunto encontrarás tu reporte de transacciones.</p>
                <h3>Resumen:</h3>
                <ul>
                    <li><strong>Total Ingresos:</strong> ${total_income:.2f}</li>
                    <li><strong>Total Gastos:</strong> ${total_expense:.2f}</li>
                    <li><strong>Balance:</strong> ${balance:.2f}</li>
                </ul>
                <p>Gracias por usar nuestra Wallet.</p>
            </body></html>'''
        )
        
        # Attach Excel file
        encoded_file = base64.b64encode(output.read()).decode()
        attached_file = Attachment(
            FileContent(encoded_file),
            FileName('transacciones.xlsx'),
            FileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
            Disposition('attachment')
        )
        message.attachment = attached_file
        
        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        
        return {"message": "Reporte enviado exitosamente", "status": response.status_code}
    
    except Exception as e:
        logging.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al enviar el email: {str(e)}")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()