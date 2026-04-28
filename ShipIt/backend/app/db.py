import sys
from prisma import Prisma

db = Prisma()

def connect_db():
    if not db.is_connected():
        # --- FIX FOR CELERY LOGGING PROXY ---
        # We temporarily point stdout/stderr back to the real system handles 
        # so Prisma can spawn its engine without crashing.
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
        
        try:
            db.connect()
            print("✅ Connected to Neon DB!")
        finally:
            # Put Celery's logging proxies back so we don't break Celery
            sys.stdout = old_stdout
            sys.stderr = old_stderr