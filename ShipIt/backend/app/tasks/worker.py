from app import celery, socketio
from app.agents.orchestrator import OrchestratorAgent
from app.db import db, connect_db

@celery.task(bind=True, name='app.tasks.worker.deploy_task')
def deploy_task(self, deployment_id, repo_url, ssh_details):
    """
    Background task for the ShipIt Worker.
    """
    print(f"👷 Worker received job: {deployment_id}")
    
    # 1. Secure DB Connection (Fixes LoggingProxy issue)
    connect_db()

    # 2. Update Status -> In Progress
    db.deployment.update(
        where={'id': deployment_id},
        data={'status': 'in_progress'}
    )

    try:
        # 3. Start Orchestrator with Groq
        orchestrator = OrchestratorAgent(
            deployment_id, 
            repo_url, 
            ssh_details, 
            socketio,
            model_name="groq/llama-3.3-70b-versatile"
        )
        
        success = orchestrator.run()
        orchestrator.cleanup()

        # 4. Final Status Update
        final_status = 'success' if success else 'failed'
        db.deployment.update(
            where={'id': deployment_id},
            data={'status': final_status}
        )
        print(f"🏁 Job {deployment_id} finished: {final_status}")

    except Exception as e:
        print(f"❌ Critical Worker Error: {e}")
        db.deployment.update(
            where={'id': deployment_id},
            data={'status': 'failed'}
        )