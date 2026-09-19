import unittest
import json
from app import app


class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_global_leaderboard_route(self):
        res = self.client.get('/api/leaderboard/global')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('leaderboard', data)
        self.assertIn('total_players', data)

    def test_leaderboard_alias(self):
        res = self.client.get('/api/leaderboard')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('leaderboard', data)


if __name__ == '__main__':
    unittest.main()
