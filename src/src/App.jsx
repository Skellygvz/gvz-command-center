import { useState, useEffect, useMemo } from "react";

const PROJECT_TYPES = [
  { id: "photo", label: "Photography", icon: "📷", color: "#E8C547" },
  { id: "design", label: "Design", icon: "✏️", color: "#7EC8E3" },
  { id: "coverage", label: "On-Location Coverage", icon: "🎬", color: "#F4845F" },
  { id: "event", label: "Event", icon: "🎯", color: "#A8DADC" },
  { id: "directing", label: "Creative Directing", icon: "🎭", color: "#C77DFF" },
  { id: "strategy", label: "Creative Strategy", icon: "🧠", color: "#52B788" },
];

const STATUS_OPTIONS = ["Inquiry", "Quoted", "Booked", "In Progress", "Delivered", "Paid", "Archived"];

const INITIAL_PROJECTS = [
  { id: 1, client: "Vogue Collective", type: "photo", status: "Paid", amount: 1200, date: "2026-02-10", retainer: false, notes: "Brand shoot, 3hr", tags: ["brand","fashion"] },
  { id: 2, client: "Nova Events", type: "event", status: "Paid", amount: 800, date: "2026-02-18", retainer: false, notes: "Corporate gala coverage", tags: ["corporate"] },
  { id: 3, client: "Axiom Studio", type: "strategy", status: "Booked", amount: 1500, date: "2026-03-01", retainer: true, notes: "Monthly retainer - Q1", tags: ["retainer","strategy"] },
  { id: 4, client: "Lumen Films", type: "directing", status: "In Progress", amount: 2200, date: "2026-03-04", retainer: false, notes: "Short film CD", tags: ["film"] },
  { id: 5, client: "Arch & Co", type: "design", status: "Quoted", amount: 650, date: "2026-03-05", retainer: false, notes: "Brand identity refresh", tags: ["branding"] },
];

const SETTINGS_DEFAULT = {
  businessName: "GVZ",
  survivalTarget: 3000,
  growthTarget: 6000,
  taxRate: 25,
  ownerPayPct: 50,
  opsPct: 15,
  savingsPct: 10,
  currency: "$",
};

function fmt(n, currency = "$") {
  return `${currency}${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pct(a, b) {
  if (!b) return 0;
  return Math.min(100, Math.round((a / b) * 100));
}

function RingProgress({ value, size = 80, stroke = 8, color = "#E8C547", label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "inherit" }}>{value}%</div>
        {label && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 1 }}>{label}</div>}
      </div>
    </div>
  );
}

function Bar({ value, color = "#E8C547", height = 6 }) {
  return (
    <div style={{ width: "100%", height, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, value)}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.7s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>{label}</span>
  );
}

export default function GVZCommandCenter() {
  const [tab, setTab] = useState("dashboard");
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [settings, setSettings] = useState(SETTINGS_DEFAULT);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [newProject, setNewProject] = useState({ client: "", type: "photo", status: "Inquiry", amount: "", date: new Date().toISOString().split("T")[0], retainer: false, notes: "", tags: "" });

  // Derived data
  const paidProjects = useMemo(() => projects.filter(p => p.status === "Paid"), [projects]);
  const mtdProjects = useMemo(() => paidProjects.filter(p => p.date.startsWith(selectedMonth)), [paidProjects, selectedMonth]);
  const mtdRevenue = useMemo(() => mtdProjects.reduce((s, p) => s + Number(p.amount), 0), [mtdProjects]);
  const totalRevenue = useMemo(() => paidProjects.reduce((s, p) => s + Number(p.amount), 0), [paidProjects]);
  const activeRetainers = useMemo(() => projects.filter(p => p.retainer && ["Booked","In Progress","Paid"].includes(p.status)), [projects]);
  const retainerMTD = useMemo(() => mtdProjects.filter(p => p.retainer).reduce((s, p) => s + Number(p.amount), 0), [mtdProjects]);
  const pipeline = useMemo(() => projects.filter(p => ["Inquiry","Quoted","Booked","In Progress"].includes(p.status)).reduce((s, p) => s + Number(p.amount), 0), [projects]);
  const taxes = useMemo(() => mtdRevenue * (settings.taxRate / 100), [mtdRevenue, settings.taxRate]);
  const ownerPay = useMemo(() => mtdRevenue * (settings.ownerPayPct / 100), [mtdRevenue, settings.ownerPayPct]);
  const ops = useMemo(() => mtdRevenue * (settings.opsPct / 100), [mtdRevenue, settings.opsPct]);
  const savings = useMemo(() => mtdRevenue * (settings.savingsPct / 100), [mtdRevenue, settings.savingsPct]);
  const survivalPct = useMemo(() => pct(mtdRevenue, settings.survivalTarget), [mtdRevenue, settings.survivalTarget]);
  const growthPct = useMemo(() => pct(mtdRevenue, settings.growthTarget), [mtdRevenue, settings.growthTarget]);

  // Type breakdown
  const typeBreakdown = useMemo(() => PROJECT_TYPES.map(t => {
    const ps = paidProjects.filter(p => p.type === t.id);
    return { ...t, count: ps.length, revenue: ps.reduce((s, p) => s + Number(p.amount), 0) };
  }), [paidProjects]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const rev = paidProjects.filter(p => p.date.startsWith(key)).reduce((s, p) => s + Number(p.amount), 0);
      months.push({ key, label: d.toLocaleString("default", { month: "short" }), revenue: rev });
    }
    return months;
  }, [paidProjects]);

  const maxMonthRev = useMemo(() => Math.max(...monthlyTrend.map(m => m.revenue), 1), [monthlyTrend]);

  // Suggestions
  const suggestions = useMemo(() => {
    const s = [];
    if (survivalPct < 50) s.push({ icon: "⚡", text: `Only ${survivalPct}% to survival target — push 1-2 quick projects this week.`, color: "#F4845F" });
    if (activeRetainers.length === 0) s.push({ icon: "🔁", text: "Zero active retainers. Convert 1 current client to monthly → instant baseline income.", color: "#C77DFF" });
    if (activeRetainers.length > 0 && retainerMTD / mtdRevenue < 0.3) s.push({ icon: "📈", text: `Retainer income is ${Math.round(retainerMTD/mtdRevenue*100)||0}% of MTD revenue. Aim for 40%+ for stability.`, color: "#A8DADC" });
    const topType = [...typeBreakdown].sort((a,b) => b.revenue - a.revenue)[0];
    if (topType) s.push({ icon: "🎯", text: `Your highest-earning category is ${topType.label} (${fmt(topType.revenue)}). Double down with premium packages.`, color: "#E8C547" });
    if (pipeline > mtdRevenue * 0.5) s.push({ icon: "💰", text: `${fmt(pipeline)} in pipeline. Follow up on quoted projects — close rate is your multiplier.`, color: "#52B788" });
    if (projects.filter(p => p.type === "strategy").length < 2) s.push({ icon: "🧠", text: "Creative Strategy work is high-margin. Position 1-2 strategy packages to level up avg project value.", color: "#7EC8E3" });
    if (mtdRevenue >= settings.growthTarget) s.push({ icon: "🚀", text: `Growth target HIT this month! Consider raising rates 10-15% on next proposals.`, color: "#52B788" });
    return s.slice(0, 4);
  }, [survivalPct, activeRetainers, retainerMTD, mtdRevenue, typeBreakdown, pipeline, projects, settings]);

  // Filtered projects
  const filteredProjects = useMemo(() => projects.filter(p => {
    if (filterType !== "all" && p.type !== filterType) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (searchQ && !p.client.toLowerCase().includes(searchQ.toLowerCase()) && !p.notes.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  }), [projects, filterType, filterStatus, searchQ]);

  function addProject() {
    if (!newProject.client || !newProject.amount) return;
    const tags = newProject.tags ? newProject.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    setProjects(prev => [...prev, { ...newProject, id: Date.now(), amount: Number(newProject.amount), tags }]);
    setNewProject({ client: "", type: "photo", status: "Inquiry", amount: "", date: new Date().toISOString().split("T")[0], retainer: false, notes: "", tags: "" });
    setShowAddProject(false);
  }

  function updateProjectStatus(id, status) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  }

  function deleteProject(id) {
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  const C = {
    bg: "#0A0A0F",
    surface: "#12121A",
    card: "#1A1A26",
    border: "rgba(255,255,255,0.07)",
    text: "#F0EFE9",
    muted: "rgba(240,239,233,0.45)",
    accent: "#E8C547",
    accentDim: "rgba(232,197,71,0.15)",
  };

  const cardStyle = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "20px 24px",
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle = { fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", fontSize: 14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        select option { background: #1A1A26; }
        input[type=checkbox] { accent-color: #E8C547; width: 16px; height: 16px; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, background: C.bg + "EE", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, fontFamily: "Syne, sans-serif", fontWeight: 800, color: "#000" }}>G</span>
          </div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>{settings.businessName} Command Center</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["dashboard","projects","growth","settings"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500, background: tab === t ? C.accentDim : "transparent", color: tab === t ? C.accent : C.muted, transition: "all 0.2s", letterSpacing: 0.3 }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Month selector + headline */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Dashboard</h1>
                <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Know your numbers. Control your growth.</p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                  style={{ ...inputStyle, width: "auto", padding: "8px 14px", fontSize: 13 }} />
                <button onClick={() => { setTab("projects"); setShowAddProject(true); }} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.3 }}>
                  + Log Project
                </button>
              </div>
            </div>

            {/* Top KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {[
                { label: "MTD Revenue", value: fmt(mtdRevenue), sub: `${mtdProjects.length} paid projects`, color: C.accent },
                { label: "Pipeline", value: fmt(pipeline), sub: `${projects.filter(p=>["Inquiry","Quoted","Booked","In Progress"].includes(p.status)).length} active`, color: "#7EC8E3" },
                { label: "Taxes Reserved", value: fmt(taxes), sub: `${settings.taxRate}% of MTD`, color: "#F4845F" },
                { label: "Owner Pay", value: fmt(ownerPay), sub: `${settings.ownerPayPct}% of MTD`, color: "#52B788" },
                { label: "Ops Alloc.", value: fmt(ops), sub: `${settings.opsPct}% of MTD`, color: "#A8DADC" },
                { label: "Savings", value: fmt(savings), sub: `${settings.savingsPct}% of MTD`, color: "#C77DFF" },
              ].map(k => (
                <div key={k.label} style={{ ...cardStyle, padding: "18px 20px" }}>
                  <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "Syne, sans-serif", color: k.color, lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Targets */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20 }}>
                <RingProgress value={survivalPct} color="#E8C547" label="SURVIVAL" />
                <div>
                  <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Survival Target</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Syne, sans-serif" }}>{fmt(mtdRevenue)} <span style={{ fontSize: 14, color: C.muted }}>/ {fmt(settings.survivalTarget)}</span></div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{fmt(Math.max(0, settings.survivalTarget - mtdRevenue))} remaining</div>
                </div>
              </div>
              <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20 }}>
                <RingProgress value={growthPct} color="#52B788" label="GROWTH" />
                <div>
                  <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Growth Target</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Syne, sans-serif" }}>{fmt(mtdRevenue)} <span style={{ fontSize: 14, color: C.muted }}>/ {fmt(settings.growthTarget)}</span></div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{fmt(Math.max(0, settings.growthTarget - mtdRevenue))} remaining</div>
                </div>
              </div>
            </div>

            {/* Retainer Stability + Type Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Retainer Stability</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: C.muted }}>Active Retainers</span>
                  <span style={{ fontWeight: 700, color: C.accent }}>{activeRetainers.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: C.muted }}>Retainer MTD</span>
                  <span style={{ fontWeight: 700 }}>{fmt(retainerMTD)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ color: C.muted }}>% of Revenue</span>
                  <span style={{ fontWeight: 700, color: retainerMTD/mtdRevenue > 0.3 ? "#52B788" : "#F4845F" }}>{mtdRevenue ? Math.round(retainerMTD/mtdRevenue*100) : 0}%</span>
                </div>
                <Bar value={mtdRevenue ? retainerMTD/mtdRevenue*100 : 0} color="#C77DFF" height={8} />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Target: 40%+ for stability</div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Revenue by Work Type</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {typeBreakdown.filter(t => t.count > 0).sort((a,b) => b.revenue - a.revenue).map(t => (
                    <div key={t.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12 }}>{t.icon} {t.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(t.revenue)} <span style={{ color: C.muted }}>({t.count})</span></span>
                      </div>
                      <Bar value={totalRevenue ? t.revenue/totalRevenue*100 : 0} color={t.color} height={5} />
                    </div>
                  ))}
                  {typeBreakdown.every(t => t.count === 0) && <div style={{ color: C.muted, fontSize: 13 }}>No paid projects yet.</div>}
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.muted }}>Smart Suggestions</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {suggestions.map((s, i) => (
                  <div key={i} style={{ background: s.color + "11", border: `1px solid ${s.color}33`, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20, lineHeight: 1.2 }}>{s.icon}</span>
                    <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Projects */}
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>Recent Projects</span>
                <button onClick={() => setTab("projects")} style={{ background: "transparent", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>View all →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...projects].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5).map(p => {
                  const type = PROJECT_TYPES.find(t => t.id === p.type);
                  const statusColor = { Paid: "#52B788", Booked: "#E8C547", "In Progress": "#7EC8E3", Quoted: "#C77DFF", Inquiry: "#A8DADC", Delivered: "#F4845F", Archived: "#666" }[p.status] || "#666";
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                      <span style={{ fontSize: 18 }}>{type?.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.client}</div>
                        <div style={{ color: C.muted, fontSize: 12 }}>{type?.label} · {p.date}</div>
                      </div>
                      <Badge label={p.status} color={statusColor} />
                      <div style={{ fontWeight: 700, fontSize: 15, color: p.status === "Paid" ? C.accent : C.text, minWidth: 70, textAlign: "right" }}>{fmt(p.amount)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {tab === "projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800 }}>Projects</h1>
              <button onClick={() => setShowAddProject(!showAddProject)} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {showAddProject ? "✕ Cancel" : "+ Log Project"}
              </button>
            </div>

            {/* Add Project Form */}
            {showAddProject && (
              <div style={{ ...cardStyle, border: `1px solid ${C.accent}44` }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: C.accent }}>NEW PROJECT</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                  <div><label style={labelStyle}>Client Name *</label><input style={inputStyle} value={newProject.client} onChange={e => setNewProject(p=>({...p,client:e.target.value}))} placeholder="Client or company" /></div>
                  <div><label style={labelStyle}>Work Type *</label>
                    <select style={inputStyle} value={newProject.type} onChange={e => setNewProject(p=>({...p,type:e.target.value}))}>
                      {PROJECT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Status</label>
                    <select style={inputStyle} value={newProject.status} onChange={e => setNewProject(p=>({...p,status:e.target.value}))}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Amount ($) *</label><input style={inputStyle} type="number" value={newProject.amount} onChange={e => setNewProject(p=>({...p,amount:e.target.value}))} placeholder="0" /></div>
                  <div><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={newProject.date} onChange={e => setNewProject(p=>({...p,date:e.target.value}))} /></div>
                  <div><label style={labelStyle}>Tags (comma separated)</label><input style={inputStyle} value={newProject.tags} onChange={e => setNewProject(p=>({...p,tags:e.target.value}))} placeholder="brand, fashion, retainer" /></div>
                  <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Notes</label><input style={inputStyle} value={newProject.notes} onChange={e => setNewProject(p=>({...p,notes:e.target.value}))} placeholder="Brief description..." /></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
                    <input type="checkbox" id="retainer" checked={newProject.retainer} onChange={e => setNewProject(p=>({...p,retainer:e.target.checked}))} />
                    <label htmlFor="retainer" style={{ fontSize: 13, cursor: "pointer" }}>Retainer Project</label>
                  </div>
                </div>
                <button onClick={addProject} style={{ marginTop: 16, background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                  Save Project
                </button>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input style={{ ...inputStyle, width: 200 }} placeholder="🔍 Search..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
              <select style={{ ...inputStyle, width: "auto" }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                {PROJECT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
              <select style={{ ...inputStyle, width: "auto" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
              <span style={{ color: C.muted, fontSize: 13 }}>{filteredProjects.length} projects</span>
            </div>

            {/* Projects List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredProjects.sort((a,b) => b.date.localeCompare(a.date)).map(p => {
                const type = PROJECT_TYPES.find(t => t.id === p.type);
                const statusColor = { Paid: "#52B788", Booked: "#E8C547", "In Progress": "#7EC8E3", Quoted: "#C77DFF", Inquiry: "#A8DADC", Delivered: "#F4845F", Archived: "#666" }[p.status] || "#666";
                return (
                  <div key={p.id} style={{ ...cardStyle, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ width: 40, height: 40, background: type?.color + "22", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{type?.icon}</div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.client} {p.retainer && <span style={{ fontSize: 10, background: "#C77DFF22", color: "#C77DFF", border: "1px solid #C77DFF44", borderRadius: 5, padding: "1px 6px", marginLeft: 6 }}>RETAINER</span>}</div>
                      <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{type?.label} · {p.date} {p.notes && `· ${p.notes}`}</div>
                      {p.tags?.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>{p.tags.map(tag => <span key={tag} style={{ fontSize: 10, background: "rgba(255,255,255,0.07)", borderRadius: 5, padding: "2px 7px", color: C.muted }}>{tag}</span>)}</div>}
                    </div>
                    <select value={p.status} onChange={e => updateProjectStatus(p.id, e.target.value)} style={{ ...inputStyle, width: "auto", fontSize: 12, padding: "6px 10px", color: statusColor, background: statusColor + "15", border: `1px solid ${statusColor}44` }}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <div style={{ fontWeight: 700, fontSize: 18, color: p.status === "Paid" ? C.accent : C.text, minWidth: 80, textAlign: "right" }}>{fmt(p.amount)}</div>
                    <button onClick={() => deleteProject(p.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 16, padding: "4px 8px" }} title="Delete">×</button>
                  </div>
                );
              })}
              {filteredProjects.length === 0 && <div style={{ ...cardStyle, textAlign: "center", color: C.muted, padding: 40 }}>No projects found. Log your first one!</div>}
            </div>
          </div>
        )}

        {/* GROWTH TAB */}
        {tab === "growth" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800 }}>Growth & Scaling</h1>

            {/* Monthly Revenue Chart */}
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>6-Month Revenue Trend</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
                {monthlyTrend.map(m => (
                  <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 11, color: C.muted }}>{m.revenue > 0 ? fmt(m.revenue) : ""}</div>
                    <div style={{ width: "100%", background: m.key === selectedMonth ? C.accent : "rgba(232,197,71,0.25)", borderRadius: "6px 6px 0 0", height: `${m.revenue ? Math.max(8, m.revenue/maxMonthRev*80) : 4}px`, transition: "height 0.6s ease", cursor: "pointer" }} onClick={() => setSelectedMonth(m.key)} />
                    <div style={{ fontSize: 12, color: m.key === selectedMonth ? C.accent : C.muted, fontWeight: m.key === selectedMonth ? 700 : 400 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Count by Type */}
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>Project Count by Type (All Time)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
                {typeBreakdown.map(t => (
                  <div key={t.id} style={{ background: t.color + "11", border: `1px solid ${t.color}33`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: 28 }}>{t.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "Syne, sans-serif", color: t.color, marginTop: 8 }}>{t.count}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{t.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{fmt(t.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scaling Milestones */}
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>Scaling Milestones</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "First $1K Month", target: 1000, icon: "🌱", desc: "Proof of concept" },
                  { label: "Survival Baseline", target: settings.survivalTarget, icon: "🏠", desc: "Cover all essentials" },
                  { label: "First $5K Month", target: 5000, icon: "💪", desc: "Real momentum" },
                  { label: "Growth Target", target: settings.growthTarget, icon: "📈", desc: "Scaling mode" },
                  { label: "First $10K Month", target: 10000, icon: "🚀", desc: "Premium positioning" },
                  { label: "Six-Figure Run Rate", target: 100000/12, icon: "💎", desc: "$100K/yr annualized" },
                ].map(m => {
                  const achieved = totalRevenue >= m.target || mtdRevenue >= m.target;
                  const prog = Math.min(100, Math.round(totalRevenue / m.target * 100));
                  return (
                    <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ fontSize: 22, width: 36, textAlign: "center", opacity: achieved ? 1 : 0.5 }}>{achieved ? "✅" : m.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: achieved ? C.accent : C.text }}>{m.label}</span>
                          <span style={{ color: C.muted, fontSize: 12 }}>{m.desc} · {fmt(m.target)}</span>
                        </div>
                        <Bar value={prog} color={achieved ? "#52B788" : C.accent} height={6} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: achieved ? "#52B788" : C.muted, minWidth: 44, textAlign: "right" }}>{prog}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Avg Project Value */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16 }}>
              {[
                { label: "Avg Project Value", value: fmt(paidProjects.length ? totalRevenue/paidProjects.length : 0), icon: "📊" },
                { label: "Total Projects", value: projects.length, icon: "📁" },
                { label: "Paid Projects", value: paidProjects.length, icon: "✅" },
                { label: "Lifetime Revenue", value: fmt(totalRevenue), icon: "💰" },
              ].map(s => (
                <div key={s.label} style={{ ...cardStyle, textAlign: "center", padding: 24 }}>
                  <div style={{ fontSize: 30, marginBottom: 10 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Syne, sans-serif", color: C.accent }}>{s.value}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 6, letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800 }}>Settings</h1>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>Business Config</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 20 }}>
                {[
                  { key: "businessName", label: "Business Name", type: "text" },
                  { key: "survivalTarget", label: "Survival Target ($/mo)", type: "number" },
                  { key: "growthTarget", label: "Growth Target ($/mo)", type: "number" },
                  { key: "taxRate", label: "Tax Reserve (%)", type: "number" },
                  { key: "ownerPayPct", label: "Owner Pay (%)", type: "number" },
                  { key: "opsPct", label: "Ops (%)", type: "number" },
                  { key: "savingsPct", label: "Savings (%)", type: "number" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type={f.type} style={inputStyle} value={settings[f.key]} onChange={e => setSettings(s=>({...s,[f.key]: f.type==="number" ? Number(e.target.value) : e.target.value}))} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(232,197,71,0.08)", borderRadius: 10, border: `1px solid ${C.accent}33` }}>
                <div style={{ fontSize: 13, color: C.muted }}>Allocation check: Tax {settings.taxRate}% + Owner Pay {settings.ownerPayPct}% + Ops {settings.opsPct}% + Savings {settings.savingsPct}% = <span style={{ color: settings.taxRate+settings.ownerPayPct+settings.opsPct+settings.savingsPct <= 100 ? "#52B788" : "#F4845F", fontWeight: 700 }}>{settings.taxRate+settings.ownerPayPct+settings.opsPct+settings.savingsPct}%</span> {settings.taxRate+settings.ownerPayPct+settings.opsPct+settings.savingsPct <= 100 ? "✓" : "⚠ Over 100%"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
