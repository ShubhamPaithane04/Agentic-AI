"""
Project Planning Agent

Creates project plans, architecture designs, and development roadmaps.
"""

from utils.config import get_openai_client
from utils.file_ops import create_project_structure

class PlannerAgent:
    def __init__(self):
        self.client = get_openai_client()
        self.system_prompt = """You are an expert software architect and project planner. 
        Create detailed, practical project plans with clear structure and implementation steps."""
    
    def create_plan(self, project_description):
        """Create a comprehensive project plan"""
        try:
            prompt = f"""
            Project Description: {project_description}
            
            Please create a detailed project plan including:
            1. Project overview and objectives
            2. Technology stack recommendations
            3. Project structure and file organization
            4. Development phases and milestones
            5. Implementation timeline
            6. Key features and requirements
            7. Potential challenges and solutions
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2500,
                temperature=0.7
            )
            
            plan = response.choices[0].message.content
            
            return {
                "plan": plan,
                "project_description": project_description,
                "created": True
            }
            
        except Exception as e:
            return {"error": f"Project planning failed: {str(e)}"}
    
    def design_architecture(self, requirements):
        """Design system architecture based on requirements"""
        try:
            prompt = f"""
            Requirements: {requirements}
            
            Please design a system architecture including:
            1. High-level system components
            2. Data flow and interactions
            3. Database design considerations
            4. API structure
            5. Security considerations
            6. Scalability recommendations
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2000,
                temperature=0.7
            )
            
            return {
                "architecture": response.choices[0].message.content,
                "requirements": requirements
            }
            
        except Exception as e:
            return {"error": f"Architecture design failed: {str(e)}"}