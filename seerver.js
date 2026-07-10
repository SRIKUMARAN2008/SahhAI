import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes.js';
import { initDb } from './database.js';
import { handleRetellConnection } from './retellSocket.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Initialize DB and write initial mock data if file does not exist
initDb();
const app = express();
const PORT = process.env.PORT || 5000;
// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
// Set up routes
app.use('/api', apiRouter);
// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});
// Serve frontend assets in production (optional fallback if compiled)
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendBuildPath));
app.get('*', (req, res, next) => {
  // If request matches API or WebSocket upgrade, do not serve index.html
  if (req.url.startsWith('/api') || req.url.startsWith('/llm-websocket')) {
    return next();
  }
  res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
    if (err) {
      // If build directory is not found/active, respond with simple message
      res.status(200).send("Backend Server Running. Launch frontend in dev mode to view dashboard.");
    }
  });
});
// Create HTTP server
const server = http.createServer(app);
// Attach WebSocket Server on '/llm-websocket' path
const wss = new WebSocketServer({ noServer: true });
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === '/llm-websocket') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});
// Connect Retell connection handler
wss.on('connection', (ws) => {
  handleRetellConnection(ws);
});
server.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`NXG Homes Voice Bot Backend server running on port: ${PORT}`);
  console.log(`REST APIs: http://localhost:${PORT}/api`);
  console.log(`WebSocket URL for Retell AI: ws://localhost:${PORT}/llm-websocket`);
  console.log(`===========================================================`);
});
