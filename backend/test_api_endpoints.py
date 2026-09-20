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

    def test_player_login_existing(self):
        # Aditya Shukla exists in Atlas with 284 UP - login with PIN 1234 claims/verifies
        res = self.client.post('/api/player/login', json={
            'display_name': 'Aditya Shukla',
            'campus': 'Vivekananda Global University',
            'pin': '1234'
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['display_name'], 'Aditya Shukla')
        self.assertEqual(data['universal_points'], 284)
        self.assertTrue(data.get('is_existing'))

    def test_player_login_wrong_pin(self):
        # Once PIN 1234 is claimed, wrong PIN must return 401
        res = self.client.post('/api/player/login', json={
            'display_name': 'Aditya Shukla',
            'campus': 'Vivekananda Global University',
            'pin': '9999'
        })
        self.assertEqual(res.status_code, 401)
        data = json.loads(res.data)
        self.assertIn('Incorrect Security PIN', data.get('error', ''))

    def test_player_login_not_found(self):
        res = self.client.post('/api/player/login', json={
            'display_name': 'NonExistentPlayer99999',
            'campus': 'Vivekananda Global University',
            'pin': '1234'
        })
        self.assertEqual(res.status_code, 404)


if __name__ == '__main__':
    unittest.main()
