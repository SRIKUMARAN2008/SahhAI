import express from 'express';
import { db } from './database.js';
import { handleUtterance } from './orchestrator.js';
const router = express.Router();
// Session cache for direct HTTP-based chat simulation (frontend simulator fallback)
const simulatorSessions = new Map();
// Dashboard Stats
router.get('/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to load statistics" });
  }
});
// Call Logs
router.get('/logs', (req, res) => {
  try {
    const logs = db.getCallLogs();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to load call logs" });
  }
});
// CRM Raw Data
router.get('/crm', (req, res) => {
  try {
    const rawData = db.getRawData();
    res.json({
      orders: rawData.orders,
      accounts: rawData.accounts,
      appointments: rawData.appointments,
      properties: rawData.properties
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load CRM data" });
  }
});
// Create Order
router.post('/crm/orders', (req, res) => {
  try {
    const data = db.getRawData();
    const newOrder = {
      orderNumber: req.body.orderNumber || String(Math.floor(100000 + Math.random() * 900000)),
      customerName: req.body.customerName || "John Doe",
      item: req.body.item || "NXG smart device",
      status: req.body.status || "Pending",
      shipDate: req.body.shipDate || "N/A",
      deliveryDate: req.body.deliveryDate || "N/A",
      refunded: false,
      refundReason: ""
    };
    data.orders.push(newOrder);
    db.saveRawData(data);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: "Failed to create order" });
  }
});
// Create Account
router.post('/crm/accounts', (req, res) => {
  try {
    const data = db.getRawData();
    const newAccount = {
      accountId: req.body.accountId || String(Math.floor(100000 + Math.random() * 900000)),
      customerName: req.body.customerName || "Jane Smith",
      phoneNumber: req.body.phoneNumber || "9000011111",
      balance: Number(req.body.balance) || 0,
      dueDate: req.body.dueDate || "N/A",
      status: "Active",
      address: req.body.address || "123 Main St, Chennai"
    };
    data.accounts.push(newAccount);
    db.saveRawData(data);
    res.status(201).json(newAccount);
  } catch (err) {
    res.status(500).json({ error: "Failed to create account" });
  }
});
// Schedule Appointment
router.post('/crm/appointments', (req, res) => {
  try {
    const { propertyName, date, time, customerName } = req.body;
    const apt = db.scheduleAppointment(propertyName, date, time, customerName);
    res.status(201).json(apt);
  } catch (err) {
    res.status(500).json({ error: "Failed to schedule appointment" });
  }
});
// Live Simulator Chat Endpoint (Allows browser speech to directly invoke orchestrator via HTTP)
router.post('/simulator/chat', async (req, res) => {
  try {
    const { sessionId, text, callerNumber, language } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }
    // Initialize or load session state
    let state = simulatorSessions.get(sessionId);
    if (!state) {
      state = {
        conversationHistory: [],
        language: language || "en",
        collectedSlots: {},
        activeIntent: null,
        step: null,
        isEscalated: false,
        isEnded: false,
        startTime: Date.now(),
        callerNumber: callerNumber || "9876543210"
      };
      // Send greeting first if user text is empty (initial connect)
      if (!text) {
        const greeting = "Hello, this is Nisha from NXG Homes customer support. How can I help you today?";
        state.conversationHistory.push({ role: 'assistant', content: greeting });
        simulatorSessions.set(sessionId, state);
        return res.json({
          text: greeting,
          intent: "Greeting",
          action: null,
          state
        });
      }
    }
    if (text) {
      const result = await handleUtterance(state, text);
      
      // Update session cache
      if (state.isEnded || result.action === "end_call") {
        // Save call log to database
        const durationSeconds = Math.round((Date.now() - state.startTime) / 1000);
        const dbTranscript = state.conversationHistory.map(h => ({
          sender: h.role === 'assistant' ? 'Bot' : 'User',
          text: h.content
        }));
        db.addCallLog({
          durationSeconds,
          callerNumber: state.callerNumber,
          language: state.language === "hi" ? "hi-IN" : (state.language === "ta" ? "ta-IN" : "en-US"),
          intent: result.intent || "GeneralFAQ",
          containmentStatus: state.isEscalated || result.action === "transfer" ? "Escalated" : "Resolved",
          csat: result.action === "transfer" ? 2 : 5,
          transcript: dbTranscript
        });
        simulatorSessions.delete(sessionId);
      } else {
        simulatorSessions.set(sessionId, state);
      }
      res.json({
        text: result.text,
        intent: result.intent,
        action: result.action,
        toolCalls: result.toolCalls || null,
        state
      });
    } else {
      res.json({
        text: "Session active",
        state
      });
    }
  } catch (err) {
    console.error("Error in chat simulator endpoint:", err);
    res.status(500).json({ error: "Failed to process chat turn" });
  }
});
export default router;
