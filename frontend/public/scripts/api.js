const BACKEND_URL = (window.APP_CONFIG && window.APP_CONFIG.backendUrl)
const BACKEND_PREFIX = (window.APP_CONFIG && window.APP_CONFIG.backendPrefix) || '/api';

async function getAnswerApi(guess) {
    const roomId = sessionStorage.getItem('roomId');
    return await fetch(`${BACKEND_URL}${BACKEND_PREFIX}/game/guess`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            roomId,
            guess
        })
    });
}

async function createRoomApi() {
    const playerName = sessionStorage.getItem('playerName') || 'Guest';
    return await fetch(`${BACKEND_URL}${BACKEND_PREFIX}/game/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            playerName,
            startSubject: "computer"
        })
    })
}

async function deleteRoomApi() {
    const roomId = sessionStorage.getItem('roomId');
    if (!roomId) {
        console.warn("No roomId found in sessionStorage");
        return;
    }

    return await fetch(`${BACKEND_URL}${BACKEND_PREFIX}/game/delete/${roomId}`, {
        method: 'DELETE',
    });
}

async function fetchLeaderboardApi(limit = 100) {
    return await fetch(`${BACKEND_URL}${BACKEND_PREFIX}/leaderboard?limit=${limit}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
