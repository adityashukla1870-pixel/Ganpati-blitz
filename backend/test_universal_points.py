import unittest
from services.universal_points import (
    calculate_universal_points,
    normalize_performance,
    calculate_bonuses,
    get_rank_tier,
    DIFFICULTY_MULTIPLIERS,
)


class TestUniversalPoints(unittest.TestCase):
    def test_rank_tiers(self):
        self.assertEqual(get_rank_tier(0)["id"], "bronze")
        self.assertEqual(get_rank_tier(299)["id"], "bronze")
        self.assertEqual(get_rank_tier(300)["id"], "silver")
        self.assertEqual(get_rank_tier(700)["id"], "gold")
        self.assertEqual(get_rank_tier(1300)["id"], "diamond")
        self.assertEqual(get_rank_tier(2200)["id"], "master")
        self.assertEqual(get_rank_tier(3500)["id"], "grandmaster")
        self.assertEqual(get_rank_tier(10000)["id"], "grandmaster")

    def test_anti_farming_short_run(self):
        # Run under 8 seconds with <= 5 score must award 0 UP
        points, breakdown = calculate_universal_points(
            game_id="modak-rush",
            score=0,
            duration=3.5,
            difficulty="normal",
        )
        self.assertEqual(points, 0)
        self.assertEqual(breakdown["base"], 0)

    def test_modak_rush_balancing(self):
        # 1. Casual run on Easy
        casual_up, b_casual = calculate_universal_points(
            game_id="modak-rush",
            score=80,
            duration=30,
            difficulty="easy",
            stats={"base": 80, "accuracy": 70},
        )
        self.assertTrue(30 <= casual_up <= 60, f"Casual UP: {casual_up}")

        # 2. Competent run on Normal
        norm_up, b_norm = calculate_universal_points(
            game_id="modak-rush",
            score=250,
            duration=30,
            difficulty="normal",
            stats={"base": 250, "accuracy": 88, "maxCombo": 8},
        )
        self.assertTrue(70 <= norm_up <= 120, f"Normal UP: {norm_up}")

        # 3. Skilled run on Hard
        hard_up, b_hard = calculate_universal_points(
            game_id="modak-rush",
            score=280,
            duration=30,
            difficulty="hard",
            stats={"base": 280, "accuracy": 90, "maxCombo": 12},
            is_pb=True,
        )
        self.assertTrue(135 <= hard_up <= 180, f"Hard UP: {hard_up}")

        # 4. Master flawless run
        master_up, b_master = calculate_universal_points(
            game_id="modak-rush",
            score=480,
            duration=30,
            difficulty="master",
            stats={"base": 480, "accuracy": 100, "maxCombo": 25},
            is_pb=True,
        )
        self.assertTrue(260 <= master_up <= 330, f"Master UP: {master_up}")

    def test_all_games_normalization(self):
        games = ["modak-rush", "diya-dash", "dhol-battle", "rangoli-rush", "mushak-maze", "ganpati-logic"]
        for g in games:
            norm = normalize_performance(g, score=150, duration=30, stats={"levelReached": 8, "perfectHits": 20, "roundsCompleted": 7, "mazesCompleted": 4, "correctAnswers": 8, "accuracy": 90})
            self.assertTrue(0 <= norm <= 100, f"Game {g} norm {norm} out of range")
            up, _ = calculate_universal_points(g, score=150, duration=30, difficulty="normal")
            self.assertTrue(up > 0, f"Game {g} UP should be positive")


if __name__ == "__main__":
    unittest.main()
