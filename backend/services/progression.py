from datetime import datetime
from pymongo import ReturnDocument


XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 3000]


def level_for_xp(total_xp):
    level = 1
    for index, threshold in enumerate(XP_THRESHOLDS, start=1):
        if total_xp >= threshold:
            level = index
        else:
            break
    if level == len(XP_THRESHOLDS) and total_xp >= XP_THRESHOLDS[-1]:
        level += (total_xp - XP_THRESHOLDS[-1]) // 500
    return level


def progression_snapshot(total_xp):
    level = level_for_xp(total_xp)
    if level < len(XP_THRESHOLDS):
        current_threshold = XP_THRESHOLDS[level - 1]
        next_threshold = XP_THRESHOLDS[level]
    else:
        current_threshold = XP_THRESHOLDS[-1] + (level - len(XP_THRESHOLDS)) * 500
        next_threshold = current_threshold + 500
    return {
        "total_xp": total_xp,
        "level": level,
        "current_level_xp": current_threshold,
        "next_level_xp": next_threshold,
        "progress_xp": max(0, total_xp - current_threshold),
        "progress_required": max(1, next_threshold - current_threshold),
    }


def award_xp(db, player_id, amount, source, source_id):
    """Award XP idempotently for a validated server-side event."""
    reward_key = f"{source}:{source_id}"
    existing = db.xp_events.find_one({"player_id": player_id, "reward_key": reward_key})
    if existing:
        progress = db.player_progress.find_one({"player_id": player_id}) or {"total_xp": 0}
        return progression_snapshot(progress.get("total_xp", 0)), False

    progress = db.player_progress.find_one_and_update(
        {"player_id": player_id},
        {
            "$setOnInsert": {"player_id": player_id, "created_at": datetime.utcnow()},
            "$inc": {"total_xp": amount},
            "$set": {"updated_at": datetime.utcnow()},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    db.xp_events.insert_one({
        "player_id": player_id,
        "reward_key": reward_key,
        "amount": amount,
        "source": source,
        "created_at": datetime.utcnow(),
    })
    return progression_snapshot(progress.get("total_xp", amount)), True


ACHIEVEMENTS = [
    {"id": "first-play", "name": "First Play", "description": "Complete your first game."},
    {"id": "modak-master", "name": "Modak Master", "description": "Reach 1,000 points in Modak Rush."},
    {"id": "speed-demon", "name": "Speed Demon", "description": "Complete a Mushak Maze run in under 30 seconds."},
    {"id": "pattern-pro", "name": "Pattern Pro", "description": "Complete 10 Rangoli Rush rounds."},
    {"id": "arcade-explorer", "name": "Arcade Explorer", "description": "Play all six games."},
    {"id": "multiplayer-warrior", "name": "Multiplayer Warrior", "description": "Complete your first multiplayer match."},
    {"id": "friendly-competitor", "name": "Friendly Competitor", "description": "Complete five multiplayer matches."},
    {"id": "memory-master", "name": "Memory Master", "description": "Reach level 5 in Diya Dash."},
    {"id": "rhythm-star", "name": "Rhythm Star", "description": "Score 90% accuracy in Dhol Battle."},
    {"id": "logic-legend", "name": "Logic Legend", "description": "Answer 10 Ganpati Logic questions correctly."},
    {"id": "blitz-completed", "name": "Blitz Completed", "description": "Finish your first Blitz Mix."},
    {"id": "daily-devotee", "name": "Daily Devotee", "description": "Complete daily challenges on three separate days."},
]


def unlock_game_achievements(db, player_id, game_id, game_data):
    played = set(db.game_scores.distinct("game_id", {"player_id": player_id}))
    played.add(game_id)
    unlocked = []
    candidates = []
    if db.game_scores.count_documents({"player_id": player_id}) == 1:
        candidates.append("first-play")
    if len(played) >= 6:
        candidates.append("arcade-explorer")
    if game_id == "diya-dash" and (game_data.get("level", 0) >= 5 or game_data.get("max_level", 0) >= 5):
        candidates.append("memory-master")
    if game_id == "dhol-battle" and game_data.get("accuracy", 0) >= 90:
        candidates.append("rhythm-star")
    if game_id == "modak-rush" and game_data.get("score", 0) >= 1000:
        candidates.append("modak-master")
    if game_id == "mushak-maze" and game_data.get("duration", 999) < 30:
        candidates.append("speed-demon")
    if game_id == "rangoli-rush" and game_data.get("roundsCompleted", 0) >= 10:
        candidates.append("pattern-pro")
    if game_id == "ganpati-logic" and game_data.get("correctAnswers", 0) >= 10:
        candidates.append("logic-legend")
    if game_id == "blitz-mix":
        candidates.append("blitz-completed")

    for achievement_id in candidates:
        result = db.player_achievements.update_one(
            {"player_id": player_id, "achievement_id": achievement_id},
            {"$setOnInsert": {"player_id": player_id, "achievement_id": achievement_id, "unlocked_at": datetime.utcnow()}},
            upsert=True,
        )
        if result.upserted_id:
            unlocked.append(achievement_id)
    return unlocked