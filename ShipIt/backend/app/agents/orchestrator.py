import time
from app.agents.deployer import DeployerAgent
from app.agents.diagnoser import DiagnoserAgent
from app.db import db, connect_db


class OrchestratorAgent:
    def __init__(
        self,
        deployment_id,
        repo_url,
        ssh_details,
        socketio=None,
        model_name="groq/llama-3.3-70b-versatile",
    ):
        self.deployment_id = deployment_id
        self.repo_url = repo_url
        self.socketio = socketio
        self.deployer = DeployerAgent(ssh_details)
        self.diagnoser = DiagnoserAgent(model_name=model_name)

    def log(self, message, level="info"):
        """
        Send logs to:
        1. Console
        2. Database (Neon)
        3. Socket.IO (real-time frontend)
        """
        # 1. Console
        print(f"[{level.upper()}] {message}")

        # 2. Database
        try:
            connect_db()
            db.log.create(
                data={
                    "deployment_id": self.deployment_id,
                    "message": message,
                    "level": level,
                }
            )
        except Exception as e:
            print(f"⚠️ Failed to save log to DB: {e}")

        # 3. Socket.IO
        try:
            if self.socketio:
                self.socketio.emit(
                    "log",
                    {
                        "deployment_id": self.deployment_id,
                        "message": message,
                        "level": level,
                        "timestamp": int(time.time() * 1000),  # milliseconds
                    },
                )
        except Exception as e:
            print(f"⚠️ Failed to emit socket log: {e}")

    def run(self):
        repo_name = "app"

        try:
            self.log("🚀 Orchestrator initiated Production Deployment Loop.")

            # ------------------------------------------------------------------
            # 1. CONNECT TO SERVER
            # ------------------------------------------------------------------
            if not self.deployer.connect():
                self.log(
                    "❌ SSH Connection failed. Verify credentials and server IP.",
                    "error",
                )
                return False

            # ------------------------------------------------------------------
            # 2. CLEANUP OLD PROCESSES
            # ------------------------------------------------------------------
            self.log(
                "🧹 Terminating existing Node processes to free resources...",
                "warning",
            )
            self.deployer.execute("pkill -f node || true")

            # ------------------------------------------------------------------
            # 3. CLONE OR UPDATE REPOSITORY
            # ------------------------------------------------------------------
            self.log(f"📦 Synchronizing repository: {self.repo_url}")

            clone_cmd = f"""
                if [ ! -d "{repo_name}" ]; then
                    git clone {self.repo_url} {repo_name};
                else
                    cd {repo_name} && git pull;
                fi
            """

            success, _ = self.execute_with_retry(
                clone_cmd,
                "Source Control Sync",
            )
            if not success:
                return False

            # ------------------------------------------------------------------
            # 4. STACK ANALYSIS
            # ------------------------------------------------------------------
            self.log("🧠 Agent analyzing project structure...", "ai")

            _, files_output, _, files_code = self.deployer.execute_detailed(
                f"ls -1 {repo_name}"
            )

            if files_code != 0:
                self.log("❌ Failed to read repository contents.", "error")
                return False

            _, package_json, _, package_code = self.deployer.execute_detailed(
                f"cat {repo_name}/package.json"
            )

            if package_code != 0:
                self.log("❌ package.json not found. Unsupported project type.", "error")
                return False

            stack = self.diagnoser.detect_stack(
                files_output.splitlines(),
                package_json,
            )

            if not stack:
                self.log("❌ Could not detect project stack.", "error")
                return False

            self.log(f"🧠 AI identified {stack['type']} environment.", "ai")

            # ------------------------------------------------------------------
            # 5. INSTALL DEPENDENCIES
            # ------------------------------------------------------------------
            self.log(
                f"🛠️ Executing {stack['type']} dependency installation...",
                "info",
            )

            success, _ = self.execute_with_retry(
                f"cd {repo_name} && {stack['install_cmd']}",
                "Package Install",
            )
            if not success:
                return False

            # ------------------------------------------------------------------
            # 6. BUILD PROJECT (IF NEEDED)
            # ------------------------------------------------------------------
            build_cmd = stack.get("build_cmd")

            if build_cmd:
                self.log("🏗️ Building optimized production assets...", "info")

                success, _ = self.execute_with_retry(
                    f"cd {repo_name} && {build_cmd}",
                    "Production Build",
                )

                if not success:
                    return False

            # ------------------------------------------------------------------
            # 7. START APPLICATION
            # ------------------------------------------------------------------
            start_cmd = stack["start_cmd"]

            self.log(
                f"🚀 Launching server in background: {start_cmd}",
                "success",
            )

            launch_cmd = (
                f"cd {repo_name} && "
                f"nohup {start_cmd} > production.log 2>&1 &"
            )

            self.deployer.execute(launch_cmd)

            # Allow process to initialize
            time.sleep(6)

            # ------------------------------------------------------------------
            # 8. HEALTH CHECK
            # ------------------------------------------------------------------
            self.log("🔍 Running post-launch health checks...", "info")

            _, process_output, _, _ = self.deployer.execute_detailed(
                "ps aux | grep node | grep -v grep"
            )

            if process_output.strip():
                self.log(
                    "✨ Deployment confirmed. Application is running successfully.",
                    "success",
                )
                return True

            # ------------------------------------------------------------------
            # 9. APP CRASHED -> READ LOGS
            # ------------------------------------------------------------------
            self.log(
                "⚠️ Application failed to stay alive. Reading production logs...",
                "warning",
            )

            _, production_log, _, _ = self.deployer.execute_detailed(
                f"cd {repo_name} && tail -n 25 production.log"
            )

            self.log(
                f"🧠 AI analyzing production.log failure:\n{production_log}",
                "ai",
            )

            diagnosis = self.diagnoser.diagnose(production_log)

            fix_command = diagnosis.get("fix_command")

            if fix_command:
                self.log(
                    f"🧠 AI Diagnosis: {diagnosis.get('cause', 'Unknown issue')}",
                    "ai",
                )

                self.log(
                    f"💻 AI Fix Execution: {fix_command}",
                    "command",
                )

                # Apply fix
                _, fix_out, fix_err, fix_code = (
                    self.deployer.execute_detailed(fix_command)
                )

                if fix_code != 0:
                    self.log(
                        f"❌ AI-generated fix failed:\n{fix_err or fix_out}",
                        "error",
                    )
                    return False

                # Retry launch
                self.log("🔄 Retrying launch after fix...", "info")
                self.deployer.execute(launch_cmd)

                time.sleep(4)

                _, final_output, _, _ = self.deployer.execute_detailed(
                    "ps aux | grep node | grep -v grep"
                )

                if final_output.strip():
                    self.log(
                        "✅ AI healing successful. Application is now live.",
                        "success",
                    )
                    return True

            # ------------------------------------------------------------------
            # 10. FINAL FAILURE
            # ------------------------------------------------------------------
            self.log(
                "❌ Deployment failed. Check production.log for manual inspection.",
                "error",
            )
            return False

        except Exception as e:
            self.log(f"🔥 Critical Orchestrator Exception: {str(e)}", "error")
            return False

        finally:
            self.cleanup()

    def execute_with_retry(self, command, label):
        """
        Execute a command once.
        If it fails, ask AI for a fix and retry the original command.
        Returns:
            (success: bool, error_message: str)
        """
        self.log(f"💻 Executing: {command}", "command")

        _, stdout, stderr, exit_code = self.deployer.execute_detailed(command)

        # Success
        if exit_code == 0:
            return True, ""

        error_text = stderr or stdout

        self.log(
            f"⚠️ {label} failed (Exit Code {exit_code}). Attempting AI recovery...",
            "warning",
        )

        diagnosis = self.diagnoser.diagnose(error_text)
        fix_command = diagnosis.get("fix_command")

        if not fix_command:
            self.log("❌ AI could not generate a fix.", "error")
            return False, error_text

        self.log(
            f"🧠 AI identified cause: {diagnosis.get('cause', 'Unknown issue')}",
            "ai",
        )

        self.log(
            f"💻 AI applying fix: {fix_command}",
            "command",
        )

        # Apply fix
        _, fix_stdout, fix_stderr, fix_exit_code = (
            self.deployer.execute_detailed(fix_command)
        )

        if fix_exit_code != 0:
            self.log(
                f"❌ Fix command failed:\n{fix_stderr or fix_stdout}",
                "error",
            )
            return False, error_text

        self.log("✅ Fix successful. Retrying original operation...", "success")

        # Retry original command
        _, retry_stdout, retry_stderr, retry_exit_code = (
            self.deployer.execute_detailed(command)
        )

        if retry_exit_code == 0:
            return True, ""

        return False, retry_stderr or retry_stdout

    def cleanup(self):
        """Gracefully close SSH connection."""
        try:
            if self.deployer:
                self.deployer.close()
        except Exception:
            pass
