# Project Structure

## Root Directory
```
├── backend/            # Active Flask API and generation services
├── aizen/frontend/     # Active React frontend
├── workspace/          # Latest generated project output
├── venv/               # Python virtual environment
├── .kiro/              # Kiro IDE steering
├── .vscode/            # VS Code settings
├── README.md           # Project documentation
├── start.bat           # Windows startup script
└── start.sh            # Shell startup script
```

## Backend Structure
```
backend/
├── services/           # Project builder and generation logic
├── utils/              # Shared backend utilities
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
└── .env                # Environment variables
```

## Frontend Structure
```
aizen/frontend/
├── src/
│   ├── components/     # UI components
│   ├── hooks/          # Frontend behavior hooks
│   ├── store/          # Zustand stores
│   ├── config/         # API configuration
│   ├── App.jsx         # Main app shell
│   └── index.css       # Global theme
├── package.json
└── vite.config.js
```

## Conventions
- Keep one active backend: `backend/`
- Keep one active frontend: `aizen/frontend/`
- Generated output belongs in `workspace/`
- Prefer service-oriented backend code over scattered agent modules
- Remove duplicate product surfaces instead of maintaining parallel stacks
