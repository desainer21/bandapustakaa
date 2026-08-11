# Midtrans: pembayaran otomatis Banda Pustaka

Aplikasi ini memakai halaman pembayaran aman Midtrans. Sistem **tidak** menyimpulkan pembayaran dari screenshot. Tombol unduh hanya terbuka ketika webhook Midtrans dengan signature yang valid menyatakan transaksi `settlement` atau `capture` yang diterima.

## 1. Jalankan SQL

Buka Supabase > SQL Editor, salin semua isi `supabase/midtrans.sql`, lalu klik **Run**.

## 2. Dapatkan Server Key Sandbox

1. Masuk ke Dashboard Midtrans dan pilih mode **Sandbox**.
2. Buka **Settings > Access Keys**.
3. Salin **Server Key**. Jangan masukkan key ini ke GitHub, `public-config.js`, atau chat.

## 3. Netlify Environment Variables

Di Netlify > Project configuration > Environment variables, tambahkan:

| Key | Nilai | Secret |
| --- | --- | --- |
| `MIDTRANS_SERVER_KEY` | Server Key Midtrans Sandbox | Ya |
| `MIDTRANS_IS_PRODUCTION` | `false` | Tidak |

Simpan lalu deploy ulang situs.

## 4. Pasang alamat webhook

Di Dashboard Midtrans Sandbox, buka pengaturan notifikasi/Payment Notification URL dan masukkan:

```text
https://NAMA-SITUS-ANDA.netlify.app/.netlify/functions/midtrans-webhook
```

Ganti `NAMA-SITUS-ANDA.netlify.app` dengan domain Netlify toko Anda. Simpan pengaturan tersebut.

## 5. Uji Sandbox

1. Di toko, tambahkan produk dan tekan **Lanjutkan ke pembayaran**.
2. Halaman Midtrans terbuka. Pilih metode uji yang disediakan Midtrans.
3. Setelah status sukses, Midtrans memanggil webhook.
4. Kembali ke halaman pesanan: tombol **Unduh produk** otomatis muncul.

## Produksi

Setelah akun merchant Midtrans dan kanal pembayaran (DANA/OVO/GoPay) disetujui, ubah variabel berikut di Netlify:

- `MIDTRANS_SERVER_KEY`: Server Key Production.
- `MIDTRANS_IS_PRODUCTION`: `true`.

Pastikan Payment Notification URL produksi tetap mengarah ke fungsi webhook di atas. Metode yang tampil pada halaman Midtrans bergantung pada kanal yang telah diaktifkan untuk akun merchant Anda.