import { Router } from "express";
import { getDb } from "../db/index.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const db = getDb();

    // database stats (collections, storage size, etc.)
    const stats = await db.stats();

    // build info (server version, git version, etc.)
    const buildInfo = await db.command({ buildInfo: 1 });

    res.json({
      database: db.databaseName,
      collections: stats.collections,
      objects: stats.objects,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      mongoVersion: buildInfo.version,
      gitVersion: buildInfo.gitVersion,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch DB info" });
  }
});

export default router;

