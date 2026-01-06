"""
Code Optimization Agent

Analyzes and optimizes code for performance, memory usage, and efficiency.
"""

from utils.config import get_openai_client

class OptimizerAgent:
    def __init__(self):
        self.client = get_openai_client()
        self.system_prompt = """You are an expert in code optimization, performance tuning, 
        and algorithmic efficiency. You specialize in making code faster and more efficient."""
    
    def optimize_code(self, code, language="python", optimization_type="performance"):
        """Optimize code for performance, memory, or readability"""
        try:
            prompt = f"""
            Code to optimize:
            ```{language}
            {code}
            ```
            
            Optimization focus: {optimization_type}
            
            Please provide:
            1. Optimized version of the code
            2. Explanation of optimizations made
            3. Performance improvements expected
            4. Trade-offs and considerations
            5. Before/after complexity analysis
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
                "optimized_code": response.choices[0].message.content,
                "original_code": code,
                "optimization_type": optimization_type,
                "language": language
            }
            
        except Exception as e:
            return {"error": f"Code optimization failed: {str(e)}"}
    
    def analyze_complexity(self, code, language="python"):
        """Analyze algorithmic complexity of code"""
        try:
            prompt = f"""
            Code for complexity analysis:
            ```{language}
            {code}
            ```
            
            Please analyze:
            1. Time complexity (Big O notation)
            2. Space complexity
            3. Best/average/worst case scenarios
            4. Bottlenecks and performance issues
            5. Suggestions for complexity reduction
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
                "complexity_analysis": response.choices[0].message.content,
                "code": code,
                "language": language
            }
            
        except Exception as e:
            return {"error": f"Complexity analysis failed: {str(e)}"}