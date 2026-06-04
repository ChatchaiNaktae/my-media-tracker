from flask import Flask, request
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

# ── Security Headers (Flask-Talisman) — innermost layer ──────
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

# ── CORS — outermost layer so preflight headers always win ──
_allowed = os.getenv(
    "ALLOWED_ORIGINS",
    "https://chatchainaktae.github.io,"
    "http://127.0.0.1:8080,http://localhost:8080,"
    "http://127.0.0.1:5500,http://localhost:5500"
)
ALLOWED_ORIGINS = [o.strip() for o in _allowed.split(",") if o.strip()]

if os.getenv("FLASK_ENV") == "production":
    prod_origins = os.getenv("ALLOWED_PROD_ORIGINS", "https://chatchainaktae.github.io")
    ALLOWED_ORIGINS = [o.strip() for o in prod_origins.split(",") if o.strip()]

CORS(app, resources={r"/api/*": {
    "origins": ALLOWED_ORIGINS,
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "Accept"],
    "expose_headers": ["Authorization"],
    "supports_credentials": True,
    "intercept_exceptions": True,
    "max_age": 86400,
}})

# ── Rate Limiting (Flask-Limiter) ────────────────────────────
limiter.init_app(app)

# ── JWT Configuration ───────────────────────────────────────
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = False

# ── Initialize Extensions ───────────────────────────────────
jwt = JWTManager(app)
bcrypt.init_app(app)

# ── Database ────────────────────────────────────────────────
init_db()

# ── Register Routes ─────────────────────────────────────────
app.register_blueprint(api, url_prefix='/api')


@app.after_request
def handle_options(response):
    """Ensure preflight OPTIONS requests always return 200 with CORS headers."""
    if request.method == "OPTIONS" and response.status_code not in (200, 204):
        response.status_code = 200
    return response


@app.route('/')
def root():
    return app.send_static_file('index.html')


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
