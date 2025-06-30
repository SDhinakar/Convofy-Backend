import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import http from "http";
import fs from "fs"

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { setupSocket } from "./lib/socket.js";

// Load environment variables
dotenv.config();

// Set up __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

// Setup WebSocket
setupSocket(server);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? process.env.CLIENT_URL : "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Public health check route for keep-alive pings
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});


// Serve Frontend in Production
if (process.env.NODE_ENV === "production") {
  const distPath = join(__dirname, "../Frontend/dist");

  // Prevent crash if dist folder is missing
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    app.get("*", (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) return next();
      res.sendFile(join(distPath, "index.html"));
    });
  } else {
    console.warn("⚠️ Frontend build not found in production mode.");
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on PORT: ${PORT}`);
  connectDB();
});
