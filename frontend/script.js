// AI Code Assistant - Simplified Interface JavaScript

const API_BASE = 'http://localhost:5000/api';

// State management
const state = {
    currentFeature: 'generator',
    isLoading: false
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupCharacterCounters();
});

function initializeApp() {
    // Setup feature toggle
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const feature = this.dataset.feature;
            switchFeature(feature);
        });
    });
}

function setupEventListeners() {
    // Auto-resize textareas
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', autoResizeTextarea);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function setupCharacterCounters() {
    // Code prompt counter
    const codePrompt = document.getElementById('code-prompt');
    const codeCounter = document.getElementById('code-prompt-counter');
    
    if (codePrompt && codeCounter) {
        codePrompt.addEventListener('input', function() {
            updateCharacterCounter(this, codeCounter, 2000);
        });
    }
}

function updateCharacterCounter(textarea, counter, maxLength) {
    const currentLength = textarea.value.length;
    counter.textContent = currentLength;
    
    if (currentLength > maxLength * 0.9) {
        counter.style.color = '#f59e0b';
    } else if (currentLength > maxLength) {
        counter.style.color = '#ef4444';
    } else {
        counter.style.color = '#94a3b8';
    }
}

function autoResizeTextarea(event) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
}

function switchFeature(featureName) {
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-feature="${featureName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Update feature sections
    document.querySelectorAll('.feature-section').forEach(section => {
        section.classList.remove('active');
    });
    const activeSection = document.getElementById(`${featureName}-section`);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Update state
    state.currentFeature = featureName;
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (state.currentFeature === 'generator') {
            generateCode();
        } else if (state.currentFeature === 'analyzer') {
            analyzeCode();
        }
    }
    
    // Number keys to switch features
    if (e.key === '1') {
        switchFeature('generator');
    } else if (e.key === '2') {
        switchFeature('analyzer');
    }
}

// Loading system
function showLoading(message = 'Processing your request...') {
    state.isLoading = true;
    const loadingOverlay = document.getElementById('loading');
    const loadingMessage = document.getElementById('loading-message');
    
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    state.isLoading = false;
    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Result display
function showResult(elementId, content, isError = false) {
    const resultContainer = document.getElementById(elementId);
    if (!resultContainer) return;
    
    if (isError) {
        resultContainer.innerHTML = `
            <div class="result-content">
                <div class="result-header">
                    <div class="result-title">
                        <span class="icon">❌</span>
                        Error
                    </div>
                </div>
                <div class="error-content">
                    <p>${content}</p>
                </div>
            </div>
        `;
    } else {
        resultContainer.innerHTML = content;
    }
    
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Toast notification system
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem 1.25rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        z-index: 1100;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    const icon = type === 'success' ? '✅' : 
                 type === 'error' ? '❌' : 
                 'ℹ️';
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span>${icon}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// API calls
async function makeAPICall(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'API request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw new Error(`Network error: ${error.message}`);
    }
}

// Code Generation
async function generateCode() {
    const prompt = document.getElementById('code-prompt')?.value.trim();
    const language = document.getElementById('language')?.value;
    const framework = document.getElementById('framework')?.value;
    const includeTypes = document.getElementById('include-types')?.checked;
    const includeComments = document.getElementById('include-comments')?.checked;
    const includeTests = document.getElementById('include-tests')?.checked;

    if (!prompt) {
        showToast('Please enter a description of what you want to build.', 'error');
        return;
    }

    showLoading('Generating your code...');

    try {
        const result = await makeAPICall('/generate', {
            prompt: prompt,
            language: language,
            framework: framework !== 'none' ? framework : null,
            options: {
                includeTypes,
                includeComments,
                includeTests
            }
        });

        if (result.success) {
            const content = formatCodeResult(result.result);
            showResult('code-result', content);
            showToast('Code generated successfully!', 'success');
        } else {
            showResult('code-result', result.error || 'Code generation failed', true);
            showToast('Code generation failed', 'error');
        }
    } catch (error) {
        showResult('code-result', error.message, true);
        showToast('Network error occurred', 'error');
    } finally {
        hideLoading();
    }
}

// Code Analysis
async function analyzeCode() {
    const code = document.getElementById('analyze-code')?.value.trim();

    if (!code) {
        showToast('Please enter code to analyze.', 'error');
        return;
    }

    showLoading('Analyzing your code...');

    try {
        const result = await makeAPICall('/review', {
            code: code,
            language: 'auto-detect'
        });

        if (result.success) {
            const content = formatAnalysisResult(result.result);
            showResult('analyze-result', content);
            showToast('Code analysis completed!', 'success');
        } else {
            showResult('analyze-result', result.error || 'Analysis failed', true);
            showToast('Analysis failed', 'error');
        }
    } catch (error) {
        showResult('analyze-result', error.message, true);
        showToast('Network error occurred', 'error');
    } finally {
        hideLoading();
    }
}

// Result formatting functions
function formatCodeResult(result) {
    // Safety check for result object
    if (!result || typeof result !== 'object') {
        return '<div class="result-content"><p>No code result available</p></div>';
    }
    
    const code = result.code || '';
    const language = result.language || 'text';
    const framework = result.framework || '';
    
    return `
        <div class="result-content">
            <div class="result-header">
                <div class="result-title">
                    <span class="icon code-icon"></span>
                    Generated Code
                </div>
                <div class="result-actions">
                    <button class="btn-copy" onclick="copyToClipboard('${escapeForAttribute(code)}')">
                        <span class="icon copy-icon"></span>
                    </button>
                    <button class="btn-download" onclick="downloadCode('${language}', '${escapeForAttribute(code)}')">
                        <span class="icon download-icon"></span>
                    </button>
                </div>
            </div>
            <div class="code-block">${escapeHtml(code)}</div>
            <div class="result-meta">
                <p><strong>Language:</strong> ${language}</p>
                ${framework ? `<p><strong>Framework:</strong> ${framework}</p>` : ''}
            </div>
        </div>
    `;
}

function formatAnalysisResult(result) {
    // Safety check for result object
    if (!result || typeof result !== 'object') {
        return '<div class="result-content"><p>No analysis result available</p></div>';
    }
    
    const review = result.review || '';
    
    return `
        <div class="result-content">
            <div class="result-header">
                <div class="result-title">
                    <span class="icon analyze-icon"></span>
                    Code Analysis
                </div>
                <div class="result-actions">
                    <button class="btn-copy" onclick="copyToClipboard('${escapeForAttribute(review)}')">
                        <span class="icon copy-icon"></span>
                    </button>
                </div>
            </div>
            <div class="analysis-content">
                ${formatAnalysisText(review)}
            </div>
        </div>
    `;
}

function formatAnalysisText(text) {
    // Check if text is undefined or null
    if (!text || typeof text !== 'string') {
        return '<p>No analysis available</p>';
    }
    
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

// Utility functions
function escapeHtml(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeForAttribute(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy to clipboard', 'error');
    });
}

function downloadCode(language, code) {
    const extensions = {
        typescript: 'ts',
        python: 'py',
        javascript: 'js',
        java: 'java',
        cpp: 'cpp',
        go: 'go',
        rust: 'rs'
    };
    
    const extension = extensions[language] || 'txt';
    const filename = `generated_code.${extension}`;
    
    downloadFile(filename, code);
}

function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`Downloaded ${filename}`, 'success');
}

// Clear form functions
function clearGeneratorForm() {
    const codePrompt = document.getElementById('code-prompt');
    if (codePrompt) {
        codePrompt.value = '';
        const counter = document.getElementById('code-prompt-counter');
        if (counter) counter.textContent = '0';
    }
    
    // Reset to defaults
    const language = document.getElementById('language');
    const framework = document.getElementById('framework');
    const includeComments = document.getElementById('include-comments');
    const includeTypes = document.getElementById('include-types');
    const includeTests = document.getElementById('include-tests');
    
    if (language) language.value = 'python';
    if (framework) framework.value = 'none';
    if (includeComments) includeComments.checked = true;
    if (includeTypes) includeTypes.checked = false;
    if (includeTests) includeTests.checked = false;
    
    const resultContainer = document.getElementById('code-result');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="result-placeholder">
                <div class="placeholder-icon">
                    <span class="icon code-icon"></span>
                </div>
                <h3>Ready to Generate</h3>
                <p>Enter your prompt and click generate to create code using AI</p>
            </div>
        `;
    }
    
    showToast('Form cleared', 'success');
}

function clearAnalyzerForm() {
    const analyzeCode = document.getElementById('analyze-code');
    if (analyzeCode) {
        analyzeCode.value = '';
    }
    
    const resultContainer = document.getElementById('analyze-result');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="result-placeholder">
                <div class="placeholder-icon">
                    <span class="icon analyze-icon"></span>
                </div>
                <h3>Ready to Analyze</h3>
                <p>Paste your code to get detailed analysis and suggestions</p>
            </div>
        `;
    }
    
    showToast('Form cleared', 'success');
}