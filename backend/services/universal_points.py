import math
import uuid
from datetime import datetime, timedelta
from pymongo import ReturnDocument, DESCENDING, ASCENDING

BASE_COMPLETION_POINTS = 25

DIFFICULTY_MULTIPLIERS = {
    "easy": 0.75,
    "normal": 1.00,
    "hard": 1.35,
    "expert": 1.75,
    "master": 2.25,
}

RANK_TIERS = [
    {
        "id": "grandmaster",
        "name": "Grandmaster",
        "min_points": 3500,
        "badge": "👑",
        "color": "#FFD700",
        "gradient": "linear-gradient(135deg, #FFD700, #EC4899)",
    },
    {
        "id": "master",
        "name": "Master",
        "min_points": 2200,
        "badge": "🏆",
        "color": "#EC4899",
        "gradient": "linear-gradient(135deg, #EC4899, #8E44AD)",
    },
    {
        "id": "diamond",
        "name": "Diamond",
        "min_points": 1300,
        "badge": "💎",
        "color": "#38BDF8",
        "gradient": "linear-gradient(135deg, #38BDF8, #3B82F6)",
    },
    {
        "id": "gold",
        "name": "Gold",
        "min_points": 700,
        "badge": "🥇",
        "color": "#FBBF24",
        "gradient": "linear-gradient(135deg, #FBBF24, #F59E0B)",
    },
    {
        "id": "silver",
        "name": "Silver",
        "min_points": 300,
        "badge": "🥈",
        "color": "#94A3B8",
        "gradient": "linear-gradient(135deg, #94A3B8, #64748B)",
    },
    {
        "id": "bronze",
        "name": "Bronze",
        "min_points": 0,
        "badge": "🥉",
        "color": "#CD7F32",
        "gradient": "linear-gradient(135deg, #CD7F32, #92400E)",
    },
]


def get_rank_tier(points):
    points = max(0, int(points or 0))
    for tier in RANK_TIERS:
        if points >= tier["min_points"]:
            return tier
    return RANK_TIERS[-1]


def normalize_performance(game_id, score, duration, stats=None):
    """
    Normalizes game telemetry into a standard 0-100 performance score.
    Applies minimum anti-farming threshold validation.
    """
    stats = stats or {}
    score = max(0, float(score or 0))
    duration = max(0.0, float(duration or 0))

    # Anti-farming: early quits or zero interactions award 0 performance
    if duration < 8.0 and score <= 5:
        return 0.0

    if game_id == "modak-rush":
        raw_score = float(stats.get("base", score))
        acc = float(stats.get("accuracy", 85.0))
        norm = (raw_score / 350.0) * 75.0 + (acc / 100.0) * 25.0
        return max(0.0, min(100.0, round(norm, 2)))

    elif game_id == "diya-dash":
        lvl = float(stats.get("levelReached") or stats.get("level") or max(1, score / 35.0))
        speed_bonus = float(stats.get("speedBonuses", 0))
        norm = (lvl / 12.0) * 80.0 + min(20.0, speed_bonus * 4.0)
        return max(0.0, min(100.0, round(norm, 2)))

    elif game_id == "dhol-battle":
        perfect = float(stats.get("perfectHits") or stats.get("perfect") or 0)
        good = float(stats.get("goodHits") or stats.get("good") or 0)
        miss = float(stats.get("miss", 0))
        total_notes = float(stats.get("totalNotes") or (perfect + good + miss) or max(1, score / 15.0))
        streak = float(stats.get("maxStreak") or stats.get("maxCombo") or 0)

        hit_ratio = (perfect * 1.0 + good * 0.65) / max(1.0, total_notes)
        streak_bonus = min(15.0, (streak / 20.0) * 15.0)
        norm = hit_ratio * 85.0 + streak_bonus
        return max(0.0, min(100.0, round(norm, 2)))

    elif game_id == "rangoli-rush":
        rounds = float(stats.get("roundsCompleted") or stats.get("rounds") or stats.get("correct") or max(1, score / 50.0))
        acc = float(stats.get("accuracy", 100.0))
        norm = (rounds / 10.0) * 70.0 + (acc / 100.0) * 30.0
        return max(0.0, min(100.0, round(norm, 2)))

    elif game_id == "mushak-maze":
        mazes = float(stats.get("mazesCompleted") or stats.get("mazes") or max(1, score / 80.0))
        laddus = float(stats.get("laddusCollected") or stats.get("bonuses") or 0)
        traps = float(stats.get("traps") or 0)
        bonus_points = max(0.0, min(30.0, laddus * 3.0 - traps * 5.0))
        norm = (mazes / 6.0) * 70.0 + bonus_points
        return max(0.0, min(100.0, round(norm, 2)))

    elif game_id == "ganpati-logic":
        correct = float(stats.get("correctAnswers") or stats.get("correct") or max(1, score / 40.0))
        acc = float(stats.get("accuracy", 100.0))
        norm = (correct / 12.0) * 75.0 + (acc / 100.0) * 25.0
        return max(0.0, min(100.0, round(norm, 2)))

    elif game_id == "blitz-mix":
        norm = (score / 1500.0) * 100.0
        return max(0.0, min(100.0, round(norm, 2)))

    # Fallback generic game normalization
    return max(0.0, min(100.0, round((score / 400.0) * 100.0, 2)))


def calculate_bonuses(stats=None, is_pb=False, mp_result=None):
    """Calculates controlled bonus points."""
    stats = stats or {}

    # Combo bonus
    combo = int(stats.get("maxCombo") or stats.get("maxStreak") or stats.get("streak") or 0)
    if combo >= 20:
        combo_bonus = 15
    elif combo >= 10:
        combo_bonus = 8
    elif combo >= 5:
        combo_bonus = 4
    else:
        combo_bonus = 0

    # Accuracy bonus
    acc = float(stats.get("accuracy", 0))
    if acc >= 99.9:
        acc_bonus = 15
    elif acc >= 95.0:
        acc_bonus = 10
    elif acc >= 85.0:
        acc_bonus = 5
    else:
        acc_bonus = 0

    # Personal Best bonus
    pb_bonus = 10 if is_pb else 0

    # Multiplayer result bonus
    if mp_result == "win":
        mp_bonus = 30
    elif mp_result == "draw":
        mp_bonus = 15
    elif mp_result == "loss":
        mp_bonus = 8
    else:
        mp_bonus = 0

    return {
        "combo_bonus": combo_bonus,
        "acc_bonus": acc_bonus,
        "pb_bonus": pb_bonus,
        "mp_bonus": mp_bonus,
        "total_bonus": combo_bonus + acc_bonus + pb_bonus + mp_bonus,
    }


def check_diminishing_returns(db, player_id):
    """
    Inspects recent runs by the player in the last 15 minutes.
    If 3+ recent runs had normalized performance < 20, applies diminishing factor.
    """
    if db is None:
        return 1.0

    fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)
    recent = list(
        db.point_transactions.find(
            {"player_id": player_id, "created_at": {"$gte": fifteen_mins_ago}},
            {"breakdown": 1, "created_at": 1}
        )
        .sort("created_at", DESCENDING)
        .limit(6)
    )

    if len(recent) >= 3:
        low_perf_count = 0
        for tx in recent:
            perf = tx.get("breakdown", {}).get("performance_normalized", 50)
            if perf < 20.0:
                low_perf_count += 1

        if low_perf_count >= 5:
            return 0.1
        elif low_perf_count >= 3:
            return 0.5

    return 1.0


def calculate_universal_points(
    game_id,
    score,
    duration,
    difficulty="normal",
    stats=None,
    is_pb=False,
    mp_result=None,
    diminishing_factor=1.0,
):
    """
    Authoritative server-side calculation for Universal Points.
    Returns: (total_up, breakdown_dict)
    """
    diff_key = (difficulty or "normal").lower()
    diff_mult = DIFFICULTY_MULTIPLIERS.get(diff_key, 1.00)

    # 1. Anti-farming duration/score check
    if duration < 8.0 and score <= 5:
        return 0, {
            "base": 0,
            "performance_normalized": 0.0,
            "difficulty": diff_key,
            "difficulty_multiplier": diff_mult,
            "subtotal": 0,
            "combo_bonus": 0,
            "acc_bonus": 0,
            "pb_bonus": 0,
            "mp_bonus": 0,
            "bonuses": 0,
            "diminishing_factor": diminishing_factor,
            "total_up": 0,
            "reason": "Run aborted or below minimum play threshold (minimum 8s).",
        }

    # 2. Performance normalization (0-100)
    p_norm = normalize_performance(game_id, score, duration, stats)

    # 3. Base points + scaled performance
    base_points = BASE_COMPLETION_POINTS
    subtotal = math.floor((base_points + p_norm) * diff_mult)

    # 4. Bonuses
    bonuses = calculate_bonuses(stats, is_pb=is_pb, mp_result=mp_result)

    # 5. Diminishing returns scaling
    raw_total = subtotal + bonuses["total_bonus"]
    final_up = max(5, math.floor(raw_total * diminishing_factor))

    breakdown = {
        "base": base_points,
        "performance_normalized": p_norm,
        "difficulty": diff_key,
        "difficulty_multiplier": diff_mult,
        "subtotal": subtotal,
        "combo_bonus": bonuses["combo_bonus"],
        "acc_bonus": bonuses["acc_bonus"],
        "pb_bonus": bonuses["pb_bonus"],
        "mp_bonus": bonuses["mp_bonus"],
        "bonuses": bonuses["total_bonus"],
        "diminishing_factor": diminishing_factor,
        "total_up": final_up,
    }

    return final_up, breakdown


def award_universal_points(
    db,
    player_id,
    run_id,
    game_id,
    score,
    duration,
    difficulty="normal",
    stats=None,
    is_pb=False,
    mp_result=None,
    source="solo_game",
):
    """
    Idempotent transactional award of Universal Points.
    Updates players.universal_points and records a point_transactions document.
    """
    if not run_id:
        run_id = str(uuid.uuid4())

    # 1. Idempotency check: don't double-award the same run_id
    existing_tx = db.point_transactions.find_one({"player_id": player_id, "run_id": run_id})
    if existing_tx:
        player = db.players.find_one({"player_id": player_id}) or {}
        cur_up = player.get("universal_points", 0)
        rank = db.players.count_documents({"universal_points": {"$gt": cur_up}}) + 1
        tier = get_rank_tier(cur_up)
        return {
            "already_awarded": True,
            "universal_points_awarded": existing_tx.get("amount", 0),
            "breakdown": existing_tx.get("breakdown", {}),
            "new_universal_points": cur_up,
            "global_rank": rank,
            "rank_tier": tier,
        }

    # 2. Check diminishing returns
    diminishing_factor = check_diminishing_returns(db, player_id)

    # 3. Calculate points
    total_up, breakdown = calculate_universal_points(
        game_id=game_id,
        score=score,
        duration=duration,
        difficulty=difficulty,
        stats=stats,
        is_pb=is_pb,
        mp_result=mp_result,
        diminishing_factor=diminishing_factor,
    )

    # 4. Insert transaction record
    tx_doc = {
        "transaction_id": str(uuid.uuid4()),
        "player_id": player_id,
        "run_id": run_id,
        "source": source,
        "game_id": game_id,
        "difficulty": difficulty,
        "amount": total_up,
        "breakdown": breakdown,
        "created_at": datetime.utcnow(),
    }
    db.point_transactions.insert_one(tx_doc)

    # 5. Atomically update player universal_points
    updated_player = db.players.find_one_and_update(
        {"player_id": player_id},
        {
            "$setOnInsert": {
                "player_id": player_id,
                "display_name": "Player",
                "created_at": datetime.utcnow(),
            },
            "$inc": {"universal_points": total_up},
            "$set": {"updated_at": datetime.utcnow()},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    new_up = updated_player.get("universal_points", total_up)
    global_rank = db.players.count_documents({"universal_points": {"$gt": new_up}}) + 1
    rank_tier = get_rank_tier(new_up)

    return {
        "already_awarded": False,
        "universal_points_awarded": total_up,
        "breakdown": breakdown,
        "new_universal_points": new_up,
        "global_rank": global_rank,
        "rank_tier": rank_tier,
    }


def award_fixed_universal_points(db, player_id, run_id, amount, source, metadata=None):
    """
    Awards a fixed Universal Points bonus (e.g. Daily Challenge +25 UP) idempotently.
    """
    existing_tx = db.point_transactions.find_one({"player_id": player_id, "run_id": run_id})
    if existing_tx:
        player = db.players.find_one({"player_id": player_id}) or {}
        cur_up = player.get("universal_points", 0)
        rank = db.players.count_documents({"universal_points": {"$gt": cur_up}}) + 1
        return {
            "already_awarded": True,
            "universal_points_awarded": existing_tx.get("amount", 0),
            "new_universal_points": cur_up,
            "global_rank": rank,
            "rank_tier": get_rank_tier(cur_up),
        }

    tx_doc = {
        "transaction_id": str(uuid.uuid4()),
        "player_id": player_id,
        "run_id": run_id,
        "source": source,
        "amount": amount,
        "metadata": metadata or {},
        "created_at": datetime.utcnow(),
    }
    db.point_transactions.insert_one(tx_doc)

    updated_player = db.players.find_one_and_update(
        {"player_id": player_id},
        {
            "$setOnInsert": {
                "player_id": player_id,
                "display_name": "Player",
                "created_at": datetime.utcnow(),
            },
            "$inc": {"universal_points": amount},
            "$set": {"updated_at": datetime.utcnow()},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    new_up = updated_player.get("universal_points", amount)
    global_rank = db.players.count_documents({"universal_points": {"$gt": new_up}}) + 1

    return {
        "already_awarded": False,
        "universal_points_awarded": amount,
        "new_universal_points": new_up,
        "global_rank": global_rank,
        "rank_tier": get_rank_tier(new_up),
    }
