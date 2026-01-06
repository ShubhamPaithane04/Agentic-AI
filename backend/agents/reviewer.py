"""
Code Review Agent

Performs comprehensive code reviews, security analysis, and quality assessments.
"""

from utils.config import get_openai_client

class ReviewerAgent:
    def __init__(self):
        self.client = get_openai_client()
        self.system_prompt = """You are an expert code reviewer with extensive experience in 
        software engineering best practices, security, and code quality assessment."""
    
    def review_code(self, code, language="python"):
        """Perform comprehensive code review"""
        try:
            prompt = f"""
            Code to review:
            ```{language}
            {code}
            ```
            
            Please provide a comprehensive code review including:
            1. Code quality assessment
            2. Security vulnerabilities
            3. Performance issues
            4. Best practice violations
            5. Suggestions for improvement
            6. Overall rating (1-10)
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
                "review": response.choices[0].message.content,
                "code": code,
                "language": language
            }
            
        except Exception as e:
            return {"error": f"Code review failed: {str(e)}"}
    
    def security_audit(self, code, language="python"):
        """Perform security-focused code audit"""
        try:
            prompt = f"""
            Code for security audit:
            ```{language}
            {code}
            ```
            
            Please perform a security audit focusing on:
            1. SQL injection vulnerabilities
            2. XSS vulnerabilities
            3. Authentication issues
            4. Data validation problems
            5. Encryption and security best practices
            6. OWASP Top 10 compliance
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
                "security_audit": response.choices[0].message.content,
                "code": code,
                "language": language
            }
            
        except Exception as e:
            return {"error": f"Security audit failed: {str(e)}"}