import { Router } from "express";
import { DEVMODE } from "../app.js";
import { Room } from "../db/collection.js";
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
        const room = await Room.create({ currentSubject : startSubject, playerName: playerName });
        return res.json({ roomId: room._id });
    } catch (err) {
        if (DEVMODE) console.error("failed to create room", err);
        return res.status(500).json({ msg: "failed to create room" });
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

    
    // add to room history
    // update room currentSubject
    room.currentSubject = result.next_subject;
    room.lastUpdate = new Date();
    const historyEntry = LLMUtils.getHistoryEntry(currentSubject, result.user_guess, result);
    
    if (result.beats) {
        room.history.push(...historyEntry);
        // update room score
        room.score += 1;
    }
    else {
        room.ended = true;
    }
    // save room
    await room.save();

    res.status(200).json(result)
});

export default router;
