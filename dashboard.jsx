import React, { useEffect, useState } from 'react';
import { Phone, Users, ShieldAlert, Clock, Star, ArrowUpRight, TrendingUp } from 'lucide-react';
export default function Dashboard() {
  const [stats, setStats] = useState({
    containmentRate: 78,
    aht: 104,
    csat: 4.6,
    totalCalls: 4
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchStatsAndLogs = async () => {
    try {
      const statsRes = await fetch('/api/stats');
      const logsRes = await fetch('/api/logs');
      if (statsRes.ok && logsRes.ok) {
        const statsData = await statsRes.json();
        const logsData = await logsRes.json();
        setStats(statsData);
        setRecentLogs(logsData.slice(0, 4));
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchStatsAndLogs();
    // Poll stats every 10 seconds to keep live dashboard feeling alive
    const interval = setInterval(fetchStatsAndLogs, 10000);
    return () => clearInterval(interval);
  }, []);
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  // Group logs by intent for mock visualization
  const intentsCount = recentLogs.reduce((acc, log) => {
    acc[log.intent] = (acc[log.intent] || 0) + 1;
    return acc;
  }, { OrderStatus: 2, BillingInquiry: 1, AccountUpdate: 1, Escalation: 1, TechnicalSupport: 0 });
  const totalIntentCalls = Object.values(intentsCount).reduce((a, b) => a + b, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'white' }}>Service Health Dashboard</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Real-time analytics for NXG Homes Voice Assistant (Nisha)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-success" style={{ padding: '6px 12px' }}>
            <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--success-color)', borderRadius: '50%', display: 'inline-block' }}></span>
            Telephony Link: Online
          </span>
        </div>
      </div>
      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Containment */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', color: 'var(--accent-primary)' }}>
            <Phone size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Containment Rate
            </p>
            <h3 style={{ fontSize: '1.875rem', color: 'white', marginTop: '4px' }}>
              {stats.containmentRate}%
            </h3>
            <span style={{ fontSize: '0.75rem', color: stats.containmentRate >= 70 ? 'var(--success-color)' : 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
              <TrendingUp size={12} /> Target: ≥ 70%
            </span>
          </div>
        </div>
        {/* Card 2: AHT */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', color: 'var(--accent-secondary)' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg Handle Time
            </p>
            <h3 style={{ fontSize: '1.875rem', color: 'white', marginTop: '4px' }}>
              {formatDuration(stats.aht)}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
              Goal: &lt; 2m 00s
            </span>
          </div>
        </div>
        {/* Card 3: CSAT */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', color: 'var(--warning-color)' }}>
            <Star size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CSAT Score
            </p>
            <h3 style={{ fontSize: '1.875rem', color: 'white', marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              {stats.csat} <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>/ 5.0</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
              ★★★★★ Excellent
            </span>
          </div>
        </div>
        {/* Card 4: Total Calls */}
        <div className="glass-panel glass-card-interactive" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: 'var(--info-color)' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Interactions
            </p>
            <h3 style={{ fontSize: '1.875rem', color: 'white', marginTop: '4px' }}>
              {stats.totalCalls}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
              24/7 Autopilot
            </span>
          </div>
        </div>
      </div>
      {/* Main Charts & Activity Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Intent Distribution Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', color: 'white', marginBottom: '16px' }}>Intent Volume Distribution</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            {Object.entries(intentsCount).map(([intent, count]) => {
              const percentage = totalIntentCalls > 0 ? Math.round((count / totalIntentCalls) * 100) : 0;
              return (
                <div key={intent} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-primary)' }}>{intent}</span>
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {count} calls ({percentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.max(percentage, 3)}%`, 
                      height: '100%', 
                      background: 'var(--accent-gradient)', 
                      borderRadius: '4px',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* SLA and Performance Status */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.125rem', color: 'white' }}>SLA Compliance Targets</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* SLA item 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>First Response Latency</span>
                <span style={{ color: 'var(--success-color)', fontWeight: 500 }}>98.2%</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>&lt; 1.5s voice response time</p>
            </div>
            {/* SLA item 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Transfer SLA Target</span>
                <span style={{ color: 'var(--success-color)', fontWeight: 500 }}>100%</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Context transferred to agent</p>
            </div>
            {/* SLA item 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>System Availability</span>
                <span style={{ color: 'var(--success-color)', fontWeight: 500 }}>99.99%</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Voice gateway & NLU uptime</p>
            </div>
            {/* SLA item 4 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>FCR (First Call Resolution)</span>
                <span style={{ color: 'var(--warning-color)', fontWeight: 500 }}>64.0%</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Issues resolved in first call</p>
            </div>
          </div>
        </div>
      </div>
      {/* Recent Activity Logs */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.125rem', color: 'white', marginBottom: '16px' }}>Recent Interactions</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Caller</th>
                <th>Language</th>
                <th>Duration</th>
                <th>Detected Intent</th>
                <th>Containment Status</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading logs...</td>
                </tr>
              ) : recentLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No call logs found. Start a call to log data!</td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 500 }}>{log.callerNumber}</td>
                    <td>{log.language}</td>
                    <td>{formatDuration(log.durationSeconds)}</td>
                    <td>
                      <span className="badge badge-info">{log.intent}</span>
                    </td>
                    <td>
                      <span className={`badge ${log.containmentStatus === 'Resolved' ? 'badge-success' : 'badge-danger'}`}>
                        {log.containmentStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--warning-color)', fontWeight: 600 }}>{log.csat || '-'} ★</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
