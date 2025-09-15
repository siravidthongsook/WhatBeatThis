import { Router } from "express";
import { DEVMODE } from "../app.js";
import { Room, ScoreBoard, GuessedWord } from "../db/collection.js";
import LLMUtils from "../llm.js";

const router = Router();

router.post("/create", async (req, res) => {
    const body = req.body;
    let startSubject = body.startSubject;
    let playerName = body.playerName;
    if (typeof playerName !== "string") {
        playerName = "guest"; // default name
    }
    if (playerName.length < 1 || playerName.length > 50) {
        return res.status(400).json({ msg: "invalid playerName length 1-50 characters" });
    }
    
    if (typeof startSubject !== "string" || startSubject.length < 1 || startSubject.length > 50) {
        startSubject = "computer"; // default subject
    }

    try {
        const room = await Room.create({ currentSubject : startSubject, playerName: playerName, wordHistory: [startSubject] });
        return res.json({ roomId: room._id });
    } catch (err) {
        if (DEVMODE) console.error("failed to create room", err);
        return res.status(500).json({ msg: "failed to create room" });
    }
});

router.delete("/delete/:roomId", async (req, res) => {
    const { roomId } = req.params;
    if (typeof roomId !== "string" || roomId.length < 1) {
        return res.status(400).json({ msg: "Invalid roomId" });
    }
    // Check for valid MongoDB ObjectId format
    if (!roomId.match(/^[a-fA-F0-9]{24}$/)) {
        return res.status(400).json({ msg: "Invalid roomId format" });
    }
    try {
        const room = await Room.findById(roomId).exec();
        if (!room) {
            return res.status(404).json({ msg: "Room not found" });
        }

        // Delete Room
        await Room.deleteOne({ _id: roomId });

        return res.json({ msg: "Room deleted successful" });
    } catch (err) {
        if (DEVMODE) console.error("Room reset error", err);
        return res.status(500).json({ msg: "Failed to reset room" });
    }
});

router.post("/guess", async (req, res) => {
    const body = req.body;
    if (!body) {
        res.status(400).json({
            "msg": "invalid body.",
            "body": (DEVMODE) ? body: undefined
        });
        return;
    }

    const { guess, roomId } = body;
    if (typeof guess != "string" || typeof roomId != "string") {
        res.status(400).json({
            "msg": "invalid body.",
            "body": (DEVMODE) ? body: undefined
        });
        return;
    }   

    // validate guess
    const normalizedGuess = guess.trim().toLowerCase();
    if (normalizedGuess.length < 1) {
        res.status(400).json({ error: {name: "Empty guess", code: "GUESS_INVALID" }});
        return;
    }

    if (normalizedGuess.length > 25) {
        res.status(400).json({ error: {name: "Guess too long, max 25 characters", code: "GUESS_INVALID" }});
        return;
    }

    // validate roomId
    let room;
    try {
        room = await Room.findById(roomId).exec();
    }
    catch (err) {
        if (DEVMODE) console.error("Room.findById error", err);
        res.status(400).json({ error : {name: "Room.findById error", debug: (DEVMODE) ? "Room id maybe invalid, "+err.message : undefined }});
        return;
    }
    if (!room) {
        res.status(400).json({ error: {name: "Room not found" }});
        return;
    }

    // if room ended, reject
    if (room.ended) {
        res.status(400).json({ error: {name: "Room has ended" }});
        return;
    }

    // validate guess format
    // need to be less than 50 characters
    if (guess.length < 1 || guess.length > 50) {
        res.status(400).json({ error: {name: "Invalid guess length 1-50" }});
        return;
    }

    // get current subject from room
    const currentSubject = room.currentSubject;
    if (!currentSubject) {
        res.status(500).json({ error:{ name: "Room currentSubject not set" }});
        return;
    }

    // simple check if guess is already in word history
    if (room.wordHistory.includes(guess)) {
        res.status(400).json({ error: {name: "Word already used in this game", code: "WORD_ALREADY_USED"}});
        return;
    }
    
    // validate guess with LLM
    const history = room.history;
    let result;
    try {
        result = await LLMUtils.validateUserGuess(guess, currentSubject, history)
    }
    catch (err) {
        if (DEVMODE) console.error("LLMUtils.validateUserGuess error", err)
        res.status(500).json({ error: {name: "LLMUtils.validateUserGuess error", debug: (DEVMODE) ? err.message : undefined }});
        return
    }
    // result Schema
    // {
    //     "user_guess": string,
    //     "beats": boolean,
    //     "reason": string,
    //     "next_subject": string
    // }

    if (room.wordHistory.includes(result.user_guess)) {
        res.status(400).json({ error: {name: "Word already used in this game", code: "WORD_ALREADY_USED"}});
        return;
    }
    // add to room history
    // update room currentSubject
    room.currentSubject = result.user_guess;
    room.lastUpdate = new Date();
    const historyEntry = LLMUtils.getHistoryEntry(currentSubject, result.user_guess, result);
    
    if (result.beats) {
        // update word history
        room.wordHistory.push(result.user_guess);
        // cap word history to last 20 words
        if (room.wordHistory.length > 20) {
            room.wordHistory = room.wordHistory.slice(-20);
        }
        // update llm history
        room.history.push(...historyEntry);
        // update room score
        room.score += 1;
    }
    else {
        room.ended = true;
    }
    // save room
    await room.save();

    // If the guess beats the subject, record it in the GuessedWord collection
    let guessedMeta = {
        is_first_guess: false,
        guessed_count: 0,
        guess_message: null
    };
    if (result.beats) {
        try {
            // find existing entry for this word (case-insensitive keying)
            const wordKey = result.user_guess.trim().toLowerCase();
            let existing = await GuessedWord.findOne({ word: wordKey }).exec();

            if (!existing) {
                // create new entry with firstguessedBy set to this player
                await GuessedWord.create({ word: wordKey, firstguessedBy: room.playerName, guessedCount: 1 });
                guessedMeta.is_first_guess = true;
                guessedMeta.guessed_count = 1;
                guessedMeta.guess_message = "You are the first one to guess this word.";
            } else {

                // ensure numeric guessedCount exists
                existing.guessedCount = (typeof existing.guessedCount === 'number') ? existing.guessedCount + 1 : 1;
                // ensure firstguessedBy exists
                existing.firstguessedBy = existing.firstguessedBy || room.playerName;

                await existing.save();

                guessedMeta.guessed_count = existing.guessedCount;
                guessedMeta.is_first_guess = guessedMeta.guessed_count === 1;
                guessedMeta.guess_message = `This word has been guessed by users ${guessedMeta.guessed_count} time${guessedMeta.guessed_count === 1 ? '' : 's'}`;
            }
        } catch (err) {
            if (DEVMODE) console.error('GuessedWord update error', err);
            // Don't fail the whole request for DB tracking errors — continue without meta
        }
    }

    if (room.ended) {
        if (room.score > 0) {
            // insert scoreboard
            const scoreboardEntry = await ScoreBoard.create({ playerName: room.playerName, score: room.score });
            
            // if scoreboardEntry failed, log error but do not fail the request
            if (!scoreboardEntry) {
                console.error("Failed to create scoreboard entry for player", room.playerName);
            
            }
        }
        // delete room
        await Room.deleteOne({ _id: room._id });
    }

    // attach guessed word meta to response (if available)
    const responsePayload = Object.assign({}, result, {
        is_first_guess: guessedMeta.is_first_guess,
        guessed_count: guessedMeta.guessed_count,
        guess_message: guessedMeta.guess_message
    });

    res.status(200).json(responsePayload)
});

export default router;
