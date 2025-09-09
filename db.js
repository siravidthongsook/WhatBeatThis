import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { DEVMODE } from "./app.js";
dotenv.config({ path: [".env", ".env.local"] });

let client;
let db;
const MONGODB_URI = process.env.MONGODB_URI

export async function connectToDatabase() {
    if (db) return db;
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is required in .env");
    }
    client = new MongoClient(MONGODB_URI, { maxPoolSize: 10 });
    if (DEVMODE) console.log("MONGODB: connecting.......")
    await client.connect();
    if (DEVMODE) console.log("MONGODB: connected.")
    db = client.db();
    return db;
}

export function getDb() {
    if (!db)
        throw new Error(
            "Database not initialized. Call connectToDatabase first.",
        );
    return db;
}

export async function closeDatabase() {
    if (client) await client.close();
}
