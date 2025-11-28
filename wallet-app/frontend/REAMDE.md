# Here are your Instructions
-- PARA QUE SE CORRA EL PROGRAMA DOS OPCIONES
-- Opción 1: Correr ambos en terminales separadas (recomendado)
// cd C:TU CARPETA DONDE LO TENGAS
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python server.py

-- Opción 2: Terminal en el frontend:
// cd C:TU CARPETA DONDE LO TENGAS
npm install
npm start

Opción 2: Usar VS Code Tasks (más elegante)
// Se crea un archivo tasks.json para ejecutar ambos automáticamente:
(.vscode/tasks.json)
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Backend - FastAPI",
      "type": "shell",
      "command": "cd ${workspaceFolder}\\backend; .\\venv\\Scripts\\Activate.ps1; python server.py",
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^.*$",
          "file": 1,
          "location": 2,
          "message": 3
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "^.*Uvicorn running.*",
          "endsPattern": "^.*Application startup complete.*"
        }
      },
      "group": {
        "kind": "build",
        "isDefault": false
      }
    },
    {
      "label": "Frontend - React",
      "type": "shell",
      "command": "cd ${workspaceFolder}\\frontend; npm start",
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^.*$",
          "file": 1,
          "location": 2,
          "message": 3
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "^.*webpack compiled.*",
          "endsPattern": "^.*Compiled successfully.*"
        }
      },
      "group": {
        "kind": "build",
        "isDefault": false
      }
    },
    {
      "label": "Run All (Backend + Frontend)",
      "dependsOn": ["Backend - FastAPI", "Frontend - React"],
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}


DEPENDENCY

# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*