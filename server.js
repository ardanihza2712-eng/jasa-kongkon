const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "orders.json");
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ganti-password-admin";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-change-this-secret";
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || "6285700294517";
const SECONDARY_WHATSAPP = process.env.SECONDARY_WHATSAPP || "6282137943607";

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ orders: [] }, null, 2));

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return { orders: [] }; }
}
function writeDB(db) {
  const temp = DB_FILE + ".tmp";
  fs.writeFileSync(temp, JSON.stringify(db, null, 2));
  fs.renameSync(temp, DB_FILE);
}
function adminOnly(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Silakan login sebagai admin terlebih dahulu." });
}
function safeText(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}
function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "").slice(0, 24);
}
function makeCode() {
  const d = new Date();
  const stamp = [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("");
  return "JK-" + stamp + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}
function calculate(serviceId, extraStops) {
  const service = SERVICES.find(s => s.id === serviceId);
  if (!service) return null;
  return { service, basePrice: service.price, extraStops, extraCost: extraStops * 3000, total: service.price + extraStops * 3000 };
}
const SERVICES = [
  { id:"makanan", name:"Food / Makanan", price:12000, description:"Ambil dan antar makanan/minuman" },
  { id:"barang", name:"Antar Barang", price:12000, description:"Pengantaran barang ukuran wajar" },
  { id:"toko", name:"Belanja Toko", price:12000, description:"Titip beli barang di toko" },
  { id:"pasar", name:"Belanja Pasar", price:18000, description:"Titip belanja kebutuhan pasar" },
  { id:"transaksi", name:"Transaksi / Uang", price:18000, description:"Bantuan transaksi sesuai kesepakatan" },
  { id:"pp", name:"Orderan PP", price:18000, description:"Pesanan pulang-pergi" },
  { id:"ojek", name:"NgOjek Orang", price:20000, description:"Antar jemput orang" },
  { id:"lainnya", name:"Lainnya", price:12000, description:"Kebutuhan lain sesuai kesepakatan" }
];

app.set("trust proxy", 1);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: "jk_admin_session",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/config", (req, res) => res.json({
  storeName: process.env.STORE_NAME || "JASA KONGKON",
  area: process.env.STORE_AREA || "Gemolong dan sekitarnya",
  adminWhatsApp: ADMIN_WHATSAPP,
  secondaryWhatsApp: SECONDARY_WHATSAPP,
  services: SERVICES,
  extraStopPrice: 3000
}));

app.post("/api/orders", (req, res) => {
  const body = req.body || {};
  const customerName = safeText(body.customerName, 100);
  const phone = normalizePhone(body.phone);
  const serviceId = safeText(body.serviceId, 40);
  const pickup = safeText(body.pickup, 300);
  const destination = safeText(body.destination, 300);
  const details = safeText(body.details, 700);
  const notes = safeText(body.notes, 500);
  const extraStops = Math.max(0, Math.min(10, Number.parseInt(body.extraStops, 10) || 0));
  if (!customerName || !phone || !pickup || !destination || !serviceId) {
    return res.status(400).json({ error: "Nama, WhatsApp, layanan, alamat jemput, dan tujuan wajib diisi." });
  }
  if (phone.replace(/\D/g, "").length < 9) return res.status(400).json({ error: "Nomor WhatsApp pelanggan kurang lengkap." });
  const estimate = calculate(serviceId, extraStops);
  if (!estimate) return res.status(400).json({ error: "Jenis layanan tidak valid." });
  const now = new Date().toISOString();
  const order = {
    id: crypto.randomUUID(), code: makeCode(), createdAt: now, updatedAt: now,
    customerName, phone, serviceId, serviceName: estimate.service.name,
    basePrice: estimate.basePrice, extraStops, extraCost: estimate.extraCost,
    total: estimate.total, pickup, destination, details, notes,
    status: "Menunggu konfirmasi", finalPrice: null, adminNote: ""
  };
  const db = readDB();
  db.orders.unshift(order);
  writeDB(db);
  res.status(201).json({ order, adminWhatsApp: ADMIN_WHATSAPP, secondaryWhatsApp: SECONDARY_WHATSAPP });
});

app.get("/api/orders/:code", (req, res) => {
  const order = readDB().orders.find(o => o.code.toLowerCase() === String(req.params.code).toLowerCase());
  if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan." });
  // Public tracking excludes internal admin note.
  const { adminNote, ...publicOrder } = order;
  res.json({ order: publicOrder });
});

app.post("/api/admin/login", (req, res) => {
  const username = safeText(req.body?.username, 100);
  const password = String(req.body?.password || "");
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Username atau password salah." });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: "Gagal membuat sesi login." });
    req.session.isAdmin = true;
    req.session.username = username;
    req.session.save(err2 => {
      if (err2) return res.status(500).json({ error: "Gagal menyimpan sesi login." });
      res.json({ ok: true, username });
    });
  });
});
app.post("/api/admin/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/admin/me", (req, res) => res.json({ isAdmin: Boolean(req.session?.isAdmin), username: req.session?.username || null }));
app.get("/api/admin/orders", adminOnly, (req, res) => res.json({ orders: readDB().orders }));
app.patch("/api/admin/orders/:id", adminOnly, (req, res) => {
  const allowed = ["Menunggu konfirmasi", "Dikonfirmasi", "Sedang dikerjakan", "Selesai", "Dibatalkan"];
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id || o.code === req.params.id);
  if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan." });
  const status = safeText(req.body?.status, 50);
  if (status && !allowed.includes(status)) return res.status(400).json({ error: "Status tidak valid." });
  if (status) order.status = status;
  if (req.body?.finalPrice !== undefined) {
    const price = Number(req.body.finalPrice);
    if (!Number.isFinite(price) || price < 0 || price > 100000000) return res.status(400).json({ error: "Tarif final tidak valid." });
    order.finalPrice = Math.round(price);
  }
  if (req.body?.adminNote !== undefined) order.adminNote = safeText(req.body.adminNote, 700);
  order.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ order });
});
app.get("/api/admin/export.csv", adminOnly, (req, res) => {
  const orders = readDB().orders;
  const cells = [["Kode","Tanggal","Nama","WhatsApp","Layanan","Tarif dasar","Titik ekstra","Biaya ekstra","Estimasi","Tarif final","Status","Jemput","Tujuan","Detail","Catatan admin"]];
  for (const o of orders) cells.push([o.code,o.createdAt,o.customerName,o.phone,o.serviceName,o.basePrice,o.extraStops,o.extraCost,o.total,o.finalPrice ?? "",o.status,o.pickup,o.destination,o.details,o.adminNote]);
  const csv = cells.map(row => row.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="jasa-kongkon-orders.csv"');
  res.send("\uFEFF" + csv);
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`JASA KONGKON berjalan di http://localhost:${PORT}`));
