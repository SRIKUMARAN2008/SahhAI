import React, { useEffect, useState } from 'react';
import { PhoneCall, ShieldAlert, CheckCircle, Clock, Calendar, Star, AlertCircle, RefreshCw } from 'lucide-react';
export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        if (data.length > 0 && !selectedLog) {
          setSelectedLog(data[0]); // Auto-select first item
        }
      }
    } catch (err) {
      console.error("Error loading call histories:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLogs();
  }, []);
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', flexWrap: 'wrap' }}>
      
      {/* Call Logs Table */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '620px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.125rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={20} style={{ color: 'var(--accent-primary)' }} /> Session History
          </h3>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={fetchLogs}>
            <RefreshCw size={12} /> Sync
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No call sessions found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: selectedLog?.id === log.id ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${selectedLog?.id === log.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'white' }}>{log.callerNumber}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDate(log.timestamp)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '8px', color: 'var(--color-text-secondary)' }}>
                      <span>{log.language}</span>
                      <span>•</span>
                      <span>{formatDuration(log.durationSeconds)}</span>
                    </div>
                    <span className={`badge ${log.containmentStatus === 'Resolved' ? 'badge-success' : 'badge-danger'}`}>
                      {log.containmentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Transcript Detail Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '620px' }}>
        {selectedLog ? (
          <>
            {/* Header Details */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.25rem', color: 'white' }}>Call Detail Review</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`badge ${selectedLog.containmentStatus === 'Resolved' ? 'badge-success' : 'badge-danger'}`}>
                    {selectedLog.containmentStatus === 'Resolved' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {selectedLog.containmentStatus}
                  </span>
                  <span className="badge badge-info">{selectedLog.intent}</span>
                </div>
              </div>
              {/* Stats Bar */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.813rem', color: 'var(--color-text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {formatDate(selectedLog.timestamp)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> Duration: {formatDuration(selectedLog.durationSeconds)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={14} style={{ color: 'var(--warning-color)' }} /> Rating: {selectedLog.csat || 5} / 5
                </span>
              </div>
            </div>
            {/* Scrollable Conversation Bubble Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedLog.transcript && selectedLog.transcript.length > 0 ? (
                selectedLog.transcript.map((msg, index) => (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender === 'User' ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', padding: '0 4px', fontWeight: 500 }}>
                      {msg.sender === 'User' ? 'Customer' : 'Nisha (Voice Agent)'}
                    </span>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      maxWidth: '75%',
                      fontSize: '0.875rem',
                      lineHeight: 1.45,
                      backgroundColor: msg.sender === 'User' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                      color: 'white',
                      border: msg.sender === 'User' ? 'none' : '1px solid var(--border-color)',
                      borderTopRightRadius: msg.sender === 'User' ? '2px' : '12px',
                      borderTopLeftRadius: msg.sender === 'User' ? '12px' : '2px'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No transcript recording available.
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', gap: '8px' }}>
            <AlertCircle size={32} />
            <p style={{ fontSize: '0.875rem' }}>Select a call record from the left history registry to review details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
