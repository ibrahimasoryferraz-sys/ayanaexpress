import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Package, ClipboardList, Grid3x3, Truck, Settings,
  Plus, Pencil, Trash2, X, Search, TrendingUp, DollarSign, ShoppingBag,
  Clock, CheckCircle2, Users, ChevronDown, Menu, ImagePlus, Star, AlertTriangle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

/* ============================================================
   AyanaExpress — Dashboard administrador (mockup funcional)
   Mesma identidade visual da loja: vermelho / preto / branco.
   Dados guardados localmente (window.storage) para que o
   protótipo seja utilizável. Uma versão em produção precisa de
   um backend real e autenticação de administrador — ver notas
   no fim do ficheiro.
   ============================================================ */

const BRAND = {
  red: "#C21E2A",
  redSoft: "#FBE9EA",
  black: "#0C0C0D",
  ink: "#1A1A1C",
  paper: "#F7F5F3",
  line: "#E7E3DF",
  green: "#16A34A",
  amber: "#D97706",
};

/* ---------------- Ligação ao backend real (Supabase) ----------------
   Preencha com os mesmos valores usados no ficheiro da loja
   (AyanaExpress.jsx), depois de correr o schema.sql no seu
   projeto Supabase. Vazio = o dashboard continua a funcionar
   com dados de demonstração guardados localmente. */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hiwxujxvorcckrqcljmh.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_j0PTDBCTh3gawsgEPGhNcg_FqzChzck";
const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let currentAccessToken = null;

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${currentAccessToken || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
const newId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : "p" + Date.now() + Math.random().toString(16).slice(2));

/* ---------------- Autenticação (Supabase Auth) ---------------- */
const AUTH_STORAGE_KEY = "ayana_admin_session";

function getStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function storeSession(session) {
  try {
    if (session) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}
async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Falha no login");
  return { access_token: data.access_token, user: data.user, expires_at: Date.now() + (data.expires_in || 3600) * 1000 };
}

const fmtKz = (n) => new Intl.NumberFormat("pt-PT").format(Math.round(n || 0)) + " Kz";
const STATUS_STEPS = ["Pedido recebido", "Confirmado", "Em preparação", "Enviado", "Entregue"];

const DEFAULT_CATEGORIES = [
  "Smartphones", "Eletrónica", "Relógios", "Perfumes", "Beleza",
  "Moda Homem", "Moda Mulher", "Acessórios", "Casa", "Promoções",
];

const DEFAULT_ZONES = [
  { id: "z1", name: "Luanda Centro", fee: 1500 },
  { id: "z2", name: "Talatona", fee: 2000 },
  { id: "z3", name: "Viana", fee: 2500 },
  { id: "z4", name: "Kilamba", fee: 2000 },
  { id: "z5", name: "Benfica", fee: 2000 },
  { id: "z6", name: "Cacuaco", fee: 3000 },
  { id: "z7", name: "Outras zonas", fee: 3500 },
];

const DEFAULT_PRODUCTS = [
  { id: "p1", name: "Smartphone Redora X12 128GB", category: "Smartphones", sku: "SM-X12-128", price: 385000, oldPrice: 450000, stock: 14, status: "active", sold: 63, image: "https://picsum.photos/seed/ayana-p1a/300/300", variants: "Preto, Azul" },
  { id: "p2", name: "Auscultadores Bluetooth PulseAir Pro", category: "Eletrónica", sku: "AC-PA-PRO", price: 28000, oldPrice: 38000, stock: 32, status: "active", sold: 41, image: "https://picsum.photos/seed/ayana-p2a/300/300", variants: "Preto, Branco" },
  { id: "p3", name: "Relógio Inteligente FitTrack S3", category: "Relógios", sku: "RL-FT-S3", price: 42000, oldPrice: null, stock: 20, status: "active", sold: 28, image: "https://picsum.photos/seed/ayana-p3a/300/300", variants: "Único" },
  { id: "p4", name: "Perfume Noir Intense — 100ml", category: "Perfumes", sku: "PF-NOIR-H", price: 32000, oldPrice: 40000, stock: 25, status: "active", sold: 55, image: "https://picsum.photos/seed/ayana-p4a/300/300", variants: "100ml" },
  { id: "p5", name: "Kit Beleza Facial Hidratante", category: "Beleza", sku: "BL-KIT-01", price: 18500, oldPrice: 24000, stock: 0, status: "inactive", sold: 19, image: "https://picsum.photos/seed/ayana-p6a/300/300", variants: "—" },
  { id: "p6", name: "Powerbank 20.000mAh Fast Charge", category: "Eletrónica", sku: "EL-PB-20K", price: 21000, oldPrice: 26000, stock: 28, status: "active", sold: 47, image: "https://picsum.photos/seed/ayana-p12a/300/300", variants: "Preto" },
];

const CUSTOMER_NAMES = ["Cátia Manuel", "Nelson Santos", "Ivana Pedro", "Domingos Cabral", "Beatriz Neto", "Miguel Fonseca"];
const ZONE_NAMES = DEFAULT_ZONES.map((z) => z.name);

function seedOrders(products) {
  const statuses = STATUS_STEPS;
  const now = Date.now();
  return Array.from({ length: 14 }).map((_, i) => {
    const p1 = products[i % products.length];
    const p2 = products[(i + 2) % products.length];
    const qty1 = 1 + (i % 2);
    const qty2 = i % 3 === 0 ? 1 : 0;
    const items = qty2 ? [{ ...p1, qty: qty1 }, { ...p2, qty: qty2 }] : [{ ...p1, qty: qty1 }];
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const fee = 1500 + (i % 4) * 500;
    return {
      id: "AE" + (30000000 + i * 137),
      date: new Date(now - i * 1000 * 60 * 60 * (6 + i)).toISOString(),
      customer: CUSTOMER_NAMES[i % CUSTOMER_NAMES.length],
      phone: "9" + (30000000 + i * 91735),
      zone: ZONE_NAMES[i % ZONE_NAMES.length],
      items, subtotal, fee, total: subtotal + fee,
      payment: ["Multicaixa Express", "Transferência bancária", "Pagamento na entrega"][i % 3],
      status: statuses[Math.min(i % 6, 4)],
    };
  });
}

/* ---------------- persistence ---------------- */
async function loadKey(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    return res ? JSON.parse(res.value) : fallback;
  } catch { return fallback; }
}
async function saveKey(key, value) {
  try { await window.storage.set(key, JSON.stringify(value), false); } catch {}
}

/* ---------------- shared UI ---------------- */
function StatCard({ icon: Icon, label, value, sub, tone = "black" }) {
  const color = tone === "red" ? BRAND.red : tone === "green" ? BRAND.green : tone === "amber" ? BRAND.amber : BRAND.black;
  return (
    <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "#8A8580" }}>{label}</span>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="text-xl font-black mt-2" style={{ color: BRAND.black }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#8A8580" }}>{sub}</p>}
    </div>
  );
}

function StatusPill({ status }) {
  const tone = status === "Entregue" ? BRAND.green : status === "Pedido recebido" ? BRAND.amber : BRAND.red;
  return (
    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${tone}1A`, color: tone }}>
      {status}
    </span>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`bg-white rounded-t-2xl sm:rounded-2xl w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white" style={{ borderColor: BRAND.line }}>
          <h3 className="font-black text-base" style={{ color: BRAND.black }}>{title}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function LField({ label, children }) {
  return (
    <label className="flex flex-col gap-1 mb-3">
      <span className="text-xs font-semibold" style={{ color: "#5C5852" }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = { border: `1px solid ${BRAND.line}`, borderRadius: 10, padding: "9px 11px", fontSize: 14, outline: "none", width: "100%" };

/* ---------------- Sidebar ---------------- */
function Sidebar({ tab, setTab, open, setOpen, pendingTestimonials = 0 }) {
  const items = [
    { id: "overview", label: "Visão geral", icon: LayoutDashboard },
    { id: "products", label: "Produtos", icon: Package },
    { id: "orders", label: "Encomendas", icon: ClipboardList },
    { id: "categories", label: "Categorias", icon: Grid3x3 },
    { id: "delivery", label: "Entrega", icon: Truck },
    { id: "customers", label: "Clientes", icon: Users },
    { id: "testimonials", label: "Avaliações", icon: Star },
    { id: "settings", label: "Configurações", icon: Settings },
  ];
  const content = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5">
        <span className="text-lg font-black" style={{ color: "white" }}>Ayana<span style={{ color: BRAND.red }}>Admin</span></span>
      </div>
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.id;
          return (
            <button key={it.id} onClick={() => { setTab(it.id); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: active ? BRAND.red : "transparent", color: active ? "white" : "rgba(255,255,255,0.7)" }}>
              <Icon size={17} /> {it.label}
              {it.id === "testimonials" && pendingTestimonials > 0 && (
                <span className="ml-auto text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center" style={{ backgroundColor: active ? "white" : BRAND.red, color: active ? BRAND.red : "white" }}>
                  {pendingTestimonials}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-white/40">Sessão de demonstração</div>
    </div>
  );
  return (
    <>
      <aside className="hidden md:flex w-60 flex-shrink-0 h-screen sticky top-0" style={{ backgroundColor: BRAND.black }}>{content}</aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setOpen(false)}>
          <div className="w-64 h-full" style={{ backgroundColor: BRAND.black }} onClick={(e) => e.stopPropagation()}>{content}</div>
        </div>
      )}
    </>
  );
}

/* ---------------- Overview ---------------- */
function OverviewTab({ products, orders }) {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status !== "Entregue").length;
  const completed = orders.filter((o) => o.status === "Entregue").length;
  const lowStock = products.filter((p) => p.stock <= 5 && p.status === "active");

  const revenueByDay = useMemo(() => {
    const days = {};
    orders.forEach((o) => {
      const d = new Date(o.date);
      const key = d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
      days[key] = (days[key] || 0) + o.total;
    });
    return Object.entries(days).map(([day, total]) => ({ day, total })).slice(-7).reverse();
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    return STATUS_STEPS.map((s) => ({ name: s, value: orders.filter((o) => o.status === s).length }));
  }, [orders]);

  const topProducts = useMemo(() => [...products].sort((a, b) => b.sold - a.sold).slice(0, 5), [products]);
  const pieColors = [BRAND.amber, "#8B5CF6", BRAND.red, "#3B82F6", BRAND.green];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Faturação total" value={fmtKz(revenue)} tone="red" />
        <StatCard icon={ShoppingBag} label="Encomendas" value={orders.length} sub={`${pending} pendentes`} />
        <StatCard icon={Clock} label="Pendentes" value={pending} tone="amber" />
        <StatCard icon={CheckCircle2} label="Entregues" value={completed} tone="green" />
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-start gap-2 rounded-2xl border p-4" style={{ borderColor: "#FCD34D", backgroundColor: "#FFFBEB" }}>
          <AlertTriangle size={17} style={{ color: BRAND.amber }} className="mt-0.5" />
          <p className="text-sm" style={{ color: "#78350F" }}>
            <strong>{lowStock.length} produto(s)</strong> com stock baixo: {lowStock.map((p) => p.name).join(", ")}.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
          <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Faturação recente</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND.line} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v) => fmtKz(v)} />
              <Line type="monotone" dataKey="total" stroke={BRAND.red} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
          <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Encomendas por estado</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {statusBreakdown.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center">
            {statusBreakdown.map((s, i) => (
              <span key={s.name} className="text-[11px] flex items-center gap-1" style={{ color: "#5C5852" }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: pieColors[i % pieColors.length] }} /> {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
        <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Produtos mais vendidos</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BRAND.line} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={160} tickFormatter={(v) => v.length > 20 ? v.slice(0, 20) + "…" : v} />
            <Tooltip />
            <Bar dataKey="sold" fill={BRAND.red} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------------- Products ---------------- */
function ProductsTab({ products, setProducts, categories }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()));

  const emptyForm = { id: "", name: "", category: categories[0] || "", sku: "", price: "", oldPrice: "", stock: "", status: "active", image: "", variants: "" };
  const [form, setForm] = useState(emptyForm);

  const openNew = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ ...p, oldPrice: p.oldPrice ?? "" }); setEditing(p.id); setShowModal(true); };
  const remove = async (id) => {
    if (!confirm("Eliminar este produto?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (SUPABASE_CONFIGURED) {
      try { await sb(`products?id=eq.${id}`, { method: "DELETE" }); } catch (e) { console.error(e); }
    }
  };

  const save = async () => {
    if (!form.name || !form.price || !form.sku) return;
    const payload = {
      ...form,
      id: editing || newId(),
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      stock: Number(form.stock) || 0,
      sold: form.sold || 0,
      image: form.image || "https://picsum.photos/seed/" + (editing || Date.now()) + "/300/300",
    };
    setProducts((prev) => editing ? prev.map((p) => p.id === editing ? payload : p) : [payload, ...prev]);
    setShowModal(false);
    if (SUPABASE_CONFIGURED) {
      try {
        await sb("products?on_conflict=id", {
          method: "POST",
          prefer: "resolution=merge-duplicates,return=representation",
          body: JSON.stringify([{
            id: payload.id, name: payload.name, category: payload.category, sku: payload.sku,
            price: payload.price, old_price: payload.oldPrice, stock: payload.stock, status: payload.status,
            image: payload.image, variants: payload.variants, sold: payload.sold,
          }]),
        });
      } catch (e) { console.error("Não foi possível gravar o produto no Supabase:", e); }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8580" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar produto ou SKU…" className="pl-9 pr-3 py-2 rounded-xl border w-full text-sm" style={{ borderColor: BRAND.line }} />
        </div>
        <button onClick={openNew} className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: BRAND.red }}>
          <Plus size={16} /> Novo produto
        </button>
      </div>

      <div className="rounded-2xl border overflow-hidden bg-white" style={{ borderColor: BRAND.line }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs" style={{ color: "#8A8580", backgroundColor: BRAND.paper }}>
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Preço</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: BRAND.line }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={p.image} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div>
                        <p className="font-semibold" style={{ color: BRAND.ink }}>{p.name}</p>
                        <p className="text-xs" style={{ color: "#8A8580" }}>{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#5C5852" }}>{p.category}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{fmtKz(p.price)}</p>
                    {p.oldPrice && <p className="text-xs line-through" style={{ color: "#B0AAA4" }}>{fmtKz(p.oldPrice)}</p>}
                  </td>
                  <td className="px-4 py-3" style={{ color: p.stock <= 5 ? BRAND.red : "#5C5852" }}>{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: p.status === "active" ? "#DCFCE7" : "#F3F4F6", color: p.status === "active" ? BRAND.green : "#6B7280" }}>
                      {p.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)}><Pencil size={15} style={{ color: "#5C5852" }} /></button>
                      <button onClick={() => remove(p.id)}><Trash2 size={15} style={{ color: BRAND.red }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "#8A8580" }}>Nenhum produto encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? "Editar produto" : "Novo produto"} onClose={() => setShowModal(false)} wide>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <LField label="Nome do produto"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></LField>
            <LField label="SKU"><input style={inputStyle} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></LField>
            <LField label="Categoria">
              <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </LField>
            <LField label="Estado">
              <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </LField>
            <LField label="Preço (Kz)"><input type="number" style={inputStyle} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></LField>
            <LField label="Preço antigo (promoção)"><input type="number" style={inputStyle} value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} /></LField>
            <LField label="Stock"><input type="number" style={inputStyle} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></LField>
            <LField label="Variantes (cor, tamanho, modelo)"><input style={inputStyle} placeholder="Ex: Preto, Azul / M, L, XL" value={form.variants} onChange={(e) => setForm({ ...form, variants: e.target.value })} /></LField>
            <div className="sm:col-span-2">
              <LField label="URL da imagem"><input style={inputStyle} placeholder="https://…" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></LField>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ color: "#5C5852" }}>Cancelar</button>
            <button onClick={save} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: BRAND.red }}>Guardar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Orders ---------------- */
function OrdersTab({ orders, setOrders }) {
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const updateStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    if (SUPABASE_CONFIGURED) {
      try { await sb(`orders?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); } catch (e) { console.error(e); }
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {["all", ...STATUS_STEPS].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border"
            style={{ borderColor: filter === s ? BRAND.red : BRAND.line, backgroundColor: filter === s ? BRAND.red : "white", color: filter === s ? "white" : "#5C5852" }}>
            {s === "all" ? "Todas" : s}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border overflow-hidden bg-white" style={{ borderColor: BRAND.line }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs" style={{ color: "#8A8580", backgroundColor: BRAND.paper }}>
                <th className="px-4 py-3 font-semibold">Pedido</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Zona</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t" style={{ borderColor: BRAND.line }}>
                  <td className="px-4 py-3">
                    <button className="font-semibold" style={{ color: BRAND.red }} onClick={() => setDetail(o)}>{o.id}</button>
                    <p className="text-xs" style={{ color: "#8A8580" }}>{new Date(o.date).toLocaleDateString("pt-PT")}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#5C5852" }}>{o.customer}</td>
                  <td className="px-4 py-3" style={{ color: "#5C5852" }}>{o.zone}</td>
                  <td className="px-4 py-3 font-semibold">{fmtKz(o.total)}</td>
                  <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="text-xs border rounded-lg px-2 py-1.5" style={{ borderColor: BRAND.line }}>
                      {STATUS_STEPS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "#8A8580" }}>Nenhuma encomenda neste estado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <Modal title={`Encomenda ${detail.id}`} onClose={() => setDetail(null)}>
          <p className="text-sm mb-1"><strong>Cliente:</strong> {detail.customer}</p>
          <p className="text-sm mb-1"><strong>Telefone:</strong> {detail.phone}</p>
          <p className="text-sm mb-1"><strong>Zona:</strong> {detail.zone}</p>
          <p className="text-sm mb-3"><strong>Pagamento:</strong> {detail.payment}</p>
          <div className="border-t pt-3" style={{ borderColor: BRAND.line }}>
            {detail.items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm mb-1">
                <span style={{ color: "#5C5852" }}>{it.name} x{it.qty}</span>
                <span className="font-semibold">{fmtKz(it.price * it.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between font-black" style={{ borderColor: BRAND.line }}>
            <span>Total</span><span>{fmtKz(detail.total)}</span>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Categories ---------------- */
function CategoriesTab({ categories, setCategories }) {
  const [newCat, setNewCat] = useState("");
  const add = async () => {
    const name = newCat.trim();
    if (!name || categories.includes(name)) return;
    setCategories([...categories, name]);
    setNewCat("");
    if (SUPABASE_CONFIGURED) {
      try { await sb("categories", { method: "POST", body: JSON.stringify([{ name, slug: name.toLowerCase().replace(/\s+/g, "-") }]) }); } catch (e) { console.error(e); }
    }
  };
  const remove = async (c) => {
    setCategories(categories.filter((x) => x !== c));
    if (SUPABASE_CONFIGURED) {
      try { await sb(`categories?name=eq.${encodeURIComponent(c)}`, { method: "DELETE" }); } catch (e) { console.error(e); }
    }
  };
  return (
    <div className="max-w-lg">
      <div className="flex gap-2 mb-4">
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nova categoria…" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button onClick={add} className="px-4 py-2 rounded-xl font-semibold text-sm text-white flex-shrink-0" style={{ backgroundColor: BRAND.red }}>Adicionar</button>
      </div>
      <div className="flex flex-col gap-2">
        {categories.map((c) => (
          <div key={c} className="flex items-center justify-between rounded-xl border px-4 py-2.5 bg-white" style={{ borderColor: BRAND.line }}>
            <span className="text-sm font-medium" style={{ color: BRAND.ink }}>{c}</span>
            <button onClick={() => remove(c)}><Trash2 size={15} style={{ color: BRAND.red }} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Delivery zones ---------------- */
function DeliveryTab({ zones, setZones }) {
  const [form, setForm] = useState({ name: "", fee: "" });
  const add = async () => {
    if (!form.name || !form.fee) return;
    const zone = { id: newId(), name: form.name, fee: Number(form.fee) };
    setZones([...zones, zone]);
    setForm({ name: "", fee: "" });
    if (SUPABASE_CONFIGURED) {
      try { await sb("delivery_zones", { method: "POST", body: JSON.stringify([{ id: zone.id, name: zone.name, fee: zone.fee }]) }); } catch (e) { console.error(e); }
    }
  };
  const update = async (id, fee) => {
    setZones(zones.map((z) => z.id === id ? { ...z, fee: Number(fee) } : z));
    if (SUPABASE_CONFIGURED) {
      try { await sb(`delivery_zones?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ fee: Number(fee) }) }); } catch (e) { console.error(e); }
    }
  };
  const remove = async (id) => {
    setZones(zones.filter((z) => z.id !== id));
    if (SUPABASE_CONFIGURED) {
      try { await sb(`delivery_zones?id=eq.${id}`, { method: "DELETE" }); } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="max-w-xl">
      <p className="text-sm mb-4" style={{ color: "#5C5852" }}>Configure as taxas de entrega em Luanda por zona.</p>
      <div className="flex flex-col gap-2 mb-5">
        {zones.map((z) => (
          <div key={z.id} className="flex items-center gap-3 rounded-xl border px-4 py-2.5 bg-white" style={{ borderColor: BRAND.line }}>
            <span className="flex-1 text-sm font-medium" style={{ color: BRAND.ink }}>{z.name}</span>
            <input type="number" value={z.fee} onChange={(e) => update(z.id, e.target.value)} className="w-28 text-sm border rounded-lg px-2 py-1.5" style={{ borderColor: BRAND.line }} />
            <span className="text-xs" style={{ color: "#8A8580" }}>Kz</span>
            <button onClick={() => remove(z.id)}><Trash2 size={15} style={{ color: BRAND.red }} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome da zona" style={inputStyle} />
        <input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="Taxa (Kz)" style={{ ...inputStyle, width: 140 }} />
        <button onClick={add} className="px-4 py-2 rounded-xl font-semibold text-sm text-white flex-shrink-0" style={{ backgroundColor: BRAND.red }}>Adicionar</button>
      </div>
    </div>
  );
}

/* ---------------- Customers (derived from orders) ---------------- */
function CustomersTab({ orders }) {
  const customers = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (!map[o.customer]) map[o.customer] = { name: o.customer, phone: o.phone, orders: 0, total: 0 };
      map[o.customer].orders += 1;
      map[o.customer].total += o.total;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [orders]);

  return (
    <div className="rounded-2xl border overflow-hidden bg-white" style={{ borderColor: BRAND.line }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="text-left text-xs" style={{ color: "#8A8580", backgroundColor: BRAND.paper }}>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Telefone</th>
              <th className="px-4 py-3 font-semibold">Encomendas</th>
              <th className="px-4 py-3 font-semibold">Total gasto</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.name} className="border-t" style={{ borderColor: BRAND.line }}>
                <td className="px-4 py-3 font-semibold" style={{ color: BRAND.ink }}>{c.name}</td>
                <td className="px-4 py-3" style={{ color: "#5C5852" }}>{c.phone}</td>
                <td className="px-4 py-3" style={{ color: "#5C5852" }}>{c.orders}</td>
                <td className="px-4 py-3 font-semibold">{fmtKz(c.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Testemunhos (moderação) ---------------- */
function TestimonialsTab({ testimonials, setTestimonials }) {
  const [filter, setFilter] = useState("pending");
  const filtered = filter === "all" ? testimonials : testimonials.filter((t) => t.status === filter);

  const updateStatus = async (id, status) => {
    setTestimonials((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    if (SUPABASE_CONFIGURED) {
      try { await sb(`testimonials?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); } catch (e) { console.error(e); }
    }
  };
  const remove = async (id) => {
    if (!confirm("Eliminar este testemunho?")) return;
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    if (SUPABASE_CONFIGURED) {
      try { await sb(`testimonials?id=eq.${id}`, { method: "DELETE" }); } catch (e) { console.error(e); }
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {[{ id: "pending", label: "Pendentes" }, { id: "approved", label: "Aprovados" }, { id: "rejected", label: "Rejeitados" }, { id: "all", label: "Todos" }].map((s) => (
          <button key={s.id} onClick={() => setFilter(s.id)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border"
            style={{ borderColor: filter === s.id ? BRAND.red : BRAND.line, backgroundColor: filter === s.id ? BRAND.red : "white", color: filter === s.id ? "white" : "#5C5852" }}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {filtered.map((t) => (
          <div key={t.id} className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-sm" style={{ color: BRAND.ink }}>{t.customer_name}{t.city ? " — " + t.city : ""}</p>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={13} className={i <= (t.rating || 5) ? "fill-current" : ""} style={{ color: i <= (t.rating || 5) ? BRAND.red : "#D9D5D1" }} />
                  ))}
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: t.status === "approved" ? "#DCFCE7" : t.status === "rejected" ? "#FEE2E2" : "#FEF9C3",
                  color: t.status === "approved" ? BRAND.green : t.status === "rejected" ? BRAND.red : "#A16207",
                }}>
                {t.status === "approved" ? "Aprovado" : t.status === "rejected" ? "Rejeitado" : "Pendente"}
              </span>
            </div>
            <p className="text-sm mt-2" style={{ color: "#4A4640" }}>"{t.text}"</p>
            <div className="flex gap-2 mt-3">
              {t.status !== "approved" && (
                <button onClick={() => updateStatus(t.id, "approved")} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: BRAND.green }}>Aprovar</button>
              )}
              {t.status !== "rejected" && (
                <button onClick={() => updateStatus(t.id, "rejected")} className="text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: BRAND.line, color: "#5C5852" }}>Rejeitar</button>
              )}
              <button onClick={() => remove(t.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg ml-auto" style={{ color: BRAND.red }}>Eliminar</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: "#8A8580" }}>Nenhum testemunho neste filtro.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function SettingsTab() {
  const emptySettings = {
    store_name: "AyanaExpress", address: "", logo_url: "",
    facebook_url: "", instagram_url: "", tiktok_url: "",
    open_days: "Segunda a Sábado", open_time: "08:00", close_time: "19:00",
    currency: "Kz", tax_rate: 0,
  };
  const [settings, setSettings] = useState(emptySettings);
  const [whatsapp, setWhatsapp] = useState("+244 976 340 762");
  const [payments, setPayments] = useState({ multicaixa: true, transfer: true, cod: true });
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

  useEffect(() => {
    (async () => {
      if (SUPABASE_CONFIGURED) {
        try {
          const rows = await sb("store_settings?id=eq.1&select=*");
          if (rows && rows[0]) setSettings({ ...emptySettings, ...rows[0] });
          return;
        } catch (e) { console.error("Não foi possível carregar configurações:", e); }
      }
      try {
        const raw = localStorage.getItem("ayana_admin_settings");
        if (raw) setSettings({ ...emptySettings, ...JSON.parse(raw) });
      } catch {}
    })();
  }, []);

  const set = (k) => (e) => setSettings((s) => ({ ...s, [k]: e.target.value }));

  const save = async () => {
    setSaveState("saving");
    try {
      if (SUPABASE_CONFIGURED) {
        await sb("store_settings?id=eq.1", {
          method: "PATCH",
          prefer: "return=minimal",
          body: JSON.stringify({ ...settings, updated_at: new Date().toISOString() }),
        });
      } else {
        localStorage.setItem("ayana_admin_settings", JSON.stringify(settings));
      }
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (e) {
      console.error("Não foi possível guardar configurações:", e);
      setSaveState("error");
    }
  };

  return (
    <div className="max-w-lg flex flex-col gap-5">
      <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
        <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Informações da loja</p>
        <LField label="Nome da loja"><input style={inputStyle} value={settings.store_name} onChange={set("store_name")} /></LField>
        <LField label="Endereço"><input style={inputStyle} value={settings.address} onChange={set("address")} placeholder="Ex: Luanda, Talatona" /></LField>
        <LField label="URL do logótipo"><input style={inputStyle} value={settings.logo_url} onChange={set("logo_url")} placeholder="https://…" /></LField>
        {settings.logo_url && <img src={settings.logo_url} alt="Logótipo" className="w-14 h-14 rounded-xl object-cover border mt-1" style={{ borderColor: BRAND.line }} />}
      </div>

      <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
        <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Contacto da loja</p>
        <LField label="Número de WhatsApp"><input style={inputStyle} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></LField>
      </div>

      <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
        <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Redes sociais</p>
        <LField label="Facebook"><input style={inputStyle} value={settings.facebook_url} onChange={set("facebook_url")} placeholder="https://facebook.com/…" /></LField>
        <LField label="Instagram"><input style={inputStyle} value={settings.instagram_url} onChange={set("instagram_url")} placeholder="https://instagram.com/…" /></LField>
        <LField label="TikTok"><input style={inputStyle} value={settings.tiktok_url} onChange={set("tiktok_url")} placeholder="https://tiktok.com/@…" /></LField>
      </div>

      <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
        <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Horário de funcionamento</p>
        <LField label="Dias"><input style={inputStyle} value={settings.open_days} onChange={set("open_days")} placeholder="Ex: Segunda a Sábado" /></LField>
        <div className="grid grid-cols-2 gap-3">
          <LField label="Abre às"><input type="time" style={inputStyle} value={settings.open_time} onChange={set("open_time")} /></LField>
          <LField label="Fecha às"><input type="time" style={inputStyle} value={settings.close_time} onChange={set("close_time")} /></LField>
        </div>
      </div>

      <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
        <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Moeda e impostos</p>
        <div className="grid grid-cols-2 gap-3">
          <LField label="Moeda">
            <select style={inputStyle} value={settings.currency} onChange={set("currency")}>
              <option value="Kz">Kwanza (Kz)</option>
              <option value="USD">Dólar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </LField>
          <LField label="Taxa de imposto (%)"><input type="number" min="0" style={inputStyle} value={settings.tax_rate} onChange={set("tax_rate")} /></LField>
        </div>
      </div>

      <div className="rounded-2xl border p-4 bg-white" style={{ borderColor: BRAND.line }}>
        <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Métodos de pagamento ativos</p>
        {[{ k: "multicaixa", label: "Multicaixa Express" }, { k: "transfer", label: "Transferência bancária" }, { k: "cod", label: "Pagamento na entrega" }].map((p) => (
          <label key={p.k} className="flex items-center gap-2 mb-2 text-sm" style={{ color: "#5C5852" }}>
            <input type="checkbox" checked={payments[p.k]} onChange={(e) => setPayments({ ...payments, [p.k]: e.target.checked })} />
            {p.label}
          </label>
        ))}
      </div>

      <button onClick={save} disabled={saveState === "saving"}
        className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ backgroundColor: BRAND.red }}>
        {saveState === "saving" ? "A guardar…" : saveState === "saved" ? "Guardado ✓" : "Guardar configurações"}
      </button>
      {saveState === "error" && <p className="text-xs text-center" style={{ color: BRAND.red }}>Não foi possível guardar. Tente novamente.</p>}

      <div className="rounded-2xl border p-4" style={{ borderColor: "#FCD34D", backgroundColor: "#FFFBEB" }}>
        <p className="text-sm" style={{ color: "#78350F" }}>
          O número de WhatsApp e os métodos de pagamento aqui ainda não estão ligados ao resto do site —
          para os alterar de forma efetiva, é preciso editar essas constantes no código da loja.
          As restantes configurações acima já ficam guardadas de verdade.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Ecrã de login ---------------- */
function LoginScreen({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const session = await signIn(email, password);
      currentAccessToken = session.access_token;
      storeSession(session);
      onSignedIn(session);
    } catch (err) {
      setError(err.message || "E-mail ou palavra-passe incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: BRAND.black }}>
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl p-6">
        <div className="text-center mb-6">
          <span className="text-xl font-black" style={{ color: BRAND.black }}>Ayana<span style={{ color: BRAND.red }}>Admin</span></span>
          <p className="text-xs mt-1" style={{ color: "#8A8580" }}>Acesso restrito à equipa AyanaExpress</p>
        </div>
        <LField label="E-mail">
          <input type="email" required style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </LField>
        <LField label="Palavra-passe">
          <input type="password" required style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </LField>
        {error && <p className="text-xs mb-3" style={{ color: BRAND.red }}>{error}</p>}
        {!SUPABASE_CONFIGURED && (
          <p className="text-xs mb-3" style={{ color: BRAND.amber }}>
            Supabase não está configurado — o login não vai funcionar até ligar as chaves no topo do ficheiro.
          </p>
        )}
        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50" style={{ backgroundColor: BRAND.red }}>
          {loading ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   App root
   ============================================================ */
export default function AdminApp() {
  const [session, setSession] = useState(() => {
    const s = getStoredSession();
    if (s) currentAccessToken = s.access_token;
    return s;
  });
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [orders, setOrders] = useState(() => seedOrders(DEFAULT_PRODUCTS));
  const [testimonials, setTestimonials] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [backendStatus, setBackendStatus] = useState(SUPABASE_CONFIGURED ? "loading" : "demo");
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    if (SUPABASE_CONFIGURED && session && session.expires_at && session.expires_at < Date.now()) {
      // Sessão guardada já expirou — força novo login em vez de usar um token inválido.
      currentAccessToken = null;
      storeSession(null);
      setSession(null);
      return;
    }
    setBackendStatus(SUPABASE_CONFIGURED ? "loading" : "demo");
    setBackendError("");
    (async () => {
      if (SUPABASE_CONFIGURED) {
        try {
          const [p, c, z, o, t] = await Promise.all([
            sb("products?select=*&order=created_at.desc"),
            sb("categories?select=*&order=name.asc"),
            sb("delivery_zones?select=*&order=fee.asc"),
            sb("orders?select=*&order=created_at.desc"),
            sb("testimonials?select=*&order=created_at.desc"),
          ]);
          setProducts((p || []).map((r) => ({
            id: r.id, name: r.name, category: r.category, sku: r.sku, price: r.price,
            oldPrice: r.old_price, stock: r.stock, status: r.status,
            image: r.image || (Array.isArray(r.images) && r.images[0]) || "https://picsum.photos/seed/" + r.id + "/300/300",
            variants: r.variants || "", sold: r.sold || 0,
          })));
          setCategories((c || []).map((r) => r.name));
          setZones((z || []).map((r) => ({ id: r.id, name: r.name, fee: r.fee })));
          setOrders((o || []).map((r) => ({
            id: r.id, date: r.created_at, customer: r.customer_name, phone: r.phone, zone: r.zone,
            items: r.items || [], subtotal: r.subtotal, fee: r.delivery_fee, total: r.total,
            payment: r.payment, status: r.status,
          })));
          setTestimonials(t || []);
          setBackendStatus("live");
          setLoaded(true);
          return;
        } catch (e) {
          console.error("Falha ao ligar ao Supabase, a usar dados locais:", e);
          // Se a sessão expirou a meio (token inválido), força novo login em vez de ficar preso no erro.
          if (String(e.message || e).toLowerCase().includes("jwt")) {
            currentAccessToken = null;
            storeSession(null);
            setSession(null);
            return;
          }
          setBackendStatus("error");
          setBackendError(String(e && e.message ? e.message : e));
        }
      }
      const [p, c, z, o] = await Promise.all([
        loadKey("admin:products", null),
        loadKey("admin:categories", null),
        loadKey("admin:zones", null),
        loadKey("admin:orders", null),
      ]);
      if (p) setProducts(p);
      if (c) setCategories(c);
      if (z) setZones(z);
      if (o) setOrders(o);
      setLoaded(true);
    })();
  }, [session]);
  useEffect(() => { if (loaded && !SUPABASE_CONFIGURED) saveKey("admin:products", products); }, [products, loaded]);
  useEffect(() => { if (loaded && !SUPABASE_CONFIGURED) saveKey("admin:categories", categories); }, [categories, loaded]);
  useEffect(() => { if (loaded && !SUPABASE_CONFIGURED) saveKey("admin:zones", zones); }, [zones, loaded]);
  useEffect(() => { if (loaded && !SUPABASE_CONFIGURED) saveKey("admin:orders", orders); }, [orders, loaded]);

  const titles = {
    overview: "Visão geral", products: "Produtos", orders: "Encomendas",
    categories: "Categorias", delivery: "Entrega", customers: "Clientes",
    testimonials: "Avaliações", settings: "Configurações",
  };

  if (SUPABASE_CONFIGURED && !session) {
    return <LoginScreen onSignedIn={setSession} />;
  }

  const logout = () => {
    currentAccessToken = null;
    storeSession(null);
    setSession(null);
  };

  return (
    <div className="flex" style={{ fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: BRAND.paper, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Manrope:wght@700;800&display=swap');
        h1, h2, h3, .font-black { font-family: 'Manrope', 'Inter', sans-serif; }
      `}</style>
      <Sidebar tab={tab} setTab={setTab} open={sidebarOpen} setOpen={setSidebarOpen} pendingTestimonials={testimonials.filter((t) => t.status === "pending").length} />
      <main className="flex-1 min-w-0">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 bg-white border-b sticky top-0 z-30" style={{ borderColor: BRAND.line }}>
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <h1 className="text-lg font-black" style={{ color: BRAND.black }}>{titles[tab]}</h1>
          <span className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: backendStatus === "live" ? "#DCFCE7" : backendStatus === "error" ? "#FEE2E2" : "#F3F4F6",
              color: backendStatus === "live" ? BRAND.green : backendStatus === "error" ? BRAND.red : "#6B7280",
            }}>
            {backendStatus === "live" ? "● Ligado ao Supabase" : backendStatus === "error" ? "● Erro de ligação" : "● Modo demonstração"}
          </span>
          {session && (
            <button onClick={logout} className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ borderColor: BRAND.line, color: "#5C5852" }}>
              Sair
            </button>
          )}
        </div>
        {backendStatus === "error" && backendError && (
          <div className="px-4 sm:px-6 py-2 text-xs" style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>
            Detalhe do erro (para diagnóstico): {backendError}
          </div>
        )}
        <div className="p-4 sm:p-6">
          {tab === "overview" && <OverviewTab products={products} orders={orders} />}
          {tab === "products" && <ProductsTab products={products} setProducts={setProducts} categories={categories} />}
          {tab === "orders" && <OrdersTab orders={orders} setOrders={setOrders} />}
          {tab === "categories" && <CategoriesTab categories={categories} setCategories={setCategories} />}
          {tab === "delivery" && <DeliveryTab zones={zones} setZones={setZones} />}
          {tab === "customers" && <CustomersTab orders={orders} />}
          {tab === "testimonials" && <TestimonialsTab testimonials={testimonials} setTestimonials={setTestimonials} />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   LIGAÇÃO AO SUPABASE — já preparada neste ficheiro
   ============================================================
   Preencha SUPABASE_URL e SUPABASE_ANON_KEY no topo do ficheiro
   com os mesmos valores usados em AyanaExpress.jsx (depois de
   correr schema.sql). Ao recarregar, todas as ações — criar,
   editar, eliminar produtos, mudar estado de encomendas, gerir
   categorias e zonas — passam a escrever diretamente na mesma
   base de dados que a loja usa. Sem esses valores, continua a
   funcionar em modo demonstração local, como antes.

   AINDA POR FAZER antes de um lançamento real:
   1. Autenticação de administrador (Supabase Auth) — ver a
      secção comentada no fim de schema.sql para restringir a
      escrita apenas a utilizadores admin autenticados.
   2. Notificar o cliente (WhatsApp/SMS) quando o estado de uma
      encomenda muda — isso precisa de uma função no servidor
      (Supabase Edge Function), não pode ser feito só no frontend.
   3. Nunca guardar credenciais de pagamento ou chaves secretas
      neste ficheiro — apenas a chave "anon public" é segura
      para o frontend.
   ============================================================ */
