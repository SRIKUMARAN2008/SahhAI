import { handleUtterance } from './orchestrator.js';
import { db } from './database.js';
export function handleRetellConnection(ws) {
  console.log("[WebSocket] New Retell connection established.");
  // Call session state
  let sessionState = {
    conversationHistory: [],
    language: "en",
    collectedSlots: {},
    activeIntent: null,
    step: null,
    isEscalated: false,
    isEnded: false,
    startTime: Date.now(),
    callerNumber: "Unknown"
  };
  let callId = null;
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log("[WebSocket Received]:", JSON.stringify(data, null, 2));
      // 1. Check for connection startup / config event
      if (data.event === "start" || data.call_id) {
        callId = data.call_id || `call_${Date.now()}`;
        sessionState.callerNumber = data.from_number || data.caller_number || "9876543210";
        console.log(`[WebSocket] Starting call session for ID: ${callId}, Caller: ${sessionState.callerNumber}`);
        
        // Return initial greeting
        const greeting = "Hello, thank you for calling NXG Homes. How can I assist you today?";
        sessionState.conversationHistory.push({ role: 'assistant', content: greeting });
        
        const responseFrame = {
          response_id: 1,
          content: greeting,
          content_complete: true
        };
        ws.send(JSON.stringify(responseFrame));
        return;
      }
      // 2. Check for speech / transcript events
      // Retell sends updates during user speech. We trigger agent reply on user_speech_committed
      if (data.interaction_type === "user_speech_committed" || (data.transcript && data.interaction_type !== "user_speech_interim")) {
        const transcriptArr = data.transcript || [];
        const lastUtteranceObj = transcriptArr[transcriptArr.length - 1];
        
        if (!lastUtteranceObj || lastUtteranceObj.role !== "user") {
          return; // Ignore assistant utterances in incoming feed
        }
        const userText = lastUtteranceObj.content;
        console.log(`[WebSocket] User Utterance: "${userText}"`);
        // Get response from orchestrator
        const responseId = data.response_id || Date.now();
        const result = await handleUtterance(sessionState, userText);
        console.log(`[WebSocket] Agent Response: "${result.text}" (Action: ${result.action})`);
        // Send back streamed response in chunks (to simulate real-time streaming)
        const words = result.text.split(" ");
        let currentChunk = "";
        
        for (let i = 0; i < words.length; i++) {
          currentChunk += (i === 0 ? "" : " ") + words[i];
          // Send words in batches of 3 or 4 for natural stream feel
          if (i % 3 === 2 || i === words.length - 1) {
            const streamFrame = {
              response_id: responseId,
              content: currentChunk,
              content_complete: i === words.length - 1
            };
            ws.send(JSON.stringify(streamFrame));
            currentChunk = "";
            // Small artificial latency to mimic processing/streaming
            await new Promise(resolve => setTimeout(resolve, 80));
          }
        }
        // If transfer or hangup action requested, handle it
        if (result.action === "transfer") {
          console.log("[WebSocket] Action: Transferring to human agent.");
          const transferFrame = {
            response_id: responseId + 1,
            action: "transfer",
            transfer_to: "+1234567890", // Mock live queue routing number
            content: "Please hold while I route your call.",
            content_complete: true
          };
          ws.send(JSON.stringify(transferFrame));
          sessionState.isEscalated = true;
        }
        // Check if call ends
        if (result.action === "end_call") {
          console.log("[WebSocket] Action: Ending call.");
          const endFrame = {
            response_id: responseId + 1,
            action: "end_call",
            content_complete: true
          };
          ws.send(JSON.stringify(endFrame));
          sessionState.isEnded = true;
          ws.close();
        }
      }
      // Handle Ping
      if (data.event === "ping") {
        ws.send(JSON.stringify({ event: "pong" }));
      }
    } catch (err) {
      console.error("[WebSocket] Error processing message:", err);
      ws.send(JSON.stringify({
        error: "Internal processing error occurred",
        content_complete: true
      }));
    }
  });
  ws.on('close', () => {
    console.log(`[WebSocket] Connection closed for call ${callId || 'unknown'}`);
    
    // Save call log to database
    if (sessionState.conversationHistory.length > 0) {
      const durationSeconds = Math.round((Date.now() - sessionState.startTime) / 1000);
      const isEscalated = sessionState.isEscalated;
      // Extract primary intent from history
      let detectedIntent = "GeneralFAQ";
      if (sessionState.activeIntent) {
        detectedIntent = sessionState.activeIntent;
      } else {
        // Look through history to guess
        const historyText = sessionState.conversationHistory.map(h => h.content).join(" ").toLowerCase();
        if (historyText.includes("order")) detectedIntent = "OrderStatus";
        else if (historyText.includes("refund")) detectedIntent = "RefundRequest";
        else if (historyText.includes("bill") || historyText.includes("payment")) detectedIntent = "BillingInquiry";
        else if (historyText.includes("troubleshoot") || historyText.includes("router")) detectedIntent = "TechnicalSupport";
        else if (historyText.includes("appointment") || historyText.includes("visit")) detectedIntent = "AppointmentBooking";
        else if (historyText.includes("address") || historyText.includes("update")) detectedIntent = "AccountUpdate";
      }
      // Map conversationHistory format to DB format
      const dbTranscript = sessionState.conversationHistory.map(h => ({
        sender: h.role === 'assistant' ? 'Bot' : 'User',
        text: h.content
      }));
      // Generate a mock CSAT score
      let csat = 5;
      if (isEscalated) csat = 2; // general user irritation for escalations
      else if (durationSeconds > 180) csat = 3;
      db.addCallLog({
        durationSeconds,
        callerNumber: sessionState.callerNumber,
        language: sessionState.language === "hi" ? "hi-IN" : (sessionState.language === "ta" ? "ta-IN" : "en-US"),
        intent: detectedIntent,
        containmentStatus: isEscalated ? "Escalated" : "Resolved",
        csat,
        transcript: dbTranscript
      });
      
      console.log("[WebSocket] Call log saved to DB.");
    }
  });
}
