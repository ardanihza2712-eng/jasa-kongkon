# JASA KONGKON — Gemolong dan sekitarnya

Website pesanan dengan dashboard admin, pelacakan pesanan, bill cetak/simpan PDF, ekspor CSV, dan tombol WhatsApp.

## Deploy ke Render
- Buat Web Service dari repository GitHub ini.
- Runtime: Node.
- Build Command: `npm install`
- Start Command: `npm start`
- Tambahkan Environment Variables: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `ADMIN_WHATSAPP`, `SECONDARY_WHATSAPP`.
- Gunakan password admin kuat dan SESSION_SECRET panjang yang unik. Jangan memakai nilai contoh.

## Catatan penting
Penyimpanan pesanan saat ini menggunakan file JSON lokal. Untuk penggunaan produksi di Render, gunakan persistent disk atau pindahkan database ke PostgreSQL/Supabase; tanpa penyimpanan persisten, data dapat hilang saat layanan di-redeploy. Uji alur pesanan dan admin sebelum dipakai pelanggan.
