"""
Documentation Agent

Generates comprehensive documentation, comments, and API documentation.
"""

from utils.config import get_openai_client

class DocumenterAgent:
    def __init__(self):
        self.client = get_openai_client()
        self.system_prompt = """You are an expert technical writer specializing in code 
        documentation, API documentation, and creating clear, comprehensive documentation."""
    
    def generate_documentation(self, code, language="python", doc_type="comprehensive"):
        """Generate documentation for code"""
        try:
            prompt = f"""
            Code to document:
            ```{language}
            {code}
            ```
            
            Documentation type: {doc_type}
            
            Please generate:
            1. Comprehensive function/class documentation
            2. Usage examples
            3. Parameter descriptions
            4. Return value documentation
            5. Error handling documentation
            6. Code comments where needed
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2500,
                temperature=0.5
            )
            
            return {
                "documented_code": response.choices[0].message.content,
                "original_code": code,
                "doc_type": doc_type,
                "language": language
            }
            
        except Exception as e:
            return {"error": f"Documentation generation failed: {str(e)}"}
    
    def generate_api_docs(self, code, language="python"):
        """Generate API documentation"""
        try:
            prompt = f"""
            API code to document:
            ```{language}
            {code}
            ```
            
            Please generate API documentation including:
            1. Endpoint descriptions
            2. Request/response formats
            3. Authentication requirements
            4. Error codes and messages
            5. Usage examples
            6. Rate limiting information
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2500,
                temperature=0.5
            )
            
            return {
                "api_documentation": response.choices[0].message.content,
                "code": code,
                "language": language
            }
            
        except Exception as e:
            return {"error": f"API documentation generation failed: {str(e)}"}