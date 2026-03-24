import { useState, useMemo, useRef } from "react";

const CATEGORIES = ["All", "Laptops", "Monitors", "Keyboards & Mice", "Headsets", "Docking Stations", "Cables & Adapters", "Storage", "Other"];

const SAMPLE = [
  { id: 1, name: 'MacBook Pro 14" M3', sku: "MBP-M3-14", category: "Laptops", qty: 12, lowStock: 5, cost: 1599.00, price: 1999.00 },
  { id: 2, name: "Dell XPS 15 (i7)", sku: "DELL-XPS15", category: "Laptops", qty: 4, lowStock: 5, cost: 1100.00, price: 1499.00 },
  { id: 3, name: "Lenovo ThinkPad X1", sku: "LEN-X1C", category: "Laptops", qty: 0, lowStock: 3, cost: 980.00, price: 1349.00 },
  { id: 4, name: 'LG UltraWide 34"', sku: "LG-UW34", category: "Monitors", qty: 8, lowStock: 4, cost: 320.00, price: 499.00 },
  { id: 5, name: 'Dell 27" 4K Monitor', sku: "DELL-27-4K", category: "Monitors", qty: 3, lowStock: 4, cost: 280.00, price: 419.00 },
  { id: 6, name: "Logitech MX Keys", sku: "LOG-MXK", category: "Keyboards & Mice", qty: 25, lowStock: 8, cost: 65.00, price: 109.99 },
  { id: 7, name: "Logitech MX Master 3", sku: "LOG-MXM3", category: "Keyboards & Mice", qty: 18, lowStock: 8, cost: 55.00, price: 99.99 },
  { id: 8, name: "Sony WH-1000XM5", sku: "SNY-XM5", category: "Headsets", qty: 6, lowStock: 5, cost: 230.00, price: 349.99 },
  { id: 9, name: "Jabra Evolve2 85", sku: "JAB-EV285", category: "Headsets", qty: 2, lowStock: 5, cost: 290.00, price: 449.00 },
  { id: 10, name: "CalDigit TS4 Dock", sku: "CAL-TS4", category: "Docking Stations", qty: 9, lowStock: 3, cost: 195.00, price: 299.99 },
  { id: 11, name: "USB-C to HDMI 2.1", sku: "CBL-USBC-HDMI", category: "Cables & Adapters", qty: 45, lowStock: 15, cost: 8.00, price: 22.99 },
  { id: 12, name: "Samsung T7 1TB SSD", sku: "SAM-T7-1TB", category: "Storage", qty: 14, lowStock: 6, cost: 75.00, price: 109.99 },
];

let nextId = 13;

const fmt = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const emptyForm = { name: "", sku: "", category: "Laptops", qty: "", lowStock: "", cost: "", price: "" };

export default function App() {
  const [items, setItems] = useState(SAMPLE);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [adjustId, setAdjustId] = useState(null);
  const fileRef = useRef();

  const openAdd = () => { setForm(emptyForm); setModal({ mode: "add" }); };
  const openEdit = (item) => {
    setForm({ ...item, qty: String(item.qty), lowStock: String(item.lowStock), cost: String(item.cost), price: String(item.price) });
    setModal({ mode: "edit", item });
  };
  const closeModal = () => setModal(null);

  const saveForm = () => {
    const parsed = { ...form, qty: Number(form.qty) || 0, lowStock: Number(form.lowStock) || 0, cost: parseFloat(form.cost) || 0, price: parseFloat(form.price) || 0 };
    if (!parsed.name.trim()) return;
    if (modal.mode === "add") setItems(p => [...p, { ...parsed, id: nextId++ }]);
    else setItems(p => p.map(i => i.id === modal.item.id ? { ...parsed, id: i.id } : i));
    closeModal();
  };

  const deleteItem = (id) => setItems(p => p.filter(i => i.id !== id));
  const adjustQty = (id, delta) => setItems(p => p.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i));

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let r = items;
    if (search) r = r.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== "All") r = r.filter(i => i.category === catFilter);
    if (stockFilter === "low") r = r.filter(i => i.qty > 0 && i.qty <= i.lowStock);
    if (stockFilter === "out") r = r.filter(i => i.qty === 0);
    return [...r].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
  }, [items, search, catFilter, stockFilter, sortCol, sortDir]);

  const stats = useMemo(() => ({
    total: items.length,
    lowStock: items.filter(i => i.qty > 0 && i.qty <= i.lowStock).length,
    outOfStock: items.filter(i => i.qty === 0).length,
    totalCost: items.reduce((s, i) => s + i.qty * i.cost, 0),
    totalRetail: items.reduce((s, i) => s + i.qty * i.price, 0),
  }), [items]);

  const exportCSV = () => {
    const h = ["ID", "Name", "SKU", "Category", "Qty", "Low Stock Threshold", "Unit Cost", "Unit Price", "Total Cost Value", "Total Retail Value"];
    const rows = items.map(i => [i.id, `"${i.name}"`, i.sku, i.category, i.qty, i.lowStock, i.cost.toFixed(2), i.price.toFixed(2), (i.qty * i.cost).toFixed(2), (i.qty * i.price).toFixed(2)]);
    const csv = [h, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "inventory.csv"; a.click();
  };

  const importCSV = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split("\n").slice(1).filter(Boolean);
      const imported = lines.map(line => {
        const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
        return { id: nextId++, name: cols[1] || "", sku: cols[2] || "", category: cols[3] || "Other", qty: Number(cols[4]) || 0, lowStock: Number(cols[5]) || 0, cost: parseFloat(cols[6]) || 0, price: parseFloat(cols[7]) || 0 };
      });
      setItems(p => [...p, ...imported]);
    };
    reader.readAsText(file); e.target.value = "";
  };

  const margin = (item) => item.price > 0 ? Math.round(((item.price - item.cost) / item.price) * 100) : 0;

  const SortArrow = ({ col }) => sortCol !== col
    ? <span style={{ opacity: 0.25, fontSize: 9, marginLeft: 3 }}>↕</span>
    : <span style={{ fontSize: 9, marginLeft: 3 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;

  const statusBadge = (item) => {
    if (item.qty === 0) return <span style={pill("#fee2e2", "#dc2626")}>Out of Stock</span>;
    if (item.qty <= item.lowStock) return <span style={pill("#fef9c3", "#b45309")}>⚠ Low Stock</span>;
    return <span style={pill("#dcfce7", "#15803d")}>In Stock</span>;
  };

  const pill = (bg, color) => ({ background: bg, color, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" });
  const inp = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none", background: "#fafafa" };
  const lbl = { fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 };

  const alerts = items.filter(i => i.qty === 0 || i.qty <= i.lowStock);

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: "#f1f5f9", minHeight: "100vh", padding: "24px 16px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1150, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              💻 Laptop & Peripherals Inventory
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>{items.length} SKUs tracked across {CATEGORIES.length - 1} categories</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => fileRef.current.click()} style={actionBtn("#6366f1")}>⬆ Import CSV</button>
            <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} style={{ display: "none" }} />
            <button onClick={exportCSV} style={actionBtn("#0ea5e9")}>⬇ Export CSV</button>
            <button onClick={openAdd} style={actionBtn("#22c55e")}>+ Add Item</button>
          </div>
        </div>

        {/* Low Stock Alert Banner */}
        {alerts.length > 0 && (
          <div style={{ background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontWeight: 600, color: "#92400e", fontSize: 14 }}>
              {alerts.filter(i => i.qty === 0).length} item(s) out of stock, {alerts.filter(i => i.qty > 0).length} item(s) running low —
            </span>
            <span style={{ color: "#92400e", fontSize: 13 }}>
              {alerts.map(i => i.name).slice(0, 3).join(", ")}{alerts.length > 3 ? ` +${alerts.length - 3} more` : ""}
            </span>
            <button onClick={() => setStockFilter("low")} style={{ marginLeft: "auto", fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "none", background: "#f59e0b", color: "#fff", fontWeight: 600, cursor: "pointer" }}>View All</button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total SKUs", value: stats.total, color: "#6366f1", icon: "📦" },
            { label: "Low Stock", value: stats.lowStock, color: "#f59e0b", icon: "⚠️" },
            { label: "Out of Stock", value: stats.outOfStock, color: "#ef4444", icon: "🚫" },
            { label: "Cost Value", value: fmt(stats.totalCost), color: "#0ea5e9", icon: "💵" },
            { label: "Retail Value", value: fmt(stats.totalRetail), color: "#22c55e", icon: "💰" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,.07)", borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.07)", marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search name or SKU..." style={{ ...inp, maxWidth: 220, background: "#f8fafc" }} />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inp, maxWidth: 200, background: "#f8fafc" }}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["all", "All"], ["low", "⚠ Low"], ["out", "🚫 Out"]].map(([v, l]) => (
              <button key={v} onClick={() => setStockFilter(v)} style={{ padding: "7px 13px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: stockFilter === v ? "#6366f1" : "#f1f5f9", color: stockFilter === v ? "#fff" : "#374151", transition: "all .15s" }}>{l}</button>
            ))}
          </div>
          {(search || catFilter !== "All" || stockFilter !== "all") && (
            <button onClick={() => { setSearch(""); setCatFilter("All"); setStockFilter("all"); }} style={{ marginLeft: "auto", fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "none", background: "#f1f5f9", color: "#64748b", cursor: "pointer", fontWeight: 600 }}>✕ Clear</button>
          )}
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.07)", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {[["name","Product"],["sku","SKU"],["category","Category"],["qty","Qty"],["lowStock","Alert At"],["cost","Cost"],["price","Price"],["margin","Margin"],["status","Status"]].map(([col, label]) => (
                  <th key={col} onClick={() => col !== "status" && col !== "margin" && handleSort(col)}
                    style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, cursor: col !== "status" && col !== "margin" ? "pointer" : "default", whiteSpace: "nowrap" }}>
                    {label}{col !== "status" && col !== "margin" && <SortArrow col={col} />}
                  </th>
                ))}
                <th style={{ padding: "11px 14px", textAlign: "center", fontWeight: 700, color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: 48, color: "#94a3b8", fontSize: 14 }}>No items match your filters.</td></tr>
              )}
              {filtered.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", background: item.qty === 0 ? "#fff9f9" : idx % 2 === 0 ? "#fff" : "#fafcff" }}>
                  <td style={{ padding: "11px 14px", fontWeight: 600, color: "#0f172a", minWidth: 160 }}>{item.name}</td>
                  <td style={{ padding: "11px 14px", color: "#64748b", fontFamily: "monospace", fontSize: 12 }}>{item.sku}</td>
                  <td style={{ padding: "11px 14px", color: "#334155" }}>
                    <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{item.category}</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {adjustId === item.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => adjustQty(item.id, -1)} style={smBtn("#ef4444")}>−</button>
                        <span style={{ fontWeight: 800, minWidth: 28, textAlign: "center", fontSize: 15 }}>{item.qty}</span>
                        <button onClick={() => adjustQty(item.id, 1)} style={smBtn("#22c55e")}>+</button>
                        <button onClick={() => setAdjustId(null)} style={{ ...smBtn("#94a3b8"), fontSize: 10, padding: "4px 6px" }}>✓</button>
                      </div>
                    ) : (
                      <span onClick={() => setAdjustId(item.id)} title="Click to adjust" style={{ fontWeight: 700, cursor: "pointer", fontSize: 15, color: item.qty === 0 ? "#ef4444" : item.qty <= item.lowStock ? "#d97706" : "#0f172a" }}>
                        {item.qty}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "11px 14px", color: "#94a3b8", fontSize: 13 }}>{item.lowStock}</td>
                  <td style={{ padding: "11px 14px", color: "#475569" }}>{fmt(item.cost)}</td>
                  <td style={{ padding: "11px 14px", color: "#475569", fontWeight: 600 }}>{fmt(item.price)}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ color: margin(item) >= 40 ? "#16a34a" : margin(item) >= 20 ? "#d97706" : "#dc2626", fontWeight: 700 }}>{margin(item)}%</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>{statusBadge(item)}</td>
                  <td style={{ padding: "11px 14px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                      <button onClick={() => openEdit(item)} title="Edit" style={smBtn("#6366f1")}>✏️</button>
                      <button onClick={() => deleteItem(item.id)} title="Delete" style={smBtn("#ef4444")}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                  <td colSpan={3} style={{ padding: "10px 14px", fontWeight: 700, color: "#475569", fontSize: 12 }}>TOTALS ({filtered.length} items)</td>
                  <td style={{ padding: "10px 14px", fontWeight: 800, color: "#0f172a" }}>{filtered.reduce((s, i) => s + i.qty, 0)}</td>
                  <td />
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0ea5e9" }}>{fmt(filtered.reduce((s, i) => s + i.qty * i.cost, 0))}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "#22c55e" }}>{fmt(filtered.reduce((s, i) => s + i.qty * i.price, 0))}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 10 }}>Click any quantity to adjust stock · {filtered.length} of {items.length} items shown</p>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, boxShadow: "0 25px 60px rgba(0,0,0,.25)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{modal.mode === "add" ? "➕ Add New Item" : "✏️ Edit Item"}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>Product Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder='e.g. MacBook Pro 14" M3' style={inp} />
              </div>
              <div>
                <label style={lbl}>SKU</label>
                <input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} placeholder="e.g. MBP-M3-14" style={inp} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inp}>
                  {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Quantity</label>
                <input type="number" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} placeholder="0" style={inp} min={0} />
              </div>
              <div>
                <label style={lbl}>Low Stock Alert At</label>
                <input type="number" value={form.lowStock} onChange={e => setForm(p => ({ ...p, lowStock: e.target.value }))} placeholder="5" style={inp} min={0} />
              </div>
              <div>
                <label style={lbl}>Unit Cost ($)</label>
                <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} placeholder="0.00" style={inp} min={0} step={0.01} />
              </div>
              <div>
                <label style={lbl}>Selling Price ($)</label>
                <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" style={inp} min={0} step={0.01} />
              </div>
              {form.cost > 0 && form.price > 0 && (
                <div style={{ gridColumn: "1/-1", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#166534", fontWeight: 600 }}>
                  📊 Margin: {Math.round(((form.price - form.cost) / form.price) * 100)}% · Profit per unit: {fmt(form.price - form.cost)}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
              <button onClick={closeModal} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Cancel</button>
              <button onClick={saveForm} style={actionBtn("#22c55e")}>{modal.mode === "add" ? "Add Item" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function actionBtn(bg) {
  return { padding: "9px 18px", borderRadius: 8, border: "none", background: bg, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" };
}
function smBtn(bg) {
  return { padding: "4px 9px", borderRadius: 6, border: "none", background: bg, color: "#fff", fontSize: 12, cursor: "pointer" };
}