# Banda Pustaka

Toko produk digital dengan tampilan statis serta fondasi produksi Supabase + Netlify Functions.

## Deploy ke Netlify

1. Masuk ke Netlify dan pilih **Add new site → Deploy manually**.
2. Seret folder `banda-pustaka` ini ke halaman deploy.
3. Situs selesai dibuat dan dapat diberi domain sendiri.

## Demo admin

- PIN: `banda212`
- Username: `admin212`
- Password: `tasik212`

## Versi produksi

Ikuti [panduan Supabase lengkap](PANDUAN-SUPABASE-LENGKAP.md). Database, transaksi, dan file kemudian tidak bergantung pada cache atau riwayat browser pengunjung. File digital tetap privat dan hanya dibuatkan tautan sementara untuk pesanan berstatus `paid`.

Untuk langkah khusus mengunggah e-book, template, audio, video, dan sampul, baca [panduan upload produk](PANDUAN-UPLOAD-PRODUK.md).

## Aktifkan upload dari dasbor

Jalankan sekali [enable-admin-uploads.sql](supabase/enable-admin-uploads.sql) melalui Supabase SQL Editor. Setelah itu, admin dapat login dengan akun Supabase dan mengunggah file produk beserta sampul langsung dari dasbor aplikasi. File produk disimpan privat di `digital-files` dan gambar sampul ke `covers`.

## Catatan penting

Tampilan demo saat ini menyimpan katalog, keranjang, transaksi, dan jumlah pengunjung di browser perangkat yang membuka situs (localStorage); tidak dibagikan antar pengguna. Kredensial demo juga terlihat di kode klien dan **tidak aman untuk produksi**. Gunakan akun Supabase Auth yang dijelaskan dalam panduan produksi.

Verifikasi bukti transfer dari gambar tidak dapat membuktikan pembayaran secara aman. Untuk toko sungguhan, hubungkan backend / Netlify Functions dengan payment gateway yang menyediakan webhook (misalnya Midtrans atau Xendit). Webhook tersebut menjadi sumber status pembayaran dan baru membuka tautan unduhan setelah pembayaran benar-benar terkonfirmasi.
