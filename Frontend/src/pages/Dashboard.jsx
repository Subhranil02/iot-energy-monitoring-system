import { useEffect, useState } from "react";
import API from "../services/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats]         = useState(null);
  const [devices, setDevices]     = useState([]);
  const [metrics, setMetrics]     = useState(null);
  const [history, setHistory]     = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [backendError, setBackendError] = useState(false);

  const fetchAll = () => {
    Promise.all([
      API.get("/stats"),
      API.get("/devices"),
      API.get("/metrics"),
      API.get("/sensor-data?limit=30"),
      API.get("/alerts?limit=50"),
    ])
      .then(([s, d, m, h, a]) => {
        setStats(s.data);
        setDevices(d.data);
        setMetrics(m.data);
        setAlerts(a.data);
        // Build chart — reverse so oldest first
        setHistory([...h.data].reverse().map((r, i) => ({
          name: `#${i + 1}`,
          power: r.power,
          voltage: r.voltage,
          current: r.current,
          device: r.device_id,
        })));
        setBackendError(false);
        setLoading(false);
      })
      .catch(() => { setBackendError(true); setLoading(false); });
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { const id = setInterval(fetchAll, 5000); return () => clearInterval(id); }, []);

  const tabs = ["overview", "devices", "metrics", "alerts"];

  if (loading) return (
    <div style={s.centered}>
      <div style={s.spinner} />
      <p style={{ color: "#888", marginTop: 12 }}>Connecting to backend...</p>
    </div>
  );

  return (
    <div style={s.container}>

      {/* ── Top bar ── */}
      <div style={s.topbar}>
        <div style={s.topbarLeft}>
          <div style={s.logoBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <div style={s.logoText}>IoT Energy Analytics</div>
            <div style={s.liveBadge}>● Live · refreshes every 5s</div>
          </div>
        </div>
        <div style={s.tabRow}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ ...s.tabBtn, ...(activeTab === tab ? s.tabBtnActive : {}) }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "alerts" && alerts.length > 0 && (
                <span style={s.alertBubble}>{alerts.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error banner ── */}
      {backendError && (
        <div style={s.errorBanner}>
          ⚠ Cannot reach backend on port 8000.
          <button onClick={fetchAll} style={s.retrySmall}>Retry</button>
        </div>
      )}

      {/* ── Metric cards ── */}
      <div style={s.metricsGrid}>
        <MetricCard label="Total devices"    value={stats?.total_devices}  sub={`${stats?.total_readings ?? 0} readings stored`} color="#185FA5" />
        <MetricCard label="Total power (W)"  value={stats?.total_power_w}  sub="cumulative"         color="#854F0B" />
        <MetricCard label="Avg voltage (V)"  value={stats?.avg_voltage_v}  sub="across all devices" color="#3B6D11" />
        <MetricCard label="Active alerts"    value={stats?.alerts_total ?? 0}
          sub={`${stats?.alerts_critical ?? 0} critical`} color={stats?.alerts_critical > 0 ? "#A32D2D" : "#3B6D11"} />
      </div>

      {/* ══ OVERVIEW ══ */}
      {activeTab === "overview" && (
        <div style={s.grid2}>

          {/* Left — device status */}
          <div style={s.card}>
            <div style={s.cardTitle}>Device status</div>
            {devices.length === 0 ? (
              <p style={s.empty}>No devices yet — POST to /sensor-data to add one.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {devices.map(d => {
                  const status = d.latest_power_w > 80 ? "critical" : d.latest_power_w > 50 ? "warning" : "normal";
                  const dot    = status === "critical" ? "#E24B4A" : status === "warning" ? "#BA7517" : "#639922";
                  const bg     = status === "critical" ? "#FCEBEB" : status === "warning" ? "#FAEEDA" : "#EAF3DE";
                  const color  = status === "critical" ? "#A32D2D" : status === "warning" ? "#854F0B" : "#3B6D11";
                  const label  = status === "critical" ? "High load" : status === "warning" ? "Moderate" : "Normal";
                  return (
                    <div key={d.device_id} style={s.deviceRow}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{d.device_id}</div>
                          <div style={{ fontSize: 11, color: "#aaa" }}>{d.latest_voltage_v}V · {d.latest_current_a}A</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, color: "#555", marginBottom: 2 }}>{d.latest_power_w} W</div>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: bg, color }}>{label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right — chart + anomaly detection (real data) */}
          <div style={s.card}>
            <div style={s.cardTitle}>Power & voltage over time</div>
            {history.length === 0 ? (
              <p style={s.empty}>No readings yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ec" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#aaa" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#aaa" }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="power"   stroke="#E24B4A" strokeWidth={2} dot={false} name="Power (W)" />
                  <Line type="monotone" dataKey="voltage" stroke="#378ADD" strokeWidth={2} dot={false} name="Voltage (V)" />
                </LineChart>
              </ResponsiveContainer>
            )}

            {/* Anomaly detection — real counts from backend */}
            <div style={{ marginTop: 14 }}>
              <div style={s.cardTitle}>Anomaly detection</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {[
                  { label: "Power spikes",    value: stats?.high_power_count   ?? 0, color: "#A32D2D", bg: "#FCEBEB", border: "#E24B4A" },
                  { label: "Voltage drops",   value: stats?.voltage_drop_count ?? 0, color: "#854F0B", bg: "#FAEEDA", border: "#BA7517" },
                  { label: "Current alerts",  value: stats?.high_current_count ?? 0, color: "#A32D2D", bg: "#FCEBEB", border: "#E24B4A" },
                  { label: "Total resolved",  value: stats?.alerts_total       ?? 0, color: "#3B6D11", bg: "#EAF3DE", border: "#639922" },
                ].map(item => (
                  <div key={item.label} style={{ padding: "7px 10px", borderRadius: 8,
                    background: item.bg, borderLeft: `3px solid ${item.border}` }}>
                    <div style={{ fontSize: 18, fontWeight: 500, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: item.color }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DEVICES ══ */}
      {activeTab === "devices" && (
        <div style={s.card}>
          <div style={s.cardTitle}>All devices — latest reading</div>
          {devices.length === 0 ? (
            <p style={s.empty}>No devices found. Send a POST to /sensor-data first.</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>{["Device ID", "Power (W)", "Voltage (V)", "Current (A)", "Status"].map(h =>
                  <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {devices.map(d => {
                  const status = d.latest_power_w > 80 ? "High load" : d.latest_power_w > 50 ? "Moderate" : "Normal";
                  const color  = d.latest_power_w > 80 ? "#A32D2D"  : d.latest_power_w > 50 ? "#854F0B"  : "#3B6D11";
                  const bg     = d.latest_power_w > 80 ? "#FCEBEB"  : d.latest_power_w > 50 ? "#FAEEDA"  : "#EAF3DE";
                  return (
                    <tr key={d.device_id}>
                      <td style={{ ...s.td, fontWeight: 500 }}>{d.device_id}</td>
                      <td style={s.td}>{d.latest_power_w}</td>
                      <td style={s.td}>{d.latest_voltage_v}</td>
                      <td style={s.td}>{d.latest_current_a}</td>
                      <td style={s.td}>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: bg, color }}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══ METRICS ══ */}
      {activeTab === "metrics" && (
        <div style={s.card}>
          <div style={s.cardTitle}>Per-device analytics</div>
          {!metrics?.per_device?.length ? (
            <p style={s.empty}>No data yet.</p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {metrics.per_device.map(d => {
                  const pct = Math.round((d.total_power_w / metrics.per_device[0].total_power_w) * 100);
                  return (
                    <div key={d.device_id}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ fontWeight: 500 }}>{d.device_id}</span>
                        <span style={{ color: "#888" }}>{d.avg_power_w}W avg · {d.reading_count} readings</span>
                      </div>
                      <div style={s.barBg}><div style={{ ...s.barFill, width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <table style={s.table}>
                <thead>
                  <tr>{["Device", "Readings", "Avg W", "Max W", "Min W", "Avg V", "Avg A"].map(h =>
                    <th key={h} style={s.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {metrics.per_device.map(d => (
                    <tr key={d.device_id}>
                      <td style={{ ...s.td, fontWeight: 500 }}>{d.device_id}</td>
                      <td style={s.td}>{d.reading_count}</td>
                      <td style={s.td}>{d.avg_power_w}</td>
                      <td style={{ ...s.td, color: "#A32D2D" }}>{d.max_power_w}</td>
                      <td style={{ ...s.td, color: "#3B6D11" }}>{d.min_power_w}</td>
                      <td style={s.td}>{d.avg_voltage_v}</td>
                      <td style={s.td}>{d.avg_current_a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* ══ ALERTS ══ */}
      {activeTab === "alerts" && (
        <div style={s.card}>
          <div style={s.cardTitle}>All alerts ({alerts.length})</div>
          {alerts.length === 0 ? (
            <p style={s.empty}>No alerts yet — alerts are auto-generated when readings exceed thresholds.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {alerts.map(alert => {
                const isCritical = alert.severity === "critical";
                const isWarning  = alert.severity === "warning";
                const border = isCritical ? "#E24B4A" : isWarning ? "#BA7517" : "#378ADD";
                const bg     = isCritical ? "#FCEBEB" : isWarning ? "#FAEEDA" : "#E6F1FB";
                const color  = isCritical ? "#A32D2D" : isWarning ? "#854F0B" : "#185FA5";
                const icon   = isCritical ? "⚠" : isWarning ? "⚡" : "ℹ";
                return (
                  <div key={alert.id} style={{ display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 12px", borderRadius: 8, background: bg, borderLeft: `3px solid ${border}` }}>
                    <span style={{ color, fontSize: 15 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color }}>{alert.title}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{alert.description}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>{timeAgo(alert.timestamp)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={s.metricCard}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 500, color }}>{value ?? "—"}</div>
      <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

const s = {
  container:    { fontFamily: "system-ui,-apple-system,sans-serif", maxWidth: 980, margin: "0 auto", padding: "1.25rem 1rem", background: "#f7f7f5", minHeight: "100vh" },
  centered:     { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" },
  spinner:      { width: 28, height: 28, border: "3px solid #e0e0da", borderTop: "3px solid #378ADD", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  topbar:       { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" },
  topbarLeft:   { display: "flex", alignItems: "center", gap: 10 },
  logoBox:      { width: 34, height: 34, borderRadius: 8, background: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center" },
  logoText:     { fontSize: 15, fontWeight: 500, color: "#1a1a1a" },
  liveBadge:    { fontSize: 11, color: "#3B6D11" },
  tabRow:       { display: "flex", gap: 6, alignItems: "center" },
  tabBtn:       { fontSize: 13, padding: "5px 12px", borderRadius: 7, border: "0.5px solid #d0d0cc", background: "white", color: "#666", cursor: "pointer", position: "relative" },
  tabBtnActive: { borderColor: "#378ADD", background: "#E6F1FB", color: "#185FA5", fontWeight: 500 },
  alertBubble:  { marginLeft: 5, background: "#E24B4A", color: "white", fontSize: 10, padding: "1px 5px", borderRadius: 10 },
  errorBanner:  { display: "flex", alignItems: "center", gap: 10, background: "#FCEBEB", border: "0.5px solid #E24B4A", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#A32D2D", marginBottom: 12 },
  retrySmall:   { marginLeft: "auto", padding: "3px 10px", borderRadius: 6, border: "none", background: "#E24B4A", color: "white", cursor: "pointer", fontSize: 12 },
  metricsGrid:  { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: "1rem" },
  metricCard:   { background: "white", border: "0.5px solid #e0e0da", borderRadius: 10, padding: "12px 14px" },
  grid2:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  card:         { background: "white", border: "0.5px solid #e0e0da", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: 12 },
  cardTitle:    { fontSize: 12, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 },
  deviceRow:    { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", border: "0.5px solid #e8e8e4", borderRadius: 8 },
  empty:        { color: "#aaa", fontSize: 13 },
  barBg:        { height: 6, borderRadius: 3, background: "#f0f0ec", overflow: "hidden" },
  barFill:      { height: "100%", borderRadius: 3, background: "#378ADD", transition: "width 0.4s ease" },
  table:        { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:           { textAlign: "left", padding: "6px 10px", fontWeight: 500, color: "#888", fontSize: 12, borderBottom: "0.5px solid #e8e8e4" },
  td:           { padding: "10px 10px", color: "#333", borderBottom: "0.5px solid #f0f0ec" },
};
