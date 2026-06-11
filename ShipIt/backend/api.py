import asyncio
import bcrypt
from flask import Flask, jsonify, request
from prisma import Prisma
from prisma.errors import UniqueViolationError

app = Flask(__name__)

# Initialize Prisma Client
prisma = Prisma()


# -------------------------
# Database Connection
# -------------------------
async def connect_db():
    if not prisma.is_connected():
        await prisma.connect()


async def disconnect_db():
    if prisma.is_connected():
        await prisma.disconnect()


# Connect when app starts
asyncio.run(connect_db())


# -------------------------
# Home Route
# -------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify(
        {
            "server": "ShipIt API",
            "status": "Running",
            "message": "Welcome to the ShipIt backend!",
        }
    )


# -------------------------
# Register Route
# -------------------------
@app.route("/register", methods=["POST"])
async def register():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not username or not email or not password:
            return jsonify(
                {
                    "error": "username, email and password are required"
                }
            ), 400

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        user = await prisma.user.create(
            data={
                "username": username,
                "email": email,
                "hashed_password": hashed_password,
            }
        )

        return (
            jsonify(
                {
                    "message": "User registered successfully",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                }
            ),
            201,
        )

    except UniqueViolationError:
        return jsonify(
            {"error": "Username or email already exists"}
        ), 409

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------
# Login Route
# -------------------------
@app.route("/login", methods=["POST"])
async def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify(
                {"error": "Email and password are required"}
            ), 400

        user = await prisma.user.find_unique(
            where={"email": email}
        )

        if not user:
            return jsonify(
                {"error": "Invalid email or password"}
            ), 401

        valid_password = bcrypt.checkpw(
            password.encode("utf-8"),
            user.hashed_password.encode("utf-8"),
        )

        if not valid_password:
            return jsonify(
                {"error": "Invalid email or password"}
            ), 401

        return jsonify(
            {
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------
# Health Check
# -------------------------
@app.route("/health", methods=["GET"])
async def health():
    return jsonify(
        {
            "status": "healthy",
            "database": prisma.is_connected(),
        }
    )


# -------------------------
# Application Entry Point
# -------------------------
if __name__ == "__main__":
    try:
        app.run(
            host="0.0.0.0",
            port=5000,
            debug=True,
        )
    finally:
        asyncio.run(disconnect_db())
