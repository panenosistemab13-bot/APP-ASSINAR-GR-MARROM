import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("assinagr.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    data JSON NOT NULL,
    signature TEXT,
    signed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get("/api/contracts", (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM contracts ORDER BY created_at DESC");
      const contracts = stmt.all() as any[];
      res.json(contracts.map(c => ({
        ...c,
        data: JSON.parse(c.data)
      })));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  app.post("/api/contracts", (req, res) => {
    const { id, data } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO contracts (id, data) VALUES (?, ?)");
      stmt.run(id, JSON.stringify(data));
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  app.get("/api/contracts/:id", (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare("SELECT * FROM contracts WHERE id = ?");
      const contract = stmt.get(id) as any;
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json({
        ...contract,
        data: JSON.parse(contract.data)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts/:id/sign", (req, res) => {
    const { id } = req.params;
    const { signature } = req.body;
    try {
      const stmt = db.prepare("UPDATE contracts SET signature = ?, signed_at = CURRENT_TIMESTAMP WHERE id = ?");
      const result = stmt.run(signature, id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to sign contract" });
    }
  });

  app.delete("/api/contracts/:id", (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare("DELETE FROM contracts WHERE id = ?");
      const result = stmt.run(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
