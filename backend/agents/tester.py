"""
Testing Agent

Generates tests, validates code quality, and ensures proper test coverage.
"""

from utils.config import get_openai_client

class TesterAgent:
    def __init__(self):
        self.client = get_openai_client()
        self.system_prompt = """You are an expert in software testing. Generate comprehensive 
        test suites with unit tests, integration tests, and edge case coverage."""
    
    def generate_tests(self, code, test_framework="pytest"):
        """Generate comprehensive tests for given code"""
        try:
            prompt = f"""
            Code to test:
            ```
            {code}
            ```
            
            Test Framework: {test_framework}
            
            Please generate comprehensive tests including:
            1. Unit tests for all functions/methods
            2. Edge case testing
            3. Error handling tests
            4. Integration tests where applicable
            5. Mock objects where needed
            6. Test data setup and teardown
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
                "tests": response.choices[0].message.content,
                "original_code": code,
                "framework": test_framework
            }
            
        except Exception as e:
            return {"error": f"Test generation failed: {str(e)}"}
    
    def validate_code_quality(self, code):
        """Analyze code quality and suggest improvements"""
        try:
            prompt = f"""
            Code to analyze:
            ```
            {code}
            ```
            
            Please analyze code quality for:
            1. Code structure and organization
            2. Naming conventions
            3. Documentation quality
            4. Error handling
            5. Security considerations
            6. Maintainability
            7. Performance implications
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.3
            )
            
            return {
                "quality_analysis": response.choices[0].message.content,
                "code": code
            }
            
        except Exception as e:
            return {"error": f"Code quality validation failed: {str(e)}"}