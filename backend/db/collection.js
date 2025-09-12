import mongoose from "mongoose";

// Room schema
const RoomSchema = new mongoose.Schema(
  {
    createdDate: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    currentSubject: { type: String, required: true },
    lastUpdate: { type: Date, default: Date.now },
    history: { type: Array, default: [] },
    wordHistory: { type: Array, default: [] },
    playerName: { type: String, required: true },
    ended: { type: Boolean, default: false },
    // add other room-specific fields here as needed
  },
  { collection: "room", timestamps: false }
);

// GuessedWord schema
const GuessedWordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true },
    beatedBy: { type: Array, required: true },
    // beatedby schema
    // [
    //   {
    //     "word": String,
    //     "guessedBy": String -> playerName
    //   },
    // ]
  },
  { collection: "guessedWord", timestamps: false }
);

// ScoreBoard schema
const ScoreBoardSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true },
    score: { type: Number, required: true },
    createdDate: { type: Date, default: Date.now },
  },
  { collection: "scoreboard", timestamps: false }
);

export const Room = mongoose.models.Room || mongoose.model("Room", RoomSchema);
export const GuessedWord =
  mongoose.models.GuessedWord || mongoose.model("GuessedWord", GuessedWordSchema);
export const ScoreBoard =
  mongoose.models.ScoreBoard || mongoose.model("ScoreBoard", ScoreBoardSchema);

// (Optional) Backwards-compatible getters that return Mongoose models
export function getGuessedWordCollection() { return GuessedWord; }
export function getRoomCollection() { return Room; }
export function getScoreBoardCollection() { return ScoreBoard; }
