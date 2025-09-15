import dotenv from "dotenv";
dotenv.config({ path: [".env", ".env.local"] });

import express from "express";
import cors from "cors";
import { closeDatabase, connectToDatabase } from "./db/index.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) =>
    res.json({ ok: true, uptime: process.uptime() }),
);

// Configuration
const PORT = process.env.PORT;
export const DEVMODE = process.env.DEVMODE === "true" ? true : false;
const BACKEND_PREFIX = process.env.BACKEND_PREFIX ?? "/api";

// Routes
import dbInfoRouter from './routes/dbInfo.js'
import gameRouter from './routes/game.js'
import leaderboardRouter from './routes/leaderboard.js'
if (DEVMODE) {
    app.use("/db", dbInfoRouter)
}
app.use(`${BACKEND_PREFIX}/game`, gameRouter)
app.use(`${BACKEND_PREFIX}/leaderboard`, leaderboardRouter)

// Start server
if (!PORT) {
    console.log("CONFIG ERROR: Please config PORT variable inside .env file.");
    process.exit(1);
}

const server = app.listen(PORT, async () => {
    console.log("DB Driver try to connect to db...");
    await connectToDatabase();
    console.log("Backend is up on port:", PORT);
});

// Graceful shutdown
const shutdown = async () => {
    console.log("\nShutting down...");
    server.close(async () => {
        await closeDatabase();
        process.exit(0);
    });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
