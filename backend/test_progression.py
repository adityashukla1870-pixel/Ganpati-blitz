import unittest

from services.progression import level_for_xp, progression_snapshot


class ProgressionTests(unittest.TestCase):
    def test_level_thresholds(self):
        self.assertEqual(level_for_xp(0), 1)
        self.assertEqual(level_for_xp(99), 1)
        self.assertEqual(level_for_xp(100), 2)
        self.assertEqual(level_for_xp(250), 3)
        self.assertEqual(level_for_xp(700), 5)

    def test_snapshot_reports_progress(self):
        snapshot = progression_snapshot(150)
        self.assertEqual(snapshot["level"], 2)
        self.assertEqual(snapshot["progress_xp"], 50)
        self.assertEqual(snapshot["next_level_xp"], 250)


if __name__ == "__main__":
    unittest.main()