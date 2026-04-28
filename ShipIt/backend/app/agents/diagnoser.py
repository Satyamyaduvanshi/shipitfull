import json
import os
from litellm import completion

class DiagnoserAgent:
    def __init__(self, model_name="groq/llama-3.3-70b-versatile"):
        """
        Initializes the agent for cloud-based diagnosis.
        """
        self.model_name = model_name

    def detect_stack(self, file_list, package_json_content=None):
        """
        Analyzes the file structure to identify the Tech Stack and 
        returns production-ready commands.
        """
        print(f"🧠 AI Analyzing Project Structure...")

        if 'package.json' in file_list:
            print("🧠 Detected Node.js Project")
            install_cmd = "npm install"
            build_cmd = None
            start_cmd = "npm start"
            
            if package_json_content:
                try:
                    pkg = json.loads(package_json_content)
                    scripts = pkg.get('scripts', {})
                    
                    # Next.js / Production detection
                    if 'build' in scripts:
                        build_cmd = "npm run build"
                    
                    # Force network binding to 0.0.0.0 for external access
                    if 'start' in scripts:
                        start_cmd = "npm run start -- -H 0.0.0.0"
                    elif 'dev' in scripts:
                        start_cmd = "npm run dev -- -H 0.0.0.0"
                    
                    print(f"🧠 AI determined start command: '{start_cmd}'")
                except:
                    pass

            return {
                "type": "node",
                "install_cmd": install_cmd,
                "build_cmd": build_cmd,
                "start_cmd": start_cmd
            }

        if 'requirements.txt' in file_list:
            print("🧠 Detected Python Project")
            return {
                "type": "python",
                "install_cmd": "pip install -r requirements.txt",
                "build_cmd": None,
                "start_cmd": "python app.py"
            }

        return None

    def diagnose(self, error_log):
        """
        Analyzes runtime errors dynamically using Groq.
        """
        print(f"🧠 AI Diagnosing error using {self.model_name}...")

        prompt = f"""
You are an expert DevOps AI diagnosing server failures.
Analyze the error log and determine the exact bash command needed to fix it.

CONTEXT:
1. User: 'ubuntu', Home: '~/'
2. Project folder: 'app/'
3. Project commands MUST start with `cd app && `. Example: `cd app && npm install`.

ERROR LOG:
{error_log}

Respond ONLY with a valid JSON object:
{{
    "cause": "A short description of why it failed",
    "fix_command": "The exact bash command to run to fix it",
    "description": "A short explanation of the fix"
}}
"""

        try:
            # LiteLLM handles the GROQ_API_KEY automatically from .env
            response = completion(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            
            content = response.choices[0].message.content.strip()
            
            # Clean up reasoning and markdown
            if "<think>" in content:
                content = content.split("</think>")[-1].strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
                
            return json.loads(content)

        except Exception as e:
            print(f"❌ LLM Call Failed: {str(e)}")
            return {"fix_command": None, "cause": f"LLM Error: {str(e)}", "description": ""}