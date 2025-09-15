import express from 'express';
import { ScoreBoard } from '../db/collection.js';

const router = express.Router();

// Example: Replace with your actual data source (e.g., database)
// const leaderboardData = [
//     { playerName: 'Alice', score: 120 },
//     { playerName: 'Bob', score: 95 },
//     // ...
// ];

// GET /leaderboard?limit=100
router.get('/', async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 100;

    try {
        // Fetch leaderboard data from scoreboard collection
        const data = await ScoreBoard.find({})
            .sort({ score: -1 }) // Sort by score descending
            .limit(limit);
        const formattedData = data.map(entry => ({
            playerName: entry.playerName,
            score: entry.score
        }));

        res.json(formattedData);
        return;
    } catch (err) {
        console.error("Error fetching leaderboard data:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});



export default router;
