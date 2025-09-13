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