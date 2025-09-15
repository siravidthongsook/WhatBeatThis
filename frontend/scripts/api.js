const BACKEND_URL = 'http://localhost:3000';

async function getAnswerApi(guess) {
    const roomId = sessionStorage.getItem('roomId');
    return await fetch(`${BACKEND_URL}/game/guess`, {
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
    return await fetch(`${BACKEND_URL}/game/create`, {
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

    return await fetch(`${BACKEND_URL}/game/delete/${roomId}`, {
        method: 'DELETE',
    });
}

async function fetchLeaderboardApi(limit = 100) {
    return await fetch(`${BACKEND_URL}/leaderboard?limit=${limit}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
}