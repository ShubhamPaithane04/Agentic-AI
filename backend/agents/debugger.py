"""
Debugging Agent

Analyzes code errors and provides debugging assistance and fixes.
"""

from utils.config import get_openai_client

class DebuggerAgent:
    def __init__(self):
        self.client = get_openai_client()
        self.system_prompt = """You are an expert debugger. Analyze code errors, 
        identify root causes, and provide clear solutions with explanations."""
    
    def debug_code(self, code, error_message=None):
        """Debug code and provide fixes"""
        try:
            prompt = f"""
            Code with issues:
            {code}
            
            Error message (if any): {error_message or 'No specific error provided'}
            
            Please:
            1. Identify potential issues in the code
            2. Explain the root cause of problems
            3. Provide corrected code
            4. Suggest best practices to prevent similar issues
            """
            
            response = self.client.Completion.create(
                engine="gpt-3.5-turbo-instruct",
                prompt=prompt,
                max_tokens=2000,
                temperature=0.3
            )
            
            return {
                "analysis": response.choices[0].text.strip(),
                "original_code": code,
                "error_message": error_message
            }
            
        except Exception as e:
            return {"error": f"Debugging failed: {str(e)}"}
    
    def analyze_performance(self, code):
        """Analyze code performance and suggest optimizations"""
        try:
            prompt = f"""
            Code to analyze:
            ```
            {code}
            ```
            
            Please analyze this code for:
            1. Performance bottlenecks
            2. Memory usage issues
            3. Optimization opportunities
            4. Best practice improvements
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.3
            )
            
            return {
                "performance_analysis": response.choices[0].message.content,
                "code": code
            }
            
        except Exception as e:
            return {"error": f"Performance analysis failed: {str(e)}"}