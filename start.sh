#!/bin/bash

echo "Starting Aizen..."

cd backend || exit 1
if [ -d "../venv" ]; then
  ../venv/Scripts/python.exe app.py &
else
  python app.py &
fi
BACKEND_PID=$!
cd ..

cd aizen/frontend || exit 1
npm run dev &
FRONTEND_PID=$!
cd ../..

echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:5000"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
