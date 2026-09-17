# Technology Stack

## Backend
- **Language**: Python
- **Framework**: Flask
- **Architecture**: Single API service with a project-builder service layer
- **Model Provider**: Groq API when `GROQ_API_KEY` is configured

## Frontend
- **Framework**: React
- **Tooling**: Vite
- **State**: Zustand
- **Styling**: Tailwind + custom CSS theme

## Development Environment
- **Python Environment**: `venv/`
- **Frontend Runtime**: Node.js
- **Configuration**: `.env` in `backend/`

## Common Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd aizen/frontend
npm install
npm run dev
```

### Full App
```bash
start.bat
```

## Code Organization
- Backend generation logic lives in `backend/services/`
- Shared backend helpers live in `backend/utils/`
- Frontend UI lives in `aizen/frontend/src/components/`
- Frontend state and API wiring live in `aizen/frontend/src/store/` and `aizen/frontend/src/config/`
