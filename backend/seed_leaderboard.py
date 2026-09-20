import re
from app import get_db

def purge_seed_players():
    db, err = get_db()
    if err:
        print("DB error:", err)
        return

    # Delete any lingering dummy seed players
    res = db.players.delete_many({"player_id": re.compile(r"^seed")})
    print(f"Purged {res.deleted_count} seed players. Only real registered players remain.")

if __name__ == "__main__":
    purge_seed_players()
