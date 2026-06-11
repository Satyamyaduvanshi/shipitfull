import io
import time
import socket
import paramiko
from typing import Optional, Tuple


class DeployerAgent:
    """
    Handles SSH communication with remote servers.

    Features:
    - Private key string support
    - Private key file support
    - Retry connection
    - Command timeout
    - Detailed command execution
    - SFTP support
    - Graceful cleanup
    """

    def __init__(self, ssh_details: dict):
        self.hostname = ssh_details.get("hostname")
        self.username = ssh_details.get("username")
        self.key_str = ssh_details.get("private_key")

        self.client: Optional[paramiko.SSHClient] = None
        self.sftp = None

    # =====================================================
    # CONNECTION
    # =====================================================

    def connect(self, retries: int = 3) -> bool:
        """
        Establish SSH connection.
        """

        for attempt in range(retries):
            try:
                self.client = paramiko.SSHClient()

                self.client.set_missing_host_key_policy(
                    paramiko.AutoAddPolicy()
                )

                if "BEGIN" in self.key_str:
                    key_file = io.StringIO(self.key_str)

                    try:
                        pkey = paramiko.RSAKey.from_private_key(
                            key_file
                        )
                    except Exception:
                        key_file.seek(0)
                        pkey = paramiko.Ed25519Key.from_private_key(
                            key_file
                        )

                else:
                    pkey = paramiko.RSAKey.from_private_key_file(
                        self.key_str
                    )

                print(
                    f"🔌 Connecting to "
                    f"{self.username}@{self.hostname}"
                )

                self.client.connect(
                    hostname=self.hostname,
                    username=self.username,
                    pkey=pkey,
                    timeout=15,
                    banner_timeout=15,
                    auth_timeout=15,
                    look_for_keys=False,
                    allow_agent=False,
                )

                self.sftp = self.client.open_sftp()

                print("✅ SSH Connected")
                return True

            except Exception as e:
                print(
                    f"❌ Connection attempt "
                    f"{attempt + 1} failed: {e}"
                )

                time.sleep(2)

        return False

    # =====================================================
    # BASIC COMMAND
    # =====================================================

    def execute(
        self,
        command: str,
        timeout: int = 300,
    ) -> Tuple[str, str, int]:
        """
        Execute command.

        Returns:
            stdout, stderr, exit_code
        """

        if not self.client:
            return "", "SSH not connected", -1

        try:
            print(f"💻 Executing:\n{command}")

            stdin, stdout, stderr = self.client.exec_command(
                command,
                timeout=timeout,
            )

            exit_code = stdout.channel.recv_exit_status()

            out = stdout.read().decode(
                errors="ignore"
            )

            err = stderr.read().decode(
                errors="ignore"
            )

            return (
                out.strip(),
                err.strip(),
                exit_code,
            )

        except socket.timeout:
            return (
                "",
                "Command timeout exceeded",
                -1,
            )

        except Exception as e:
            return (
                "",
                str(e),
                -1,
            )

    # =====================================================
    # DETAILED COMMAND
    # =====================================================

    def execute_detailed(
        self,
        command: str,
        timeout: int = 600,
    ):
        """
        Detailed execution used by orchestrator.

        Returns:
            success,
            stdout,
            stderr,
            exit_code
        """

        start = time.time()

        stdout, stderr, exit_code = self.execute(
            command,
            timeout,
        )

        duration = round(
            time.time() - start,
            2,
        )

        success = exit_code == 0

        print(
            f"⏱ Command completed "
            f"in {duration}s "
            f"(code={exit_code})"
        )

        return (
            success,
            stdout,
            stderr,
            exit_code,
        )

    # =====================================================
    # STREAMING EXECUTION
    # =====================================================

    def execute_stream(
        self,
        command: str,
        callback=None,
    ):
        """
        Stream logs line-by-line.

        callback(line)
        """

        if not self.client:
            return False

        try:
            transport = self.client.get_transport()

            channel = transport.open_session()

            channel.exec_command(command)

            while True:
                if channel.recv_ready():
                    line = channel.recv(4096).decode()

                    if callback:
                        callback(line)

                    print(line, end="")

                if channel.exit_status_ready():
                    break

                time.sleep(0.1)

            return channel.recv_exit_status() == 0

        except Exception as e:
            print(f"❌ Stream Error: {e}")
            return False

    # =====================================================
    # FILE OPERATIONS
    # =====================================================

    def upload_file(
        self,
        local_path: str,
        remote_path: str,
    ) -> bool:
        try:
            self.sftp.put(
                local_path,
                remote_path,
            )
            return True

        except Exception as e:
            print(
                f"Upload failed: {e}"
            )
            return False

    def download_file(
        self,
        remote_path: str,
        local_path: str,
    ) -> bool:
        try:
            self.sftp.get(
                remote_path,
                local_path,
            )
            return True

        except Exception as e:
            print(
                f"Download failed: {e}"
            )
            return False

    # =====================================================
    # HEALTH CHECK
    # =====================================================

    def ping(self) -> bool:
        """
        Verify SSH session still alive.
        """

        if not self.client:
            return False

        try:
            _, _, code = self.execute(
                "echo alive"
            )

            return code == 0

        except Exception:
            return False

    # =====================================================
    # CLEANUP
    # =====================================================

    def close(self):
        try:
            if self.sftp:
                self.sftp.close()

            if self.client:
                self.client.close()

            print("🔒 SSH connection closed")

        except Exception:
            pass

    # =====================================================
    # CONTEXT MANAGER
    # =====================================================

    def __enter__(self):
        self.connect()
        return self

    def __exit__(
        self,
        exc_type,
        exc_val,
        exc_tb,
    ):
        self.close()
