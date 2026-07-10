import React, { useState } from 'react';
import { LayoutDashboard, PhoneCall, Database, History, Settings, Bot, Cpu } from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import CallSimulator from './components/CallSimulator.jsx';
import CrmManager from './components/CrmManager.jsx';
import CallLogs from './components/CallLogs.jsx';
import ConfigEditor from './components/ConfigEditor.jsx';
import './App.css';
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'simulator', 'crm', 'logs', 'config'
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Premium Top Navigation Bar */}
      <header style={{
        background: 'rgba(11, 15, 25, 0.65)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        sticky: 'top',
        top: 0,
        zIndex: 100,
        padding: '0 24px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            color: 'white',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            <Bot size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'white', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              NXG Homes <span style={{ fontSize: '0.688rem', fontWeight: 500, color: 'var(--accent-primary)', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.2)' }}>Voice AI</span>
            </h1>
          </div>
        </div>
        {/* Tab Links */}
        <nav style={{ display: 'flex', gap: '6px', height: '100%', alignItems: 'center' }}>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`nav-tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('simulator')}
            className={`nav-tab-button ${activeTab === 'simulator' ? 'active' : ''}`}
          >
            <PhoneCall size={16} /> Live Simulator
          </button>
          <button 
            onClick={() => setActiveTab('crm')}
            className={`nav-tab-button ${activeTab === 'crm' ? 'active' : ''}`}
          >
            <Database size={16} /> CRM Registry
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`nav-tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          >
            <History size={16} /> Call History
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`nav-tab-button ${activeTab === 'config' ? 'active' : ''}`}
          >
            <Settings size={16} /> Config Editor
          </button>
        </nav>
        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: 'var(--color-text-secondary)' }}>
          <Cpu size={16} style={{ color: 'var(--success-color)' }} />
          <span>Local Engine Active</span>
        </div>
      </header>
      {/* Main Tab Render Container */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'simulator' && <CallSimulator />}
        {activeTab === 'crm' && <CrmManager />}
        {activeTab === 'logs' && <CallLogs />}
        {activeTab === 'config' && <ConfigEditor />}
      </main>
      {/* Footer */}
      <footer style={{
        padding: '20px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--color-text-muted)',
        marginTop: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>NXG Homes customer care platform © 2026</span>
        <span>Built with React + Node.js (Retell Custom LLM Protocol Compliant)</span>
      </footer>
    </div>
  );
}
