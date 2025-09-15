import 'dotenv/config'
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
export async function connectToDatabase() {
    if (!MONGODB_URI) throw new Error("MONGODB_URI is required in .env");
    if (mongoose.connection.readyState === 1) return mongoose.connection.db;

    const devmode = process.env.DEVMODE === "true";
    if (devmode) console.log("MONGOOSE: connecting...");
    await mongoose.connect(MONGODB_URI, {
        // Keep minimal options; Mongoose 8 uses modern driver defaults
        maxPoolSize: 10,
    });
    if (devmode) console.log("MONGOOSE: connected.");
    return mongoose.connection.db;
}

export function getDb() {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        throw new Error("Database not initialized. Call connectToDatabase first.");
    }
    return mongoose.connection.db;
}

export async function closeDatabase() {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
}
