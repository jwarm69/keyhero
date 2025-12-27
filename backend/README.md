# KeyHero Backend API

Express.js backend with SQLite database for the KeyHero leaderboard system.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment (optional):
Edit `.env` file to change port or database path.

3. Start server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-26T10:30:00.000Z"
}
```

### Submit Score
```
POST /api/scores
Content-Type: application/json
```

Body:
```json
{
  "playerName": "Player123",
  "songId": "song1",
  "difficulty": "hard",
  "score": 8500,
  "accuracy": 95.5,
  "maxCombo": 150,
  "grade": "A",
  "perfectCount": 120,
  "goodCount": 30,
  "missCount": 5
}
```

Response:
```json
{
  "success": true,
  "id": 42,
  "rank": 5
}
```

### Get Song Leaderboard
```
GET /api/leaderboard?songId=song1&difficulty=hard&limit=10
```

Response:
```json
{
  "songId": "song1",
  "difficulty": "hard",
  "leaderboard": [
    {
      "rank": 1,
      "playerName": "Player123",
      "score": 8500,
      "accuracy": 95.5,
      "maxCombo": 150,
      "grade": "A",
      "date": "2025-12-26T10:30:00.000Z"
    }
  ]
}
```

### Get Global Leaderboard
```
GET /api/leaderboard/global?limit=10
```

Response:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "playerName": "Player123",
      "songId": "song1",
      "difficulty": "hard",
      "score": 8500,
      "accuracy": 95.5,
      "maxCombo": 150,
      "grade": "A",
      "date": "2025-12-26T10:30:00.000Z"
    }
  ]
}
```

## Database Schema

SQLite database with automatic schema creation on first run.

**Table: scores**
- `id` (INTEGER PRIMARY KEY)
- `player_name` (TEXT)
- `song_id` (TEXT)
- `difficulty` (TEXT)
- `score` (INTEGER)
- `accuracy` (REAL)
- `max_combo` (INTEGER)
- `grade` (TEXT)
- `perfect_count` (INTEGER)
- `good_count` (INTEGER)
- `miss_count` (INTEGER)
- `created_at` (TIMESTAMP)

**Indexes:**
- `idx_song_leaderboard` - (song_id, difficulty, score DESC)
- `idx_global_leaderboard` - (score DESC)

## Environment Variables

Create a `.env` file:

```
PORT=3000
DATABASE_PATH=./leaderboard.db
CORS_ORIGIN=http://localhost:5173
```

## Security

- Input validation on all endpoints
- Player name length limits (1-50 characters)
- Score range validation
- CORS configured for frontend origin
- SQL injection prevention via parameterized queries
- Rate limiting recommended for production

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment
2. Use a process manager (PM2, systemd)
3. Set up reverse proxy (nginx)
4. Enable HTTPS
5. Configure firewall
6. Set appropriate CORS_ORIGIN
7. Consider adding rate limiting middleware
8. Regular database backups

## Development

Run with auto-reload:
```bash
npm run dev
```

Test endpoints:
```bash
# Health check
curl http://localhost:3000/api/health

# Submit score
curl -X POST http://localhost:3000/api/scores \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Test","songId":"song1","difficulty":"easy","score":1000,"accuracy":85,"maxCombo":50,"grade":"B"}'

# Get leaderboard
curl "http://localhost:3000/api/leaderboard?songId=song1&difficulty=easy&limit=5"

# Get global leaderboard
curl "http://localhost:3000/api/leaderboard/global?limit=10"
```



