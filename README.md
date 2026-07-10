# NXG Homes - Voice Customer Care Bot Platform
This repository contains the complete, production-ready source code for the **NXG Homes Voice AI Customer Care Bot**. The platform is split into a compliant **Node.js Custom LLM backend** and a premium **React-based analytics and simulator dashboard**.
---
## Architecture Overview
```text
voice_customer_care_bot/
├── README.md                      # Setup and usage guide
├── package.json                   # Root workspace controls
├── backend/                       # Express & WebSocket Server (PORT 5000)
│   ├── server.js                  # Gateway, binds Express & ws protocols
│   ├── database.js                # CRM registry & call logs datastore (db.json)
│   ├── orchestrator.js            # Dual-Mode agent orchestrator (Offline NLU or OpenAI tool-calling)
│   ├── retellSocket.js            # Retell custom LLM WebSocket protocol implementation
│   └── routes.js                  # Dashboard endpoints & REST chat simulator interface
└── frontend/                      # React SPA Dashboard (PORT 3000)
    ├── src/
    │   ├── App.jsx                # Layout & active module routers
    │   ├── index.css              # Custom styling design tokens & keyframe animations
    │   └── components/
    │       ├── Dashboard.jsx      # Performance widgets & analytics gauges
    │       ├── CallSimulator.jsx  # Simulated phone utilizing browser Web Speech API
    │       ├── CrmManager.jsx     # Read/Write view of Orders, Accounts & Appointments
    │       ├── CallLogs.jsx       # Log viewer for transcripts & containment flags
    │       └── ConfigEditor.jsx   # Prompt editor and temperature toggles
    └── vite.config.js             # Hot Reload configuration with backend REST/WS proxies
```
---
## Dual-Mode Operation
To ensure immediate usability, the bot runs in two modes:
1. **Offline Simulator Mode (Default)**:
   - Requires no API keys.
   - Uses a structured regex/NLU matching engine to extract entities and fulfill customer intents (checking order status, updating address, scheduling Tirumangalam property visits, initiating refunds, technical support troubleshooting, and handling manager escalations).
   - Simulates speech-to-speech interaction in the browser using the HTML5 **Web Speech API** (`SpeechRecognition` for listening and `SpeechSynthesis` for speaking).
2. **Enterprise LLM Mode**:
   - Activated by adding `OPENAI_API_KEY` to `backend/.env`.
   - Uses OpenAI's GPT-4 function-calling models to drive conversational flow, dynamically query database schemas, validate 6-digit formatting constraints, and handle multilingual conversations in English, Hindi, and Tamil.
---
## Setup & Running Guide
### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)
### 2. Installation
From the root directory, run the install command to install dependencies for both components:
```bash
npm run install:all
```
### 3. Configuration (Optional)
To activate LLM mode, copy the environment template in the backend directory and supply your key:
```bash
cd backend
cp .env.example .env
# Edit .env and set: OPENAI_API_KEY=your_key_here
```
### 4. Running the Application in Development Mode
Launch both the backend API server and Vite frontend compiler concurrently from the root directory:
```bash
npm run dev
```
Once started:
- **Frontend Dashboard**: View at [http://localhost:3000](http://localhost:3000)
- **Backend API**: Check health at [http://localhost:5000/health](http://localhost:5000/health)
---
## Telephony Integration (Retell AI)
The backend exposes a WebSocket listener fully compliant with the **Retell AI Custom LLM API** at:
`ws://localhost:5000/llm-websocket`
### Retell AI Dashboard Setup:
1. Expose your local backend port `5000` via a tunnel tool like `ngrok` or `localtunnel`:
   ```bash
   ngrok http 5000
   ```
2. Copy your public WebSocket URL:
   `ws://<your-ngrok-subdomain>.ngrok-free.app/llm-websocket`
3. Go to the **Retell AI Developer Console**, create a new LLM, select **Custom LLM**, and paste your WebSocket URL.
4. Bind this LLM setup to a phone number. 
5. Place a call to test natural streaming responses, slot validations, tool executions, and direct live transfers!
