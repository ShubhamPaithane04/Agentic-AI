"""
Code Generation Agent

Handles intelligent code generation, modification, and optimization tasks.
"""

import os
from utils.config import get_openai_client
from utils.file_ops import save_generated_file

class CoderAgent:
    def __init__(self):
        self.client = get_openai_client()
        self.system_prompt = """You are an expert software developer. Generate clean, 
        efficient, and well-documented code based on user requirements. Follow best 
        practices and include appropriate error handling."""
    
    def generate_code(self, prompt, language="python", framework=None):
        """Generate code based on user prompt"""
        try:
            full_prompt = f"""
            Language: {language}
            Framework: {framework or 'None specified'}
            
            Requirements: {prompt}
            
            Please generate clean, production-ready code with:
            - Proper error handling
            - Clear documentation
            - Best practices
            - Modular structure
            """
            
            response = self.client.Completion.create(
                engine="gpt-3.5-turbo-instruct",
                prompt=full_prompt,
                max_tokens=2000,
                temperature=0.7
            )
            
            generated_code = response.choices[0].text.strip()
            
            # Save generated code to file
            filename = save_generated_file(generated_code, language)
            
            return {
                "code": generated_code,
                "filename": filename,
                "language": language,
                "framework": framework
            }
            
        except Exception as e:
            return {"error": f"Code generation failed: {str(e)}"}
    
    def modify_code(self, existing_code, modification_request):
        """Modify existing code based on request"""
        try:
            prompt = f"""
            Existing code:
            {existing_code}
            
            Modification request: {modification_request}
            
            Please provide the modified code with explanations of changes made.
            """
            
            response = self.client.Completion.create(
                engine="gpt-3.5-turbo-instruct",
                prompt=prompt,
                max_tokens=2000,
                temperature=0.7
            )
            
            return {
                "modified_code": response.choices[0].text.strip(),
                "original_code": existing_code
            }
            
        except Exception as e:
            return {"error": f"Code modification failed: {str(e)}"}