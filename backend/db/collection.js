import { getDb } from "./index.js"

export function getGuessedWordCollection(){
    const db = getDb();
    return db.collection("guessedWord");
}

export function getRoomCollection(){
    const db = getDb();
    return db.collection("room");
}

export function getScoreBoardCollection(){
    const db = getDb();
    return db.collection("scoreboard");
}
