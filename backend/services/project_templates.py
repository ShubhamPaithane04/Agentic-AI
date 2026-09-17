# -*- coding: utf-8 -*-
"""
Project Templates Service
Pre-built project scaffolds for quick generation
"""

TEMPLATES = {
    'react_app': {
        'name': 'React Todo App',
        'description': 'Modern React application with hooks',
        'files': {
            'package.json': '''{
  "name": "react-todo-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}''',
            'App.jsx': '''import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');

  const addTask = () => {
    if (input.trim()) {
      setTasks([...tasks, { id: Date.now(), text: input, done: false }]);
      setInput('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? {...t, done: !t.done} : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="app">
      <h1>📝 My Tasks</h1>
      <div className="input-group">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && addTask()}
          placeholder="Add a new task..."
        />
        <button onClick={addTask}>Add</button>
      </div>
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className={task.done ? 'done' : ''}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(task.id)}
            />
            <span>{task.text}</span>
            <button onClick={() => deleteTask(task.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}''',
            'App.css': '''.app {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

button {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

button:hover {
  background: #0056b3;
}

.task-list {
  list-style: none;
  padding: 0;
}

.task-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8f9fa;
  margin-bottom: 8px;
  border-radius: 8px;
}

.task-list li.done span {
  text-decoration: line-through;
  opacity: 0.6;
}

.task-list li button {
  margin-left: auto;
  padding: 4px 12px;
  background: #dc3545;
}'''
        }
    },
    'flask_api': {
        'name': 'Flask REST API',
        'description': 'RESTful API with database',
        'files': {
            'app.py': '''from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

def init_db():
    conn = sqlite3.connect('tasks.db')
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            completed BOOLEAN DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    conn = sqlite3.connect('tasks.db')
    c = conn.cursor()
    c.execute('SELECT * FROM tasks')
    tasks = [{'id': row[0], 'title': row[1], 'completed': bool(row[2])} for row in c.fetchall()]
    conn.close()
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.json
    conn = sqlite3.connect('tasks.db')
    c = conn.cursor()
    c.execute('INSERT INTO tasks (title) VALUES (?)', (data['title'],))
    conn.commit()
    task_id = c.lastrowid
    conn.close()
    return jsonify({'id': task_id, 'title': data['title'], 'completed': False}), 201

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = sqlite3.connect('tasks.db')
    c = conn.cursor()
    c.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()
    return '', 204

if __name__ == '__main__':
    app.run(debug=True, port=5000)
''',
            'requirements.txt': '''Flask==2.3.2
Flask-CORS==4.0.0
''',
            'README.md': '''# Flask REST API

## Setup
```bash
pip install -r requirements.txt
python app.py
```

## Endpoints
- GET /api/tasks - List all tasks
- POST /api/tasks - Create task
- DELETE /api/tasks/:id - Delete task
'''
        }
    },
    'express_api': {
        'name': 'Express.js API',
        'description': 'Node.js REST API with MongoDB',
        'files': {
            'server.js': '''const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let tasks = [];
let nextId = 1;

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const task = {
    id: nextId++,
    title: req.body.title,
    completed: false
  };
  tasks.push(task);
  res.status(201).json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  tasks = tasks.filter(t => t.id !== parseInt(req.params.id));
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
''',
            'package.json': '''{
  "name": "express-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}''',
            'README.md': '''# Express API

## Setup
```bash
npm install
npm start
```

## Endpoints
- GET /api/tasks
- POST /api/tasks
- DELETE /api/tasks/:id
'''
        }
    }
}

def get_template(template_id):
    """Get template by ID"""
    return TEMPLATES.get(template_id)

def list_templates():
    """List all available templates"""
    return [
        {
            'id': tid,
            'name': t['name'],
            'description': t['description']
        }
        for tid, t in TEMPLATES.items()
    ]
