from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Import agents
from agents.coder import CoderAgent
from agents.debugger import DebuggerAgent
from agents.planner import PlannerAgent
from agents.tester import TesterAgent
from agents.reviewer import ReviewerAgent
from agents.optimizer import OptimizerAgent
from agents.documenter import DocumenterAgent

# Initialize agents
coder = CoderAgent()
debugger = DebuggerAgent()
planner = PlannerAgent()
tester = TesterAgent()
reviewer = ReviewerAgent()
optimizer = OptimizerAgent()
documenter = DocumenterAgent()

@app.route('/test')
def test_page():
    try:
        with open('../frontend/test.html', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return "Test page not found", 404

@app.route('/')
def index():
    try:
        with open('../frontend/index.html', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return "Frontend files not found", 404

@app.route('/style.css')
def serve_css():
    try:
        with open('../frontend/style.css', 'r', encoding='utf-8') as f:
            response = app.response_class(
                f.read(),
                mimetype='text/css'
            )
            return response
    except FileNotFoundError:
        return "CSS file not found", 404

@app.route('/script.js')
def serve_js():
    try:
        with open('../frontend/script.js', 'r', encoding='utf-8') as f:
            response = app.response_class(
                f.read(),
                mimetype='application/javascript'
            )
            return response
    except FileNotFoundError:
        return "JS file not found", 404

@app.route('/api/generate', methods=['POST'])
def generate_code():
    data = request.json
    prompt = data.get('prompt', '')
    
    try:
        result = coder.generate_code(prompt)
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/debug', methods=['POST'])
def debug_code():
    data = request.json
    code = data.get('code', '')
    error = data.get('error', '')
    
    try:
        result = debugger.debug_code(code, error)
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/plan', methods=['POST'])
def plan_project():
    data = request.json
    description = data.get('description', '')
    
    try:
        result = planner.create_plan(description)
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/review', methods=['POST'])
def review_code():
    data = request.json
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    try:
        result = reviewer.review_code(code, language)
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/optimize', methods=['POST'])
def optimize_code():
    data = request.json
    code = data.get('code', '')
    language = data.get('language', 'python')
    optimization_type = data.get('optimization_type', 'performance')
    
    try:
        result = optimizer.optimize_code(code, language, optimization_type)
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/document', methods=['POST'])
def document_code():
    data = request.json
    code = data.get('code', '')
    language = data.get('language', 'python')
    doc_type = data.get('doc_type', 'comprehensive')
    
    try:
        result = documenter.generate_documentation(code, language, doc_type)
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/security', methods=['POST'])
def security_audit():
    data = request.json
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    try:
        result = reviewer.security_audit(code, language)
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/complexity', methods=['POST'])
def analyze_complexity():
    data = request.json
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    try:
        result = optimizer.analyze_complexity(code, language)
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)