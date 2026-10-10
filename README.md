# JASA KONGKON — Sistem Pesanan Full (starter)

Website pemesanan untuk JASA KONGKON, area Gemolong dan sekitarnya. Paket ini berisi frontend, API backend Node.js, penyimpanan pesanan di file JSON, login admin, dashboard, ekspor CSV, pelacakan kode pesanan, bill estimasi/final yang bisa dicetak atau disimpan sebagai PDF, dan tombol WhatsApp dengan pesan yang sudah disiapkan.

## Tarif layanan bawaan
- Food / Makanan — Rp12.000
- Antar Barang — Rp12.000
- Belanja Toko — Rp12.000
- Belanja Pasar — Rp18.000
- Transaksi / Uang — Rp18.000
- Orderan PP — Rp18.000
- NgOjek Orang — Rp20.000
- Lainnya — Rp12.000
- Titik tambahan — Rp3.000 per tempat
- Tidak ada biaya tunggu bawaan

Tarif ini adalah tarif dasar/estimasi. Admin perlu mengonfirmasi tarif final sebelum pekerjaan dimulai.

## Jalankan di komputer untuk pengujian
1. Instal Node.js versi 18 atau lebih baru dari https://nodejs.org/
2. Ekstrak ZIP ke folder.
3. Buka Terminal/Command Prompt di folder hasil ekstrak.
4. Jalankan `npm install`.
5. Salin `.env.example` menjadi `.env`.
6. Ubah `ADMIN_PASSWORD` dan `SESSION_SECRET` di `.env` menjadi nilai rahasia milikmu.
7. Jalankan `npm start`.
8. Buka `http://localhost:3000`. Dashboard admin ada di `http://localhost:3000/admin.html`.

Login admin default dari `.env.example`: username `admin`, password `ganti-password-admin-yang-kuat`. Jangan gunakan password contoh tersebut saat online.

## Cara kerja WhatsApp
- Setelah pesanan tersimpan, bill/pratinjau muncul dan tombol “Kirim lewat WhatsApp” membuka WhatsApp dengan teks pesanan yang sudah disiapkan untuk admin.
- Dashboard admin punya tombol WhatsApp pelanggan untuk menyiapkan update status/tagihan.
- Ini bukan pengiriman otomatis tanpa sentuhan. Browser hanya membuka WhatsApp; pengguna masih perlu menekan tombol kirim.
- Pengiriman otomatis penuh (tanpa klik) memerlukan WhatsApp Business Platform/API, nomor bisnis yang disetujui, token API, template pesan bila diwajibkan, serta konfigurasi webhook. Tidak ada kredensial API yang disertakan di ZIP.

## Penyimpanan dan keamanan — baca sebelum online
- Untuk pengujian satu server, pesanan disimpan ke `data/orders.json`.
- Jangan jalankan beberapa instance server yang menulis ke file JSON yang sama secara bersamaan.
- Untuk hosting cloud, gunakan persistent disk/volume dan atur `DATA_DIR` ke direktori disk persisten. Tanpa disk persisten, beberapa platform hosting bisa menghapus data saat deploy/restart.
- File JSON ini adalah penyimpanan starter sederhana, bukan database produksi yang kuat untuk banyak pengguna. Untuk penggunaan komersial, migrasikan ke PostgreSQL/Supabase atau database managed dengan backup dan kontrol akses.
- Login admin menggunakan session cookie; wajib ganti `ADMIN_PASSWORD` dan `SESSION_SECRET`, aktifkan HTTPS, dan jangan membagikan akses admin.
- Endpoint admin dilindungi sesi. Namun sebelum penggunaan komersial, tambahkan perlindungan brute-force/rate limit, logging, backup, kebijakan privasi, validasi tambahan, serta pengujian keamanan.
- Pesanan berisi nama, nomor WhatsApp, dan alamat pelanggan. Batasi akses dan simpan hanya selama diperlukan.

## Deploy online mulai dari nol (gambaran)
1. Buat akun GitHub, buat repository baru, lalu unggah isi folder ini (jangan unggah `.env` atau data pelanggan).
2. Pilih hosting Node.js yang mendukung aplikasi web dan persistent disk. Atur build command `npm install`, start command `npm start`.
3. Tambahkan environment variables dari `.env.example` di panel hosting. Set `NODE_ENV=production`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, dan `DATA_DIR` sesuai direktori persistent disk.
4. Aktifkan HTTPS, lakukan tes pemesanan dan dashboard admin, lalu atur domain khusus jika sudah punya.
5. Untuk WhatsApp otomatis, daftarkan dan konfigurasi WhatsApp Business Platform/API secara terpisah.

Paket ini bisa diuji lokal setelah Node.js terpasang, tetapi belum menjadi layanan cloud aktif. ZIP tidak membuat akun hosting, database managed, domain, atau WhatsApp Business API atas nama pemilik.
