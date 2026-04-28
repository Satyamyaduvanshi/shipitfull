from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# THE SECRET SAUCE: message_queue allows separate processes (Worker & Flask) 
# to share the same log stream.
socketio = SocketIO(
    cors_allowed_origins="*", 
    message_queue=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    async_mode='eventlet'
)

def make_celery(app):
    """
    Factory to configure Celery.
    Maps uppercase Flask config to lowercase Celery config.
    """
    celery_app = Celery(app.import_name)
    redis_url = app.config.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    
    celery_app.conf.update(
        broker_url=redis_url,
        result_backend=redis_url,
        worker_redirect_stdouts=False, 
        broker_connection_retry_on_startup=True,
        task_track_started=True
    )

    class ContextTask(celery_app.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app.Task = ContextTask
    return celery_app

def create_app():
    app = Flask(__name__)
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'shipit_secret_key')
    
    # Configure Redis for Celery
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    app.config['CELERY_BROKER_URL'] = redis_url
    app.config['CELERY_RESULT_BACKEND'] = redis_url

    # FIX: CORS must cover /* to include the /socket.io/ path
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        supports_credentials=True,
    )

    socketio.init_app(app)
    
    # Initialize Celery globally within the app extensions
    global celery
    celery = make_celery(app)
    app.extensions["celery"] = celery

    # Register Blueprints
    from .routes.auth import auth_bp
    from .routes.deploy import deploy_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(deploy_bp, url_prefix='/api/deploy')

    @app.route('/')
    def health_check():
        return {"status": "ShipIt Agent Backend Online", "node": "Arch_Linux"}

    return app