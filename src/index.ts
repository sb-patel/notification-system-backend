require('dotenv').config();

import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { userRouter } from "./routes/user";
import { adminRouter } from "./routes/admin";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";


const app = express();
const server = http.createServer(app);

app.use(cors()); // Enable CORS for all routes in development
app.use(express.json());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);


async function main() {
  try {
    if (!process.env.MONGO_URL) {
      return;
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log(process.env.MONGO_URL);

    // Start Server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
  catch (error) {
    console.log(error instanceof Error ? error.message : "Unknown Error");
  }
};

main();

// WebSocket Setup
const wss = new WebSocketServer({ server });
const clients = new Map<string, WebSocket>();

wss.on("connection", (ws, req) => {
  const params = new URLSearchParams(req.url?.split("?")[1]);
  const token = params.get("token");

  if (!token) {
    ws.close();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_USER_PASSWORD as string) as { id: string };
    const userId = decoded.id;
    clients.set(userId, ws);

    console.log(`User connected: ${userId}`);

    ws.on("close", () => {
      clients.delete(userId);
      console.log(`User disconnected: ${userId}`);
    });
  } catch (err) {
    ws.close();
    console.error("Invalid WebSocket token:", err);
  }
});

// Function to send notifications via WebSocket
export const sendNotification = async (userId: string, notification: any, type = "individual") => {
  if (type === "individual" && clients.has(userId)) {
    clients.get(userId)?.send(JSON.stringify(notification));
  }
  else {
    clients.forEach((ws, clientId) => {
      ws.send(JSON.stringify(notification));
    });
  }
};