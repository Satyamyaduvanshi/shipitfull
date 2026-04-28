# run.py
import eventlet
eventlet.monkey_patch() # MUST be at the very top

from app import create_app, socketio

app = create_app()

if __name__ == '__main__':
    print("🚀 Starting ShipIt Server with Eventlet on Port 5001...")
    # debug=True can sometimes interfere with eventlet, 
    # use it only if needed for development.
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)