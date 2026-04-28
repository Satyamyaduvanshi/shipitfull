import json
import os
import time
from tabulate import tabulate
from dotenv import load_dotenv
from app.agents.deployer import DeployerAgent
from app.agents.orchestrator import OrchestratorAgent

# Load the API keys from your .env file
load_dotenv()

# --- CONFIGURATION ---
MODELS_TO_TEST = [
    # 1. Google's Model
    #"gemini/gemini-2.5-flash",  
    
    # 2. Meta's Model (70 Billion Parameters)
    "groq/llama-3.3-70b-versatile",
    
    # 3. OpenAI's Open Source Model (120 Billion Parameters - Massive brain!)
    "groq/openai/gpt-oss-120b",
    
    # 4. Alibaba's Top Coding Model (32 Billion Parameters)
    "groq/qwen/qwen3-32b"
]

# The test repository
TEST_REPO = "https://github.com/Satyamyaduvanshi/text.ai.git"

def load_ssh_details():
    try:
        key_path = os.path.abspath("shipit.pem")
        with open(key_path, 'r') as f:
            private_key = f.read()
            
        return {
            "hostname": "98.92.66.127",  
            "username": "ubuntu",
            "private_key": private_key
        }
    except Exception as e:
        print(f"❌ Error loading SSH key: {e}")
        exit(1)

def run_benchmark():
    ssh_details = load_ssh_details()
    
    with open("dataset.json", "r") as f:
        scenarios = json.load(f)

    results = []

    for model in MODELS_TO_TEST:
        print(f"\n{'='*50}")
        print(f"🧪 EVALUATING MODEL: {model}")
        print(f"{'='*50}")

        successes = 0
        total_scenarios = len(scenarios)

        for scenario in scenarios:
            print(f"\n👉 Running Scenario {scenario['id']}: {scenario['category']}")
            
            # 1. Setup Deployer just to run break/cleanup commands
            admin_deployer = DeployerAgent(ssh_details)
            if not admin_deployer.connect():
                print("❌ Failed to connect to server. Check your IP and PEM key.")
                return
            
            # 2. Reset the server state to clean
            print("   🧹 Running cleanup command...")
            admin_deployer.execute(scenario['cleanup_command'])
            
            # --- CRITICAL FIX: Unlock immutable files before deleting ---
            admin_deployer.execute("sudo chattr -R -i app || true && sudo rm -rf app") 
            
            # 3. BREAK THE SERVER
            print(f"   💥 Breaking server: {scenario['description']}")
            admin_deployer.execute(scenario['break_command'])
            admin_deployer.close()

            # 4. Unleash the Orchestrator AI
            print(f"   🤖 Unleashing {model} Orchestrator...")
            # We pass socketio=None since we are running via CLI, not Flask
            orchestrator = OrchestratorAgent(
                deployment_id=f"test_{scenario['id']}",
                repo_url=TEST_REPO,
                ssh_details=ssh_details,
                socketio=None, 
                model_name=model
            )
            
            # Run the deployment!
            start_time = time.time()
            is_success = orchestrator.run()
            time_taken = round(time.time() - start_time, 2)
            
            if is_success:
                print(f"   ✅ {model} successfully fixed the server in {time_taken}s!")
                successes += 1
            else:
                print(f"   ❌ {model} failed to fix the scenario.")
                
            orchestrator.cleanup()

        # Record metrics for this model
        success_rate = (successes / total_scenarios) * 100
        results.append([model, f"{successes}/{total_scenarios}", f"{success_rate:.1f}%"])

    # --- PRINT FINAL ACADEMIC TABLE ---
    print("\n\n📊 FINAL BENCHMARK RESULTS")
    print(tabulate(results, headers=["Model", "Successes", "Success Rate"], tablefmt="grid"))
    print("\n(Use these numbers for your conference paper!)")

if __name__ == "__main__":
    run_benchmark()