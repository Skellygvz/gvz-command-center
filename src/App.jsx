import { useState, useEffect, useMemo } from "react";

const SUPABASE_URL = "https://hkvqxpbhvkuketrglyoc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrdnF4cGJodmt1a2V0cmdseW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTA2NDEsImV4cCI6MjA4ODMyNjY0MX0.aPnxDeYVB4Nk-l-HyJyT3yUfqpmsdZMXi-CrmMJakgM";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function dbSelect(table) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc`, { headers });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}
async function dbInsert(table, data) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers, body: JSON.stringify(data) });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}
async function dbUpdate(table, id, data) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers, body: JSON.stringify(data) });
    return r.ok;
  } catch { return false; }
}
async function dbDelete(table, id) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers });
    return r.ok;
  } catch { return false; }
}
async function dbUpsert(table, data) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(data),
    });
    return r.ok;
  } catch { return false; }
}

const PROJECT_TYPES = [
  { id: "photo", label: "Photography", icon: "📷", color: "#E8C547" },
  { id: "design", label: "Design", icon: "✏️", color: "#7EC8E3" },
  { id: "coverage", label: "On-Location Coverage", icon: "🎬", color: "#F4845F" },
  { id: "event", label: "Event", icon: "🎯", color: "#A8DADC" },
  { id: "directing", label: "Creative Directing", icon: "🎭", color: "#C77DFF" },
  { id: "strategy", label: "Creative Strategy", icon: "🧠", color: "#52B788" },
{ id: "video", label: "Video Editing", icon: "🎞️", color: "#FF6B6B" },
const EXPENSE_CATEGORIES = ["Equipment", "Software", "Travel", "Marketing", "Subcontractors", "Office", "Education", "Other"];
const STATUS_OPTIONS = ["Inquiry", "Quoted", "Booked", "In Progress", "Delivered", "Paid", "Archived"];

const SETTINGS_DEFAULT = {
  businessName: "GVZ",
  survivalTarget: 3000,
  growthTarget: 6000,
  taxRate: 25,
  ownerPayPct: 50,
  opsPct: 15,
  savingsPct: 10,
};

const EMPTY_PROJECT = {
  client: "", type: "photo", status: "Inquiry",
  amount: "", date: new Date().toISOString().split("T")[0],
  retainer: false, notes: "", tags: "",
  contact_name: "", contact_email: "", contact_phone: "",
};

const EMPTY_EXPENSE = {
  description: "", category: "Equipment", amount: "",
  date: new Date().toISOString().split("T")[0], notes: "",
};

function fmt(n) { return `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }
function pct(a, b) { return !b ? 0 : Math.min(100, Math.round((a / b) * 100)); }

const STATUS_COLORS = {
  Paid: "#52B788", Booked: "#E8C547", "In Progress": "#7EC8E3",
  Quoted: "#C77DFF", Inquiry: "#A8DADC", Delivered: "#F4845F", Archived: "#555"
};

const C = {
  bg: "#080810", card: "#13131E", border: "rgba(255,255,255,0.08)",
  text: "#F0EFE9", muted: "rgba(240,239,233,0.4)",
  accent: "#E8C547", accentDim: "rgba(232,197,71,0.12)",
};

function RingProgress({ value, size = 72, stroke = 7, color = "#E8C547", label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{value}%</div>
        {label && <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1 }}>{label}</div>}
      </div>
    </div>
  );
}

function Bar({ value, color = "#E8C547", height = 5 }) {
  return (
    <div style={{ width: "100%", height, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.7s ease" }} />
    </div>
  );
}

function Badge({ label, color }) {
  return <span style={{ background: color + "20", color, border: `1px solid ${color}40`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>{label}</span>;
}

function Toast({ msg, type }) {
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: type === "err" ? "#F4845F" : "#52B788", color: "#000", padding: "12px 24px", borderRadius: 99, fontWeight: 700, fontSize: 13, zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      {msg}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", padding: "24px 20px 40px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18 }}>{title}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: C.text, width: 32, height: 32, borderRadius: "50%", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
  borderRadius: 12, color: C.text, padding: "14px 16px", fontSize: 16,
  outline: "none", width: "100%", fontFamily: "inherit", boxSizing: "border-box",
  WebkitAppearance: "none",
};
const labelStyle = { fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" };
const cardStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 16px" };
const btnPrimary = { background: C.accent, color: "#000", border: "none", borderRadius: 14, padding: "16px 24px", fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "inherit", width: "100%", letterSpacing: 0.3 };
const btnSecondary = { background: "rgba(255,255,255,0.07)", color: C.text, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit", width: "100%" };

export default function App() {
  const [tab, setTab] = useState("dash");
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState(SETTINGS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(false);
  const [toast, setToast] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editExpense, setEditExpense] = useState(null);
  const [viewProject, setViewProject] = useState(null);
  const [newProject, setNewProject] = useState(EMPTY_PROJECT);
  const [newExpense, setNewExpense] = useState(EMPTY_EXPENSE);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;
  });

  function showToast(msg, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [pData, eData, sData] = await Promise.all([
        dbSelect("projects"), dbSelect("expenses"), dbSelect("settings")
      ]);
      if (Array.isArray(pData)) {
        const norm = pData.map(p => ({ ...p, tags: Array.isArray(p.tags) ? p.tags : [], amount: Number(p.amount) }));
        setProjects(norm);
        localStorage.setItem("gvz_p", JSON.stringify(norm));
        setOnline(true);
      } else {
        const c = localStorage.getItem("gvz_p");
        if (c) setProjects(JSON.parse(c));
      }
      if (Array.isArray(eData)) {
        const norm = eData.map(e => ({ ...e, amount: Number(e.amount) }));
        setExpenses(norm);
        localStorage.setItem("gvz_e", JSON.stringify(norm));
      } else {
        const c = localStorage.getItem("gvz_e");
        if (c) setExpenses(JSON.parse(c));
      }
      if (Array.isArray(sData) && sData.length > 0) {
        setSettings({ ...SETTINGS_DEFAULT, ...sData[0].data });
      } else {
        const c = localStorage.getItem("gvz_s");
        if (c) setSettings(JSON.parse(c));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveProject() {
    if (!newProject.client || !newProject.amount) return showToast("Client & amount required", "err");
    setSyncing(true);
    const tags = newProject.tags ? newProject.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    const record = { ...newProject, amount: Number(newProject.amount), tags };
    delete record.tags_str;
    const result = await dbInsert("projects", record);
    const saved = Array.isArray(result) && result[0]
      ? { ...result[0], tags: result[0].tags || [], amount: Number(result[0].amount) }
      : { ...record, id: `loc_${Date.now()}`, created_at: new Date().toISOString() };
    const updated = [saved, ...projects];
    setProjects(updated);
    localStorage.setItem("gvz_p", JSON.stringify(updated));
    setNewProject(EMPTY_PROJECT);
    setShowProjectForm(false);
    showToast("Project saved ✓");
    setSyncing(false);
  }

  async function updateProjectFn(id, changes) {
    const updated = projects.map(p => p.id === id ? { ...p, ...changes } : p);
    setProjects(updated);
    localStorage.setItem("gvz_p", JSON.stringify(updated));
    await dbUpdate("projects", id, changes);
  }

  async function saveEditProject() {
    if (!editProject.client || !editProject.amount) return showToast("Client & amount required", "err");
    setSyncing(true);
    const tags = Array.isArray(editProject.tags) ? editProject.tags : editProject.tags.split(",").map(t=>t.trim()).filter(Boolean);
    const changes = { ...editProject, tags, amount: Number(editProject.amount) };
    await updateProjectFn(editProject.id, changes);
    setEditProject(null);
    showToast("Updated ✓");
    setSyncing(false);
  }

  async function deleteProjectFn(id) {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem("gvz_p", JSON.stringify(updated));
    await dbDelete("projects", id);
    setViewProject(null);
    showToast("Deleted");
  }

  async function saveExpense() {
    if (!newExpense.description || !newExpense.amount) return showToast("Description & amount required", "err");
    setSyncing(true);
    const record = { ...newExpense, amount: Number(newExpense.amount) };
    const result = await dbInsert("expenses", record);
    const saved = Array.isArray(result) && result[0]
      ? { ...result[0], amount: Number(result[0].amount) }
      : { ...record, id: `loc_${Date.now()}`, created_at: new Date().toISOString() };
    const updated = [saved, ...expenses];
    setExpenses(updated);
    localStorage.setItem("gvz_e", JSON.stringify(updated));
    setNewExpense(EMPTY_EXPENSE);
    setShowExpenseForm(false);
    showToast("Expense saved ✓");
    setSyncing(false);
  }

  async function deleteExpenseFn(id) {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localStorage.setItem("gvz_e", JSON.stringify(updated));
    await dbDelete("expenses", id);
    showToast("Deleted");
  }

  async function saveSetting(key, val) {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    localStorage.setItem("gvz_s", JSON.stringify(updated));
    await dbUpsert("settings", { id: 1, data: updated });
  }

  function exportCSV() {
    const ph = ["Client","Type","Status","Amount","Date","Retainer","Contact","Email","Phone","Notes","Tags"];
    const pr = projects.map(p => [p.client,p.type,p.status,p.amount,p.date,p.retainer?"Yes":"No",p.contact_name||"",p.contact_email||"",p.contact_phone||"",p.notes||"",(p.tags||[]).join("|")]);
    const eh = ["Description","Category","Amount","Date","Notes"];
    const er = expenses.map(e => [e.description,e.category,e.amount,e.date,e.notes||""]);
    const csv = [...[ph,...pr].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")),"","EXPENSES",...[eh,...er].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `GVZ_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("CSV exported ✓");
  }

  // Derived
  const paid = useMemo(() => projects.filter(p => p.status === "Paid"), [projects]);
  const mtdPaid = useMemo(() => paid.filter(p => p.date?.startsWith(selectedMonth)), [paid, selectedMonth]);
  const mtdRev = useMemo(() => mtdPaid.reduce((s,p) => s+p.amount, 0), [mtdPaid]);
  const mtdExp = useMemo(() => expenses.filter(e => e.date?.startsWith(selectedMonth)).reduce((s,e) => s+e.amount, 0), [expenses, selectedMonth]);
  const mtdNet = mtdRev - mtdExp;
  const totalRev = useMemo(() => paid.reduce((s,p) => s+p.amount, 0), [paid]);
  const pipeline = useMemo(() => projects.filter(p => ["Inquiry","Quoted","Booked","In Progress"].includes(p.status)).reduce((s,p) => s+p.amount, 0), [projects]);
  const retainerMTD = useMemo(() => mtdPaid.filter(p => p.retainer).reduce((s,p) => s+p.amount, 0), [mtdPaid]);
  const activeRetainers = useMemo(() => projects.filter(p => p.retainer && ["Booked","In Progress","Paid"].includes(p.status)), [projects]);
  const taxes = mtdRev * (settings.taxRate/100);
  const ownerPay = mtdRev * (settings.ownerPayPct/100);
  const ops = mtdRev * (settings.opsPct/100);
  const savings = mtdRev * (settings.savingsPct/100);
  const survPct = pct(mtdRev, settings.survivalTarget);
  const growPct = pct(mtdRev, settings.growthTarget);

  const typeBreakdown = useMemo(() => PROJECT_TYPES.map(t => {
    const ps = paid.filter(p => p.type === t.id);
    return { ...t, count: ps.length, revenue: ps.reduce((s,p) => s+p.amount, 0) };
  }), [paid]);

  const suggestions = useMemo(() => {
    const s = [];
    if (survPct < 50) s.push({ icon: "⚡", text: `${survPct}% to survival target — push 1–2 quick projects this week.`, color: "#F4845F" });
    if (activeRetainers.length === 0) s.push({ icon: "🔁", text: "No active retainers. Convert 1 client to monthly for baseline income.", color: "#C77DFF" });
    if (mtdExp > mtdRev * 0.4) s.push({ icon: "⚠️", text: `Expenses are ${Math.round(mtdExp/mtdRev*100)||0}% of revenue this month. Review your spend.`, color: "#F4845F" });
    const top = [...typeBreakdown].sort((a,b)=>b.revenue-a.revenue)[0];
    if (top?.revenue > 0) s.push({ icon: "🎯", text: `Top earner: ${top.label} (${fmt(top.revenue)}). Build premium packages around it.`, color: "#E8C547" });
    if (pipeline > 0) s.push({ icon: "💰", text: `${fmt(pipeline)} in pipeline. Follow up on quotes to close.`, color: "#52B788" });
    if (mtdRev >= settings.growthTarget) s.push({ icon: "🚀", text: "Growth target HIT! Raise rates 10–15% on next proposals.", color: "#52B788" });
    return s.slice(0,3);
  }, [survPct, activeRetainers, mtdExp, mtdRev, typeBreakdown, pipeline, settings]);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"DM Sans,sans-serif" }}>
      <div style={{ width:56,height:56,background:C.accent,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:800,color:"#000",fontFamily:"Syne,sans-serif" }}>G</div>
      <div style={{ color:C.muted,fontSize:14 }}>Loading…</div>
    </div>
  );

  const TABS = [
    { id:"dash", icon:"⚡", label:"Dash" },
    { id:"projects", icon:"📁", label:"Projects" },
    { id:"expenses", icon:"💸", label:"Expenses" },
    { id:"growth", icon:"📈", label:"Growth" },
    { id:"settings", icon:"⚙️", label:"Settings" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Sans','Helvetica Neue',sans-serif", fontSize:15, paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px;}
        select option{background:#13131E;}
        input[type=checkbox]{accent-color:#E8C547;width:20px;height:20px;cursor:pointer;flex-shrink:0;}
        input[type=date]{color-scheme:dark;}
        input[type=month]{color-scheme:dark;}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div style={{ position:"sticky",top:0,zIndex:100,background:C.bg+"F0",backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.border}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:36,height:36,background:C.accent,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,color:"#000" }}>G</div>
          <div>
            <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16,lineHeight:1 }}>{settings.businessName}</div>
            <div style={{ fontSize:10,color:C.muted,letterSpacing:0.5 }}>Command Center</div>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          {syncing && <div style={{ fontSize:11,color:C.muted }}>saving…</div>}
          <div style={{ fontSize:10,padding:"3px 10px",borderRadius:99,background:online?"#52B78818":"#F4845F18",color:online?"#52B788":"#F4845F",border:`1px solid ${online?"#52B78840":"#F4845F40"}`,fontWeight:600 }}>
            {online?"● LIVE":"● OFFLINE"}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:600,margin:"0 auto",padding:"20px 16px" }}>

        {/* DASHBOARD */}
        {tab === "dash" && (
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div>
                <h1 style={{ fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:800 }}>Dashboard</h1>
                <p style={{ color:C.muted,fontSize:13,marginTop:2 }}>Know your numbers.</p>
              </div>
              <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{ ...inputStyle,width:"auto",padding:"10px 14px",fontSize:14 }} />
            </div>

            {/* MTD Revenue Hero */}
            <div style={{ ...cardStyle,background:"linear-gradient(135deg,#1A1A26,#1E1A2E)",border:`1px solid ${C.accent}30` }}>
              <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>MTD Revenue</div>
              <div style={{ fontFamily:"Syne,sans-serif",fontSize:42,fontWeight:800,color:C.accent,lineHeight:1 }}>{fmt(mtdRev)}</div>
              <div style={{ display:"flex",gap:16,marginTop:10 }}>
                <span style={{ fontSize:13,color:C.muted }}>{mtdPaid.length} paid projects</span>
                <span style={{ fontSize:13,color:"#F4845F" }}>− {fmt(mtdExp)} expenses</span>
                <span style={{ fontSize:13,color:"#52B788",fontWeight:700 }}>= {fmt(mtdNet)} net</span>
              </div>
              <div style={{ marginTop:14 }}>
                <Bar value={survPct} color={C.accent} height={6} />
                <div style={{ display:"flex",justifyContent:"space-between",marginTop:6 }}>
                  <span style={{ fontSize:11,color:C.muted }}>Survival: {survPct}%</span>
                  <span style={{ fontSize:11,color:C.muted }}>{fmt(settings.survivalTarget)}</span>
                </div>
              </div>
            </div>

            {/* Quick stats grid */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {[
                { label:"Pipeline",value:fmt(pipeline),color:"#7EC8E3",sub:`${projects.filter(p=>["Inquiry","Quoted","Booked","In Progress"].includes(p.status)).length} active` },
                { label:"Owner Pay",value:fmt(ownerPay),color:"#52B788",sub:`${settings.ownerPayPct}% of MTD` },
                { label:"Tax Reserved",value:fmt(taxes),color:"#F4845F",sub:`${settings.taxRate}% of MTD` },
                { label:"Savings",value:fmt(savings),color:"#C77DFF",sub:`${settings.savingsPct}% of MTD` },
              ].map(k=>(
                <div key={k.label} style={{ ...cardStyle,padding:"14px 16px" }}>
                  <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>{k.label}</div>
                  <div style={{ fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:k.color }}>{k.value}</div>
                  <div style={{ fontSize:12,color:C.muted,marginTop:4 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Targets */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {[
                { label:"Survival",target:settings.survivalTarget,prog:survPct,color:"#E8C547" },
                { label:"Growth",target:settings.growthTarget,prog:growPct,color:"#52B788" },
              ].map(t=>(
                <div key={t.label} style={{ ...cardStyle,display:"flex",alignItems:"center",gap:14 }}>
                  <RingProgress value={t.prog} color={t.color} label={t.label.toUpperCase()} />
                  <div>
                    <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:4 }}>{t.label} Target</div>
                    <div style={{ fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800 }}>{fmt(t.target)}</div>
                    <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{fmt(Math.max(0,t.target-mtdRev))} left</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggestions */}
            <div style={cardStyle}>
              <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:12 }}>💡 Smart Suggestions</div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {suggestions.map((s,i)=>(
                  <div key={i} style={{ background:s.color+"12",border:`1px solid ${s.color}30`,borderRadius:12,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start" }}>
                    <span style={{ fontSize:18,lineHeight:1.3,flexShrink:0 }}>{s.icon}</span>
                    <span style={{ fontSize:13,lineHeight:1.5 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent */}
            <div style={cardStyle}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                <span style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase" }}>Recent Projects</span>
                <button onClick={()=>setTab("projects")} style={{ background:"transparent",border:"none",color:C.accent,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>All →</button>
              </div>
              {[...projects].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,4).map(p=>{
                const t = PROJECT_TYPES.find(t=>t.id===p.type);
                return (
                  <div key={p.id} onClick={()=>setViewProject(p)} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer" }}>
                    <div style={{ width:38,height:38,background:(t?.color||"#888")+"20",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{t?.icon}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:600,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{p.client}</div>
                      <div style={{ color:C.muted,fontSize:12 }}>{t?.label} · {p.date}</div>
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                      <Badge label={p.status} color={STATUS_COLORS[p.status]||"#888"} />
                      <span style={{ fontWeight:700,fontSize:14,color:p.status==="Paid"?C.accent:C.text }}>{fmt(p.amount)}</span>
                    </div>
                  </div>
                );
              })}
              {projects.length===0 && <div style={{ color:C.muted,textAlign:"center",padding:24,fontSize:14 }}>No projects yet. Log your first one!</div>}
            </div>

            {/* Quick add buttons */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <button onClick={()=>{setShowProjectForm(true);setTab("projects");}} style={btnPrimary}>+ Log Project</button>
              <button onClick={()=>{setShowExpenseForm(true);setTab("expenses");}} style={{ ...btnSecondary }}>+ Add Expense</button>
            </div>
          </div>
        )}

        {/* PROJECTS */}
        {tab === "projects" && (
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <h1 style={{ fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:800 }}>Projects</h1>
              <button onClick={exportCSV} style={{ background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:10,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>↓ CSV</button>
            </div>

            <button onClick={()=>{setShowProjectForm(true);setEditProject(null);}} style={btnPrimary}>+ Log New Project</button>

            {[...projects].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(p=>{
              const t = PROJECT_TYPES.find(t=>t.id===p.type);
              return (
                <div key={p.id} onClick={()=>setViewProject(p)} style={{ ...cardStyle,display:"flex",alignItems:"center",gap:12,cursor:"pointer",activeBackground:"rgba(255,255,255,0.05)" }}>
                  <div style={{ width:44,height:44,background:(t?.color||"#888")+"20",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>{t?.icon}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700,fontSize:15 }}>{p.client}</span>
                      {p.retainer && <span style={{ fontSize:9,background:"#C77DFF20",color:"#C77DFF",border:"1px solid #C77DFF40",borderRadius:5,padding:"1px 6px",letterSpacing:1 }}>RETAINER</span>}
                    </div>
                    <div style={{ color:C.muted,fontSize:12,marginTop:2 }}>{t?.label} · {p.date}</div>
                    {p.contact_name && <div style={{ color:C.muted,fontSize:12 }}>👤 {p.contact_name}</div>}
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
                    <Badge label={p.status} color={STATUS_COLORS[p.status]||"#888"} />
                    <span style={{ fontWeight:700,fontSize:16,color:p.status==="Paid"?C.accent:C.text }}>{fmt(p.amount)}</span>
                  </div>
                </div>
              );
            })}
            {projects.length===0 && <div style={{ ...cardStyle,textAlign:"center",color:C.muted,padding:40 }}>No projects yet.</div>}
          </div>
        )}

        {/* EXPENSES */}
        {tab === "expenses" && (
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <h1 style={{ fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:800 }}>Expenses</h1>
              <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{ ...inputStyle,width:"auto",padding:"8px 12px",fontSize:13 }} />
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <div style={cardStyle}>
                <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>MTD Expenses</div>
                <div style={{ fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,color:"#F4845F" }}>{fmt(mtdExp)}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>MTD Net</div>
                <div style={{ fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,color:mtdNet>=0?"#52B788":"#F4845F" }}>{fmt(mtdNet)}</div>
              </div>
            </div>

            <button onClick={()=>setShowExpenseForm(true)} style={btnPrimary}>+ Add Expense</button>

            {/* Category breakdown */}
            {expenses.filter(e=>e.date?.startsWith(selectedMonth)).length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:14 }}>This Month by Category</div>
                {EXPENSE_CATEGORIES.map(cat=>{
                  const total = expenses.filter(e=>e.date?.startsWith(selectedMonth)&&e.category===cat).reduce((s,e)=>s+e.amount,0);
                  if(!total) return null;
                  return (
                    <div key={cat} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                        <span style={{ fontSize:13 }}>{cat}</span>
                        <span style={{ fontSize:13,fontWeight:600 }}>{fmt(total)}</span>
                      </div>
                      <Bar value={mtdExp?total/mtdExp*100:0} color="#F4845F" height={4} />
                    </div>
                  );
                })}
              </div>
            )}

            {[...expenses].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(e=>(
              <div key={e.id} style={{ ...cardStyle,display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:44,height:44,background:"#F4845F20",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>💸</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,fontSize:14 }}>{e.description}</div>
                  <div style={{ color:C.muted,fontSize:12,marginTop:2 }}>{e.category} · {e.date}</div>
                  {e.notes && <div style={{ color:C.muted,fontSize:12 }}>{e.notes}</div>}
                </div>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8 }}>
                  <span style={{ fontWeight:700,fontSize:16,color:"#F4845F" }}>{fmt(e.amount)}</span>
                  <button onClick={()=>deleteExpenseFn(e.id)} style={{ background:"transparent",border:"none",color:"rgba(255,255,255,0.2)",cursor:"pointer",fontSize:18,padding:"2px 6px" }}>×</button>
                </div>
              </div>
            ))}
            {expenses.length===0 && <div style={{ ...cardStyle,textAlign:"center",color:C.muted,padding:40 }}>No expenses yet.</div>}
          </div>
        )}

        {/* GROWTH */}
        {tab === "growth" && (
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <h1 style={{ fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:800 }}>Growth</h1>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              {[
                { label:"Lifetime Revenue",value:fmt(totalRev),icon:"💰" },
                { label:"Total Projects",value:projects.length,icon:"📁" },
                { label:"Paid Projects",value:paid.length,icon:"✅" },
                { label:"Avg Project",value:fmt(paid.length?totalRev/paid.length:0),icon:"📊" },
              ].map(s=>(
                <div key={s.label} style={{ ...cardStyle,textAlign:"center",padding:20 }}>
                  <div style={{ fontSize:26,marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontFamily:"Syne,sans-serif",fontSize:24,fontWeight:800,color:C.accent }}>{s.value}</div>
                  <div style={{ color:C.muted,fontSize:11,marginTop:4,letterSpacing:0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:16 }}>Revenue by Type</div>
              {typeBreakdown.filter(t=>t.count>0).sort((a,b)=>b.revenue-a.revenue).map(t=>(
                <div key={t.id} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                    <span style={{ fontSize:14 }}>{t.icon} {t.label}</span>
                    <span style={{ fontSize:14,fontWeight:700 }}>{fmt(t.revenue)} <span style={{ color:C.muted,fontWeight:400 }}>({t.count})</span></span>
                  </div>
                  <Bar value={totalRev?t.revenue/totalRev*100:0} color={t.color} height={6} />
                </div>
              ))}
              {typeBreakdown.every(t=>t.count===0) && <div style={{ color:C.muted,fontSize:13 }}>Log paid projects to see breakdown.</div>}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:16 }}>Scaling Milestones</div>
              {[
                { label:"First $1K Month",target:1000,icon:"🌱" },
                { label:"Survival Baseline",target:settings.survivalTarget,icon:"🏠" },
                { label:"First $5K Month",target:5000,icon:"💪" },
                { label:"Growth Target",target:settings.growthTarget,icon:"📈" },
                { label:"First $10K Month",target:10000,icon:"🚀" },
                { label:"Six-Figure Run Rate",target:Math.round(100000/12),icon:"💎" },
              ].map(m=>{
                const best = Math.max(mtdRev, ...([...Array(6)].map((_,i)=>{
                  const d = new Date(); d.setMonth(d.getMonth()-i);
                  const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
                  return paid.filter(p=>p.date?.startsWith(k)).reduce((s,p)=>s+p.amount,0);
                })));
                const done = best >= m.target;
                const p2 = Math.min(100, Math.round(best/m.target*100));
                return (
                  <div key={m.label} style={{ display:"flex",alignItems:"center",gap:14,marginBottom:14 }}>
                    <span style={{ fontSize:22,width:32,textAlign:"center",opacity:done?1:0.5 }}>{done?"✅":m.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                        <span style={{ fontWeight:600,fontSize:14,color:done?C.accent:C.text }}>{m.label}</span>
                        <span style={{ color:C.muted,fontSize:12 }}>{fmt(m.target)}</span>
                      </div>
                      <Bar value={p2} color={done?"#52B788":C.accent} height={5} />
                    </div>
                    <span style={{ fontSize:13,fontWeight:700,color:done?"#52B788":C.muted,minWidth:36,textAlign:"right" }}>{p2}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <h1 style={{ fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:800 }}>Settings</h1>

            <div style={cardStyle}>
              <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:16 }}>Business</div>
              {[
                { key:"businessName",label:"Business Name",type:"text" },
                { key:"survivalTarget",label:"Survival Target ($/mo)",type:"number" },
                { key:"growthTarget",label:"Growth Target ($/mo)",type:"number" },
              ].map(f=>(
                <div key={f.key} style={{ marginBottom:16 }}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type} style={inputStyle} value={settings[f.key]}
                    onChange={e => saveSetting(f.key, f.type==="number"?Number(e.target.value):e.target.value)} />
                </div>
              ))}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:16 }}>Revenue Allocation</div>
              {[
                { key:"taxRate",label:"Tax Reserve %" },
                { key:"ownerPayPct",label:"Owner Pay %" },
                { key:"opsPct",label:"Ops %" },
                { key:"savingsPct",label:"Savings %" },
              ].map(f=>(
                <div key={f.key} style={{ marginBottom:16 }}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type="number" style={inputStyle} value={settings[f.key]}
                    onChange={e => saveSetting(f.key, Number(e.target.value))} />
                </div>
              ))}
              <div style={{ padding:"12px 14px",background:C.accent+"10",borderRadius:10,border:`1px solid ${C.accent}25` }}>
                <span style={{ fontSize:13,color:C.muted }}>Total allocated: </span>
                <span style={{ fontWeight:700,color:(settings.taxRate+settings.ownerPayPct+settings.opsPct+settings.savingsPct)>100?"#F4845F":"#52B788" }}>
                  {settings.taxRate+settings.ownerPayPct+settings.opsPct+settings.savingsPct}%
                  {(settings.taxRate+settings.ownerPayPct+settings.opsPct+settings.savingsPct)>100?" ⚠ Over 100%":" ✓"}
                </span>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:12 }}>Data & Backup</div>
              <p style={{ color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:16 }}>Data saves to Supabase in real-time with localStorage as offline backup.</p>
              <button onClick={exportCSV} style={{ ...btnSecondary }}>↓ Export CSV Backup</button>
            </div>

            <div style={{ ...cardStyle,border:`1px solid ${online?"#52B78830":"#F4845F30"}` }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:10,height:10,borderRadius:"50%",background:online?"#52B788":"#F4845F",flexShrink:0 }} />
                <span style={{ fontSize:13 }}>{online?"Connected to Supabase":"Offline — using local cache"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:C.bg+"F8",backdropFilter:"blur(16px)",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"10px 0 20px",zIndex:100 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 12px",opacity:tab===t.id?1:0.4,transition:"opacity 0.2s" }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            <span style={{ fontSize:10,color:tab===t.id?C.accent:C.text,fontWeight:tab===t.id?700:400,fontFamily:"inherit",letterSpacing:0.5 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <Modal title="Log Project" onClose={()=>setShowProjectForm(false)}>
          {[
            { key:"client",label:"Client Name *",type:"text",placeholder:"Client or company" },
            { key:"contact_name",label:"Contact Name",type:"text",placeholder:"Who you deal with" },
            { key:"contact_email",label:"Contact Email",type:"email",placeholder:"email@example.com" },
            { key:"contact_phone",label:"Contact Phone",type:"tel",placeholder:"+1 (555) 000-0000" },
          ].map(f=>(
            <div key={f.key} style={{ marginBottom:14 }}>
              <label style={labelStyle}>{f.label}</label>
              <input type={f.type} style={inputStyle} value={newProject[f.key]} placeholder={f.placeholder} onChange={e=>setNewProject(p=>({...p,[f.key]:e.target.value}))} />
            </div>
          ))}
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Work Type</label>
            <select style={inputStyle} value={newProject.type} onChange={e=>setNewProject(p=>({...p,type:e.target.value}))}>
              {PROJECT_TYPES.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={newProject.status} onChange={e=>setNewProject(p=>({...p,status:e.target.value}))}>
              {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
            <div>
              <label style={labelStyle}>Amount ($) *</label>
              <input type="number" style={inputStyle} value={newProject.amount} placeholder="0" onChange={e=>setNewProject(p=>({...p,amount:e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} value={newProject.date} onChange={e=>setNewProject(p=>({...p,date:e.target.value}))} />
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input type="text" style={inputStyle} value={newProject.tags} placeholder="brand, fashion, editorial" onChange={e=>setNewProject(p=>({...p,tags:e.target.value}))} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Notes</label>
            <input type="text" style={inputStyle} value={newProject.notes} placeholder="Brief description..." onChange={e=>setNewProject(p=>({...p,notes:e.target.value}))} />
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:24,padding:"14px 16px",background:"rgba(199,125,255,0.08)",borderRadius:12,border:"1px solid rgba(199,125,255,0.2)" }}>
            <input type="checkbox" id="ret" checked={newProject.retainer} onChange={e=>setNewProject(p=>({...p,retainer:e.target.checked}))} />
            <label htmlFor="ret" style={{ fontSize:15,cursor:"pointer" }}>Retainer Project (recurring)</label>
          </div>
          <button onClick={saveProject} disabled={syncing} style={{ ...btnPrimary,opacity:syncing?0.6:1 }}>{syncing?"Saving…":"Save Project"}</button>
        </Modal>
      )}

      {/* Edit Project Modal */}
      {editProject && (
        <Modal title="Edit Project" onClose={()=>setEditProject(null)}>
          {[
            { key:"client",label:"Client Name",type:"text" },
            { key:"contact_name",label:"Contact Name",type:"text" },
            { key:"contact_email",label:"Contact Email",type:"email" },
            { key:"contact_phone",label:"Contact Phone",type:"tel" },
          ].map(f=>(
            <div key={f.key} style={{ marginBottom:14 }}>
              <label style={labelStyle}>{f.label}</label>
              <input type={f.type} style={inputStyle} value={editProject[f.key]||""} onChange={e=>setEditProject(p=>({...p,[f.key]:e.target.value}))} />
            </div>
          ))}
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Work Type</label>
            <select style={inputStyle} value={editProject.type} onChange={e=>setEditProject(p=>({...p,type:e.target.value}))}>
              {PROJECT_TYPES.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={editProject.status} onChange={e=>setEditProject(p=>({...p,status:e.target.value}))}>
              {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
            <div>
              <label style={labelStyle}>Amount</label>
              <input type="number" style={inputStyle} value={editProject.amount} onChange={e=>setEditProject(p=>({...p,amount:e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} value={editProject.date} onChange={e=>setEditProject(p=>({...p,date:e.target.value}))} />
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Tags</label>
            <input type="text" style={inputStyle} value={Array.isArray(editProject.tags)?editProject.tags.join(", "):editProject.tags||""} onChange={e=>setEditProject(p=>({...p,tags:e.target.value}))} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Notes</label>
            <input type="text" style={inputStyle} value={editProject.notes||""} onChange={e=>setEditProject(p=>({...p,notes:e.target.value}))} />
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:24,padding:"14px 16px",background:"rgba(199,125,255,0.08)",borderRadius:12,border:"1px solid rgba(199,125,255,0.2)" }}>
            <input type="checkbox" id="ret2" checked={!!editProject.retainer} onChange={e=>setEditProject(p=>({...p,retainer:e.target.checked}))} />
            <label htmlFor="ret2" style={{ fontSize:15,cursor:"pointer" }}>Retainer Project</label>
          </div>
          <button onClick={saveEditProject} disabled={syncing} style={{ ...btnPrimary,opacity:syncing?0.6:1 }}>{syncing?"Saving…":"Update Project"}</button>
        </Modal>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <Modal title="Add Expense" onClose={()=>setShowExpenseForm(false)}>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Description *</label>
            <input type="text" style={inputStyle} value={newExpense.description} placeholder="What did you spend on?" onChange={e=>setNewExpense(p=>({...p,description:e.target.value}))} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Category</label>
            <select style={inputStyle} value={newExpense.category} onChange={e=>setNewExpense(p=>({...p,category:e.target.value}))}>
              {EXPENSE_CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
            <div>
              <label style={labelStyle}>Amount ($) *</label>
              <input type="number" style={inputStyle} value={newExpense.amount} placeholder="0" onChange={e=>setNewExpense(p=>({...p,amount:e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} value={newExpense.date} onChange={e=>setNewExpense(p=>({...p,date:e.target.value}))} />
            </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={labelStyle}>Notes</label>
            <input type="text" style={inputStyle} value={newExpense.notes} placeholder="Optional details" onChange={e=>setNewExpense(p=>({...p,notes:e.target.value}))} />
          </div>
          <button onClick={saveExpense} disabled={syncing} style={{ ...btnPrimary,opacity:syncing?0.6:1 }}>{syncing?"Saving…":"Save Expense"}</button>
        </Modal>
      )}

      {/* View Project Modal */}
      {viewProject && (
        <Modal title="Project Details" onClose={()=>setViewProject(null)}>
          {(() => {
            const p = viewProject;
            const t = PROJECT_TYPES.find(t=>t.id===p.type);
            const sc = STATUS_COLORS[p.status]||"#888";
            return (
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:20,padding:"16px",background:(t?.color||"#888")+"12",borderRadius:14 }}>
                  <div style={{ width:52,height:52,background:(t?.color||"#888")+"25",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26 }}>{t?.icon}</div>
                  <div>
                    <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20 }}>{p.client}</div>
                    <div style={{ color:C.muted,fontSize:13,marginTop:2 }}>{t?.label}</div>
                  </div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
                  <div style={{ ...cardStyle,padding:14 }}>
                    <div style={{ fontSize:11,color:C.muted,letterSpacing:1,marginBottom:4 }}>AMOUNT</div>
                    <div style={{ fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:p.status==="Paid"?C.accent:C.text }}>{fmt(p.amount)}</div>
                  </div>
                  <div style={{ ...cardStyle,padding:14 }}>
                    <div style={{ fontSize:11,color:C.muted,letterSpacing:1,marginBottom:6 }}>STATUS</div>
                    <select value={p.status} onChange={e=>{updateProjectFn(p.id,{status:e.target.value});setViewProject({...p,status:e.target.value});}} style={{ ...inputStyle,padding:"8px 12px",fontSize:14,color:sc,background:sc+"15",border:`1px solid ${sc}40` }}>
                      {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                {(p.contact_name||p.contact_email||p.contact_phone) && (
                  <div style={{ ...cardStyle,marginBottom:14 }}>
                    <div style={{ fontSize:11,color:C.muted,letterSpacing:1,marginBottom:10 }}>CONTACT</div>
                    {p.contact_name && <div style={{ fontSize:14,fontWeight:600,marginBottom:4 }}>👤 {p.contact_name}</div>}
                    {p.contact_email && <a href={`mailto:${p.contact_email}`} style={{ display:"block",fontSize:14,color:"#7EC8E3",marginBottom:4,textDecoration:"none" }}>✉️ {p.contact_email}</a>}
                    {p.contact_phone && <a href={`tel:${p.contact_phone}`} style={{ display:"block",fontSize:14,color:"#52B788",textDecoration:"none" }}>📞 {p.contact_phone}</a>}
                  </div>
                )}
                {[
                  { label:"DATE", value:p.date },
                  { label:"NOTES", value:p.notes },
                  { label:"TAGS", value:p.tags?.join(", ") },
                ].filter(r=>r.value).map(r=>(
                  <div key={r.label} style={{ display:"flex",gap:12,marginBottom:10,padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:10 }}>
                    <span style={{ fontSize:11,color:C.muted,letterSpacing:1,minWidth:50 }}>{r.label}</span>
                    <span style={{ fontSize:14 }}>{r.value}</span>
                  </div>
                ))}
                {p.retainer && <div style={{ padding:"10px 14px",background:"#C77DFF12",border:"1px solid #C77DFF30",borderRadius:10,marginBottom:10,fontSize:13,color:"#C77DFF",fontWeight:600 }}>🔁 Retainer Project</div>}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:20 }}>
                  <button onClick={()=>{setEditProject({...p,tags:Array.isArray(p.tags)?p.tags.join(", "):(p.tags||"")});setViewProject(null);}} style={btnSecondary}>Edit</button>
                  <button onClick={()=>deleteProjectFn(p.id)} style={{ ...btnSecondary,color:"#F4845F",borderColor:"#F4845F40" }}>Delete</button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
