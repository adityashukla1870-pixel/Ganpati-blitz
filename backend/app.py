import os
import re
import uuid
import random
import string
import time
import threading
from datetime import datetime, timedelta

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import pymongo.errors
from pymongo import MongoClient, DESCENDING, ASCENDING
from pymongo.errors import ConnectionFailure
from werkzeug.security import generate_password_hash, check_password_hash
from services.progression import ACHIEVEMENTS, award_xp, unlock_game_achievements, progression_snapshot
from services.universal_points import (
    award_universal_points,
    award_fixed_universal_points,
    calculate_universal_points,
    get_rank_tier,
)


load_dotenv()

app = Flask(__name__)

# Production-safe Secret Key handling
secret_key = os.getenv("SECRET_KEY")
if not secret_key or secret_key == "dev-secret-key":
    if os.getenv("FLASK_ENV") == "production":
        secret_key = os.urandom(24).hex()
    else:
        secret_key = "dev-secret-key"
app.config["SECRET_KEY"] = secret_key

# Flexible CORS & Socket.IO origins configuration
raw_origins = os.getenv("ALLOWED_ORIGINS", "")
frontend_url = os.getenv("FRONTEND_URL", "")

DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://ganpati-blitz.vercel.app",
]

origins_list = list(DEFAULT_ORIGINS)
if raw_origins:
    if raw_origins.strip() == "*":
        origins_list = ["*"]
    else:
        for o in raw_origins.split(","):
            val = o.strip().rstrip("/")
            if val and val not in origins_list:
                origins_list.append(val)

if frontend_url and "*" not in origins_list:
    val = frontend_url.strip().rstrip("/")
    if val and val not in origins_list:
        origins_list.append(val)


def is_allowed_origin(origin):
    if not origin:
        return False
    if "*" in origins_list:
        return True
    if origin in origins_list:
        return True
    if re.match(r"^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$", origin):
        return True
    if re.match(r"^https:\/\/([a-zA-Z0-9_-]+\.)?vercel\.app$", origin):
        return True
    return False


cors_target = "*" if "*" in origins_list else origins_list + [r"^https:\/\/.*\.vercel\.app$"]
CORS(
    app,
    resources={r"/*": {"origins": cors_target}},
    supports_credentials=True,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
)


@app.before_request
def handle_cors_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        origin = request.headers.get("Origin")
        if origin and (is_allowed_origin(origin) or "*" in origins_list):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        elif origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept"
        response.headers["Access-Control-Max-Age"] = "86400"
        return response


@app.after_request
def ensure_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and "Access-Control-Allow-Origin" not in response.headers:
        if is_allowed_origin(origin) or "*" in origins_list:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept"
    return response


socketio_async_mode = os.getenv("SOCKETIO_ASYNC_MODE", "threading")
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode=socketio_async_mode,
    ping_timeout=30,
    ping_interval=10,
)

def get_sanitized_mongo_uri():
    raw = os.getenv("MONGO_URI", "").strip()
    if (raw.startswith('"') and raw.endswith('"')) or (raw.startswith("'") and raw.endswith("'")):
        raw = raw[1:-1].strip()
    return raw or "mongodb://localhost:27017/ganpati_blitz"


def mask_credentials(text):
    if not text:
        return ""
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", str(text))


def diagnose_mongo_error(err, uri):
    safe_uri = mask_credentials(uri)
    raw_error_str = mask_credentials(str(err))
    error_type = type(err).__name__

    is_production = os.getenv("FLASK_ENV") == "production" or "RENDER" in os.environ
    is_localhost = "localhost" in uri or "127.0.0.1" in uri
    has_brackets = "<" in uri or ">" in uri

    if is_localhost and is_production:
        return {
            "category": "MISSING_MONGO_URI",
            "error_type": error_type,
            "message": "MONGO_URI is missing or pointing to localhost in production. Please set MONGO_URI in Render Environment Variables.",
            "safe_error": raw_error_str,
        }
    elif has_brackets:
        return {
            "category": "UNREPLACED_PLACEHOLDERS",
            "error_type": error_type,
            "message": "MONGO_URI contains '<' or '>' template brackets. Replace '<password>' and '<username>' with your actual database credentials in Render.",
            "safe_error": raw_error_str,
        }
    elif isinstance(err, pymongo.errors.OperationFailure) or "authentication failed" in raw_error_str.lower():
        return {
            "category": "AUTH_FAILED",
            "error_type": error_type,
            "message": "MongoDB authentication failed. Verify your database username and password in Render. If your password contains special characters (@, %, #, +), URL-encode them.",
            "safe_error": raw_error_str,
        }
    elif isinstance(err, pymongo.errors.ServerSelectionTimeoutError) or "timed out" in raw_error_str.lower():
        return {
            "category": "IP_NOT_WHITELISTED_OR_TIMEOUT",
            "error_type": error_type,
            "message": "Connection to MongoDB cluster timed out. Verify MongoDB Atlas Network Access: Add IP 0.0.0.0/0 (Allow access from anywhere).",
            "safe_error": raw_error_str,
        }
    elif isinstance(err, pymongo.errors.ConfigurationError):
        return {
            "category": "CONFIGURATION_ERROR",
            "error_type": error_type,
            "message": f"MongoDB configuration error. Verify connection string format and ensure dnspython is installed: {raw_error_str}",
            "safe_error": raw_error_str,
        }
    else:
        return {
            "category": "DATABASE_ERROR",
            "error_type": error_type,
            "message": f"MongoDB connection error: {raw_error_str}",
            "safe_error": raw_error_str,
        }


_client = None
_indexes_ready = False
_last_db_error = None


def get_db():
    global _client, _indexes_ready, _last_db_error
    uri = get_sanitized_mongo_uri()
    try:
        if _client is None:
            client_kwargs = {
                "serverSelectionTimeoutMS": 5000,
                "connectTimeoutMS": 5000,
                "socketTimeoutMS": 5000,
            }
            try:
                import certifi
                client_kwargs["tlsCAFile"] = certifi.where()
            except Exception:
                pass
            _client = MongoClient(uri, **client_kwargs)
        _client.admin.command("ping")
        _last_db_error = None
    except Exception as e:
        _client = None  # Reset client so next request makes a fresh attempt
        _last_db_error = diagnose_mongo_error(e, uri)
        app.logger.error(f"[MongoDB Error] {_last_db_error['category']}: {_last_db_error['message']}")
        return None, _last_db_error["message"]

    db = _client.get_default_database(default="ganpati_blitz")
    if not _indexes_ready:
        try:
            db.players.create_index([("player_id", ASCENDING)], unique=True)
            db.players.create_index([("campus", ASCENDING), ("rating", DESCENDING)])
            db.game_scores.create_index([("game_id", ASCENDING), ("score", DESCENDING)])
            db.game_scores.create_index([("player_id", ASCENDING), ("game_id", ASCENDING), ("created_at", DESCENDING)])
            db.game_scores.create_index(
                [("player_id", ASCENDING), ("session_id", ASCENDING)],
                unique=True,
                partialFilterExpression={"session_id": {"$type": "string"}},
            )
            db.xp_events.create_index([("player_id", ASCENDING), ("reward_key", ASCENDING)], unique=True)
            db.daily_completions.create_index([("player_id", ASCENDING), ("challenge_id", ASCENDING)], unique=True)
            db.player_achievements.create_index([("player_id", ASCENDING), ("achievement_id", ASCENDING)], unique=True)
            db.players.create_index([("universal_points", DESCENDING)])
            db.players.create_index([("campus", ASCENDING), ("universal_points", DESCENDING)])
            db.point_transactions.create_index([("player_id", ASCENDING), ("run_id", ASCENDING)], unique=True)
            db.point_transactions.create_index([("player_id", ASCENDING), ("created_at", DESCENDING)])
            _indexes_ready = True
        except Exception as idx_err:
            app.logger.warning(f"[MongoDB Index Warning] Non-fatal index creation warning: {mask_credentials(idx_err)}")
    return db, None


# ─────────────────────────────────────────────
# In-memory rooms & match state
# ─────────────────────────────────────────────
rooms = {}
matches = {}
quick_match_queue = []
disconnect_timers = {}


def generate_room_code():
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(chars, k=5))
        if code not in rooms:
            return code


def generate_seed():
    return random.randint(100000, 999999)


# ─────────────────────────────────────────────
# REST API — Phase 1 (preserved)
# ─────────────────────────────────────────────

@app.route("/", methods=["GET"])
@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health():
    db, err = get_db()
    if err:
        diag = _last_db_error or {}
        return jsonify({
            "status": "unhealthy",
            "service": "ganpati-blitz",
            "database": {
                "connected": False,
                "category": diag.get("category", "DATABASE_ERROR"),
                "reason": diag.get("message", err),
                "error_type": diag.get("error_type", "DatabaseError"),
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }), 503
    return jsonify({
        "status": "healthy",
        "service": "ganpati-blitz",
        "database": {
            "connected": True,
            "name": db.name,
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }), 200


def serialize_player_profile(db, player_doc, is_existing=False):
    player_id = player_doc.get("player_id", "")
    progress = db.player_progress.find_one({"player_id": player_id}) or {}
    total_xp = progress.get("total_xp", 0)
    snap = progression_snapshot(total_xp)
    up = player_doc.get("universal_points", 0)
    rank = db.players.count_documents({"universal_points": {"$gt": up}, "player_id": {"$not": {"$regex": "^seed"}}}) + 1
    tier = get_rank_tier(up)

    created_at = player_doc.get("created_at")
    created_at_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")

    return {
        "player_id": player_id,
        "id": player_id,
        "display_name": player_doc.get("display_name", "Player"),
        "name": player_doc.get("display_name", "Player"),
        "campus": player_doc.get("campus", "Unknown"),
        "avatar": player_doc.get("avatar", "🪷"),
        "universal_points": up,
        "rating": player_doc.get("rating", 1000),
        "games_played": player_doc.get("games_played", 0),
        "wins": player_doc.get("wins", 0),
        "losses": player_doc.get("losses", 0),
        "level": snap.get("level", 1),
        "xp": snap.get("current_level_xp", 0),
        "xpNext": snap.get("next_level_xp", 100),
        "tier": tier,
        "global_rank": rank,
        "created_at": created_at_str,
        "is_existing": is_existing,
    }


@app.route("/api/player", methods=["POST"])
def create_or_get_player():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    display_name = data.get("display_name", "").strip()
    campus = data.get("campus", "").strip()
    avatar = data.get("avatar", "🪷").strip() or "🪷"
    pin = str(data.get("pin", "")).strip()

    if not display_name or not campus:
        return jsonify({"error": "display_name and campus are required"}), 400
    if len(display_name) < 2 or len(display_name) > 40:
        return jsonify({"error": "Display name must be between 2 and 40 characters"}), 400
    if len(campus) > 80:
        return jsonify({"error": "campus is too long"}), 400
    if not pin or len(pin) < 4 or len(pin) > 8:
        return jsonify({"error": "Security PIN must be between 4 and 8 digits/characters"}), 400

    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503

    existing = db.players.find_one({
        "display_name": {"$regex": f"^{re.escape(display_name)}$", "$options": "i"},
        "campus": campus,
        "player_id": {"$not": {"$regex": "^seed"}},
    })
    if existing:
        return jsonify({"error": f"An account named '{display_name}' already exists at {campus}. Please switch to Log In."}), 409

    player_id = str(uuid.uuid4())
    player = {
        "player_id": player_id,
        "display_name": display_name,
        "campus": campus,
        "avatar": avatar,
        "pin_hash": generate_password_hash(pin),
        "universal_points": 0,
        "rating": 1000,
        "games_played": 0,
        "wins": 0,
        "losses": 0,
        "created_at": datetime.utcnow()
    }

    db.players.insert_one(player)
    return jsonify(serialize_player_profile(db, player, is_existing=False)), 201


@app.route("/api/player/login", methods=["POST"])
def login_player():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    display_name = data.get("display_name", "").strip()
    campus = data.get("campus", "").strip()
    pin = str(data.get("pin", "")).strip()

    if not display_name:
        return jsonify({"error": "display_name is required"}), 400
    if not pin:
        return jsonify({"error": "Security PIN is required"}), 400

    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503

    query = {
        "display_name": {"$regex": f"^{re.escape(display_name)}$", "$options": "i"},
        "player_id": {"$not": {"$regex": "^seed"}},
    }
    if campus and campus not in ("All Campuses", "Other", ""):
        query["campus"] = {"$regex": f"^{re.escape(campus)}$", "$options": "i"}

    existing = db.players.find_one(query)
    if not existing and campus and campus not in ("All Campuses", "Other", ""):
        # Fallback: search by display_name regardless of campus
        existing = db.players.find_one({
            "display_name": {"$regex": f"^{re.escape(display_name)}$", "$options": "i"},
            "player_id": {"$not": {"$regex": "^seed"}},
        })

    if not existing:
        campus_suffix = f" at {campus}" if campus and campus != "All Campuses" else ""
        return jsonify({"error": f"No account found for '{display_name}'{campus_suffix}. Please check spelling or click Create Account."}), 404

    # Security verification via PIN
    stored_hash = existing.get("pin_hash")
    if not stored_hash:
        # Account claim migration: First login secures the existing legacy account with their chosen PIN
        new_hash = generate_password_hash(pin)
        db.players.update_one({"_id": existing["_id"]}, {"$set": {"pin_hash": new_hash}})
        existing["pin_hash"] = new_hash
    else:
        if not check_password_hash(stored_hash, pin):
            return jsonify({"error": "Incorrect Security PIN. Please verify your PIN and try again."}), 401

    return jsonify(serialize_player_profile(db, existing, is_existing=True)), 200


VALID_GAME_IDS = ["modak-rush", "diya-dash", "dhol-battle", "rangoli-rush", "mushak-maze", "ganpati-logic", "blitz-mix"]

GAME_SCORE_LIMITS = {
    "modak-rush": (0, 50000),
    "diya-dash": (0, 99999),
    "dhol-battle": (0, 99999),
    "rangoli-rush": (0, 99999),
    "mushak-maze": (0, 99999),
    "ganpati-logic": (0, 99999),
    "blitz-mix": (0, 600),
}

GAME_DURATION_RANGES = {
    "modak-rush": (25, 35),
    "dhol-battle": (40, 50),
    "ganpati-logic": (40, 50),
    "diya-dash": (0, 120),
    "rangoli-rush": (0, 300),
    "mushak-maze": (0, 300),
    "blitz-mix": (1, 600),
}


@app.route("/api/games/<game_id>/score", methods=["POST"])
def submit_score(game_id):
    if game_id not in VALID_GAME_IDS:
        return jsonify({"error": "Invalid game_id"}), 400

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body required"}), 400

    player_id = data.get("player_id")
    session_id = data.get("session_id")
    score = data.get("score")
    duration = data.get("duration")

    if not player_id:
        return jsonify({"error": "player_id is required"}), 400

    score_min, score_max = GAME_SCORE_LIMITS.get(game_id, (0, 99999))
    if not isinstance(score, int) or score < score_min or score > score_max:
        return jsonify({"error": f"score must be an integer between {score_min} and {score_max}"}), 400

    dur_min, dur_max = GAME_DURATION_RANGES.get(game_id, (0, 600))
    if not isinstance(duration, (int, float)) or duration < dur_min or duration > dur_max:
        return jsonify({"error": f"duration must be between {dur_min} and {dur_max}"}), 400

    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503

    player = db.players.find_one({"player_id": player_id})
    if not player:
        return jsonify({"error": "Player not found"}), 404

    if session_id and db.game_scores.find_one({"player_id": player_id, "session_id": session_id}):
        return jsonify({"error": "This game session was already submitted."}), 409

    game_score = {
        "player_id": player_id,
        "game_id": game_id,
        "score": score,
        "duration": float(duration),
        "game_data": data.get("game_data", {}),
        "created_at": datetime.utcnow()
    }
    if isinstance(session_id, str) and session_id.strip():
        game_score["session_id"] = session_id.strip()
    # Check if this run is a new personal best for this game
    prev_best = db.game_scores.find_one({"player_id": player_id, "game_id": game_id}, sort=[("score", DESCENDING)])
    is_pb = (prev_best is None) or (score > prev_best.get("score", 0))

    score_id = str(uuid.uuid4())
    game_score["score_id"] = score_id
    db.game_scores.insert_one(game_score)

    xp_amount = 50 if game_id == "blitz-mix" else 10
    progression, xp_awarded = award_xp(db, player_id, xp_amount, "game_completion", score_id)
    unlocked = unlock_game_achievements(db, player_id, game_id, game_score["game_data"])

    # Authoritative Universal Points award
    game_data = data.get("game_data", {})
    difficulty = data.get("difficulty") or game_data.get("difficulty", "normal")
    stats = data.get("stats") or game_data.get("stats") or game_data
    run_id = data.get("run_id") or session_id or score_id

    up_result = award_universal_points(
        db=db,
        player_id=player_id,
        run_id=run_id,
        game_id=game_id,
        score=score,
        duration=duration,
        difficulty=difficulty,
        stats=stats,
        is_pb=is_pb,
        source="solo_game",
    )

    return jsonify({
        "message": "Score submitted successfully",
        "score": score,
        "player_id": player_id,
        "game_id": game_id,
        "xp_awarded": xp_amount if xp_awarded else 0,
        "progression": progression,
        "achievements_unlocked": unlocked,
        "universal_points_awarded": up_result["universal_points_awarded"],
        "universal_points_breakdown": up_result["breakdown"],
        "new_universal_points": up_result["new_universal_points"],
        "global_rank": up_result["global_rank"],
        "rank_tier": up_result["rank_tier"],
    }), 201


@app.route("/api/progression/<player_id>", methods=["GET"])
def get_progression(player_id):
    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503
    progress = db.player_progress.find_one({"player_id": player_id}) or {"total_xp": 0}
    return jsonify(progression_snapshot(progress.get("total_xp", 0)))


@app.route("/api/achievements", methods=["GET"])
def get_achievements():
    return jsonify({"achievements": ACHIEVEMENTS})


@app.route("/api/achievements/<player_id>", methods=["GET"])
def get_player_achievements(player_id):
    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503
    unlocked = list(db.player_achievements.find({"player_id": player_id}, {"_id": 0}))
    for item in unlocked:
        if isinstance(item.get("unlocked_at"), datetime):
            item["unlocked_at"] = item["unlocked_at"].isoformat()
    return jsonify({"achievements": ACHIEVEMENTS, "unlocked": unlocked})


@app.route("/api/profile/<player_id>", methods=["GET"])
def get_profile(player_id):
    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503
    player = db.players.find_one({"player_id": player_id}, {"_id": 0})
    if not player:
        return jsonify({"error": "Player not found"}), 404
    progress = db.player_progress.find_one({"player_id": player_id}) or {"total_xp": 0}
    games_played = db.game_scores.count_documents({"player_id": player_id})
    best_scores = list(db.game_scores.aggregate([
        {"$match": {"player_id": player_id}},
        {"$group": {"_id": "$game_id", "best_score": {"$max": "$score"}}},
    ]))
    unlocked_count = db.player_achievements.count_documents({"player_id": player_id})
    progress_data = progression_snapshot(progress.get("total_xp", 0))
    progress_data.update({"current_streak": progress.get("current_streak", 0), "longest_streak": progress.get("longest_streak", 0)})

    up = player.get("universal_points", 0)
    global_rank = db.players.count_documents({"universal_points": {"$gt": up}}) + 1
    rank_tier = get_rank_tier(up)

    profile = {
        "player": {
            "player_id": player["player_id"],
            "display_name": player["display_name"],
            "campus": player["campus"],
            "avatar": player.get("avatar", "🪷"),
            "rating": player.get("rating", 1000),
            "universal_points": up,
            "global_rank": global_rank,
            "rank_tier": rank_tier,
        },
        "competitive": {
            "universal_points": up,
            "global_rank": global_rank,
            "rank_tier": rank_tier,
        },
        "progression": progress_data,
        "stats": {"games_played": games_played, "wins": player.get("wins", 0), "achievements": unlocked_count, "achievement_total": len(ACHIEVEMENTS)},
        "best_scores": {item["_id"]: item["best_score"] for item in best_scores},
    }
    return jsonify(profile)


@app.route("/api/stats/<player_id>", methods=["GET"])
def get_stats(player_id):
    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503
    if not db.players.find_one({"player_id": player_id}, {"_id": 1}):
        return jsonify({"error": "Player not found"}), 404
    game_counts = list(db.game_scores.aggregate([
        {"$match": {"player_id": player_id}},
        {"$group": {"_id": "$game_id", "plays": {"$sum": 1}, "best_score": {"$max": "$score"}}},
        {"$sort": {"plays": -1}},
    ]))
    progress = db.player_progress.find_one({"player_id": player_id}) or {"total_xp": 0}
    return jsonify({
        "progression": progression_snapshot(progress.get("total_xp", 0)),
        "games": game_counts,
        "daily_challenges_completed": db.daily_completions.count_documents({"player_id": player_id}),
        "blitz_mix_completions": db.game_scores.count_documents({"player_id": player_id, "game_id": "blitz-mix"}),
        "multiplayer_matches": db.match_players.count_documents({"player_id": player_id}),
        "current_streak": progress.get("current_streak", 0),
        "longest_streak": progress.get("longest_streak", 0),
    })


def current_daily_challenge():
    challenge_date = datetime.utcnow().date().isoformat()
    return {
        "challenge_id": f"{challenge_date}:modak-rush:score",
        "challenge_date": challenge_date,
        "game_id": "modak-rush",
        "challenge_type": "score",
        "target": 300,
        "description": "Reach 300 points in one Modak Rush run.",
        "reward_xp": 25,
    }


@app.route("/api/daily-challenge", methods=["GET"])
def get_daily_challenge():
    challenge = current_daily_challenge()
    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503
    player_id = request.args.get("player_id")
    completed = bool(player_id and db.daily_completions.find_one({
        "player_id": player_id,
        "challenge_id": challenge["challenge_id"],
    }))
    return jsonify({"challenge": challenge, "completed": completed})


@app.route("/api/daily-challenge/complete", methods=["POST"])
def complete_daily_challenge():
    data = request.get_json(silent=True) or {}
    player_id = data.get("player_id")
    challenge = current_daily_challenge()
    if not player_id:
        return jsonify({"error": "player_id is required"}), 400

    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503
    if db.daily_completions.find_one({"player_id": player_id, "challenge_id": challenge["challenge_id"]}):
        return jsonify({"completed": True, "already_claimed": True, "rewarded_xp": 0})

    today = datetime.utcnow().date()
    start = datetime.combine(today, datetime.min.time())
    end = start + timedelta(days=1)
    valid_run = db.game_scores.find_one({
        "player_id": player_id,
        "game_id": challenge["game_id"],
        "score": {"$gte": challenge["target"]},
        "created_at": {"$gte": start, "$lt": end},
    })
    if not valid_run:
        return jsonify({"error": "Complete the challenge in a validated game run first."}), 400

    completion = {
        "player_id": player_id,
        "challenge_id": challenge["challenge_id"],
        "challenge_date": challenge["challenge_date"],
        "completed_at": datetime.utcnow(),
    }
    db.daily_completions.insert_one(completion)
    yesterday = (today - timedelta(days=1)).isoformat()
    had_yesterday = db.daily_completions.find_one({"player_id": player_id, "challenge_date": yesterday})
    old_progress = db.player_progress.find_one({"player_id": player_id}) or {}
    current_streak = old_progress.get("current_streak", 0) + 1 if had_yesterday else 1
    longest_streak = max(old_progress.get("longest_streak", 0), current_streak)
    db.player_progress.update_one(
        {"player_id": player_id},
        {"$set": {"current_streak": current_streak, "longest_streak": longest_streak, "updated_at": datetime.utcnow()}},
        upsert=True,
    )
    progression, awarded = award_xp(db, player_id, challenge["reward_xp"], "daily_challenge", challenge["challenge_id"])
    up_res = award_fixed_universal_points(
        db,
        player_id,
        run_id=f"daily:{challenge['challenge_id']}:{player_id}",
        amount=25,
        source="daily_challenge",
        metadata={"challenge_id": challenge["challenge_id"]},
    )
    return jsonify({
        "completed": True,
        "rewarded_xp": challenge["reward_xp"] if awarded else 0,
        "progression": progression,
        "universal_points_awarded": up_res["universal_points_awarded"],
        "new_universal_points": up_res["new_universal_points"],
        "global_rank": up_res["global_rank"],
        "rank_tier": up_res["rank_tier"],
    })


@app.route("/api/games/<game_id>/best/<player_id>", methods=["GET"])
def get_personal_best(game_id, player_id):
    if game_id not in VALID_GAME_IDS:
        return jsonify({"error": "Invalid game_id"}), 400

    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503

    result = db.game_scores.find_one(
        {"player_id": player_id, "game_id": game_id},
        sort=[("score", DESCENDING)]
    )

    if not result:
        return jsonify({"player_id": player_id, "best_score": 0})

    return jsonify({
        "player_id": player_id,
        "best_score": result["score"],
        "duration": result["duration"],
        "achieved_at": result["created_at"].isoformat()
    })


@app.route("/api/games/<game_id>/leaderboard", methods=["GET"])
def get_leaderboard(game_id):
    if game_id not in VALID_GAME_IDS:
        return jsonify({"error": "Invalid game_id"}), 400

    campus = request.args.get("campus")
    limit = request.args.get("limit", 50, type=int)
    if limit < 1:
        limit = 50
    if limit > 200:
        limit = 200

    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503

    pipeline = [
        {"$match": {"game_id": game_id}},
        {"$lookup": {
            "from": "players",
            "localField": "player_id",
            "foreignField": "player_id",
            "as": "player"
        }},
        {"$unwind": "$player"},
        {"$group": {
            "_id": "$player_id",
            "max_score": {"$max": "$score"},
            "display_name": {"$first": "$player.display_name"},
            "campus": {"$first": "$player.campus"}
        }}
    ]
    if campus:
        pipeline.append({"$match": {"campus": campus}})
    pipeline.extend([
        {"$sort": {"max_score": DESCENDING}},
        {"$limit": limit}
    ])

    results = list(db.game_scores.aggregate(pipeline))
    leaderboard = []
    for rank, entry in enumerate(results, 1):
        leaderboard.append({
            "rank": rank,
            "player_id": entry["_id"],
            "display_name": entry["display_name"],
            "campus": entry["campus"],
            "best_score": entry["max_score"]
        })

    return jsonify({
        "leaderboard": leaderboard,
        "count": len(leaderboard),
        "campus_filter": campus
    })


@app.route("/api/leaderboard/global", methods=["GET"])
@app.route("/api/leaderboard", methods=["GET"])
def get_global_leaderboard():
    campus = request.args.get("campus")
    if campus in ("All Campuses", "null", "", "undefined"):
        campus = None
    limit = request.args.get("limit", 50, type=int)
    page = request.args.get("page", 1, type=int)
    player_id = request.args.get("player_id")

    if limit < 1:
        limit = 50
    if limit > 200:
        limit = 200
    if page < 1:
        page = 1
    skip = (page - 1) * limit

    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503

    query = {"player_id": {"$not": {"$regex": "^seed"}}}
    if campus:
        query["campus"] = campus

    total_players = db.players.count_documents(query)

    cursor = db.players.find(
        query,
        {
            "player_id": 1,
            "display_name": 1,
            "campus": 1,
            "avatar": 1,
            "universal_points": 1,
            "rating": 1,
            "games_played": 1,
            "wins": 1,
        }
    ).sort("universal_points", DESCENDING).skip(skip).limit(limit)

    results = list(cursor)
    leaderboard = []
    for idx, doc in enumerate(results):
        up = doc.get("universal_points", 0)
        rank = skip + idx + 1
        tier = get_rank_tier(up)
        leaderboard.append({
            "rank": rank,
            "player_id": doc["player_id"],
            "display_name": doc.get("display_name", "Player"),
            "campus": doc.get("campus", "Unknown"),
            "avatar": doc.get("avatar", "🪷"),
            "universal_points": up,
            "tier": tier,
            "rating": doc.get("rating", 1000),
            "games_played": doc.get("games_played", 0),
        })

    player_card = None
    if player_id:
        p_doc = db.players.find_one({"player_id": player_id})
        if p_doc:
            p_up = p_doc.get("universal_points", 0)
            p_rank = db.players.count_documents({"universal_points": {"$gt": p_up}, "player_id": {"$not": {"$regex": "^seed"}}}) + 1
            p_campus_rank = None
            if campus:
                p_campus_rank = db.players.count_documents({"campus": campus, "universal_points": {"$gt": p_up}, "player_id": {"$not": {"$regex": "^seed"}}}) + 1
            player_card = {
                "player_id": player_id,
                "display_name": p_doc.get("display_name", "Player"),
                "campus": p_doc.get("campus", "Unknown"),
                "avatar": p_doc.get("avatar", "🪷"),
                "universal_points": p_up,
                "global_rank": p_rank,
                "campus_rank": p_campus_rank,
                "tier": get_rank_tier(p_up),
                "percentile": round((1.0 - (p_rank / max(1, total_players))) * 100, 1),
            }

    return jsonify({
        "leaderboard": leaderboard,
        "total_players": total_players,
        "page": page,
        "limit": limit,
        "campus_filter": campus,
        "player_card": player_card,
    })


# ─────────────────────────────────────────────
# REST API — Phase 2 (multiplayer)
# ─────────────────────────────────────────────

@app.route("/api/matches/history/<player_id>", methods=["GET"])
def get_match_history(player_id):
    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503

    limit = request.args.get("limit", 20, type=int)
    if limit < 1:
        limit = 20
    if limit > 100:
        limit = 100

    matches_list = list(
        db.match_players.find({"player_id": player_id})
        .sort("created_at", DESCENDING)
        .limit(limit)
    )

    history = []
    for mp in matches_list:
        match_doc = db.matches.find_one({"match_id": mp["match_id"]})
        if not match_doc:
            continue

        opponent_id = None
        for pid in match_doc.get("player_ids", []):
            if pid != player_id:
                opponent_id = pid
                break

        opponent = db.players.find_one({"player_id": opponent_id}) if opponent_id else None
        opponent_name = opponent["display_name"] if opponent else "Unknown"

        my_score = mp.get("score", 0)
        opp_mp = db.match_players.find_one({
            "match_id": mp["match_id"],
            "player_id": opponent_id
        }) if opponent_id else None
        opp_score = opp_mp.get("score", 0) if opp_mp else 0

        history.append({
            "match_id": mp["match_id"],
            "opponent_name": opponent_name,
            "result": mp.get("result", "draw"),
            "my_score": my_score,
            "opponent_score": opp_score,
            "rating_before": mp.get("rating_before", 1000),
            "rating_after": mp.get("rating_after", 1000),
            "mode": match_doc.get("mode", "quick_match"),
            "created_at": match_doc.get("created_at", datetime.utcnow()).isoformat()
        })

    return jsonify({"history": history})


@app.route("/api/leaderboard/multiplayer", methods=["GET"])
def get_multiplayer_leaderboard():
    limit = request.args.get("limit", 50, type=int)
    campus = request.args.get("campus")
    if limit < 1:
        limit = 50
    if limit > 200:
        limit = 200

    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503

    pipeline = [
        {"$match": {"games_played": {"$gte": 1}}},
        {"$lookup": {
            "from": "players",
            "localField": "player_id",
            "foreignField": "player_id",
            "as": "player"
        }},
        {"$unwind": "$player"},
    ]
    if campus:
        pipeline.append({"$match": {"player.campus": campus}})
    pipeline.extend([
        {"$project": {
            "player_id": 1,
            "display_name": "$player.display_name",
            "campus": "$player.campus",
            "rating": 1,
            "games_played": 1,
            "wins": 1,
            "losses": 1,
        }},
        {"$sort": {"rating": DESCENDING}},
        {"$limit": limit}
    ])

    results = list(db.players.aggregate(pipeline))
    leaderboard = []
    for rank, entry in enumerate(results, 1):
        leaderboard.append({
            "rank": rank,
            "player_id": entry["player_id"],
            "display_name": entry["display_name"],
            "campus": entry["campus"],
            "rating": entry.get("rating", 1000),
            "games_played": entry.get("games_played", 0),
            "wins": entry.get("wins", 0),
            "losses": entry.get("losses", 0),
        })

    return jsonify({"leaderboard": leaderboard, "count": len(leaderboard)})


@app.route("/api/player/<player_id>/rating", methods=["GET"])
def get_player_rating(player_id):
    db, err = get_db()
    if err:
        return jsonify({"error": err}), 503

    player = db.players.find_one({"player_id": player_id})
    if not player:
        return jsonify({"error": "Player not found"}), 404

    return jsonify({
        "player_id": player_id,
        "rating": player.get("rating", 1000),
        "games_played": player.get("games_played", 0),
        "wins": player.get("wins", 0),
        "losses": player.get("losses", 0),
    })


# ─────────────────────────────────────────────
# Socket.IO Events — Rooms & Matchmaking
# ─────────────────────────────────────────────

@socketio.on("connect")
def on_connect():
    emit("connected", {"sid": request.sid})


@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    for room_code, room in list(rooms.items()):
        if sid in room.get("players", {}):
            player_id = room["players"][sid]
            leave_room(room_code)

            if room["status"] == "waiting":
                room["players"].pop(sid, None)
                created_age = time.time() - room.get("created_at", 0)
                # Keep room open for at least 90s to allow host to enter waiting room or reconnect
                if len(room["players"]) == 0 and created_age > 90:
                    rooms.pop(room_code, None)
                elif len(room["players"]) > 0:
                    emit("player_left", {
                        "player_id": player_id,
                        "message": "Opponent left."
                    }, room=room_code)
            elif room["status"] == "ready" or room["status"] == "playing":
                room["players"].pop(sid, None)
                room["disconnected"] = room.get("disconnected", {})
                room["disconnected"][player_id] = time.time()
                emit("player_disconnected", {
                    "player_id": player_id,
                    "message": "Opponent disconnected. Waiting for reconnection..."
                }, room=room_code)
                _start_disconnect_timer(room_code, player_id)
            break

    for q_entry in list(quick_match_queue):
        if q_entry.get("sid") == sid:
            quick_match_queue.remove(q_entry)
            break


def _start_disconnect_timer(room_code, player_id):
    timer_key = f"{room_code}:{player_id}"
    if timer_key in disconnect_timers:
        disconnect_timers[timer_key].cancel()

    def timeout():
        room = rooms.get(room_code)
        if room and player_id in room.get("disconnected", {}):
            room["disconnected"].pop(player_id, None)
            match_id = room.get("match_id")
            if match_id and match_id in matches:
                match = matches[match_id]
                if match["status"] == "playing":
                    match["status"] = "completed"
                    match["ended_at"] = datetime.utcnow()
                    _finalize_match(match_id, disconnected_player=player_id)
            emit("match_ended_by_disconnect", {
                "match_id": match_id,
                "disconnected_player": player_id,
                "message": "Opponent did not reconnect. Match ended."
            }, room=room_code)

    timer = threading.Timer(15.0, timeout)
    disconnect_timers[timer_key] = timer
    timer.start()


@socketio.on("create_room")
def on_create_room(data):
    player_id = (data.get("player_id") or data.get("id") or "").strip()
    display_name = (data.get("display_name") or data.get("name") or "Player").strip()
    game_id = data.get("game_id", "modak-rush")
    if not player_id:
        emit("error", {"message": "player_id required"})
        return

    if game_id not in VALID_GAME_IDS:
        game_id = "modak-rush"

    room_code = generate_room_code()
    rooms[room_code] = {
        "players": {request.sid: player_id},
        "player_names": {player_id: display_name},
        "game_id": game_id,
        "status": "waiting",
        "ready": {},
        "created_at": time.time(),
        "match_id": None,
        "disconnected": {},
    }
    join_room(room_code)
    emit("room_created", {
        "room_code": room_code,
        "player_id": player_id,
        "display_name": display_name,
        "game_id": game_id,
    })


@socketio.on("join_room")
def on_join_room(data):
    room_code = data.get("room_code", "").strip().upper()
    player_id = (data.get("player_id") or data.get("id") or "").strip()
    display_name = (data.get("display_name") or data.get("name") or "Player").strip()

    if not player_id:
        emit("error", {"message": "player_id required"})
        return

    room = rooms.get(room_code)
    if not room:
        emit("error", {"message": "Room not found. Check the code and try again."})
        return

    if room["status"] not in ("waiting", "ready"):
        emit("error", {"message": "Room is not accepting players."})
        return

    existing_pids = list(room["players"].values())
    if player_id in existing_pids:
        # Re-link current SID to this player_id
        old_sids = [s for s, pid in list(room["players"].items()) if pid == player_id]
        for s in old_sids:
            room["players"].pop(s, None)
        room["players"][request.sid] = player_id
        if display_name:
            room["player_names"][player_id] = display_name
        join_room(room_code)

        players_info = []
        for sid, pid in room["players"].items():
            players_info.append({
                "player_id": pid,
                "display_name": room["player_names"].get(pid, "Player"),
                "ready": room["ready"].get(pid, False),
            })
        emit("player_joined", {
            "room_code": room_code,
            "players": players_info,
            "game_id": room.get("game_id", "modak-rush"),
        }, room=room_code)
        emit("room_state", {
            "room_code": room_code,
            "players": players_info,
            "game_id": room.get("game_id", "modak-rush"),
            "status": room["status"],
        }, room=room_code)
        return

    if len(room["players"]) >= 2:
        emit("error", {"message": "Room is full."})
        return

    room["players"][request.sid] = player_id
    room["player_names"][player_id] = display_name
    room["status"] = "ready"
    join_room(room_code)

    players_info = []
    for sid, pid in room["players"].items():
        players_info.append({
            "player_id": pid,
            "display_name": room["player_names"].get(pid, "Player"),
            "ready": room["ready"].get(pid, False),
        })

    emit("player_joined", {
        "room_code": room_code,
        "players": players_info,
        "game_id": room.get("game_id", "modak-rush"),
    }, room=room_code)
    emit("room_state", {
        "room_code": room_code,
        "players": players_info,
        "game_id": room.get("game_id", "modak-rush"),
        "status": room["status"],
    }, room=room_code)


@socketio.on("player_ready")
def on_player_ready(data):
    room_code = (data.get("room_code") or "").strip().upper()
    player_id = (data.get("player_id") or data.get("id") or "").strip()

    room = rooms.get(room_code)
    if not room:
        emit("error", {"message": "Room not found"})
        return

    # Always ensure the invoking socket is joined to room_code
    join_room(room_code)

    if not player_id:
        player_id = room.get("players", {}).get(request.sid)

    if not player_id:
        emit("error", {"message": "Invalid player ID"})
        return

    # Ensure socket SID mapping is updated
    room["players"][request.sid] = player_id
    room["ready"][player_id] = True

    # Deduplicate players_info by player_id
    players_info = []
    seen_pids = set()
    for sid, pid in list(room["players"].items()):
        if pid not in seen_pids:
            seen_pids.add(pid)
            players_info.append({
                "player_id": pid,
                "display_name": room["player_names"].get(pid, "Player"),
                "ready": room["ready"].get(pid, False),
            })

    emit("player_ready", {
        "player_id": player_id,
        "players": players_info,
    }, room=room_code)

    # Trigger match start when at least 2 unique players are in room and all are ready
    unique_pids = set(room["players"].values())
    if len(unique_pids) >= 2 and all(room["ready"].get(pid, False) for pid in unique_pids):
        _start_match(room_code)


def _start_match(room_code):
    room = rooms.get(room_code)
    if not room:
        return

    # If already in countdown, re-emit to ensure any reconnected player receives it
    if room.get("status") == "countdown" and room.get("match_id"):
        match_id = room["match_id"]
        match = matches.get(match_id)
        if match:
            players_info = []
            for pid in match["player_ids"]:
                players_info.append({
                    "player_id": pid,
                    "display_name": match.get("player_names", {}).get(pid, "Player"),
                })
            emit("start_countdown", {
                "match_id": match_id,
                "seed": match["seed"],
                "players": players_info,
                "server_time": int(time.time() * 1000),
            }, room=room_code)
            return

    match_id = str(uuid.uuid4())
    seed = generate_seed()
    # Deduplicate player_ids preserving order
    player_ids = list(dict.fromkeys(room["players"].values()))

    match = {
        "match_id": match_id,
        "game_id": room.get("game_id", "modak-rush"),
        "mode": "friend_room" if room_code else "quick_match",
        "room_code": room_code,
        "seed": seed,
        "status": "countdown",
        "player_ids": player_ids,
        "player_names": dict(room["player_names"]),
        "winner_id": None,
        "created_at": datetime.utcnow(),
        "started_at": None,
        "ended_at": None,
    }

    matches[match_id] = match
    room["match_id"] = match_id
    room["status"] = "countdown"

    players_info = []
    for pid in player_ids:
        players_info.append({
            "player_id": pid,
            "display_name": room["player_names"].get(pid, "Player"),
        })

    emit("start_countdown", {
        "match_id": match_id,
        "seed": seed,
        "players": players_info,
        "server_time": int(time.time() * 1000),
    }, room=room_code)


@socketio.on("player_finished")
def on_player_finished(data):
    match_id = data.get("match_id")
    player_id = data.get("player_id")
    score = data.get("score", 0)
    duration = data.get("duration", 30)

    match = matches.get(match_id)
    if not match:
        emit("error", {"message": "Match not found"})
        return

    if match["status"] not in ("countdown", "playing"):
        emit("error", {"message": "Match already finished"})
        return

    if player_id not in match.get("player_ids", []):
        emit("error", {"message": "Player is not part of this match"})
        return
    room = rooms.get(match.get("room_code"))
    if room and room.get("players", {}).get(request.sid) != player_id:
        emit("error", {"message": "Match session is not authorized"})
        return
    if not isinstance(score, (int, float)) or isinstance(score, bool):
        emit("error", {"message": "Invalid score"})
        return
    if not isinstance(duration, (int, float)) or isinstance(duration, bool):
        emit("error", {"message": "Invalid duration"})
        return
    score_min, score_max = GAME_SCORE_LIMITS.get(match.get("game_id"), (0, 99999))
    dur_min, dur_max = GAME_DURATION_RANGES.get(match.get("game_id"), (0, 600))
    if score < score_min or score > score_max or duration < dur_min or duration > dur_max:
        emit("error", {"message": "Score or duration is outside the game limits"})
        return

    if match["status"] == "countdown":
        match["status"] = "playing"
        match["started_at"] = datetime.utcnow()

    if not hasattr(match, '_scores'):
        match['_scores'] = {}
    if player_id in match['_scores']:
        emit("error", {"message": "Result already submitted"})
        return
    match['_scores'][player_id] = {
        "score": int(score),
        "duration": float(duration),
        "finished_at": time.time()
    }

    room = rooms.get(match.get("room_code"))
    if room:
        emit("score_update", {
            "player_id": player_id,
            "score": score,
        }, room=match["room_code"])

    if len(match['_scores']) == 2:
        _finalize_match(match_id)
    else:
        other_player = None
        for pid in match["player_ids"]:
            if pid != player_id:
                other_player = pid
                break
        if other_player:
            room_code = match.get("room_code")
            if room_code:
                emit("opponent_finished", {
                    "player_id": player_id
                }, room=room_code)


def _finalize_match(match_id, disconnected_player=None):
    match = matches.get(match_id)
    if not match:
        return

    match["status"] = "completed"
    match["ended_at"] = datetime.utcnow()

    scores = match.get('_scores', {})
    player_ids = match["player_ids"]

    if disconnected_player:
        connected_player = None
        for pid in player_ids:
            if pid != disconnected_player:
                connected_player = pid
                break

        if connected_player:
            my_score_data = scores.get(connected_player, {"score": 0, "duration": 30})
            match["winner_id"] = connected_player
            match['_scores'][disconnected_player] = {
                "score": 0,
                "duration": 30,
                "finished_at": time.time()
            }
            _update_ratings(match_id, connected_player, disconnected_player)
            _save_match_to_db(match_id)
            _emit_results(match_id)
        return

    p1, p2 = player_ids[0], player_ids[1]
    s1 = scores.get(p1, {"score": 0})["score"]
    s2 = scores.get(p2, {"score": 0})["score"]

    if s1 > s2:
        match["winner_id"] = p1
    elif s2 > s1:
        match["winner_id"] = p2
    else:
        match["winner_id"] = None

    _update_ratings(match_id, p1, p2)
    _save_match_to_db(match_id)
    _emit_results(match_id)


def _update_ratings(match_id, p1, p2):
    match = matches.get(match_id)
    if not match:
        return

    db, err = get_db()
    if err:
        return

    scores = match.get('_scores', {})
    s1 = scores.get(p1, {}).get("score", 0)
    s2 = scores.get(p2, {}).get("score", 0)

    player1 = db.players.find_one({"player_id": p1})
    player2 = db.players.find_one({"player_id": p2})

    r1 = player1.get("rating", 1000) if player1 else 1000
    r2 = player2.get("rating", 1000) if player2 else 1000

    match["_ratings"] = {
        p1: {"before": r1, "after": r1},
        p2: {"before": r2, "after": r2},
    }

    if s1 > s2:
        new_r1 = r1 + 25
        new_r2 = max(0, r2 - 20)
        match["_ratings"][p1]["after"] = new_r1
        match["_ratings"][p2]["after"] = new_r2
        match["_results"] = {p1: "win", p2: "loss"}
    elif s2 > s1:
        new_r2 = r2 + 25
        new_r1 = max(0, r1 - 20)
        match["_ratings"][p2]["after"] = new_r2
        match["_ratings"][p1]["after"] = new_r1
        match["_results"] = {p1: "loss", p2: "win"}
    else:
        match["_results"] = {p1: "draw", p2: "draw"}

    for pid, rating_data in match["_ratings"].items():
        result = match["_results"].get(pid, "draw")
        update_fields = {
            "rating": rating_data["after"],
        }
        if result == "win":
            update_fields["$inc"] = {"games_played": 1, "wins": 1}
        elif result == "loss":
            update_fields["$inc"] = {"games_played": 1, "losses": 1}
        else:
            update_fields["$inc"] = {"games_played": 1}

        inc_val = update_fields.pop("$inc", None)
        update_ops = {"$set": update_fields}
        if inc_val:
            update_ops["$inc"] = inc_val

        db.players.update_one(
            {"player_id": pid},
            update_ops
        )


def _save_match_to_db(match_id):
    match = matches.get(match_id)
    if not match:
        return

    db, err = get_db()
    if err:
        return

    match_doc = {
        "match_id": match_id,
        "game_id": match.get("game_id", "modak-rush"),
        "mode": match.get("mode", "quick_match"),
        "room_code": match.get("room_code"),
        "seed": match["seed"],
        "status": "completed",
        "player_ids": match["player_ids"],
        "winner_id": match.get("winner_id"),
        "created_at": match.get("created_at", datetime.utcnow()),
        "started_at": match.get("started_at", datetime.utcnow()),
        "ended_at": match.get("ended_at", datetime.utcnow()),
    }
    db.matches.update_one(
        {"match_id": match_id},
        {"$set": match_doc},
        upsert=True
    )

    scores = match.get('_scores', {})
    ratings = match.get('_ratings', {})
    results = match.get('_results', {})

    match["_universal_points"] = {}
    for pid in match["player_ids"]:
        score_data = scores.get(pid, {})
        rating_data = ratings.get(pid, {"before": 1000, "after": 1000})
        res = results.get(pid, "draw")
        up_award = award_universal_points(
            db=db,
            player_id=pid,
            run_id=f"mp:{match_id}:{pid}",
            game_id=match.get("game_id", "modak-rush"),
            score=score_data.get("score", 0),
            duration=score_data.get("duration", 30),
            difficulty="normal",
            stats=score_data.get("stats", {}),
            mp_result=res,
            source="multiplayer",
        )
        match["_universal_points"][pid] = up_award

        mp_doc = {
            "match_id": match_id,
            "player_id": pid,
            "score": score_data.get("score", 0),
            "result": res,
            "rating_before": rating_data.get("before", 1000),
            "rating_after": rating_data.get("after", 1000),
            "universal_points_awarded": up_award.get("universal_points_awarded", 0),
            "created_at": match.get("ended_at", datetime.utcnow()),
        }
        db.match_players.update_one(
            {"match_id": match_id, "player_id": pid},
            {"$set": mp_doc},
            upsert=True
        )


def _emit_results(match_id):
    match = matches.get(match_id)
    if not match:
        return

    room_code = match.get("room_code")
    if not room_code:
        return

    scores = match.get('_scores', {})
    ratings = match.get('_ratings', {})
    results = match.get('_results', {})
    winner_id = match.get("winner_id")

    for sid, pid in rooms.get(room_code, {}).get("players", {}).items():
        my_score = scores.get(pid, {}).get("score", 0)
        opp_id = None
        for p in match["player_ids"]:
            if p != pid:
                opp_id = p
                break
        opp_score = scores.get(opp_id, {}).get("score", 0) if opp_id else 0
        my_rating = ratings.get(pid, {})
        my_result = results.get(pid, "draw")
        my_up = match.get("_universal_points", {}).get(pid, {})

        emit("game_finished", {
            "match_id": match_id,
            "result": my_result,
            "my_score": my_score,
            "opponent_score": opp_score,
            "opponent_name": match.get("player_names", {}).get(opp_id, "Opponent"),
            "rating_before": my_rating.get("before", 1000),
            "rating_after": my_rating.get("after", 1000),
            "rating_change": my_rating.get("after", 1000) - my_rating.get("before", 1000),
            "universal_points_awarded": my_up.get("universal_points_awarded", 0),
            "universal_points_breakdown": my_up.get("breakdown", {}),
            "new_universal_points": my_up.get("new_universal_points", 0),
            "global_rank": my_up.get("global_rank"),
            "rank_tier": my_up.get("rank_tier"),
            "winner_id": winner_id,
        }, room=sid)


@socketio.on("rematch_requested")
def on_rematch_requested(data):
    room_code = data.get("room_code")
    player_id = data.get("player_id")

    room = rooms.get(room_code)
    if not room:
        emit("error", {"message": "Room not found"})
        return

    room["rematch"] = room.get("rematch", {})
    room["rematch"][player_id] = True

    players_info = []
    for sid, pid in room["players"].items():
        players_info.append({
            "player_id": pid,
            "display_name": room["player_names"].get(pid, "Player"),
            "rematch_requested": room["rematch"].get(pid, False),
        })

    emit("rematch_update", {
        "player_id": player_id,
        "players": players_info,
    }, room=room_code)

    if len(room.get("rematch", {})) == 2:
        room["status"] = "ready"
        room["ready"] = {}
        room["rematch"] = {}
        old_match_id = room.get("match_id")
        if old_match_id and old_match_id in matches:
            del matches[old_match_id]
        room["match_id"] = None
        _start_match(room_code)


@socketio.on("leave_room")
def on_leave_room(data):
    room_code = data.get("room_code")
    player_id = data.get("player_id")

    room = rooms.get(room_code)
    if room:
        for sid, pid in list(room["players"].items()):
            if pid == player_id:
                leave_room(room_code)
                room["players"].pop(sid, None)
                room["player_names"].pop(player_id, None)
                break

        emit("player_left", {
            "player_id": player_id,
            "message": "Opponent left."
        }, room=room_code)

        if len(room["players"]) == 0:
            rooms.pop(room_code, None)


@socketio.on("join_quick_match")
def on_join_quick_match(data):
    player_id = data.get("player_id")
    display_name = data.get("display_name", "Player")

    if not player_id:
        emit("error", {"message": "player_id required"})
        return

    for entry in quick_match_queue:
        if entry["player_id"] == player_id:
            emit("error", {"message": "Already in queue"})
            return

    quick_match_queue.append({
        "sid": request.sid,
        "player_id": player_id,
        "display_name": display_name,
        "joined_at": time.time(),
    })

    emit("queued", {"position": len(quick_match_queue)})
    _try_match_quick()


def _try_match_quick():
    now = time.time()
    quick_match_queue[:] = [e for e in quick_match_queue if now - e["joined_at"] < 30]

    if len(quick_match_queue) < 2:
        return

    p1 = quick_match_queue.pop(0)
    p2 = quick_match_queue.pop(0)

    room_code = generate_room_code()
    rooms[room_code] = {
        "players": {
            p1["sid"]: p1["player_id"],
            p2["sid"]: p2["player_id"],
        },
        "player_names": {
            p1["player_id"]: p1["display_name"],
            p2["player_id"]: p2["display_name"],
        },
        "status": "ready",
        "ready": {},
        "created_at": time.time(),
        "match_id": None,
        "disconnected": {},
    }

    join_room(room_code, sid=p1["sid"])
    join_room(room_code, sid=p2["sid"])

    players_info = [
        {"player_id": p1["player_id"], "display_name": p1["display_name"]},
        {"player_id": p2["player_id"], "display_name": p2["display_name"]},
    ]

    emit("match_found", {
        "room_code": room_code,
        "players": players_info,
    }, room=room_code)


@socketio.on("cancel_quick_match")
def on_cancel_quick_match(data):
    player_id = data.get("player_id")
    for entry in list(quick_match_queue):
        if entry["player_id"] == player_id:
            quick_match_queue.remove(entry)
            break
    emit("queue_cancelled")


@socketio.on("game_action")
def on_game_action(data):
    match_id = data.get("match_id")
    match = matches.get(match_id)
    if not match:
        return
    room_code = match.get("room_code")
    if not room_code:
        return
    emit("game_action", data, room=room_code, include_self=False)


@socketio.on("score_update_live")
def on_score_update_live(data):
    match_id = data.get("match_id")
    player_id = data.get("player_id")
    score = data.get("score", 0)
    match = matches.get(match_id)
    if not match:
        return
    room_code = match.get("room_code")
    if not room_code:
        return
    emit("score_update_live", {
        "player_id": player_id,
        "score": score,
    }, room=room_code, include_self=False)


# ─────────────────────────────────────────────
# Error handlers
# ─────────────────────────────────────────────

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    socketio.run(app, debug=os.getenv("FLASK_ENV") != "production", host="0.0.0.0", port=int(os.getenv("PORT", "5000")))
