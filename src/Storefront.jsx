import React, { useState, useEffect, useMemo, useCallback } from "react";
import { jsPDF } from "jspdf";
import {
  Search, ShoppingCart, Menu, X, Home, Grid3x3, Heart, User, Star,
  Minus, Plus, Trash2, ChevronRight, ChevronLeft, MapPin, Shield,
  Truck, MessageCircle, CheckCircle2, ArrowLeft, Filter, SlidersHorizontal, Download
} from "lucide-react";

/* ============================================================
   AyanaExpress — protótipo funcional da loja (frontend)
   Marca: vermelho / preto / branco — premium, direto, rápido
   Persistência: carrinho e pedidos guardados localmente via
   window.storage (por utilizador). Isto é um protótipo:
   autenticação real, stock real e pagamentos reais precisam
   de um backend (ver notas no fim do ficheiro).
   ============================================================ */

const WHATSAPP_NUMBER = "244976340762";

/* ---------------- Ligação ao backend real (Supabase) ----------------
   Preencha estes dois valores depois de criar o seu projeto em
   supabase.com e correr o ficheiro schema.sql fornecido:
   Project Settings → API → Project URL / anon public key.
   Se ficarem vazios, a loja continua a funcionar com os dados de
   demonstração abaixo (nada rebenta sem backend ligado). */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hiwxujxvorcckrqcljmh.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_j0PTDBCTh3gawsgEPGhNcg_FqzChzck";
const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const BRAND = {
  red: "#C21E2A",
  redDeep: "#7A1017",
  black: "#0C0C0D",
  ink: "#1A1A1C",
  paper: "#F7F5F3",
  line: "#E7E3DF",
};

let CATEGORIES = [
  { id: "smartphones", name: "Smartphones", img: "https://picsum.photos/seed/ayana-smartphones/400/300" },
  { id: "eletronica", name: "Eletrónica", img: "https://picsum.photos/seed/ayana-eletronica/400/300" },
  { id: "relogios", name: "Relógios", img: "https://picsum.photos/seed/ayana-relogios/400/300" },
  { id: "perfumes", name: "Perfumes", img: "https://picsum.photos/seed/ayana-perfumes/400/300" },
  { id: "beleza", name: "Beleza", img: "https://picsum.photos/seed/ayana-beleza/400/300" },
  { id: "moda-homem", name: "Moda Homem", img: "https://picsum.photos/seed/ayana-modahomem/400/300" },
  { id: "moda-mulher", name: "Moda Mulher", img: "https://picsum.photos/seed/ayana-modamulher/400/300" },
  { id: "acessorios", name: "Acessórios", img: "https://picsum.photos/seed/ayana-acessorios/400/300" },
  { id: "casa", name: "Casa", img: "https://picsum.photos/seed/ayana-casa/400/300" },
  { id: "promocoes", name: "Promoções", img: "https://picsum.photos/seed/ayana-promo/400/300" },
];

let PRODUCTS = [
  { id: "p1", name: "Smartphone Redora X12 128GB", category: "smartphones", price: 385000, oldPrice: 450000, rating: 4.6, reviews: 128, stock: 14, sku: "SM-X12-128", tag: "Mais vendido",
    desc: "Ecrã de 6.5\", câmara tripla 50MP, bateria 5000mAh. Ideal para redes sociais, trabalho e fotografia do dia a dia.",
    features: ["6.5\" FHD+", "128GB / 6GB RAM", "Câmara 50MP", "Bateria 5000mAh", "Dual SIM"],
    images: ["https://picsum.photos/seed/ayana-p1a/600/600", "https://picsum.photos/seed/ayana-p1b/600/600", "https://picsum.photos/seed/ayana-p1c/600/600"] },
  { id: "p2", name: "Auscultadores Bluetooth PulseAir Pro", category: "eletronica", price: 28000, oldPrice: 38000, rating: 4.4, reviews: 76, stock: 32, sku: "AC-PA-PRO", tag: "Promoção",
    desc: "Som limpo, cancelamento de ruído passivo e até 30h de autonomia com a caixa de carregamento.",
    features: ["Bluetooth 5.3", "30h de autonomia", "Resistente à água IPX4", "Microfone integrado"],
    images: ["https://picsum.photos/seed/ayana-p2a/600/600", "https://picsum.photos/seed/ayana-p2b/600/600"] },
  { id: "p3", name: "Relógio Inteligente FitTrack S3", category: "relogios", price: 42000, oldPrice: null, rating: 4.5, reviews: 54, stock: 20, sku: "RL-FT-S3", tag: "Novo",
    desc: "Monitor de batimentos cardíacos, contagem de passos e notificações do telemóvel no pulso.",
    features: ["Ecrã AMOLED 1.4\"", "Monitor cardíaco", "À prova de água", "Bateria 7 dias"],
    images: ["https://picsum.photos/seed/ayana-p3a/600/600", "https://picsum.photos/seed/ayana-p3b/600/600"] },
  { id: "p4", name: "Perfume Noir Intense — 100ml (Homem)", category: "perfumes", price: 32000, oldPrice: 40000, rating: 4.7, reviews: 91, stock: 25, sku: "PF-NOIR-H", tag: "Promoção",
    desc: "Fragrância amadeirada e intensa, ideal para uso noturno e ocasiões especiais.",
    features: ["100ml", "Amadeirado especiado", "Longa duração", "Embalagem premium"],
    images: ["https://picsum.photos/seed/ayana-p4a/600/600", "https://picsum.photos/seed/ayana-p4b/600/600"] },
  { id: "p5", name: "Perfume Rosé Élégance — 90ml (Mulher)", category: "perfumes", price: 34000, oldPrice: null, rating: 4.8, reviews: 63, stock: 18, sku: "PF-ROSE-M",
    desc: "Notas florais e frutadas, elegante e versátil para o dia a dia.",
    features: ["90ml", "Floral frutado", "Longa duração"],
    images: ["https://picsum.photos/seed/ayana-p5a/600/600", "https://picsum.photos/seed/ayana-p5b/600/600"] },
  { id: "p6", name: "Kit Beleza Facial Hidratante", category: "beleza", price: 18500, oldPrice: 24000, rating: 4.3, reviews: 40, stock: 30, sku: "BL-KIT-01", tag: "Promoção",
    desc: "Kit com limpeza, hidratação e proteção diária para todos os tipos de pele.",
    features: ["3 produtos", "Uso diário", "Todos os tipos de pele"],
    images: ["https://picsum.photos/seed/ayana-p6a/600/600", "https://picsum.photos/seed/ayana-p6b/600/600"] },
  { id: "p7", name: "Camisa Social Slim Fit", category: "moda-homem", price: 15500, oldPrice: null, rating: 4.2, reviews: 29, stock: 40, sku: "MD-CAM-01",
    desc: "Corte moderno, tecido leve, ideal para o trabalho ou saídas.",
    features: ["Slim fit", "Tecido respirável", "Tamanhos M, L, XL"],
    images: ["https://picsum.photos/seed/ayana-p7a/600/600", "https://picsum.photos/seed/ayana-p7b/600/600"] },
  { id: "p8", name: "Vestido Elegance Midi", category: "moda-mulher", price: 22000, oldPrice: 27000, rating: 4.6, reviews: 47, stock: 22, sku: "MD-VES-01", tag: "Promoção",
    desc: "Vestido midi elegante, perfeito para eventos e uso casual sofisticado.",
    features: ["Tecido premium", "Tamanhos S, M, L", "Vários usos"],
    images: ["https://picsum.photos/seed/ayana-p8a/600/600", "https://picsum.photos/seed/ayana-p8b/600/600"] },
  { id: "p9", name: "Óculos de Sol UV400 Classic", category: "acessorios", price: 9500, oldPrice: null, rating: 4.1, reviews: 33, stock: 50, sku: "AC-OC-01",
    desc: "Proteção UV400, armação leve e resistente, estilo clássico.",
    features: ["Proteção UV400", "Armação leve", "Estojo incluído"],
    images: ["https://picsum.photos/seed/ayana-p9a/600/600", "https://picsum.photos/seed/ayana-p9b/600/600"] },
  { id: "p10", name: "Capa + Película para Smartphone", category: "acessorios", price: 5500, oldPrice: 7500, rating: 4.0, reviews: 21, stock: 60, sku: "AC-CAP-01", tag: "Promoção",
    desc: "Proteção completa para o teu telemóvel: capa antichoque e película de vidro temperado.",
    features: ["Antichoque", "Vidro temperado", "Vários modelos"],
    images: ["https://picsum.photos/seed/ayana-p10a/600/600", "https://picsum.photos/seed/ayana-p10b/600/600"] },
  { id: "p11", name: "Conjunto de Panelas Antiaderente 5pç", category: "casa", price: 48000, oldPrice: null, rating: 4.5, reviews: 38, stock: 12, sku: "CS-PAN-05",
    desc: "Conjunto completo antiaderente, ideal para o dia a dia da cozinha.",
    features: ["5 peças", "Antiaderente", "Compatível com todos os fogões"],
    images: ["https://picsum.photos/seed/ayana-p11a/600/600", "https://picsum.photos/seed/ayana-p11b/600/600"] },
  { id: "p12", name: "Powerbank 20.000mAh Fast Charge", category: "eletronica", price: 21000, oldPrice: 26000, rating: 4.7, reviews: 85, stock: 28, sku: "EL-PB-20K", tag: "Mais vendido",
    desc: "Carregamento rápido para telemóvel, ideal para viagens e dias fora de casa.",
    features: ["20.000mAh", "Carregamento rápido", "2 saídas USB"],
    images: ["https://picsum.photos/seed/ayana-p12a/600/600", "https://picsum.photos/seed/ayana-p12b/600/600"] },
];

let ZONES = [
  { id: "luanda-centro", name: "Luanda Centro", fee: 1500 },
  { id: "talatona", name: "Talatona", fee: 2000 },
  { id: "viana", name: "Viana", fee: 2500 },
  { id: "kilamba", name: "Kilamba", fee: 2000 },
  { id: "benfica", name: "Benfica", fee: 2000 },
  { id: "cacuaco", name: "Cacuaco", fee: 3000 },
  { id: "outras", name: "Outras zonas", fee: 3500 },
];

let STORE_SETTINGS = {
  store_name: "AyanaExpress",
  address: "Luanda, Angola",
  logo_url: "",
  facebook_url: "",
  instagram_url: "",
  tiktok_url: "",
  open_days: "Segunda a Sábado",
  open_time: "08:00",
  close_time: "19:00",
  currency: "Kz",
  tax_rate: 0,
};

let TESTIMONIALS = [
  { name: "Cátia M.", city: "Talatona", rating: 5, text: "Encomendei um perfume e chegou no mesmo dia. Atendimento muito atencioso pelo WhatsApp." },
  { name: "Nelson S.", city: "Kilamba", rating: 5, text: "Site fácil de usar e preços justos. Já fiz três compras e todas chegaram certinhas." },
  { name: "Ivana P.", city: "Viana", rating: 4, text: "Gostei da opção de pagar na entrega. Deu muita confiança para a primeira compra." },
];

const fmtKz = (n) => new Intl.NumberFormat("pt-PT").format(Math.round(n)) + " Kz";

/* ---------------- persistence helpers ---------------- */
async function loadCart() {
  try {
    const res = await window.storage.get("ayana:cart", false);
    return res ? JSON.parse(res.value) : [];
  } catch { return []; }
}
async function saveCart(cart) {
  try { await window.storage.set("ayana:cart", JSON.stringify(cart), false); } catch {}
}
async function loadFavorites() {
  try {
    const res = await window.storage.get("ayana:favorites", false);
    return res ? JSON.parse(res.value) : [];
  } catch { return []; }
}
async function saveFavorites(favs) {
  try { await window.storage.set("ayana:favorites", JSON.stringify(favs), false); } catch {}
}
async function loadOrders() {
  try {
    const res = await window.storage.get("ayana:orders", false);
    return res ? JSON.parse(res.value) : [];
  } catch { return []; }
}
async function saveOrders(orders) {
  try { await window.storage.set("ayana:orders", JSON.stringify(orders), false); } catch {}
}

/* ---------------- small shared components ---------------- */
function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={13} className={i <= Math.round(rating) ? "fill-current" : ""}
            style={{ color: i <= Math.round(rating) ? BRAND.red : "#D9D5D1" }} />
        ))}
      </div>
      {count != null && <span style={{ color: "#8A8580" }}>({count})</span>}
    </div>
  );
}

function ProductCard({ product, onOpen, onAdd, isFav, onToggleFav }) {
  const discount = product.oldPrice ? Math.round(100 - (product.price / product.oldPrice) * 100) : null;
  return (
    <div className="group relative rounded-2xl bg-white overflow-hidden border transition-shadow hover:shadow-lg" style={{ borderColor: BRAND.line }}>
      <div className="relative cursor-pointer" onClick={() => onOpen(product.id)}>
        <img src={product.images[0]} alt={product.name} className="w-full aspect-square object-cover" />
        {discount && (
          <span className="absolute top-2 left-2 text-white text-[11px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: BRAND.red }}>
            -{discount}%
          </span>
        )}
        {product.tag && !discount && (
          <span className="absolute top-2 left-2 text-white text-[11px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: BRAND.black }}>
            {product.tag}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(product.id); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"
        >
          <Heart size={16} className={isFav ? "fill-current" : ""} style={{ color: BRAND.red }} />
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium leading-snug line-clamp-2 cursor-pointer" onClick={() => onOpen(product.id)} style={{ color: BRAND.ink, minHeight: "2.6em" }}>
          {product.name}
        </p>
        <div className="mt-1"><StarRating rating={product.rating} count={product.reviews} /></div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-bold" style={{ color: BRAND.black }}>{fmtKz(product.price)}</span>
          {product.oldPrice && <span className="text-xs line-through" style={{ color: "#B0AAA4" }}>{fmtKz(product.oldPrice)}</span>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(product); }}
          className="mt-2.5 w-full text-white text-sm font-semibold py-2 rounded-xl transition-transform active:scale-95"
          style={{ backgroundColor: BRAND.black }}
        >
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "#5C5852" }}>
      <Icon size={15} style={{ color: BRAND.red }} />
      <span>{label}</span>
    </div>
  );
}

/* ---------------- Header ---------------- */
function Header({ cartCount, onNav, onSearch, searchQuery, view }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navItems = [
    { id: "home", label: "Início" },
    { id: "shop", label: "Boutique" },
    { id: "categories", label: "Categorias" },
    { id: "promotions", label: "Promoções" },
    { id: "contact", label: "Contacto" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: BRAND.line }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <button className="md:hidden" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNav("home")}>
          {STORE_SETTINGS.logo_url && (
            <img src={STORE_SETTINGS.logo_url} alt={STORE_SETTINGS.store_name} className="w-8 h-8 rounded-lg object-cover" />
          )}
          <span className="text-xl font-black tracking-tight" style={{ color: BRAND.black }}>{STORE_SETTINGS.store_name}</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 ml-8">
          {navItems.map((n) => (
            <button key={n.id} onClick={() => onNav(n.id)}
              className="text-sm font-medium pb-1 border-b-2 transition-colors"
              style={{ color: view === n.id ? BRAND.red : BRAND.ink, borderColor: view === n.id ? BRAND.red : "transparent" }}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="flex-1" />
        <button onClick={() => setSearchOpen((s) => !s)} className="p-2"><Search size={20} /></button>
        <button onClick={() => onNav("favorites")} className="p-2 hidden sm:block"><Heart size={20} /></button>
        <button onClick={() => onNav("account")} className="p-2 hidden sm:block"><User size={20} /></button>
        <button onClick={() => onNav("cart")} className="p-2 relative">
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center" style={{ backgroundColor: BRAND.red }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>
      {searchOpen && (
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Procurar produtos…"
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{ borderColor: BRAND.line }}
          />
        </div>
      )}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMenuOpen(false)}>
          <div className="bg-white w-72 h-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-black">{STORE_SETTINGS.store_name}</span>
              <button onClick={() => setMenuOpen(false)}><X size={22} /></button>
            </div>
            <div className="flex flex-col gap-4">
              {navItems.map((n) => (
                <button key={n.id} onClick={() => { onNav(n.id); setMenuOpen(false); }} className="text-left text-base font-medium">{n.label}</button>
              ))}
              <button onClick={() => { onNav("favorites"); setMenuOpen(false); }} className="text-left text-base font-medium">Favoritos</button>
              <button onClick={() => { onNav("account"); setMenuOpen(false); }} className="text-left text-base font-medium">Minha Conta</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------- Floating WhatsApp ---------------- */
function WhatsAppFloat() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá AyanaExpress! Gostaria de saber mais sobre os vossos produtos.")}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-6 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white"
      style={{ backgroundColor: "#22C55E" }}>
      <MessageCircle size={26} />
    </a>
  );
}

/* ---------------- Mobile bottom nav ---------------- */
function MobileNav({ view, onNav, cartCount }) {
  const items = [
    { id: "home", label: "Início", icon: Home },
    { id: "shop", label: "Boutique", icon: Grid3x3 },
    { id: "search", label: "Procurar", icon: Search },
    { id: "cart", label: "Carrinho", icon: ShoppingCart },
    { id: "account", label: "Conta", icon: User },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t" style={{ borderColor: BRAND.line }}>
      <div className="flex items-center justify-around py-2">
        {items.map((it) => {
          const Icon = it.icon;
          const active = view === it.id;
          return (
            <button key={it.id} onClick={() => onNav(it.id)} className="flex flex-col items-center gap-0.5 px-2 py-1 relative">
              <Icon size={21} style={{ color: active ? BRAND.red : "#8A8580" }} />
              {it.id === "cart" && cartCount > 0 && (
                <span className="absolute -top-0.5 right-1 text-[9px] font-bold text-white rounded-full w-3.5 h-3.5 flex items-center justify-center" style={{ backgroundColor: BRAND.red }}>{cartCount}</span>
              )}
              <span className="text-[10px] font-medium" style={{ color: active ? BRAND.red : "#8A8580" }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Footer ---------------- */
function Footer({ onNav, backendStatus }) {
  const label = backendStatus === "live" ? "Ligado à base de dados" : backendStatus === "error" ? "Erro de ligação — a usar demonstração" : "Modo demonstração (sem backend ligado)";
  return (
    <footer className="mt-16 text-white" style={{ backgroundColor: BRAND.black }}>
      <div className="max-w-6xl mx-auto px-4 pt-4 flex justify-center">
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: backendStatus === "live" ? "#14532D" : "rgba(255,255,255,0.08)", color: backendStatus === "live" ? "#86EFAC" : "rgba(255,255,255,0.5)" }}>
          {label}
        </span>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <span className="text-lg font-black">{STORE_SETTINGS.store_name}</span>
          <p className="mt-2 text-white/60">Compre online. Receba em Luanda.</p>
          {(STORE_SETTINGS.facebook_url || STORE_SETTINGS.instagram_url || STORE_SETTINGS.tiktok_url) && (
            <div className="flex gap-3 mt-3">
              {STORE_SETTINGS.facebook_url && <a href={STORE_SETTINGS.facebook_url} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-xs underline">Facebook</a>}
              {STORE_SETTINGS.instagram_url && <a href={STORE_SETTINGS.instagram_url} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-xs underline">Instagram</a>}
              {STORE_SETTINGS.tiktok_url && <a href={STORE_SETTINGS.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-xs underline">TikTok</a>}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold mb-2">Sobre</p>
          <div className="flex flex-col gap-1.5 text-white/60">
            <button className="text-left hover:text-white" onClick={() => onNav("about")}>Sobre nós</button>
            <button className="text-left hover:text-white" onClick={() => onNav("contact")}>Contactos</button>
            <button className="text-left hover:text-white" onClick={() => onNav("delivery")}>Entrega</button>
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2">Horário</p>
          <p className="text-white/60">{STORE_SETTINGS.open_days}</p>
          <p className="text-white/60 mt-1">{STORE_SETTINGS.open_time} – {STORE_SETTINGS.close_time}</p>
        </div>
        <div>
          <p className="font-semibold mb-2">Contacto</p>
          <p className="text-white/60">WhatsApp: +244 976 340 762</p>
          <p className="text-white/60 mt-1">{STORE_SETTINGS.address || "Luanda, Angola"}</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} AyanaExpress. Todos os direitos reservados.
      </div>
    </footer>
  );
}

/* ---------------- Home view ---------------- */
/* ---------------- Formulário de testemunho ---------------- */
function TestimonialForm() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    if (!SUPABASE_CONFIGURED) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      await sb("testimonials", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify([{ customer_name: name.trim(), city: city.trim(), rating, text: text.trim(), status: "pending" }]),
      });
      setStatus("sent");
      setName(""); setCity(""); setText(""); setRating(5);
    } catch (e) {
      console.error("Não foi possível enviar o testemunho:", e);
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="mt-8 rounded-2xl border p-5 text-center" style={{ borderColor: BRAND.line, backgroundColor: "white" }}>
        <p className="text-sm font-semibold" style={{ color: BRAND.ink }}>Obrigado pelo seu testemunho! ✓</p>
        <p className="text-xs mt-1" style={{ color: "#8A8580" }}>Vai aparecer no site assim que for revisto pela equipa.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 rounded-2xl border p-5" style={{ borderColor: BRAND.line, backgroundColor: "white" }}>
      <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Deixe o seu testemunho</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="O seu nome" className="input" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="A sua cidade/bairro (opcional)" className="input" />
      </div>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} onClick={() => setRating(i)}>
            <Star size={20} className={i <= rating ? "fill-current" : ""} style={{ color: i <= rating ? BRAND.red : "#D9D5D1" }} />
          </button>
        ))}
      </div>
      <textarea required value={text} onChange={(e) => setText(e.target.value)} placeholder="Conte a sua experiência…" rows={3} className="input mb-3" />
      {status === "error" && (
        <p className="text-xs mb-3" style={{ color: BRAND.red }}>
          {SUPABASE_CONFIGURED ? "Não foi possível enviar. Tente novamente." : "Envio indisponível no modo demonstração."}
        </p>
      )}
      <button type="submit" disabled={status === "sending"} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60" style={{ backgroundColor: BRAND.red }}>
        {status === "sending" ? "A enviar…" : "Enviar testemunho"}
      </button>
    </form>
  );
}

function HomeView({ onNav, onOpenProduct, onAdd, favorites, onToggleFav, onOpenCategory }) {
  const popular = PRODUCTS.filter((p) => p.tag === "Mais vendido");
  const promos = PRODUCTS.filter((p) => p.oldPrice);
  const news = PRODUCTS.filter((p) => p.tag === "Novo").concat(PRODUCTS.slice(0, 2));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: BRAND.black }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="none">
          <defs>
            <pattern id="diag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag)" />
        </svg>
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-block text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full mb-4" style={{ backgroundColor: BRAND.red, color: "white" }}>
              Entrega em Luanda
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Compre online.<br />Receba em <span style={{ color: BRAND.red }}>Luanda.</span>
            </h1>
            <p className="mt-4 text-white/70 text-base max-w-md">
              Produtos selecionados, bons preços e entrega rápida em Luanda.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => onNav("shop")} className="px-6 py-3 rounded-xl font-semibold text-sm" style={{ backgroundColor: BRAND.red, color: "white" }}>
                Comprar agora
              </button>
              <button onClick={() => onNav("promotions")} className="px-6 py-3 rounded-xl font-semibold text-sm border border-white/30 text-white">
                Ver promoções
              </button>
            </div>
          </div>
          <div className="relative">
            <img src="https://picsum.photos/seed/ayana-hero/700/560" alt="Compras online em Luanda" className="rounded-2xl w-full object-cover aspect-[5/4]" />
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-3 shadow-xl hidden sm:flex items-center gap-2">
              <Truck size={18} style={{ color: BRAND.red }} />
              <span className="text-xs font-semibold" style={{ color: BRAND.ink }}>Entrega em 24-48h em Luanda</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Badge icon={Truck} label="Entrega rápida em Luanda" />
        <Badge icon={Shield} label="Pagamento seguro" />
        <Badge icon={MessageCircle} label="Pedido também por WhatsApp" />
        <Badge icon={CheckCircle2} label="Produtos verificados" />
      </section>

      {/* Categories */}
      <Section title="Categorias populares" onSeeAll={() => onNav("categories")}>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.slice(0, 10).map((c) => (
            <button key={c.id} onClick={() => onOpenCategory(c.id)} className="group text-center">
              <div className="rounded-2xl overflow-hidden aspect-square border" style={{ borderColor: BRAND.line }}>
                <img src={c.img} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <p className="mt-1.5 text-xs font-medium" style={{ color: BRAND.ink }}>{c.name}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Popular products */}
      <Section title="Produtos populares" onSeeAll={() => onNav("shop")}>
        <ProductGrid products={popular.length ? popular : PRODUCTS.slice(0, 4)} onOpen={onOpenProduct} onAdd={onAdd} favorites={favorites} onToggleFav={onToggleFav} />
      </Section>

      {/* Promotions banner */}
      <section className="max-w-6xl mx-auto px-4 my-10">
        <div className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ backgroundColor: BRAND.red }}>
          <div>
            <p className="text-white/80 text-xs font-bold uppercase tracking-wide">Promoções da semana</p>
            <p className="text-white text-2xl font-black mt-1">Até 25% de desconto</p>
          </div>
          <button onClick={() => onNav("promotions")} className="px-6 py-3 rounded-xl bg-white font-semibold text-sm" style={{ color: BRAND.red }}>
            Ver promoções
          </button>
        </div>
      </section>

      {/* New arrivals */}
      <Section title="Novidades" onSeeAll={() => onNav("shop")}>
        <ProductGrid products={news.slice(0, 4)} onOpen={onOpenProduct} onAdd={onAdd} favorites={favorites} onToggleFav={onToggleFav} />
      </Section>

      {/* Why us */}
      <section className="max-w-6xl mx-auto px-4 my-12">
        <h2 className="text-xl font-black mb-5" style={{ color: BRAND.black }}>Porquê comprar na AyanaExpress</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Truck, t: "Entrega rápida", d: "Entregamos em Luanda em 24 a 48 horas, conforme a zona." },
            { icon: Shield, t: "Pagamento seguro", d: "Multicaixa Express, transferência ou pagamento na entrega." },
            { icon: MessageCircle, t: "Suporte por WhatsApp", d: "Fale diretamente connosco para tirar dúvidas ou finalizar o pedido." },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl p-5 border" style={{ borderColor: BRAND.line }}>
              <f.icon size={22} style={{ color: BRAND.red }} />
              <p className="font-bold mt-3" style={{ color: BRAND.ink }}>{f.t}</p>
              <p className="text-sm mt-1" style={{ color: "#7A7570" }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12" style={{ backgroundColor: BRAND.paper }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl font-black mb-5" style={{ color: BRAND.black }}>O que dizem os nossos clientes</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl bg-white p-5 border" style={{ borderColor: BRAND.line }}>
                <StarRating rating={t.rating || 5} />
                <p className="text-sm mt-2" style={{ color: "#4A4640" }}>"{t.text}"</p>
                <p className="text-xs font-semibold mt-3" style={{ color: BRAND.ink }}>{t.name}{t.city ? " — " + t.city : ""}</p>
              </div>
            ))}
          </div>
          <TestimonialForm />
        </div>
      </section>

      {/* WhatsApp banner */}
      <section className="max-w-6xl mx-auto px-4 my-10">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Gostaria de fazer uma encomenda na AyanaExpress.")}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between rounded-2xl p-5 border"
          style={{ borderColor: "#22C55E", backgroundColor: "#F0FDF4" }}
        >
          <div className="flex items-center gap-3">
            <MessageCircle size={26} style={{ color: "#22C55E" }} />
            <div>
              <p className="font-bold text-sm" style={{ color: BRAND.ink }}>Prefere encomendar por WhatsApp?</p>
              <p className="text-xs" style={{ color: "#5C5852" }}>Fale connosco: +244 976 340 762</p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "#5C5852" }} />
        </a>
      </section>

      {/* Newsletter */}
      <section className="max-w-6xl mx-auto px-4 mb-14">
        <div className="rounded-2xl p-6 md:p-8 text-center" style={{ backgroundColor: BRAND.black }}>
          <p className="text-white font-black text-lg">Receba as nossas promoções em primeira mão</p>
          <div className="mt-4 flex max-w-md mx-auto gap-2">
            <input placeholder="O seu e-mail" className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none" />
            <button className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: BRAND.red }}>Subscrever</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, onSeeAll, children }) {
  return (
    <section className="max-w-6xl mx-auto px-4 my-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black" style={{ color: BRAND.black }}>{title}</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-sm font-semibold flex items-center gap-0.5" style={{ color: BRAND.red }}>
            Ver tudo <ChevronRight size={16} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function ProductGrid({ products, onOpen, onAdd, favorites, onToggleFav }) {
  if (!products.length) {
    return <p className="text-sm py-10 text-center" style={{ color: "#8A8580" }}>Nenhum produto encontrado.</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onOpen={onOpen} onAdd={onAdd} isFav={favorites.includes(p.id)} onToggleFav={onToggleFav} />
      ))}
    </div>
  );
}

/* ---------------- Shop view ---------------- */
function ShopView({ initialCategory, searchQuery, onOpenProduct, onAdd, favorites, onToggleFav, onlyPromotions }) {
  const [category, setCategory] = useState(initialCategory || "all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => setCategory(initialCategory || "all"), [initialCategory]);

  const filtered = useMemo(() => {
    let list = [...PRODUCTS];
    if (onlyPromotions) list = list.filter((p) => p.oldPrice);
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "new") list = list.filter((p) => p.tag === "Novo").concat(list.filter((p) => p.tag !== "Novo"));
    if (sort === "bestsellers") list = list.filter((p) => p.tag === "Mais vendido").concat(list.filter((p) => p.tag !== "Mais vendido"));
    return list;
  }, [category, searchQuery, minPrice, maxPrice, sort, onlyPromotions]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black mb-1" style={{ color: BRAND.black }}>{onlyPromotions ? "Promoções" : "Boutique"}</h1>
      <p className="text-sm mb-5" style={{ color: "#7A7570" }}>{filtered.length} produtos encontrados</p>

      <div className="flex items-center gap-2 mb-5 md:hidden">
        <button onClick={() => setShowFilters((s) => !s)} className="flex items-center gap-1.5 text-sm font-semibold border rounded-xl px-3 py-2" style={{ borderColor: BRAND.line }}>
          <SlidersHorizontal size={15} /> Filtros
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="text-sm border rounded-xl px-3 py-2 flex-1" style={{ borderColor: BRAND.line }}>
          <option value="relevance">Relevância</option>
          <option value="price-asc">Preço: menor</option>
          <option value="price-desc">Preço: maior</option>
          <option value="new">Novidades</option>
          <option value="bestsellers">Mais vendidos</option>
        </select>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <aside className={`${showFilters ? "block" : "hidden"} md:block`}>
          <div className="rounded-2xl border p-4" style={{ borderColor: BRAND.line }}>
            <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Categoria</p>
            <div className="flex flex-col gap-1.5 mb-5">
              <button onClick={() => setCategory("all")} className="text-left text-sm py-0.5" style={{ color: category === "all" ? BRAND.red : "#5C5852", fontWeight: category === "all" ? 700 : 400 }}>
                Todas
              </button>
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setCategory(c.id)} className="text-left text-sm py-0.5" style={{ color: category === c.id ? BRAND.red : "#5C5852", fontWeight: category === c.id ? 700 : 400 }}>
                  {c.name}
                </button>
              ))}
            </div>
            <p className="font-bold text-sm mb-2" style={{ color: BRAND.ink }}>Preço (Kz)</p>
            <div className="flex gap-2 mb-1">
              <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Mín" type="number" className="w-1/2 border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: BRAND.line }} />
              <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Máx" type="number" className="w-1/2 border rounded-lg px-2 py-1.5 text-sm" style={{ borderColor: BRAND.line }} />
            </div>
          </div>
          <div className="hidden md:block mt-4">
            <p className="font-bold text-sm mb-2" style={{ color: BRAND.ink }}>Ordenar</p>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full text-sm border rounded-xl px-3 py-2" style={{ borderColor: BRAND.line }}>
              <option value="relevance">Relevância</option>
              <option value="price-asc">Preço: menor</option>
              <option value="price-desc">Preço: maior</option>
              <option value="new">Novidades</option>
              <option value="bestsellers">Mais vendidos</option>
            </select>
          </div>
        </aside>
        <ProductGrid products={filtered} onOpen={onOpenProduct} onAdd={onAdd} favorites={favorites} onToggleFav={onToggleFav} />
      </div>
    </div>
  );
}

/* ---------------- Categories view ---------------- */
function CategoriesView({ onOpenCategory }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black mb-5" style={{ color: BRAND.black }}>Categorias</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => onOpenCategory(c.id)} className="group text-left rounded-2xl overflow-hidden border" style={{ borderColor: BRAND.line }}>
            <div className="aspect-[4/3] overflow-hidden">
              <img src={c.img} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <p className="p-3 font-semibold text-sm" style={{ color: BRAND.ink }}>{c.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Product detail view ---------------- */
function ProductView({ productId, onBack, onAdd, onBuyNow, favorites, onToggleFav, onOpenProduct }) {
  const product = PRODUCTS.find((p) => p.id === productId);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  useEffect(() => { setImgIdx(0); setQty(1); }, [productId]);
  if (!product) return null;

  const discount = product.oldPrice ? Math.round(100 - (product.price / product.oldPrice) * 100) : null;
  const similar = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const waMsg = `Olá! Tenho interesse neste produto:\n\n*${product.name}*\nPreço: ${fmtKz(product.price)}\nQuantidade: ${qty}\n\nPodem confirmar disponibilidade?`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold mb-5" style={{ color: BRAND.ink }}>
        <ArrowLeft size={16} /> Voltar
      </button>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="rounded-2xl overflow-hidden border aspect-square" style={{ borderColor: BRAND.line }}>
            <img src={product.images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2 mt-3">
            {product.images.map((img, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className="w-16 h-16 rounded-xl overflow-hidden border-2" style={{ borderColor: i === imgIdx ? BRAND.red : BRAND.line }}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div>
          {product.tag && <span className="inline-block text-[11px] font-bold uppercase px-2.5 py-1 rounded-full text-white mb-2" style={{ backgroundColor: product.oldPrice ? BRAND.red : BRAND.black }}>{discount ? `-${discount}%` : product.tag}</span>}
          <h1 className="text-2xl font-black" style={{ color: BRAND.black }}>{product.name}</h1>
          <div className="mt-2"><StarRating rating={product.rating} count={product.reviews} /></div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-black" style={{ color: BRAND.black }}>{fmtKz(product.price)}</span>
            {product.oldPrice && <span className="text-base line-through" style={{ color: "#B0AAA4" }}>{fmtKz(product.oldPrice)}</span>}
          </div>
          <p className="text-sm mt-4" style={{ color: "#5C5852" }}>{product.desc}</p>

          <ul className="mt-4 space-y-1.5">
            {product.features.map((f, i) => (
              <li key={i} className="text-sm flex items-center gap-2" style={{ color: "#4A4640" }}>
                <CheckCircle2 size={14} style={{ color: BRAND.red }} /> {f}
              </li>
            ))}
          </ul>

          <p className="text-xs mt-4" style={{ color: product.stock > 0 ? "#16A34A" : BRAND.red }}>
            {product.stock > 0 ? `Em stock (${product.stock} disponíveis)` : "Fora de stock"}
          </p>

          <div className="flex items-center gap-3 mt-5">
            <div className="flex items-center border rounded-xl" style={{ borderColor: BRAND.line }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5"><Minus size={14} /></button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="p-2.5"><Plus size={14} /></button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button onClick={() => onBuyNow(product, qty)} className="flex-1 py-3 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: BRAND.red }}>
              Comprar agora
            </button>
            <button onClick={() => onAdd(product, qty)} className="flex-1 py-3 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: BRAND.black }}>
              Adicionar ao carrinho
            </button>
          </div>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border" style={{ borderColor: "#22C55E", color: "#16A34A" }}>
            <MessageCircle size={16} /> Perguntar pelo WhatsApp
          </a>

          <div className="mt-5 flex flex-col gap-2 rounded-2xl border p-4" style={{ borderColor: BRAND.line }}>
            <Badge icon={Truck} label="Entrega em Luanda" />
            <Badge icon={Shield} label="Pagamento seguro" />
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xl font-black mb-4" style={{ color: BRAND.black }}>Produtos semelhantes</h2>
          <ProductGrid products={similar} onOpen={onOpenProduct} onAdd={onAdd} favorites={favorites} onToggleFav={onToggleFav} />
        </div>
      )}
    </div>
  );
}

/* ---------------- Cart view ---------------- */
function CartView({ cart, onUpdateQty, onRemove, onNav }) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black mb-5" style={{ color: BRAND.black }}>Carrinho</h1>
      {cart.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart size={44} className="mx-auto mb-3" style={{ color: "#D9D5D1" }} />
          <p className="text-sm mb-4" style={{ color: "#7A7570" }}>O seu carrinho está vazio.</p>
          <button onClick={() => onNav("shop")} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: BRAND.red }}>Ir às compras</button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-2xl border p-3" style={{ borderColor: BRAND.line }}>
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 flex flex-col">
                  <p className="text-sm font-semibold" style={{ color: BRAND.ink }}>{item.name}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: BRAND.black }}>{fmtKz(item.price)}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border rounded-lg" style={{ borderColor: BRAND.line }}>
                      <button onClick={() => onUpdateQty(item.id, item.qty - 1)} className="p-1.5"><Minus size={13} /></button>
                      <span className="w-6 text-center text-xs font-semibold">{item.qty}</span>
                      <button onClick={() => onUpdateQty(item.id, item.qty + 1)} className="p-1.5"><Plus size={13} /></button>
                    </div>
                    <button onClick={() => onRemove(item.id)}><Trash2 size={16} style={{ color: BRAND.red }} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: BRAND.line }}>
            <div className="flex justify-between text-sm mb-1"><span style={{ color: "#5C5852" }}>Subtotal</span><span className="font-semibold">{fmtKz(subtotal)}</span></div>
            <p className="text-xs" style={{ color: "#8A8580" }}>Taxa de entrega calculada no checkout, conforme a zona.</p>
          </div>
          <button onClick={() => onNav("checkout")} className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: BRAND.red }}>
            Finalizar compra
          </button>
        </>
      )}
    </div>
  );
}

/* ---------------- Checkout view ---------------- */
/* ---------------- Gerar PDF do pedido ---------------- */
async function fetchImageAsDataUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function downloadOrderPDF(order, form, zone) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let y = 56;

  const logoData = STORE_SETTINGS.logo_url ? await fetchImageAsDataUrl(STORE_SETTINGS.logo_url) : null;
  const textX = logoData ? marginX + 44 : marginX;
  if (logoData) {
    try { doc.addImage(logoData, marginX, y - 22, 32, 32); } catch {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(194, 30, 42); // BRAND.red
  doc.text(STORE_SETTINGS.store_name || "AyanaExpress", textX, y);
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(STORE_SETTINGS.address || "Compre online. Receba em Luanda.", textX, y + 16);
  const socials = [STORE_SETTINGS.facebook_url, STORE_SETTINGS.instagram_url, STORE_SETTINGS.tiktok_url].filter(Boolean);
  if (socials.length) doc.text(socials.join("   ·   "), textX, y + 30);

  y += 44;
  doc.setDrawColor(230, 226, 222);
  doc.line(marginX, y, 548, y);
  y += 24;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Pedido ${order.id}`, marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date(order.date).toLocaleString("pt-PT"), 548, y, { align: "right" });

  y += 26;
  doc.setFont("helvetica", "bold");
  doc.text("Cliente", marginX, y);
  doc.setFont("helvetica", "normal");
  y += 16;
  doc.text(`${form.name}  ·  ${form.phone}${form.whatsapp ? "  ·  WhatsApp: " + form.whatsapp : ""}`, marginX, y);
  y += 16;
  doc.text(`${form.province}, ${form.municipality}, ${form.neighborhood}`, marginX, y);
  y += 16;
  doc.text(form.address, marginX, y);
  if (form.reference) { y += 16; doc.text(`Referência: ${form.reference}`, marginX, y); }

  y += 28;
  doc.setFont("helvetica", "bold");
  doc.text("Produtos", marginX, y);
  y += 8;
  doc.line(marginX, y, 548, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  order.items.forEach((item) => {
    const lineTotal = fmtKz(item.price * item.qty);
    doc.text(`${item.name}`, marginX, y);
    doc.text(`x${item.qty}`, 420, y, { align: "right" });
    doc.text(lineTotal, 548, y, { align: "right" });
    y += 18;
    if (y > 740) { doc.addPage(); y = 56; }
  });

  y += 6;
  doc.line(marginX, y, 548, y);
  y += 20;
  doc.text("Subtotal", 420, y, { align: "right" });
  doc.text(fmtKz(order.subtotal), 548, y, { align: "right" });
  y += 18;
  doc.text(`Entrega (${zone.name})`, 420, y, { align: "right" });
  doc.text(fmtKz(order.deliveryFee), 548, y, { align: "right" });
  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total", 420, y, { align: "right" });
  doc.text(fmtKz(order.total), 548, y, { align: "right" });

  y += 34;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Método de pagamento: ${form.payment}`, marginX, y);
  if (form.notes) { y += 16; doc.text(`Notas: ${form.notes}`, marginX, y); }

  doc.save(`pedido-${order.id}.pdf`);
}

function CheckoutView({ cart, onOrderComplete, onNav }) {
  const [form, setForm] = useState({
    name: "", phone: "", whatsapp: "", province: "Luanda", municipality: "",
    neighborhood: "", address: "", reference: "", zone: ZONES[0].id, payment: "Multicaixa Express", notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const zone = ZONES.find((z) => z.id === form.zone) || ZONES[0];
  const total = subtotal + zone.fee;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.name && form.phone && form.municipality && form.neighborhood && form.address;

  const buildWhatsAppMessage = () => {
    const lines = [
      `*Novo pedido — AyanaExpress*`,
      ``,
      `Cliente: ${form.name}`,
      `Telefone: ${form.phone}`,
      form.whatsapp ? `WhatsApp: ${form.whatsapp}` : null,
      ``,
      `*Produtos:*`,
      ...cart.map((i) => `• ${i.name} x${i.qty} — ${fmtKz(i.price * i.qty)}`),
      ``,
      `Subtotal: ${fmtKz(subtotal)}`,
      `Entrega (${zone.name}): ${fmtKz(zone.fee)}`,
      `*Total: ${fmtKz(total)}*`,
      ``,
      `*Endereço:*`,
      `${form.province}, ${form.municipality}, ${form.neighborhood}`,
      form.address,
      form.reference ? `Ponto de referência: ${form.reference}` : null,
      ``,
      `Pagamento: ${form.payment}`,
      form.notes ? `Notas: ${form.notes}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  };

  const handleSubmit = async () => {
    if (!valid || cart.length === 0) return;
    const order = {
      id: "AE" + Date.now().toString().slice(-8),
      date: new Date().toISOString(),
      items: cart, subtotal, deliveryFee: zone.fee, total, zone: zone.name,
      customer: form, status: "Pedido recebido",
    };
    const orders = await loadOrders();
    await saveOrders([order, ...orders]);
    if (SUPABASE_CONFIGURED) {
      try {
        await sb("orders", {
          method: "POST",
          body: JSON.stringify([{
            id: order.id, created_at: order.date, status: order.status,
            customer_name: form.name, phone: form.phone, whatsapp: form.whatsapp,
            province: form.province, municipality: form.municipality, neighborhood: form.neighborhood,
            address: form.address, reference: form.reference, zone: zone.name,
            payment: form.payment, notes: form.notes,
            items: order.items, subtotal: order.subtotal, delivery_fee: order.deliveryFee, total: order.total,
          }]),
        });
      } catch (e) { console.error("Não foi possível gravar o pedido no Supabase:", e); }
    }
    setSubmitted(true);
    setCompletedOrder(order);
    onOrderComplete(order);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle2 size={48} className="mx-auto mb-3" style={{ color: "#16A34A" }} />
        <h1 className="text-xl font-black mb-2" style={{ color: BRAND.black }}>Pedido registado!</h1>
        <p className="text-sm mb-6" style={{ color: "#5C5852" }}>
          Baixe o PDF do pedido e envie-o na conversa do WhatsApp para confirmarmos tudo mais rápido.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => downloadOrderPDF(completedOrder, form, zone)}
            className="w-full max-w-xs inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white"
            style={{ backgroundColor: BRAND.black }}
          >
            <Download size={18} /> Baixar PDF do pedido
          </button>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage())}`} target="_blank" rel="noopener noreferrer"
            className="w-full max-w-xs inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white" style={{ backgroundColor: "#22C55E" }}>
            <MessageCircle size={18} /> Abrir conversa no WhatsApp
          </a>
        </div>
        <p className="text-xs mt-4" style={{ color: "#8A8580" }}>
          Dica: depois de abrir o WhatsApp, toque no clipe 📎 e anexe o PDF que acabou de baixar.
        </p>
        <div>
          <button onClick={() => onNav("home")} className="mt-5 text-sm font-semibold" style={{ color: BRAND.red }}>Voltar à loja</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black mb-5" style={{ color: BRAND.black }}>Finalizar compra</h1>
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div className="flex flex-col gap-3">
          <Field label="Nome completo *"><input value={form.name} onChange={set("name")} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número de telefone *"><input value={form.phone} onChange={set("phone")} className="input" placeholder="9XX XXX XXX" /></Field>
            <Field label="WhatsApp"><input value={form.whatsapp} onChange={set("whatsapp")} className="input" placeholder="Se diferente" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Província"><input value={form.province} onChange={set("province")} className="input" /></Field>
            <Field label="Município *"><input value={form.municipality} onChange={set("municipality")} className="input" /></Field>
          </div>
          <Field label="Bairro *"><input value={form.neighborhood} onChange={set("neighborhood")} className="input" /></Field>
          <Field label="Endereço *"><input value={form.address} onChange={set("address")} className="input" /></Field>
          <Field label="Ponto de referência"><input value={form.reference} onChange={set("reference")} className="input" /></Field>
          <Field label="Zona de entrega">
            <select value={form.zone} onChange={set("zone")} className="input">
              {ZONES.map((z) => <option key={z.id} value={z.id}>{z.name} — {fmtKz(z.fee)}</option>)}
            </select>
          </Field>
          <Field label="Método de pagamento">
            <select value={form.payment} onChange={set("payment")} className="input">
              <option>Multicaixa Express</option>
              <option>Transferência bancária</option>
              <option>Pagamento na entrega</option>
            </select>
          </Field>
          <Field label="Notas do pedido"><textarea value={form.notes} onChange={set("notes")} className="input" rows={3} /></Field>
        </div>

        <div className="rounded-2xl border p-4 h-fit" style={{ borderColor: BRAND.line }}>
          <p className="font-bold text-sm mb-3" style={{ color: BRAND.ink }}>Resumo do pedido</p>
          <div className="flex flex-col gap-1.5 mb-3 max-h-40 overflow-y-auto">
            {cart.map((i) => (
              <div key={i.id} className="flex justify-between text-xs">
                <span style={{ color: "#5C5852" }}>{i.name} x{i.qty}</span>
                <span className="font-semibold">{fmtKz(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 flex flex-col gap-1" style={{ borderColor: BRAND.line }}>
            <div className="flex justify-between text-sm"><span style={{ color: "#5C5852" }}>Subtotal</span><span>{fmtKz(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: "#5C5852" }}>Entrega</span><span>{fmtKz(zone.fee)}</span></div>
            <div className="flex justify-between text-base font-black mt-1"><span>Total</span><span>{fmtKz(total)}</span></div>
          </div>
          <button onClick={handleSubmit} disabled={!valid || cart.length === 0}
            className="w-full mt-4 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40"
            style={{ backgroundColor: BRAND.red }}>
            Confirmar pedido
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold" style={{ color: "#5C5852" }}>{label}</span>
      {children}
    </label>
  );
}

/* ---------------- Favorites view ---------------- */
function FavoritesView({ favorites, onOpen, onAdd, onToggleFav }) {
  const products = PRODUCTS.filter((p) => favorites.includes(p.id));
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black mb-5" style={{ color: BRAND.black }}>Favoritos</h1>
      {products.length === 0 ? (
        <p className="text-sm" style={{ color: "#7A7570" }}>Ainda não guardou nenhum produto.</p>
      ) : (
        <ProductGrid products={products} onOpen={onOpen} onAdd={onAdd} favorites={favorites} onToggleFav={onToggleFav} />
      )}
    </div>
  );
}

/* ---------------- Account view ---------------- */
function AccountView({ orders }) {
  const [tab, setTab] = useState("orders");
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black mb-5" style={{ color: BRAND.black }}>Minha Conta</h1>
      <div className="flex gap-4 border-b mb-5" style={{ borderColor: BRAND.line }}>
        {[{ id: "orders", label: "Encomendas" }, { id: "profile", label: "Perfil" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="pb-2 text-sm font-semibold border-b-2"
            style={{ color: tab === t.id ? BRAND.red : "#8A8580", borderColor: tab === t.id ? BRAND.red : "transparent" }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "orders" && (
        orders.length === 0 ? (
          <p className="text-sm" style={{ color: "#7A7570" }}>Ainda não tem encomendas. Depois de finalizar pelo WhatsApp, o seu histórico aparece aqui.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl border p-4" style={{ borderColor: BRAND.line }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm" style={{ color: BRAND.ink }}>Pedido {o.id}</p>
                    <p className="text-xs" style={{ color: "#8A8580" }}>{new Date(o.date).toLocaleDateString("pt-PT")}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: BRAND.paper, color: BRAND.red }}>{o.status}</span>
                </div>
                <StatusTracker status={o.status} />
                <p className="text-sm font-black mt-2" style={{ color: BRAND.black }}>{fmtKz(o.total)}</p>
              </div>
            ))}
          </div>
        )
      )}
      {tab === "profile" && (
        <div className="rounded-2xl border p-5" style={{ borderColor: BRAND.line }}>
          <p className="text-sm" style={{ color: "#5C5852" }}>
            O registo e a autenticação de clientes (inscrição, login, "esqueci-me da password") precisam de um backend real com base de dados —
            este protótipo demonstra o fluxo de compra completo sem armazenar contas de utilizador.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusTracker({ status }) {
  const steps = ["Pedido recebido", "Confirmado", "Em preparação", "Enviado", "Entregue"];
  const idx = steps.indexOf(status);
  return (
    <div className="flex items-center mt-3">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: i <= idx ? BRAND.red : "#E7E3DF" }} />
          {i < steps.length - 1 && <div className="flex-1 h-0.5" style={{ backgroundColor: i < idx ? BRAND.red : "#E7E3DF" }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------------- Simple info pages ---------------- */
function InfoPage({ title, children }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black mb-4" style={{ color: BRAND.black }}>{title}</h1>
      <div className="text-sm leading-relaxed" style={{ color: "#5C5852" }}>{children}</div>
    </div>
  );
}

/* ============================================================
   App root
   ============================================================ */
export default function App() {
  const [view, setView] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [backendStatus, setBackendStatus] = useState(SUPABASE_CONFIGURED ? "loading" : "demo");

  useEffect(() => {
    (async () => {
      const [c, f, o] = await Promise.all([loadCart(), loadFavorites(), loadOrders()]);
      setCart(c); setFavorites(f); setOrders(o); setLoaded(true);
    })();
  }, []);
  useEffect(() => { if (loaded) saveCart(cart); }, [cart, loaded]);
  useEffect(() => { if (loaded) saveFavorites(favorites); }, [favorites, loaded]);

  // Se o Supabase estiver configurado, substitui os dados de demonstração
  // (PRODUCTS / CATEGORIES / ZONES) pelos dados reais da base de dados.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    (async () => {
      try {
        const [prod, cats, zones, settingsRows, testiRows] = await Promise.all([
          sb("products?select=*&order=created_at.desc"),
          sb("categories?select=*&order=name.asc"),
          sb("delivery_zones?select=*&order=fee.asc"),
          sb("store_settings?id=eq.1&select=*"),
          sb("testimonials?status=eq.approved&select=*&order=created_at.desc&limit=9"),
        ]);
        if (prod) PRODUCTS = prod.map((p) => ({
          ...p,
          images: Array.isArray(p.images) && p.images.length ? p.images : [p.image || "https://picsum.photos/seed/" + p.id + "/600/600"],
          oldPrice: p.old_price ?? null,
          desc: p.description || "",
          features: Array.isArray(p.features) ? p.features : [],
          rating: p.rating ?? 4.5,
          reviews: p.reviews ?? 0,
          tag: p.tag || null,
        }));
        if (cats) CATEGORIES = cats.map((c) => ({ id: c.slug || c.id, name: c.name, img: c.image || "https://picsum.photos/seed/" + c.id + "/400/300" }));
        if (zones) ZONES = zones.map((z) => ({ id: z.id, name: z.name, fee: z.fee }));
        if (settingsRows && settingsRows[0]) STORE_SETTINGS = { ...STORE_SETTINGS, ...settingsRows[0] };
        if (testiRows && testiRows.length) TESTIMONIALS = testiRows.map((t) => ({ name: t.customer_name, city: t.city || "", rating: t.rating || 5, text: t.text }));
        setBackendStatus("live");
        setDataVersion((v) => v + 1);
      } catch (e) {
        console.error("Falha ao ligar ao Supabase, a usar dados de demonstração:", e);
        setBackendStatus("error");
      }
    })();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1800); };

  const addToCart = useCallback((product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.images[0], qty }];
    });
    showToast("Adicionado ao carrinho ✓");
  }, []);

  const buyNow = useCallback((product, qty) => {
    addToCart(product, qty);
    setView("checkout");
    window.scrollTo(0, 0);
  }, [addToCart]);

  const updateQty = (id, qty) => {
    if (qty < 1) return setCart((prev) => prev.filter((i) => i.id !== id));
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  };
  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));
  const toggleFav = (id) => setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);

  const openProduct = (id) => { setSelectedProduct(id); setView("product"); window.scrollTo(0, 0); };
  const openCategory = (id) => { setSelectedCategory(id); setView("shop"); window.scrollTo(0, 0); };
  const nav = (v) => {
    if (v === "search") { setView("shop"); return; }
    setSelectedCategory(null);
    setView(v);
    window.scrollTo(0, 0);
  };
  const onOrderComplete = async (order) => {
    setOrders((prev) => [order, ...prev]);
    setCart([]);
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: "white", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Manrope:wght@700;800&display=swap');
        h1, h2, .font-black { font-family: 'Manrope', 'Inter', sans-serif; }
        .input { border:1px solid ${BRAND.line}; border-radius:12px; padding:10px 12px; font-size:14px; outline:none; width:100%; }
        .input:focus { border-color: ${BRAND.red}; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>

      <Header cartCount={cartCount} onNav={nav} onSearch={setSearchQuery} searchQuery={searchQuery} view={view} />

      <div key={dataVersion}>
      {view === "home" && (
        <HomeView onNav={nav} onOpenProduct={openProduct} onAdd={addToCart} favorites={favorites} onToggleFav={toggleFav} onOpenCategory={openCategory} />
      )}
      {view === "shop" && (
        <ShopView initialCategory={selectedCategory} searchQuery={searchQuery} onOpenProduct={openProduct} onAdd={addToCart} favorites={favorites} onToggleFav={toggleFav} />
      )}
      {view === "promotions" && (
        <ShopView initialCategory="all" searchQuery={""} onOpenProduct={openProduct} onAdd={addToCart} favorites={favorites} onToggleFav={toggleFav} onlyPromotions />
      )}
      {view === "categories" && <CategoriesView onOpenCategory={openCategory} />}
      {view === "product" && (
        <ProductView productId={selectedProduct} onBack={() => nav("shop")} onAdd={addToCart} onBuyNow={buyNow} favorites={favorites} onToggleFav={toggleFav} onOpenProduct={openProduct} />
      )}
      {view === "cart" && <CartView cart={cart} onUpdateQty={updateQty} onRemove={removeFromCart} onNav={nav} />}
      {view === "checkout" && <CheckoutView cart={cart} onOrderComplete={onOrderComplete} onNav={nav} />}
      {view === "favorites" && <FavoritesView favorites={favorites} onOpen={openProduct} onAdd={addToCart} onToggleFav={toggleFav} />}
      {view === "account" && <AccountView orders={orders} />}
      {view === "contact" && (
        <InfoPage title="Contactos">
          <p>WhatsApp: +244 976 340 762</p>
          <p className="mt-2">Atendimento: Segunda a Sábado, 8h–19h.</p>
          <p className="mt-2">Luanda, Angola.</p>
        </InfoPage>
      )}
      {view === "about" && (
        <InfoPage title="Sobre nós">
          <p>A AyanaExpress é uma loja online criada para facilitar as compras em Luanda: produtos selecionados, preços justos e entrega rápida diretamente à sua porta.</p>
        </InfoPage>
      )}
      {view === "delivery" && (
        <InfoPage title="Entrega">
          <p>Entregamos em Luanda em 24 a 48 horas, consoante a zona:</p>
          <ul className="mt-3 space-y-1">
            {ZONES.map((z) => <li key={z.id}>• {z.name} — {fmtKz(z.fee)}</li>)}
          </ul>
        </InfoPage>
      )}
      </div>

      <Footer onNav={nav} backendStatus={backendStatus} />
      <WhatsAppFloat />
      <MobileNav view={view} onNav={nav} cartCount={cartCount} />
      <div className="h-16 md:hidden" />

      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg" style={{ backgroundColor: BRAND.black }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LIGAÇÃO AO SUPABASE — já preparada neste ficheiro
   ============================================================
   1. Crie um projeto gratuito em supabase.com.
   2. No SQL editor, corra o ficheiro schema.sql fornecido.
   3. Em Project Settings → API, copie "Project URL" e a chave
      "anon public" e cole-as em SUPABASE_URL / SUPABASE_ANON_KEY
      no topo deste ficheiro.
   4. Ao recarregar, a loja passa a ler produtos, categorias e
      zonas de entrega diretamente da base de dados, e cada
      encomenda finalizada é gravada na tabela `orders`.
   Sem estes dois valores preenchidos, a loja continua a
   funcionar normalmente com os dados de demonstração abaixo.

   AINDA POR LIGAR (fora do alcance de um frontend em artifact):
   - Autenticação real de clientes (Supabase Auth) — o "Perfil"
     e a conta de cliente continuam a ser um mock.
   - Pagamento real (Multicaixa Express, etc.) — precisa de um
     fornecedor de pagamentos angolano credenciado; nunca simular
     transações reais.
   - Qualquer chave secreta (não a "anon public") deve viver no
     servidor (ex: Supabase Edge Functions), nunca no frontend.
   ============================================================ */
