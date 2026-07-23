# Mengaktifkan Banda Pustaka untuk toko sungguhan

Folder ini sudah berisi database schema dan Netlify Functions. Tanpa konfigurasi berikut, tampilan toko tetap berjalan sebagai demo lokal.

## 1. Siapkan Supabase

1. Buat project Supabase baru.
2. Buka **SQL Editor**, tempel seluruh isi `supabase/schema.sql`, lalu jalankan.
3. Di **Storage**, unggah file digital ke bucket privat `digital-files` dan catat path-nya (mis. `ebook/menulis.pdf`). Buat/unggah gambar ke bucket `covers`.
4. Di **Authentication > Users**, buat akun admin memakai email dan password kuat.
5. Tetapkan `app_metadata.role` akun tersebut menjadi `admin` melalui Admin API atau dashboard yang mendukung pengaturan metadata. Jangan gunakan `user_metadata` karena pengguna dapat mengubahnya sendiri.

## 2. Deploy ke Netlify

1. Upload folder ini melalui **Add new site > Deploy manually**, atau hubungkan ke Git.
2. Di **Site configuration > Environment variables**, buat:

   - `SUPABASE_URL`: URL project Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: service role key Supabase

3. Deploy ulang agar Netlify Functions aktif.

`SUPABASE_SERVICE_ROLE_KEY` sangat rahasia. Jangan pernah dimasukkan ke `index.html`, JavaScript browser, Git, atau dikirim kepada pembeli.

## 3. Alur pembayaran aman

Fungsi `create-order` menerima bukti transfer, menghitung harga ulang dari database, menyimpan pesanan dan bukti secara privat. Admin memeriksa bukti lalu mengubah `orders.status` menjadi `paid` di Supabase. Pembeli dapat menerima alamat:

`https://DOMAIN-ANDA/.netlify/functions/download?token=TOKEN_PESANAN`

Fungsi unduhan akan mengeluarkan tautan privat yang hanya berlaku 10 menit dan hanya bila status pesanan `paid`.

Untuk pemberian akses otomatis tanpa pemeriksaan admin, gunakan payment gateway resmi yang mendukung webhook dan buat fungsi webhook yang memvalidasi signature gateway sebelum mengubah status menjadi `paid`. Jangan membuat status bayar hanya dari OCR/tanggal/jam pada gambar: itu tidak dapat membuktikan transfer asli.
