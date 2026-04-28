import time
from app.agents.deployer import DeployerAgent
from app.agents.diagnoser import DiagnoserAgent
from app.db import db, connect_db

class OrchestratorAgent:
    def __init__(self, deployment_id, repo_url, ssh_details, socketio, model_name="groq/llama-3.3-70b-versatile"):
        self.deployment_id = deployment_id
        self.repo_url = repo_url
        self.socketio = socketio
        self.deployer = DeployerAgent(ssh_details)
        self.diagnoser = DiagnoserAgent(model_name=model_name)

    def log(self, message, level="info"):
        """Sends real-time logs to Frontend, saves to Neon DB, and prints to console."""
        # 1. Terminal Output (Arch Console)
        print(f"[{level.upper()}] {message}")

        # 2. Database Persistence (Neon DB)
        connect_db()
        try:
            db.log.create(data={
                'deployment_id': self.deployment_id,
                'message': message,
                'level': level
            })
        except Exception as e:
            print(f"⚠️ Failed to save log to DB: {e}")

        # 3. Live Stream (SocketIO)
        if self.socketio:
            self.socketio.emit('log', {
                'deployment_id': self.deployment_id,
                'message': message,
                'level': level,
                'timestamp': time.time() * 1000 # Milliseconds for JS
            })

    def run(self):
        try:
            self.log("🚀 Orchestrator initiated Production Deployment Loop.")
            
            if not self.deployer.connect():
                self.log("❌ SSH Connection failed. Verify credentials and Node IP.", "error")
                return False

            # 1. CLEANUP
            self.log("🧹 Terminating existing Node processes to free resources...", "warning")
            self.deployer.execute("pkill -f node || true")

            # 2. FETCH CODE
            self.log(f"📦 Synchronizing repository: {self.repo_url}")
            # Ensure we are in a clean directory
            repo_name = "app"
            clone_cmd = f"if [ ! -d '{repo_name}' ]; then git clone {self.repo_url} {repo_name}; else cd {repo_name} && git pull; fi"
            
            success, _ = self.execute_with_retry(clone_cmd, "Source Control Sync")
            if not success: return False

            # 3. STACK ANALYSIS
            self.log("🧠 Agent analyzing project structure...", "ai")
            files_str, _, _ = self.deployer.execute(f"ls {repo_name}")
            pkg_content, _, _ = self.deployer.execute(f"cat {repo_name}/package.json")
            stack = self.diagnoser.detect_stack(files_str.split('\n'), pkg_content)

            if not stack:
                self.log("❌ Unsupported project type. No package.json found.", "error")
                return False
            
            self.log(f"🧠 AI identified {stack['type']} environment.", "ai")

            # 4. DEPENDENCY INSTALL
            self.log(f"🛠️ Executing {stack['type']} dependency installation...", "info")
            success, _ = self.execute_with_retry(f"cd {repo_name} && {stack['install_cmd']}", "Package Install")
            if not success: return False

            # 5. BUILD PHASE
            if stack.get('build_cmd'):
                self.log(f"🏗️ Building optimized production assets...", "info")
                success, _ = self.execute_with_retry(f"cd {repo_name} && {stack['build_cmd']}", "Production Build")
                if not success: return False

            # 6. LAUNCH & SMART VERIFICATION
            self.log(f"🚀 Launching server in background: {stack['start_cmd']}", "success")
            start_cmd = f"cd {repo_name} && nohup {stack['start_cmd']} > production.log 2>&1 &"
            self.deployer.execute(start_cmd)
            
            # Settle time
            time.sleep(6)
            
            # 7. POST-LAUNCH VALIDATION
            self.log("🔍 Running post-launch health checks...", "info")
            is_running, _, _ = self.deployer.execute("ps aux | grep node | grep -v grep")
            
            if is_running:
                self.log("✨ Deployment confirmed. Application is responsive on Port 3000.", "success")
                return True
            else:
                self.log("⚠️ App failed to stay alive. Reading logs for diagnosis...", "warning")
                # HEALING: Read the actual output of the failed app
                _, production_log, _ = self.deployer.execute(f"cd {repo_name} && tail -n 25 production.log")
                
                self.log(f"🧠 AI analyzing production.log failure:\n{production_log}", "ai")
                
                diagnosis = self.diagnoser.diagnose(production_log)
                
                if diagnosis.get('fix_command'):
                    self.log(f"🧠 AI Diagnosis: {diagnosis['cause']}", "ai")
                    self.log(f"💻 AI Fix Execution: {diagnosis['fix_command']}", "command")
                    
                    self.deployer.execute(diagnosis['fix_command'])
                    self.log("🔄 Retrying launch after fix...", "info")
                    self.deployer.execute(start_cmd)
                    
                    time.sleep(4)
                    final_check, _, _ = self.deployer.execute("ps aux | grep node | grep -v grep")
                    if final_check:
                        self.log("✅ AI Healing successful. App is now live.", "success")
                        return True

                self.log("❌ Deployment failed. Manual logs at production.log", "error")
                return False

        except Exception as e:
            self.log(f"🔥 Critical Orchestrator Exception: {str(e)}", "error")
            return False
        finally:
            self.cleanup()

    def execute_with_retry(self, command, label):
        """Standard execution with one-shot AI self-healing."""
        self.log(f"💻 Executing: {command}", "command")
        _, out, err, code = self.deployer.execute_detailed(command)
        
        if code == 0: 
            return True, ""
        
        self.log(f"⚠️ {label} failed (Exit Code {code}). Attempting AI recovery...", "warning")
        diagnosis = self.diagnoser.diagnose(err if err else out)
        
        if diagnosis.get('fix_command'):
            self.log(f"🧠 AI identified cause: {diagnosis['cause']}", "ai")
            self.log(f"💻 AI applying fix: {diagnosis['fix_command']}", "command")
            
            # Apply fix
            _, f_out, f_err, f_code = self.deployer.execute_detailed(diagnosis['fix_command'])
            
            if f_code == 0:
                self.log("✅ Fix successful. Retrying original operation...", "success")
                _, r_out, r_err, r_code = self.deployer.execute_detailed(command)
                return r_code == 0, r_err
        
        return False, err

    def cleanup(self):
        """Gracefully close remote connections."""
        if self.deployer:
            self.deployer.close()