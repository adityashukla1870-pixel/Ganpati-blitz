from datetime import datetime
from app import get_db
from services.universal_points import get_rank_tier

SAMPLE_PLAYERS = [
    {"player_id": "seed-gm-1", "display_name": "Aarav_Blitzer", "campus": "NIAT Jaipur", "avatar": "⚡", "universal_points": 4250, "rating": 1420, "games_played": 68, "wins": 52},
    {"player_id": "seed-gm-2", "display_name": "DiyaMaster_Pooja", "campus": "NIAT Pune", "avatar": "🪔", "universal_points": 3820, "rating": 1380, "games_played": 54, "wins": 41},
    {"player_id": "seed-m-1", "display_name": "Rohan_Rhythms", "campus": "NIAT Delhi", "avatar": "🥁", "universal_points": 2980, "rating": 1290, "games_played": 42, "wins": 30},
    {"player_id": "seed-m-2", "display_name": "Siddharth_Maze", "campus": "NIAT Bangalore", "avatar": "🐭", "universal_points": 2450, "rating": 1240, "games_played": 38, "wins": 26},
    {"player_id": "seed-d-1", "display_name": "Ananya_Logic", "campus": "NIAT Hyderabad", "avatar": "🧠", "universal_points": 1850, "rating": 1180, "games_played": 29, "wins": 19},
    {"player_id": "seed-d-2", "display_name": "Vikram_Swift", "campus": "NIAT Mumbai", "avatar": "🍬", "universal_points": 1420, "rating": 1140, "games_played": 22, "wins": 14},
    {"player_id": "seed-g-1", "display_name": "Kavita_Artist", "campus": "NIAT Chennai", "avatar": "🌸", "universal_points": 1050, "rating": 1090, "games_played": 17, "wins": 11},
    {"player_id": "seed-g-2", "display_name": "Rahul_Arcade", "campus": "NIAT Jaipur", "avatar": "🎮", "universal_points": 820, "rating": 1060, "games_played": 14, "wins": 8},
    {"player_id": "seed-s-1", "display_name": "Neha_Challenger", "campus": "NIAT Delhi", "avatar": "✨", "universal_points": 580, "rating": 1020, "games_played": 9, "wins": 5},
    {"player_id": "seed-s-2", "display_name": "Aditya_Rookie", "campus": "NIAT Pune", "avatar": "🥟", "universal_points": 390, "rating": 1010, "games_played": 6, "wins": 3},
]

def seed():
    db, err = get_db()
    if err:
        print("DB error:", err)
        return

    for p in SAMPLE_PLAYERS:
        db.players.update_one(
            {"player_id": p["player_id"]},
            {"$set": {**p, "updated_at": datetime.utcnow()}},
            upsert=True
        )
    print(f"Seeded {len(SAMPLE_PLAYERS)} competitive players successfully.")

if __name__ == "__main__":
    seed()
