import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.FRONTEND_PORT || 4000;
const backendUrl = process.env.BACKEND_URL || (() => { throw new Error("BACKEND_URL is required in .env"); })();

// Expose runtime-safe config to the browser without shipping secrets
app.get('/config.js', (_req, res) => {
    res.type('application/javascript');
    res.set('Cache-Control', 'no-store');
    res.send(`window.APP_CONFIG = ${JSON.stringify({
        backendUrl,
        backendPrefifx: process.env.BACKEND_PREFIX || '/api',
    })};`);
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
