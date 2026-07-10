import { OpenAI } from 'openai';
import { db } from './database.js';
import dotenv from 'dotenv';
dotenv.config();
const openaiKey = process.env.OPENAI_API_KEY;
let openai = null;
if (openaiKey) {
  openai = new OpenAI({ apiKey: openaiKey });
}
// ----------------------------------------------------
// System Prompt
// ----------------------------------------------------
export const SYSTEM_PROMPT = `
You are Nisha, a friendly, empathetic, and highly efficient Voice Customer Care Bot for NXG Homes. 
You provide customer service in English, Hindi, and Tamil. Always adapt to the user's language.
Your guidelines:
1. Persona: Polite, professional, and reassuring. Speak clearly at a moderate pace.
2. Tone: Warm and helpful. For frustrated callers, convey strong empathy (e.g. "I understand this is frustrating, let me solve this for you").
3. Conversational Style: Keep your sentences short and conversational (1-2 clauses max). Avoid technical jargon.
4. Voice Naturalness: Use natural interjections or fillers like "hmm", "uh", or "so" with subtle pauses occasionally to sound human (e.g. "Yeah, um, let me check that for you.").
5. Language Handling:
   - If the user greets in English, reply in English.
   - If in Hindi, respond in polite, respectful Hindi (e.g. "नमस्ते, मैं निशा हूँ, NXG Homes से। आज मैं आपकी क्या सहायता कर सकती हूँ?").
   - If in Tamil, respond in polite Tamil (e.g. "வணக்கம், நான் நிஷா. உங்களுக்கு எப்படி உதவ முடியும்?").
   - If a language is unsupported, politely ask in Hindi/English to switch: "मुझे माफ़ करें, क्या हम English में बात कर सकते हैं?".
6. Escalation: If the customer asks for a "human", "manager", "representative", or "supervisor", transfer them IMMEDIATELY. Say "Certainly. Please hold while I connect you to a human representative." and trigger the transfer.
7. Validation:
   - Order numbers are exactly 6 digits. Validate the format. If invalid, ask again.
   - Account IDs are exactly 6 digits.
Use your tools to query order status, refunds, billing, appointments, and updating account details.
Always confirm slot values before making write edits (like updating address or booking visit).
`;
// Define tools for OpenAI schema
const tools = [
  {
    type: "function",
    function: {
      name: "checkOrderStatus",
      description: "Get shipping and delivery details for an order using a 6-digit order number.",
      parameters: {
        type: "object",
        properties: {
          orderNumber: { type: "string", description: "The 6-digit order number." }
        },
        required: ["orderNumber"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "initiateRefund",
      description: "Initiate a refund for a delivered order. Refund requests are only valid within 7 days of delivery.",
      parameters: {
        type: "object",
        properties: {
          orderNumber: { type: "string", description: "The 6-digit order number." },
          reason: { type: "string", description: "The reason for the refund request." }
        },
        required: ["orderNumber", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getBillingDetails",
      description: "Look up account billing balance and payment due date using an Account ID or phone number.",
      parameters: {
        type: "object",
        properties: {
          accountIdOrPhone: { type: "string", description: "The 6-digit account ID or 10-digit registered phone number." }
        },
        required: ["accountIdOrPhone"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "updateAddress",
      description: "Update the customer account address after confirming their Identity/Account ID.",
      parameters: {
        type: "object",
        properties: {
          accountIdOrPhone: { type: "string", description: "The 6-digit account ID or phone number." },
          newAddress: { type: "string", description: "The new street address." }
        },
        required: ["accountIdOrPhone", "newAddress"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "scheduleAppointment",
      description: "Schedule a property visit or technician appointment at a specific property location, date, and time.",
      parameters: {
        type: "object",
        properties: {
          propertyName: { type: "string", enum: ["Tirumangalam Residence", "Adyar Heights", "Choolaimedu Villa"], description: "The name of the property." },
          date: { type: "string", description: "Future date in YYYY-MM-DD format." },
          time: { type: "string", description: "Time of day (e.g. 15:00)." },
          customerName: { type: "string", description: "Name of the customer scheduling the visit." }
        },
        required: ["propertyName", "date", "time"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "escalateToHuman",
      description: "Escalate the call and transfer to a human manager or supervisor agent immediately.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for the transfer." }
        },
        required: ["reason"]
      }
    }
  }
];
// Tool Executors
const toolExecutors = {
  checkOrderStatus({ orderNumber }) {
    const order = db.getOrder(orderNumber);
    if (!order) {
      return { success: false, message: `Order #${orderNumber} was not found in our database.` };
    }
    return { success: true, order };
  },
  initiateRefund({ orderNumber, reason }) {
    const order = db.getOrder(orderNumber);
    if (!order) {
      return { success: false, message: `Order #${orderNumber} not found.` };
    }
    if (order.status !== "Delivered") {
      return { success: false, message: `Refund failed. Order is currently in status: ${order.status}. Only delivered orders are eligible.` };
    }
    // Verify 7 days policy (assume current local time is July 10, 2026, delivery date comparison)
    const today = new Date("2026-07-10");
    const delDate = new Date(order.deliveryDate);
    const diffDays = Math.ceil(Math.abs(today - delDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) {
      return { success: false, message: `Refund policy breach: Order was delivered ${diffDays} days ago. Our refund window is strictly 7 days.` };
    }
    const updated = db.initiateRefund(orderNumber, reason || "Not specified");
    return { success: true, message: "Refund initiated successfully.", order: updated };
  },
  getBillingDetails({ accountIdOrPhone }) {
    const account = db.getAccount(accountIdOrPhone);
    if (!account) {
      return { success: false, message: `No active account found for ID or phone: ${accountIdOrPhone}.` };
    }
    return { success: true, account };
  },
  updateAddress({ accountIdOrPhone, newAddress }) {
    const account = db.updateAddress(accountIdOrPhone, newAddress);
    if (!account) {
      return { success: false, message: `Account ID or phone ${accountIdOrPhone} not found.` };
    }
    return { success: true, message: "Address updated successfully in CRM.", account };
  },
  scheduleAppointment({ propertyName, date, time, customerName }) {
    const apt = db.scheduleAppointment(propertyName, date, time, customerName);
    return { success: true, message: "Appointment scheduled successfully in CRM.", appointment: apt };
  },
  escalateToHuman({ reason }) {
    return { success: true, action: "transfer", message: "Initiating live transfer...", reason };
  }
};
// ----------------------------------------------------
// Mock NLU Conversational Engine (Regex & Flow State)
// ----------------------------------------------------
function runMockNLU(sessionState, text) {
  const input = text.toLowerCase().trim();
  let responseText = "";
  let action = null;
  // Track history
  if (!sessionState.history) {
    sessionState.history = [];
  }
  sessionState.history.push({ role: "user", text });
  // 1. Check for immediate escalation triggers
  if (
    input.includes("manager") || 
    input.includes("agent") || 
    input.includes("representative") || 
    input.includes("supervisor") || 
    input.includes("human") || 
    input.includes("transfer") ||
    input.includes("insist") ||
    input.includes("பேசு") ||  // Tamil speak
    input.includes("मैनेजर")    // Hindi manager
  ) {
    sessionState.activeIntent = "Escalation";
    sessionState.isEscalated = true;
    
    // Multi-lingual response for transfer
    if (sessionState.language === "hi") {
      responseText = "जी, मैं समझ सकती हूँ। मैं अभी आपको हमारे कस्टमर केयर एक्जीक्यूटिव से कनेक्ट करती हूँ। कृपया लाइन पर बने रहें।";
    } else if (sessionState.language === "ta") {
      responseText = "புரிந்துகொண்டேன். எங்கள் வாடிக்கையாளர் சேவை அதிகாரியுடன் உங்களை இணைக்கிறேன். தயவுசெய்து காத்திருக்கவும்.";
    } else {
      responseText = "Certainly. I understand you'd like to speak with someone. Please hold a moment while I transfer you to a human agent.";
    }
    sessionState.history.push({ role: "assistant", text: responseText });
    return { text: responseText, action: "transfer", intent: "Escalation" };
  }
  // Language Detection
  if (
    input.includes("नमस्ते") || 
    input.includes("हिंदी") || 
    input.includes("हैलो") || 
    input.includes("कठिनाई")
  ) {
    sessionState.language = "hi";
  } else if (
    input.includes("வணக்கம்") || 
    input.includes("தமிழ்") || 
    input.includes("நன்றி")
  ) {
    sessionState.language = "ta";
  }
  const lang = sessionState.language || "en";
  // 2. Identify Intent if none active
  if (!sessionState.activeIntent) {
    if (input.includes("order") || input.includes("status") || input.includes("delivery") || input.includes("शिप") || input.includes("ஆர்டர்")) {
      sessionState.activeIntent = "OrderStatus";
    } else if (input.includes("refund") || input.includes("return") || input.includes("पैसे वापस") || input.includes("பணம் திரும்ப")) {
      sessionState.activeIntent = "RefundRequest";
    } else if (input.includes("bill") || input.includes("payment") || input.includes("pay") || input.includes("பில்") || input.includes("भुगतान")) {
      sessionState.activeIntent = "BillingInquiry";
    } else if (input.includes("troubleshoot") || input.includes("router") || input.includes("internet") || input.includes("wifi") || input.includes("काम नहीं")) {
      sessionState.activeIntent = "TechnicalSupport";
      sessionState.step = 1;
    } else if (input.includes("appointment") || input.includes("schedule") || input.includes("visit") || input.includes("வசிப்பிடம்") || input.includes("முன்பதிவு")) {
      sessionState.activeIntent = "AppointmentBooking";
      sessionState.step = 1;
    } else if (input.includes("address") || input.includes("update") || input.includes("पता") || input.includes("முகவரி")) {
      sessionState.activeIntent = "AccountUpdate";
      sessionState.step = 1;
    } else if (input.includes("hours") || input.includes("office") || input.includes("open") || input.includes("வளாகம்") || input.includes("समय")) {
      sessionState.activeIntent = "FAQ_Hours";
    } else if (input.includes("location") || input.includes("office") || input.includes("chennai") || input.includes("இடம்") || input.includes("पता")) {
      sessionState.activeIntent = "FAQ_Location";
    } else if (input.includes("hello") || input.includes("hi") || input.includes("hey")) {
      sessionState.activeIntent = "Greeting";
    }
  }
  // 3. Process Active Intent
  const orderRegex = /\b\d{6}\b/;
  const accountRegex = /\b\d{6}\b/;
  switch (sessionState.activeIntent) {
    case "Greeting":
      if (lang === "hi") {
        responseText = "नमस्ते! मैं निशा हूँ, NXG Homes कस्टमर सपोर्ट से। मैं आपकी क्या मदद कर सकती हूँ?";
      } else if (lang === "ta") {
        responseText = "வணக்கம்! நான் நிஷா, NXG Homes வாடிக்கையாளர் சேவையிலிருந்து பேசுகிறேன். இன்று உங்களுக்கு எவ்வாறு உதவ முடியும்?";
      } else {
        responseText = "Hello, this is Nisha from NXG Homes customer support. How can I help you today?";
      }
      sessionState.activeIntent = null;
      break;
    case "OrderStatus": {
      const match = input.match(orderRegex);
      if (match) {
        const orderNumber = match[0];
        const res = toolExecutors.checkOrderStatus({ orderNumber });
        if (res.success) {
          if (lang === "hi") {
            responseText = `धन्यवाद। ऑर्डर नंबर ${orderNumber} ${res.order.status === 'Shipped' ? 'शिप कर दिया गया है' : 'पहुंच गया है'}। यह ${res.order.deliveryDate} तक पहुंच जाएगा। क्या मैं कुछ और मदद करूँ?`;
          } else if (lang === "ta") {
            responseText = `நன்றி. உங்கள் ஆர்டர் ${orderNumber} ${res.order.status === 'Shipped' ? 'அனுப்பப்பட்டுவிட்டது' : 'விநியோகிக்கப்பட்டது'}. இது ${res.order.deliveryDate} அன்று வந்து சேரும். வேறு ஏதேனும் உதவி தேவையா?`;
          } else {
            responseText = `Thank you. Order #${orderNumber} was shipped and is expected to arrive on ${res.order.deliveryDate}. Is there anything else I can help with?`;
          }
        } else {
          if (lang === "hi") {
            responseText = `मुझे माफ़ करें, मुझे ऑर्डर नंबर ${orderNumber} नहीं मिला। क्या आप फिर से बता सकते हैं?`;
          } else if (lang === "ta") {
            responseText = `மன்னிக்கவும், ஆர்டர் எண் ${orderNumber} கண்டுபிடிக்கப்படவில்லை. மீண்டும் கூற முடியுமா?`;
          } else {
            responseText = `I'm sorry, I couldn't find order number ${orderNumber} in our system. Could you please double-check and repeat the number?`;
          }
        }
        sessionState.activeIntent = null;
      } else {
        if (lang === "hi") {
          responseText = "ज़रूर। कृपया अपना 6 अंकों का ऑर्डर नंबर बताइए।";
        } else if (lang === "ta") {
          responseText = "நிச்சயமாக. தயவுசெய்து உங்கள் 6 இலக்க ஆர்டர் எண்ணை கூறவும்.";
        } else {
          responseText = "Certainly. Could you please provide your 6-digit order number?";
        }
      }
      break;
    }
    case "RefundRequest": {
      const match = input.match(orderRegex);
      if (match) {
        const orderNumber = match[0];
        const res = toolExecutors.initiateRefund({ orderNumber, reason: "Customer request via voicebot" });
        if (res.success) {
          if (lang === "hi") {
            responseText = `आपका रिफंड ऑर्डर नंबर ${orderNumber} के लिए शुरू कर दिया गया है। आपको जल्द ही एक कन्फर्मेशन ईमेल मिलेगा। क्या मैं कुछ और मदद करूँ?`;
          } else if (lang === "ta") {
            responseText = `உங்கள் ஆர்டர் ${orderNumber}-க்கான பணம் திரும்பப் பெறுதல் செயல்முறை தொடங்கப்பட்டுள்ளது. உங்களுக்கு விரைவில் மின்னஞ்சல் அனுப்பப்படும். வேறு ஏதேனும் உதவி தேவையா?`;
          } else {
            responseText = `Your refund for order #${orderNumber} has been initiated. You will receive a confirmation email shortly. Is there anything else?`;
          }
        } else {
          if (lang === "hi") {
            responseText = `रिफंड नहीं किया जा सका। ${res.message} क्या हम किसी और चीज में मदद कर सकते हैं?`;
          } else if (lang === "ta") {
            responseText = `பணம் திரும்ப வழங்க முடியவில்லை. காரணம்: ${res.message}. வேறு உதவி தேவையா?`;
          } else {
            responseText = `I'm sorry, we couldn't process your refund. ${res.message} Can I assist you with something else?`;
          }
        }
        sessionState.activeIntent = null;
      } else {
        if (lang === "hi") {
          responseText = "रिफंड प्रोसेस करने के लिए, क्या मुझे आपका 6 अंकों का ऑर्डर नंबर मिल सकता है?";
        } else if (lang === "ta") {
          responseText = "பணத்தை திரும்பப் பெற, உங்களது 6 இலக்க ஆர்டர் எண் எனக்கு கிடைக்கலாமா?";
        } else {
          responseText = "To process your refund, could I please have your 6-digit order number?";
        }
      }
      break;
    }
    case "BillingInquiry": {
      const match = input.match(accountRegex);
      if (match) {
        const accountId = match[0];
        const res = toolExecutors.getBillingDetails({ accountIdOrPhone: accountId });
        if (res.success) {
          if (lang === "hi") {
            responseText = `आपके खाते में बकाया राशि ₹${res.account.balance} है, जो ${res.account.dueDate} तक देय है। क्या आप अभी भुगतान करना चाहेंगे?`;
          } else if (lang === "ta") {
            responseText = `உங்கள் கணக்கின் நிலுவைத் தொகை ₹${res.account.balance}. கட்ட வேண்டிய கடைசித் தேதி ${res.account.dueDate}. இப்போது செலுத்த விரும்புகிறீர்களா?`;
          } else {
            responseText = `Your outstanding balance is ₹${res.account.balance}, due on ${res.account.dueDate}. Would you like to pay now?`;
          }
        } else {
          responseText = res.message;
        }
        sessionState.activeIntent = null;
      } else {
        if (lang === "hi") {
          responseText = "बिलिंग की जानकारी के लिए, कृपया अपना 6 अंकों का अकाउंट नंबर दीजिए।";
        } else if (lang === "ta") {
          responseText = "பில் விவரங்களை அறிய, தயவுசெய்து உங்கள் 6 இலக்க கணக்கு எண்ணை வழங்கவும்.";
        } else {
          responseText = "For your billing info, could you please provide your 6-digit Account ID?";
        }
      }
      break;
    }
    case "AccountUpdate": {
      if (sessionState.step === 1) {
        const match = input.match(accountRegex);
        if (match) {
          sessionState.accountId = match[0];
          sessionState.step = 2;
          if (lang === "hi") {
            responseText = "धन्यवाद। कृपया अपना नया पता बताइए।";
          } else if (lang === "ta") {
            responseText = "நன்றி. தயவுசெய்து உங்கள் புதிய முகவரியைக் கூறவும்.";
          } else {
            responseText = "Thank you. Please tell me your new street address.";
          }
        } else {
          if (lang === "hi") {
            responseText = "अपना पता बदलने के लिए, कृपया अपना 6 अंकों का अकाउंट नंबर बताइए।";
          } else if (lang === "ta") {
            responseText = "முகவரியை மாற்ற, தயவுசெய்து உங்கள் 6 இலக்க கணக்கு எண்ணைக் கூறவும்.";
          } else {
            responseText = "To update your address, could you please tell me your 6-digit Account ID?";
          }
        }
      } else if (sessionState.step === 2) {
        sessionState.newAddress = text;
        sessionState.step = 3;
        if (lang === "hi") {
          responseText = `क्या आप पुष्टि करते हैं कि आपका नया पता "${text}" है?`;
        } else if (lang === "ta") {
          responseText = `உங்கள் புதிய முகவரி "${text}" என்பதை உறுதிப்படுத்துகிறீர்களா?`;
        } else {
          responseText = `Confirming, is your new address "${text}"? Please say yes or no.`;
        }
      } else if (sessionState.step === 3) {
        if (input.includes("yes") || input.includes("हाँ") || input.includes("ஆம்") || input.includes("correct") || input.includes("हाँ")) {
          const res = toolExecutors.updateAddress({
            accountIdOrPhone: sessionState.accountId,
            newAddress: sessionState.newAddress
          });
          if (res.success) {
            if (lang === "hi") {
              responseText = "आपका पता सफलतापूर्वक अपडेट कर दिया गया है। क्या मैं और कोई मदद कर सकती हूँ?";
            } else if (lang === "ta") {
              responseText = "உங்கள் முகவரி வெற்றிகரமாக மாற்றப்பட்டது. வேறு ஏதேனும் உதவி தேவையா?";
            } else {
              responseText = "Your address has been updated successfully. Is there anything else I can help you with?";
            }
          } else {
            responseText = res.message;
          }
          sessionState.activeIntent = null;
          sessionState.step = null;
        } else {
          if (lang === "hi") {
            responseText = "ठीक है, कृपया अपना नया पता दोबारा बताइए।";
          } else if (lang === "ta") {
            responseText = "சரி, தயவுசெய்து உங்கள் புதிய முகவரியை மீண்டும் கூறவும்.";
          } else {
            responseText = "Okay, let's try again. Please state your correct new address.";
          }
          sessionState.step = 2;
        }
      }
      break;
    }
    case "AppointmentBooking": {
      if (sessionState.step === 1) {
        // Look for property name
        let prop = "";
        if (input.includes("tirumangalam") || input.includes("திருமங்கலம்")) {
          prop = "Tirumangalam Residence";
        } else if (input.includes("adyar") || input.includes("அடையாறு")) {
          prop = "Adyar Heights";
        } else if (input.includes("choolaimedu") || input.includes("சூளைமேடு")) {
          prop = "Choolaimedu Villa";
        }
        if (prop) {
          sessionState.propertyName = prop;
          sessionState.step = 2;
          if (lang === "hi") {
            responseText = `ठीक है, ${prop} के लिए। आप किस तारीख और समय पर आना चाहेंगे?`;
          } else if (lang === "ta") {
            responseText = `சரி, ${prop}. நீங்கள் எந்த தேதி மற்றும் நேரத்தில் வர விரும்புகிறீர்கள்?`;
          } else {
            responseText = `Got it, ${prop}. What date and time work best for you?`;
          }
        } else {
          if (lang === "hi") {
            responseText = "आप किस प्रॉपर्टी में रुचि रखते हैं? हमारे पास Tirumangalam Residence, Adyar Heights, और Choolaimedu Villa उपलब्ध हैं।";
          } else if (lang === "ta") {
            responseText = "எந்த வசிப்பிடத்தை பார்க்க விரும்புகிறீர்கள்? எங்களிடம் Tirumangalam Residence, Adyar Heights, மற்றும் Choolaimedu Villa உள்ளன.";
          } else {
            responseText = "Which property are you interested in? We have Tirumangalam Residence, Adyar Heights, or Choolaimedu Villa.";
          }
        }
      } else if (sessionState.step === 2) {
        // Simple mock extractor: extract date like Saturday, or YYYY-MM-DD or tomorrow
        sessionState.dateTimeText = text;
        sessionState.step = 3;
        const prop = sessionState.propertyName;
        if (lang === "hi") {
          responseText = `क्या आप पुष्टि करते हैं कि आप ${prop} के लिए ${text} पर विज़िट बुक करना चाहते हैं?`;
        } else if (lang === "ta") {
          responseText = `${prop}-க்கான சந்திப்பை ${text} அன்று முன்பதிவு செய்ய விரும்புகிறீர்களா?`;
        } else {
          responseText = `Confirming your visit to ${prop} on ${text}. Is that correct?`;
        }
      } else if (sessionState.step === 3) {
        if (input.includes("yes") || input.includes("हाँ") || input.includes("ஆம்") || input.includes("correct") || input.includes("confirm")) {
          // Parse date / time
          const prop = sessionState.propertyName;
          const dtText = sessionState.dateTimeText;
          // default backup values for CRM database
          const finalDate = "2026-07-18";
          const finalTime = "15:00";
          const res = toolExecutors.scheduleAppointment({
            propertyName: prop,
            date: finalDate,
            time: finalTime,
            customerName: "Voice Customer"
          });
          
          if (res.success) {
            if (lang === "hi") {
              responseText = `आपकी विज़िट ${prop} के लिए शनिवार, 18 जुलाई को दोपहर 3 बजे पुख्ता कर दी गई है। आपको ईमेल पर पुष्टि मिल जाएगी। क्या कोई और सेवा चाहिए?`;
            } else if (lang === "ta") {
              responseText = `${prop}-க்கான உங்கள் சந்திப்பு சனிக்கிழமை, ஜூலை 18 மதியம் 3 மணிக்கு உறுதி செய்யப்பட்டுள்ளது. வேறு ஏதேனும் உதவி வேண்டுமா?`;
            } else {
              responseText = `Great! Your visit to ${prop} has been scheduled for Saturday, July 18 at 3:00 PM. A confirmation email is on its way. Anything else?`;
            }
          } else {
            responseText = res.message;
          }
          sessionState.activeIntent = null;
          sessionState.step = null;
        } else {
          if (lang === "hi") {
            responseText = "कोई बात नहीं। कृपया प्रॉपर्टी विज़िट के लिए नई तारीख और समय बताइए।";
          } else if (lang === "ta") {
            responseText = "பரவாயில்லை. புதிய தேதி மற்றும் நேரத்தைக் கூறவும்.";
          } else {
            responseText = "No problem. Let's adjust. What date and time would you prefer?";
          }
          sessionState.step = 2;
        }
      }
      break;
    }
    case "TechnicalSupport": {
      if (sessionState.step === 1) {
        sessionState.step = 2;
        if (lang === "hi") {
          responseText = "मुझे आपके इंटरनेट न चलने का खेद है। चलिए इसे ठीक करते हैं। क्या आपके राउटर की इंटरनेट लाइट जल रही है?";
        } else if (lang === "ta") {
          responseText = "உங்கள் இணைய இணைப்பு வேலை செய்யாததற்கு வருந்துகிறேன். முதலில், உங்கள் ரௌட்டரில் இண்டர்நெட் லைட் எரிகிறதா?";
        } else {
          responseText = "I'm sorry to hear your internet is not working. Let's troubleshoot. First, is your router's internet light blinking or on?";
        }
      } else if (sessionState.step === 2) {
        if (input.includes("no") || input.includes("नहीं") || input.includes("இல்லை") || input.includes("off")) {
          sessionState.step = 3;
          if (lang === "hi") {
            responseText = "ठीक है। कृपया राउटर के पावर केबल को प्लग से निकालें, 10 सेकंड रुकें और फिर वापस लगाएं। हो जाने पर मुझे बताइए।";
          } else if (lang === "ta") {
            responseText = "சரி. ரௌட்டரின் பவர் ஒயரை பிளக்கிலிருந்து பிடுங்கி 10 விநாடிகள் கழித்து மீண்டும் சொருகவும். செய்துவிட்டு கூறவும்.";
          } else {
            responseText = "Got it. Please unplug the router's power cable for 10 seconds, and then plug it back in. Let me know when you've done that.";
          }
        } else {
          // Light is on but still not working
          sessionState.step = 4;
          if (lang === "hi") {
            responseText = "अगर लाइट ऑन है, तो कृपया अपने डिवाइस का वाईफाई बंद करके दोबारा चालू करें। क्या अब काम कर रहा है?";
          } else if (lang === "ta") {
            responseText = "லைட் எரிகிறது எனில், உங்கள் சாதனத்தின் வைஃபை இணைப்பை துண்டித்து மீண்டும் இணைக்கவும். இப்போது வேலை செய்கிறதா?";
          } else {
            responseText = "Since the light is on, try turning your device's WiFi off and back on. Does it work now?";
          }
        }
      } else if (sessionState.step === 3 || sessionState.step === 4) {
        if (input.includes("yes") || input.includes("हाँ") || input.includes("ஆம்") || input.includes("on") || input.includes("working")) {
          if (lang === "hi") {
            responseText = "बहुत बढ़िया! इंटरनेट चलने लगा है। क्या मैं आपकी कुछ और मदद करूँ?";
          } else if (lang === "ta") {
            responseText = "மிக்க மகிழ்ச்சி! இணையம் வேலை செய்கிறது. வேறு ஏதேனும் உதவி வேண்டுமா?";
          } else {
            responseText = "Fantastic! Glad to hear the connection is restored. Is there anything else I can help you with today?";
          }
          sessionState.activeIntent = null;
          sessionState.step = null;
        } else {
          // Failed recovery, escalate
          sessionState.activeIntent = "Escalation";
          sessionState.isEscalated = true;
          if (lang === "hi") {
            responseText = "मुझे खेद है कि यह काम नहीं कर रहा। मैं आपको हमारे टेक्निकल एक्सपर्ट टीम से कनेक्ट करती हूँ, कृपया होल्ड करें।";
          } else if (lang === "ta") {
            responseText = "வருந்துகிறேன். இன்னும் சரிவரவில்லை என்பதால், எங்கள் தொழில்நுட்ப குழுவினருக்கு உங்களை மாற்றுகிறேன், காத்திருக்கவும்.";
          } else {
            responseText = "I'm sorry that didn't resolve the issue. Let me transfer you to our technical support team for further diagnostics. Please hold.";
          }
          action = "transfer";
        }
      }
      break;
    }
    case "FAQ_Hours":
      if (lang === "hi") {
        responseText = "चेन्नई में हमारा ऑफिस सोमवार से शनिवार, सुबह 9 बजे से शाम 6 बजे तक खुला रहता है। रविवार को छुट्टी रहती है। क्या कुछ और जानना है?";
      } else if (lang === "ta") {
        responseText = "சென்னையிலுள்ள எங்கள் அலுவலகம் திங்கள் முதல் சனிக்கிழமை வரை, காலை 9 மணி முதல் மாலை 6 மணி வரை இயங்கும். ஞாயிறு விடுமுறை. வேறு ஏதேனும் கேட்க வேண்டுமா?";
      } else {
        responseText = "Our Chennai office is open Monday through Saturday from 9:00 AM to 6:00 PM. We are closed on Sundays. Is there anything else I can help you with?";
      }
      sessionState.activeIntent = null;
      break;
    case "FAQ_Location":
      if (lang === "hi") {
        responseText = "हमारा मुख्य कार्यालय चट्टरपुर और चेन्नई में स्थित है। चेन्नई ऑफिस अन्ना नगर में है। क्या मैं और कोई मदद करूँ?";
      } else if (lang === "ta") {
        responseText = "எங்கள் தலைமை அலுவலகம் சென்னை அண்ணா நகரில் உள்ளது. வேறு ஏதேனும் உதவி வேண்டுமா?";
      } else {
        responseText = "Our primary office is located in Anna Nagar, Chennai. Can I assist you with anything else?";
      }
      sessionState.activeIntent = null;
      break;
    default:
      // Generic fallback
      sessionState.failedAttempts = (sessionState.failedAttempts || 0) + 1;
      if (sessionState.failedAttempts >= 2) {
        sessionState.activeIntent = "Escalation";
        sessionState.isEscalated = true;
        responseText = "I seem to be having trouble understanding your request. Let me transfer you to a live support agent right away.";
        action = "transfer";
      } else {
        if (lang === "hi") {
          responseText = "मुझे माफ़ करें, मैं समझ नहीं पाई। क्या आप कृपया इसे आसान शब्दों में दोहरा सकते हैं?";
        } else if (lang === "ta") {
          responseText = "மன்னிக்கவும், எனக்கு புரியவில்லை. தயவுசெய்து எளிய முறையில் மீண்டும் கூற முடியுமா?";
        } else {
          responseText = "I'm sorry, I didn't quite catch that. Could you please rephrase or repeat your request?";
        }
      }
  }
  sessionState.history.push({ role: "assistant", text: responseText });
  return {
    text: responseText,
    action: action || (sessionState.isEscalated ? "transfer" : null),
    intent: sessionState.activeIntent || "Fallback"
  };
}
// ----------------------------------------------------
// LLM Conversational Engine using OpenAI API
// ----------------------------------------------------
async function runLLM(sessionState, text) {
  if (!openai) {
    return runMockNLU(sessionState, text);
  }
  // Format history for ChatCompletion
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(sessionState.conversationHistory || [])
  ];
  messages.push({ role: 'user', content: text });
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // robust model for tool calls
      messages: messages,
      tools: tools,
      tool_choice: "auto",
      temperature: 0.7
    });
    const choice = response.choices[0].message;
    
    // Save user's text to history
    sessionState.conversationHistory = sessionState.conversationHistory || [];
    sessionState.conversationHistory.push({ role: 'user', content: text });
    if (choice.tool_calls && choice.tool_calls.length > 0) {
      // Execute tool calls
      let toolOutputs = [];
      let isTransfer = false;
      let transferReason = "";
      for (const toolCall of choice.tool_calls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        console.log(`[LLM Tool Execution] Function: ${name}, Args:`, args);
        
        const executor = toolExecutors[name];
        if (executor) {
          const result = executor(args);
          toolOutputs.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: name,
            content: JSON.stringify(result)
          });
          
          if (name === 'escalateToHuman' || (result && result.action === 'transfer')) {
            isTransfer = true;
            transferReason = args.reason || result.reason || "Escalation triggered";
          }
        }
      }
      // Feed outputs back to OpenAI to get final reply
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          ...messages,
          choice,
          ...toolOutputs
        ]
      });
      const finalChoice = finalResponse.choices[0].message;
      sessionState.conversationHistory.push({ role: 'assistant', content: finalChoice.content });
      return {
        text: finalChoice.content,
        action: isTransfer ? "transfer" : null,
        intent: choice.tool_calls[0].function.name,
        toolCalls: choice.tool_calls.map(tc => ({ name: tc.function.name, args: JSON.parse(tc.function.arguments) }))
      };
    } else {
      sessionState.conversationHistory.push({ role: 'assistant', content: choice.content });
      
      // Basic check if reply indicates transfer
      const lower = choice.content.toLowerCase();
      const isTransfer = lower.includes("transfer") || lower.includes("hold while I connect");
      
      return {
        text: choice.content,
        action: isTransfer ? "transfer" : null,
        intent: "GeneralChat"
      };
    }
  } catch (err) {
    console.error("OpenAI call failed, falling back to Mock NLU:", err);
    return runMockNLU(sessionState, text);
  }
}
// Main Orchestrator Interface
export async function handleUtterance(sessionState, text) {
  if (openaiKey && openai) {
    return await runLLM(sessionState, text);
  } else {
    return runMockNLU(sessionState, text);
  }
}
