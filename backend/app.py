from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_talisman import Talisman
from datetime import timedelta
import os

from config import Config
from database import init_db
from routes import api, bcrypt
from extensions import limiter

# ── Setup Flask ─────────────────────────────────────────────
app = Flask(__name__, static_folder='../', static_url_path='')

# ── CORS — origins from env var ─────────────────────────────
_allowed = os.getenv(
    "ALLOWED_ORIGINS",
    "https://chatchainaktae.github.io,"
    "http://127.0.0.1:8080,http://localhost:8080,"
    "http://127.0.0.1:5500,http://localhost:5500"
)
ALLOWED_ORIGINS = [o.strip() for o in _allowed.split(",") if o.strip()]

# In production, restrict to production origins only
if os.getenv("FLASK_ENV") == "production":
    prod_origins = os.getenv("ALLOWED_PROD_ORIGINS", "https://chatchainaktae.github.io")
    ALLOWED_ORIGINS = [o.strip() for o in prod_origins.split(",") if o.strip()]

CORS(app, resources={r"/api/*": {
    "origins": ALLOWED_ORIGINS,
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# ── Security Headers (Flask-Talisman) ────────────────────────
Talisman(
    app,
    force_https=os.getenv("FLASK_ENV") == "production",
    content_security_policy={
        "default-src": "'self'",
        "script-src": [
            "'self'",
            "cdn.jsdelivr.net",
            "'unsafe-inline'",
        ],
        "style-src": [
            "'self'",
            "'unsafe-inline'",
            "fonts.googleapis.com",
        ],
        "font-src": [
            "'self'",
            "fonts.gstatic.com",
            "cdn.jsdelivr.net",
        ],
        "img-src": [
            "'self'",
            "data:",
            "https:",
        ],
        "connect-src": [
            "'self'",
            "https://api.jikan.moe",
        ],
    },
    x_content_type_options=True,
    x_xss_protection=False,
    frame_options="SAMEORIGIN",
)

# ── Rate Limiting (Flask-Limiter) ────────────────────────────
limiter.init_app(app)

# ── JWT Configuration ───────────────────────────────────────
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

# ── Initialize Extensions ───────────────────────────────────
jwt = JWTManager(app)
bcrypt.init_app(app)

# ── Database ────────────────────────────────────────────────
init_db()

# ── Register Routes ─────────────────────────────────────────
app.register_blueprint(api, url_prefix='/api')


@app.route('/')
def root():
    return app.send_static_file('index.html')


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
