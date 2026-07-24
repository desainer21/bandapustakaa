# Panduan Web Push Banda Pustaka

Fitur ini mengirim pemberitahuan ke perangkat yang sudah menekan tombol **Aktifkan notifikasi**:

- Admin menerima notifikasi ketika pesanan baru dibuat.
- Pembeli menerima notifikasi ketika admin mengonfirmasi pembayaran.

Notifikasi tidak membutuhkan nomor WhatsApp pembeli. Pembeli membuka halaman pesanan, lalu mengizinkan notifikasi pada perangkatnya sendiri. Setiap perangkat harus diaktifkan satu kali.

## 1. Jalankan SQL

1. Buka Supabase > **SQL Editor** > **New query**.
2. Buka file `supabase/push-subscriptions.sql` dari proyek ini.
3. Salin seluruh isi file, tempel, lalu klik **Run**.

Tabel `push_subscriptions` akan menyimpan alamat subscription perangkat secara aman. Tidak ada policy publik sehingga browser lain tidak dapat membaca data tersebut.

## 2. Buat VAPID key

Di komputer, buka Terminal atau PowerShell pada folder proyek, kemudian jalankan:

```powershell
npm install
npx web-push generate-vapid-keys
```

Perintah ini menampilkan tiga nilai. Simpan dengan aman. Jangan kirim atau unggah nilai private key ke GitHub.

## 3. Tambahkan Environment Variables Netlify

Netlify > situs Banda Pustaka > **Project configuration** > **Environment variables** > **Add a variable**.

Buat tiga variabel berikut, gunakan nilai hasil langkah sebelumnya:

| Key | Nilai | Secret |
| --- | --- | --- |
| `VAPID_PUBLIC_KEY` | Public Key | Tidak wajib secret |
| `VAPID_PRIVATE_KEY` | Private Key | Centang **Contains secret values** |
| `VAPID_SUBJECT` | `mailto:email-Anda@contoh.com` | Tidak |

Jangan mengubah `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` yang sudah ada. Setelah semua nilai tersimpan, buka **Deploys** > **Trigger deploy** > **Deploy site**.

## 4. Cara mengaktifkan dan menguji

1. Admin login, buka dasbor, klik **Aktifkan notifikasi**, lalu pilih **Allow/Izinkan** pada browser.
2. Pembeli buat pesanan sampai halaman tunggu terbuka, lalu klik **Aktifkan notifikasi pesanan** dan pilih **Izinkan**.
3. Admin menekan **Konfirmasi** pada transaksi yang sama.
4. Pembeli mendapat notifikasi dan ketika ditekan akan menuju halaman pesanan untuk mengunduh produk.

Jika tombol tidak berfungsi, pastikan situs dibuka melalui alamat `https://...netlify.app`, bukan file lokal atau HTTP biasa. Di iPhone/iPad, notifikasi web umumnya perlu situs dipasang ke Home Screen terlebih dahulu lalu dijalankan dari ikon aplikasi.

## Keamanan

- VAPID private key dan Supabase service-role key adalah rahasia server. Jangan masukkan keduanya ke `public-config.js`, HTML, atau GitHub.
- Persetujuan notifikasi berada di tangan pengguna; aplikasi tidak boleh mengaktifkan notifikasi tanpa tombol dan izin browser.
- Jika pengguna berganti perangkat atau menghapus data browser, ia perlu menekan tombol aktifkan notifikasi lagi.