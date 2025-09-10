import { Router } from "express";
import { DEVMODE } from "../app.js";
import { getRoomCollection } from "../db/collection.js";

const router = Router();

router.post("/create", async (_, res) => {
    // room createment here;
    const collection = getRoomCollection();
    const result = await collection.insertOne({"createdDate": Date.now()})
    
    return res.json({ roomId: result.insertedId });
});

router.post("/guess", (req, res) => {
    const body = req.body;
    if (!body) {
        res.status(400).json({
            "msg": "invalid body.",
            "body": (DEVMODE) ? body: undefined
        });
        return;
    }

    const { word, roomId } = body;
    if (typeof word != "string" || typeof roomId != "string") {
        res.status(400).json({
            "msg": "invalid body.",
            "body": (DEVMODE) ? body: undefined
        });
        return;
    }

    // get answer yes or no from ai
    

    // update room score
    

    // if end update scoreboard 

    res.status(200).json({"msg": "yes"})
});

export default router;
