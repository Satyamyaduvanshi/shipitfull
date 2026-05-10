import json
import logging
import re
from typing import Any, Dict, List, Optional

from litellm import completion

logger = logging.getLogger(__name__)


class DiagnoserAgent:
    """
    AI-powered deployment diagnoser.

    Responsibilities:
    1. Detect the project tech stack and generate production-ready commands.
    2. Analyze runtime errors and return a safe fix command.

    Supported stacks:
    - Node.js (Express, Next.js, Vite, NestJS, etc.)
    - Python (Flask, FastAPI, Django)

    Example response from diagnose():
    {
        "cause": "Missing Node.js dependencies",
        "fix_command": "cd app && npm install",
        "description": "Installs all required dependencies from package.json."
    }
    """

    def __init__(
        self,
        model_name: str = "groq/llama-3.3-70b-versatile",
        max_retries: int = 2,
        temperature: float = 0.1,
    ) -> None:
        self.model_name = model_name
        self.max_retries = max_retries
        self.temperature = temperature

    # -------------------------------------------------------------------------
    # STACK DETECTION
    # -------------------------------------------------------------------------

    def detect_stack(
        self,
        file_list: List[str],
        package_json_content: Optional[str] = None,
    ) -> Optional[Dict[str, Optional[str]]]:
        """
        Detects the project stack and returns installation/build/start commands.

        Args:
            file_list: List of files in the project root.
            package_json_content: Optional package.json content.

        Returns:
            Dictionary with:
                type
                install_cmd
                build_cmd
                start_cmd
            or None if unsupported.
        """
        logger.info("🧠 AI analyzing project structure...")

        normalized_files = set(file_list)

        # ---------------------------------------------------------------------
        # NODE.JS PROJECT
        # ---------------------------------------------------------------------
        if "package.json" in normalized_files:
            logger.info("🧠 Detected Node.js project")
            return self._detect_node_stack(package_json_content)

        # ---------------------------------------------------------------------
        # PYTHON PROJECT
        # ---------------------------------------------------------------------
        if (
            "requirements.txt" in normalized_files
            or "pyproject.toml" in normalized_files
            or "Pipfile" in normalized_files
        ):
            logger.info("🧠 Detected Python project")
            return self._detect_python_stack(normalized_files)

        logger.warning("⚠️ Unsupported project type")
        return None

    def _detect_node_stack(
        self,
        package_json_content: Optional[str],
    ) -> Dict[str, Optional[str]]:
        """
        Detects Node.js project details from package.json.
        """
        result = {
            "type": "node",
            "install_cmd": "npm install",
            "build_cmd": None,
            "start_cmd": "npm start",
        }

        if not package_json_content:
            return result

        try:
            pkg = json.loads(package_json_content)
            scripts = pkg.get("scripts", {})
            dependencies = {
                **pkg.get("dependencies", {}),
                **pkg.get("devDependencies", {}),
            }

            # Build command
            if "build" in scripts:
                result["build_cmd"] = "npm run build"

            # Framework detection
            is_next = "next" in dependencies
            is_nest = "@nestjs/core" in dependencies
            is_vite = "vite" in dependencies
            is_nuxt = "nuxt" in dependencies

            # Start command selection
            if "start" in scripts:
                if is_next:
                    result["start_cmd"] = "npm run start -- -H 0.0.0.0"
                else:
                    result["start_cmd"] = "npm run start"

            elif "serve" in scripts:
                result["start_cmd"] = "npm run serve"

            elif "dev" in scripts:
                # Fallback for projects without start script
                if is_next:
                    result["start_cmd"] = "npm run dev -- -H 0.0.0.0"
                elif is_vite:
                    result["start_cmd"] = "npm run dev -- --host 0.0.0.0"
                else:
                    result["start_cmd"] = "npm run dev"

            # NestJS production mode
            if is_nest and "start:prod" in scripts:
                result["start_cmd"] = "npm run start:prod"

            # Nuxt production
            if is_nuxt and "start" in scripts:
                result["start_cmd"] = "npm run start -- --host 0.0.0.0"

            logger.info(
                "🧠 Node.js stack detected: build=%s start=%s",
                result["build_cmd"],
                result["start_cmd"],
            )

        except json.JSONDecodeError:
            logger.warning("⚠️ Invalid package.json")
        except Exception as e:
            logger.exception("❌ Error detecting Node.js stack: %s", e)

        return result

    def _detect_python_stack(
        self,
        file_list: set,
    ) -> Dict[str, Optional[str]]:
        """
        Detects common Python project types.
        """
        start_cmd = "python app.py"
        install_cmd = "pip install -r requirements.txt"

        if "manage.py" in file_list:
            # Django
            start_cmd = "python manage.py runserver 0.0.0.0:8000"

        elif "main.py" in file_list:
            # FastAPI convention
            start_cmd = "uvicorn main:app --host 0.0.0.0 --port 8000"

        elif "app.py" in file_list:
            # Flask convention
            start_cmd = "python app.py"

        if "pyproject.toml" in file_list:
            install_cmd = "pip install ."

        return {
            "type": "python",
            "install_cmd": install_cmd,
            "build_cmd": None,
            "start_cmd": start_cmd,
        }

    # -------------------------------------------------------------------------
    # ERROR DIAGNOSIS
    # -------------------------------------------------------------------------

    def diagnose(self, error_log: str) -> Dict[str, Optional[str]]:
        """
        Uses an LLM to diagnose deployment failures and return a fix command.

        Args:
            error_log: Raw deployment error log.

        Returns:
            {
                "cause": "...",
                "fix_command": "...",
                "description": "..."
            }
        """
        if not error_log or not error_log.strip():
            return {
                "cause": "No error log provided",
                "fix_command": None,
                "description": "The deployment failed but no logs were available.",
            }

        logger.info("🧠 AI diagnosing deployment error using %s", self.model_name)

        prompt = self._build_diagnosis_prompt(error_log)

        for attempt in range(1, self.max_retries + 1):
            try:
                response = completion(
                    model=self.model_name,
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an expert DevOps engineer. "
                                "Return only valid JSON."
                            ),
                        },
                        {
                            "role": "user",
                            "content": prompt,
                        },
                    ],
                    temperature=self.temperature,
                )

                content = response.choices[0].message.content
                parsed = self._parse_llm_response(content)
                validated = self._validate_response(parsed)

                logger.info(
                    "✅ Diagnosis successful on attempt %d: %s",
                    attempt,
                    validated["cause"],
                )
                return validated

            except Exception as e:
                logger.warning(
                    "❌ Diagnosis attempt %d/%d failed: %s",
                    attempt,
                    self.max_retries,
                    str(e),
                )

        return {
            "cause": "LLM diagnosis failed",
            "fix_command": None,
            "description": (
                "The AI could not determine a reliable fix command."
            ),
        }

    # -------------------------------------------------------------------------
    # INTERNAL HELPERS
    # -------------------------------------------------------------------------

    def _build_diagnosis_prompt(self, error_log: str) -> str:
        """
        Creates a strict prompt for JSON-only output.
        """
        return f"""
You are an expert DevOps AI diagnosing server failures.

Analyze the following deployment error log and determine:
1. The root cause.
2. The exact bash command required to fix it.
3. A short explanation.

IMPORTANT RULES:
- Respond with ONLY valid JSON.
- No markdown.
- No code fences.
- No explanations outside JSON.
- If a project command is needed, it MUST start with: "cd app && ".
- If no safe fix is possible, set "fix_command" to null.
- Commands must be idempotent and safe to run multiple times.

ERROR LOG:
{error_log}

EXPECTED JSON FORMAT:
{{
  "cause": "Short root cause",
  "fix_command": "cd app && <command>" or null,
  "description": "Short explanation"
}}
""".strip()

    def _parse_llm_response(self, content: str) -> Dict[str, Any]:
        """
        Cleans and parses the model response.
        """
        if not content:
            raise ValueError("Empty LLM response")

        content = content.strip()

        # Remove <think> ... </think>
        if "</think>" in content:
            content = content.split("</think>")[-1].strip()

        # Remove markdown code fences
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

        # Extract JSON object if extra text exists
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            content = match.group(0)

        return json.loads(content)

    def _validate_response(
        self,
        data: Dict[str, Any],
    ) -> Dict[str, Optional[str]]:
        """
        Validates and sanitizes the LLM response.
        """
        cause = str(data.get("cause", "Unknown cause")).strip()
        description = str(
            data.get("description", "No explanation provided.")
        ).strip()

        fix_command = data.get("fix_command")
        if fix_command is not None:
            fix_command = str(fix_command).strip()

            # Normalize null-like strings
            if fix_command.lower() in {"null", "none", ""}:
                fix_command = None

            # Ensure project commands are scoped to app/
            elif not fix_command.startswith("cd app && "):
                fix_command = f"cd app && {fix_command}"

        return {
            "cause": cause,
            "fix_command": fix_command,
            "description": description,
        }
