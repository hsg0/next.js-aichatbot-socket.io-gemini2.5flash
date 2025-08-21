// server.js
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { generateResponse } from "./service/aiservice.js";

dotenv.config();

const histories = new Map(); // socket.id -> history[]
const HISTORY_LIMIT = 24;
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4020;

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

function normalizePrompt(data) {
  if (typeof data === "string") return data;
  if (typeof data?.prompt === "string") return data.prompt;
  if (typeof data?.promt === "string") return data.promt;
  return JSON.stringify(data);
}
function pushWithCap(arr, item, cap = HISTORY_LIMIT) {
  arr.push(item);
  if (arr.length > cap) arr.splice(0, arr.length - cap);
}

io.on("connection", (socket) => {
  histories.set(socket.id, []);
  console.log("Connected:", socket.id);

  // ❌ removed the plain chat echo to avoid duplicates

  socket.on("ai-message", async (data) => {
    try {
      const prompt = (normalizePrompt(data) || "").trim();
      if (!prompt) return socket.emit("ai-message:error", "No prompt provided.");

      const history = histories.get(socket.id) ?? [];
      pushWithCap(history, { role: "user", parts: [{ text: prompt }] });

      const reply = await generateResponse(history);
      pushWithCap(history, { role: "model", parts: [{ text: reply }] });
      histories.set(socket.id, history);

      socket.emit("ai-message:reply", reply);
    } catch (err) {
      console.error("❌ AI error:", err);
      socket.emit("ai-message:error", "Failed to generate AI response.");
    }
  });

  socket.on("disconnect", (reason) => {
    histories.delete(socket.id);
    console.log("👋 Disconnected:", socket.id, reason);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
