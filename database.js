import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');
const INITIAL_DATA = {
  orders: [
    {
      orderNumber: "564738",
      customerName: "Sanjay Kumar",
      item: "NXG smart home hub",
      status: "Shipped",
      shipDate: "2026-07-02",
      deliveryDate: "2026-07-16",
      refunded: false,
      refundReason: ""
    },
    {
      orderNumber: "123456",
      customerName: "Aarav Sharma",
      item: "Premium Security Camera Suite",
      status: "Shipped",
      shipDate: "2026-07-09",
      deliveryDate: "2026-07-15",
      refunded: false,
      refundReason: ""
    },
    {
      orderNumber: "789012",
      customerName: "Deepika Patel",
      item: "Smart Thermostat Pro",
      status: "Delivered",
      shipDate: "2026-07-04",
      deliveryDate: "2026-07-07",
      refunded: false,
      refundReason: ""
    }
  ],
  accounts: [
    {
      accountId: "998877",
      customerName: "Rohan Das",
      phoneNumber: "9876543210",
      balance: 2500,
      dueDate: "2026-07-20",
      status: "Active",
      address: "Flat 4B, Blue Horizon, Adyar, Chennai - 600020"
    },
    {
      accountId: "445566",
      customerName: "Meera Krishnan",
      phoneNumber: "9812345678",
      balance: 0,
      dueDate: "N/A",
      status: "Active",
      address: "12A, Sterling Road, Nungambakkam, Chennai - 600034"
    }
  ],
  appointments: [
    {
      id: "apt_1",
      propertyName: "Tirumangalam Residence",
      customerName: "Vijay Anand",
      date: "2026-07-18",
      time: "15:00",
      status: "Confirmed"
    }
  ],
  properties: [
    { name: "Tirumangalam Residence", location: "Anna Nagar, Chennai" },
    { name: "Adyar Heights", location: "Gandhi Nagar, Adyar, Chennai" },
    { name: "Choolaimedu Villa", location: "Choolaimedu, Chennai" }
  ],
  callLogs: [
    {
      id: "call_1",
      timestamp: "2026-07-09T10:14:00Z",
      durationSeconds: 92,
      callerNumber: "9876543210",
      language: "en-US",
      intent: "OrderStatus",
      containmentStatus: "Resolved",
      csat: 5,
      transcript: [
        { sender: "Bot", text: "Hello, this is Nisha from NXG Homes customer support. How can I help you today?" },
        { sender: "User", text: "Hi, I wanted to check my order status." },
        { sender: "Bot", text: "Certainly. Could you please provide your 6-digit order number?" },
        { sender: "User", text: "Yes, it is 564738." },
        { sender: "Bot", text: "Thank you for waiting. Order 564738 was shipped on July 2 and is expected on July 16. Can I assist you further?" },
        { sender: "User", text: "No, that's all. Thank you." },
        { sender: "Bot", text: "You're welcome. Have a great day!" }
      ]
    },
    {
      id: "call_2",
      timestamp: "2026-07-09T14:22:00Z",
      durationSeconds: 145,
      callerNumber: "9812345678",
      language: "hi-IN",
      intent: "AccountUpdate",
      containmentStatus: "Resolved",
      csat: 4,
      transcript: [
        { sender: "Bot", text: "Hello, this is Nisha from NXG Homes. How can I help you today?" },
        { sender: "User", text: "मुझे अपना पता बदलना है" },
        { sender: "Bot", text: "ज़रूर, मैं आपकी मदद कर सकती हूँ। क्या आप मुझे अपना अकाउंट आईडी या रजिस्टर्ड फोन नंबर दे सकते हैं?" },
        { sender: "User", text: "अकाउंट आईडी है 445566" },
        { sender: "Bot", text: "धन्यवाद मीरा जी। कृपया अपना नया पता बताइए।" },
        { sender: "User", text: "12A, Sterling Road, Nungambakkam, Chennai" },
        { sender: "Bot", text: "ठीक है, मैंने आपका पता अपडेट कर दिया है। क्या मैं आपकी कोई और सहायता कर सकती हूँ?" },
        { sender: "User", text: "नहीं, धन्यवाद।" },
        { sender: "Bot", text: "आपका दिन शुभ हो!" }
      ]
    },
    {
      id: "call_3",
      timestamp: "2026-07-10T09:05:00Z",
      durationSeconds: 65,
      callerNumber: "9000012345",
      language: "en-US",
      intent: "Escalation",
      containmentStatus: "Escalated",
      csat: 2,
      transcript: [
        { sender: "Bot", text: "Hello, this is Nisha from NXG Homes customer support. How can I help you today?" },
        { sender: "User", text: "I want to speak with a manager immediately." },
        { sender: "Bot", text: "I understand. Please hold while I transfer you to a human agent." }
      ]
    },
    {
      id: "call_4",
      timestamp: "2026-07-10T11:40:00Z",
      durationSeconds: 110,
      callerNumber: "9988776655",
      language: "ta-IN",
      intent: "BillingInquiry",
      containmentStatus: "Resolved",
      csat: 5,
      transcript: [
        { sender: "Bot", text: "வணக்கம், NXG Homes வாடிக்கையாளர் சேவைக்கு வரவேற்கிறோம். நான் நிஷா. உங்களுக்கு எப்படி உதவ முடியும்?" },
        { sender: "User", text: "என் பில் எவ்ளோனு சொல்ல முடியுமா?" },
        { sender: "Bot", text: "நிச்சயமாக. உங்கள் கணக்கு எண் அல்லது பதிவு செய்யப்பட்ட தொலைபேசி எண்ணை வழங்க முடியுமா?" },
        { sender: "User", text: "998877" },
        { sender: "Bot", text: "நன்றி. உங்கள் கணக்கில் ₹2,500 நிலுவையில் உள்ளது. கட்ட வேண்டிய கடைசி தேதி ஜூலை 20." },
        { sender: "User", text: "ஓகே, நன்றி." },
        { sender: "Bot", text: "நன்றி, நல்ல நாள் அமையட்டும்!" }
      ]
    }
  ]
};
// Ensure database file exists
export function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
  }
}
// Read database
function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading db.json, returning initial seed data", err);
    return INITIAL_DATA;
  }
}
// Write database
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing db.json", err);
  }
}
export const db = {
  // Orders
  getOrder(orderNumber) {
    const data = readDb();
    return data.orders.find(o => o.orderNumber === orderNumber);
  },
  updateOrderStatus(orderNumber, status) {
    const data = readDb();
    const order = data.orders.find(o => o.orderNumber === orderNumber);
    if (order) {
      order.status = status;
      writeDb(data);
      return order;
    }
    return null;
  },
  initiateRefund(orderNumber, reason) {
    const data = readDb();
    const order = data.orders.find(o => o.orderNumber === orderNumber);
    if (order) {
      order.refunded = true;
      order.refundReason = reason;
      order.status = "Refund Initiated";
      writeDb(data);
      return order;
    }
    return null;
  },
  // Accounts
  getAccount(accountIdOrPhone) {
    const data = readDb();
    return data.accounts.find(a => a.accountId === accountIdOrPhone || a.phoneNumber === accountIdOrPhone);
  },
  updateAddress(accountIdOrPhone, newAddress) {
    const data = readDb();
    const account = data.accounts.find(a => a.accountId === accountIdOrPhone || a.phoneNumber === accountIdOrPhone);
    if (account) {
      account.address = newAddress;
      writeDb(data);
      return account;
    }
    return null;
  },
  payBill(accountIdOrPhone, amount) {
    const data = readDb();
    const account = data.accounts.find(a => a.accountId === accountIdOrPhone || a.phoneNumber === accountIdOrPhone);
    if (account) {
      account.balance = Math.max(0, account.balance - amount);
      writeDb(data);
      return account;
    }
    return null;
  },
  // Appointments
  getAppointments() {
    const data = readDb();
    return data.appointments;
  },
  scheduleAppointment(propertyName, date, time, customerName = "Walk-in Customer") {
    const data = readDb();
    const newApt = {
      id: `apt_${Date.now()}`,
      propertyName,
      customerName,
      date,
      time,
      status: "Confirmed"
    };
    data.appointments.push(newApt);
    writeDb(data);
    return newApt;
  },
  getProperties() {
    const data = readDb();
    return data.properties;
  },
  // Call Logs
  getCallLogs() {
    const data = readDb();
    // Sort reverse chronological
    return [...data.callLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
  addCallLog(log) {
    const data = readDb();
    const newLog = {
      id: `call_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    data.callLogs.push(newLog);
    writeDb(data);
    return newLog;
  },
  // Get raw DB for direct manipulation
  getRawData() {
    return readDb();
  },
  saveRawData(data) {
    writeDb(data);
  },
  // Statistics
  getStats() {
    const data = readDb();
    const totalCalls = data.callLogs.length;
    if (totalCalls === 0) {
      return { containmentRate: 100, aht: 0, csat: 5.0, totalCalls: 0 };
    }
    const resolved = data.callLogs.filter(c => c.containmentStatus === "Resolved").length;
    const containmentRate = Math.round((resolved / totalCalls) * 100);
    const totalDur = data.callLogs.reduce((acc, c) => acc + c.durationSeconds, 0);
    const aht = Math.round(totalDur / totalCalls);
    const ratings = data.callLogs.filter(c => c.csat !== undefined && c.csat !== null);
    const csat = ratings.length > 0
      ? parseFloat((ratings.reduce((acc, c) => acc + c.csat, 0) / ratings.length).toFixed(1))
      : 5.0;
    return { containmentRate, aht, csat, totalCalls };
  }
};
