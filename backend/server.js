// Express server for KeyHero leaderboard API
// Provides endpoints for score submission and leaderboard retrieval

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Database } from './database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DATABASE_PATH || './leaderboard.db';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Initialize database
const db = new Database(DB_PATH);

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Submit a new score
 * POST /api/scores
 * Body: { playerName, songId, difficulty, score, accuracy, maxCombo, grade, ... }
 */
app.post('/api/scores', async (req, res) => {
  try {
    // Validate required fields
    const {
      playerName,
      songId,
      difficulty,
      score,
      accuracy,
      maxCombo,
      grade
    } = req.body;
    
    if (!playerName || !songId || !difficulty || score === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: playerName, songId, difficulty, score'
      });
    }
    
    // Validate player name (basic sanitization)
    if (playerName.length < 1 || playerName.length > 50) {
      return res.status(400).json({
        error: 'Player name must be between 1 and 50 characters'
      });
    }
    
    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty. Must be: easy, medium, or hard'
      });
    }
    
    // Validate score (basic range check)
    if (score < 0 || score > 1000000) {
      return res.status(400).json({
        error: 'Invalid score range'
      });
    }
    
    // Submit score to database
    const result = await db.submitScore(req.body);
    
    // Get player's rank
    const rank = await db.getPlayerRank(songId, difficulty, score);
    
    res.status(201).json({
      success: true,
      id: result.id,
      rank: rank
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({
      error: 'Failed to submit score'
    });
  }
});

/**
 * Get leaderboard for a specific song and difficulty
 * GET /api/leaderboard?songId=song1&difficulty=hard&limit=10
 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { songId, difficulty, limit = 10 } = req.query;
    
    if (!songId || !difficulty) {
      return res.status(400).json({
        error: 'Missing required parameters: songId, difficulty'
      });
    }
    
    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty. Must be: easy, medium, or hard'
      });
    }
    
    // Validate limit
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    
    const leaderboard = await db.getSongLeaderboard(songId, difficulty, parsedLimit);
    
    res.json({
      songId,
      difficulty,
      leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      error: 'Failed to retrieve leaderboard'
    });
  }
});

/**
 * Get global leaderboard (all songs, all difficulties)
 * GET /api/leaderboard/global?limit=10
 */
app.get('/api/leaderboard/global', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Validate limit
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    
    const leaderboard = await db.getGlobalLeaderboard(parsedLimit);
    
    res.json({
      leaderboard
    });
  } catch (error) {
    console.error('Error getting global leaderboard:', error);
    res.status(500).json({
      error: 'Failed to retrieve global leaderboard'
    });
  }
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`KeyHero backend server running on port ${PORT}`);
  console.log(`CORS enabled for: ${CORS_ORIGIN}`);
  console.log(`Database: ${DB_PATH}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await db.close();
  process.exit(0);
});



