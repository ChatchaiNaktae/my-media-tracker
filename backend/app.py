from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os

# Import modules from our separated files
from config import Config
from database import init_db
from routes import api, bcrypt

# Setup Flask
app = Flask(__name__, static_folder='../', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": ["https://chatchainaktae.github.io", "http://127.0.0.1:8080", "http://localhost:8080"]}})

# Load Configuration
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

# Initialize Extensions
jwt = JWTManager(app)
bcrypt.init_app(app)

# Initialize Database Migration (if needed)
init_db()

# Register API Routes
app.register_blueprint(api, url_prefix='/api')

# Root Route for Frontend
@app.route('/')
def root():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    # Discloud / Render will provide the port, fallback to 8080
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)