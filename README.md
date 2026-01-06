# AI Development Assistant

An intelligent development platform that provides AI-powered code generation, debugging, planning, and testing capabilities through specialized agents.

## Features

- **🤖 Multi-Agent Architecture**: Specialized AI agents for different development tasks
- **💻 Code Generator**: Generate clean, production-ready code in multiple languages
- **🐛 Smart Debugger**: Analyze and fix code issues with AI assistance
- **📋 Project Planner**: Create comprehensive project plans and architecture designs
- **🧪 Test Generator**: Generate comprehensive test suites automatically
- **🌐 Web Interface**: User-friendly frontend for all agent interactions

## Tech Stack

- **Backend**: Python, Flask, OpenAI API
- **Frontend**: HTML, CSS, JavaScript
- **AI**: OpenAI GPT models for intelligent assistance

## Quick Start

### Prerequisites

- Python 3.8+
- OpenAI API key
- Virtual environment (recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-development-assistant
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Configure environment**
   - Copy `backend/.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

5. **Start the application**
   ```bash
   start.bat  # Windows
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5000`

## Usage

### Code Generator
- Describe what you want to build
- Select programming language and framework
- Get clean, documented code with explanations

### Debugger
- Paste problematic code
- Add error messages (optional)
- Receive detailed analysis and fixes

### Project Planner
- Describe your project idea
- Get comprehensive plans with architecture, timeline, and implementation steps

### Test Generator
- Input your code
- Select testing framework
- Generate comprehensive test suites with edge cases

## Project Structure

```
├── backend/           # Python Flask backend
│   ├── agents/        # AI agent implementations
│   ├── utils/         # Shared utilities
│   ├── app.py         # Main Flask application
│   └── requirements.txt
├── frontend/          # Web interface
│   ├── index.html     # Main HTML page
│   ├── script.js      # JavaScript functionality
│   └── style.css      # Styling
├── generated_projects/ # Output directory
└── venv/              # Virtual environment
```

## API Endpoints

- `POST /api/generate` - Generate code
- `POST /api/debug` - Debug code issues
- `POST /api/plan` - Create project plans
- `POST /api/test` - Generate tests

## Configuration

Environment variables in `backend/.env`:

- `FLASK_APP`: Flask application entry point
- `FLASK_ENV`: Environment (development/production)
- `FLASK_DEBUG`: Debug mode (True/False)
- `PORT`: Server port (default: 5000)
- `OPENAI_API_KEY`: Your OpenAI API key (required)

## Development

### Adding New Agents

1. Create new agent in `backend/agents/`
2. Implement required methods
3. Add API endpoints in `app.py`
4. Update frontend interface

### Extending Functionality

- Agents are modular and easily extensible
- Shared utilities in `backend/utils/`
- Frontend components are reusable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information

---

**Note**: Make sure to keep your OpenAI API key secure and never commit it to version control.
