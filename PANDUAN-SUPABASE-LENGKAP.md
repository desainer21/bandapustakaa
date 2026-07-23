# Panduan lengkap Supabase untuk Banda Pustaka

Panduan ini menyiapkan penyimpanan produk dan transaksi agar tidak bergantung pada browser. Waktu pengerjaan biasanya 20–40 menit, tidak termasuk mengunggah file produk.

## Sebelum mulai

Siapkan:

- alamat email pemilik toko;
- password admin yang panjang dan unik (minimal 14 karakter);
- file produk asli (PDF, ZIP, MP3, MP4, dan sebagainya);
- gambar sampul produk; dan
- folder aplikasi [banda-pustaka](./).

Jangan pernah membagikan key yang bernama `sb_secret_...`, `service_role`, atau password database. Key tersebut dapat melewati aturan keamanan database.

## A. Membuat project

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) lalu masuk/daftar.
2. Pilih organisasi Anda, klik **New project**.
3. Isi nama, misalnya `banda-pustaka-prod`, pilih region terdekat dengan mayoritas pelanggan, dan buat **Database Password** yang kuat. Simpan password ini di password manager.
4. Klik **Create new project**, lalu tunggu hingga status project siap.
5. Di **Project Settings → API**, simpan `Project URL` untuk konfigurasi Netlify nanti. Jangan masukkan secret/service-role key ke kode browser.

## B. Membuat tabel dan aturan keamanan

1. Buka **SQL Editor → New query**.
2. Buka [supabase/schema.sql](supabase/schema.sql) dari folder aplikasi, salin seluruh isinya, tempel ke editor, lalu klik **Run**.
3. Pastikan muncul tabel `products`, `orders`, dan `order_items` di **Table Editor**.
4. Pada **Database → Policies**, pastikan RLS aktif pada ketiga tabel tersebut. Script sudah mengaktifkannya.

RLS penting karena tabel pada schema `public` bisa diakses melalui API. Aturan aplikasi ini hanya membuka pembacaan produk yang aktif untuk pengunjung. Data transaksi hanya dapat dibaca/diperbarui oleh admin. Supabase juga menekankan bahwa `app_metadata` layak dipakai untuk otorisasi, sedangkan `user_metadata` tidak aman untuk peran akses karena dapat diubah pengguna. [Dokumentasi RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [dokumentasi Users](https://supabase.com/docs/guides/auth/users).

## C. Menyiapkan Storage

Script SQL membuat tiga bucket bila belum ada. Periksa melalui **Storage**:

| Bucket | Visibilitas | Isi |
|---|---|---|
| `covers` | Public | gambar sampul produk; aman ditampilkan di katalog |
| `digital-files` | Private | e-book, ZIP template, audio/video, installer; tidak boleh public |
| `payment-proofs` | Private | bukti transfer pembeli; tidak boleh public |

Jika bucket belum tampak, buat satu per satu di **Storage → New bucket** dengan nama persis di atas. Nyalakan **Public bucket** hanya pada `covers`; dua lainnya harus tetap nonaktif. Storage memakai kebijakan RLS untuk mengontrol akses file; bucket tanpa policy tidak menerima upload dari klien. [Dokumentasi Storage](https://supabase.com/docs/guides/storage), [akses Storage](https://supabase.com/docs/guides/storage/security/access-control).

### Unggah file produk

1. Masuk ke `digital-files` lalu **Upload file**.
2. Buat struktur yang rapi, contohnya `ebook/menulis-yang-menjual-v1.pdf` atau `template/notion-life-planner.zip`.
3. Catat **Full path** file; ini yang dipakai pada kolom `file_path` di tabel `products`.
4. Unggah sampul ke `covers`, misalnya `covers/menulis-yang-menjual.jpg`. Salin public URL-nya untuk `cover_url`.

Jangan unggah file produk ke `covers` dan jangan membuat `digital-files` public. Sistem akan membuat URL bertanda tangan yang berlaku 10 menit, hanya sesudah pesanan berstatus `paid`.

## D. Menambahkan produk pertama

Di **Table Editor → products → Insert row**, isi contoh berikut:

| Kolom | Contoh |
|---|---|
| `name` | Menulis yang Menjual |
| `category` | E-book |
| `price` | 35000 |
| `description` | Panduan praktis menulis copy yang jelas dan menjual. |
| `cover_url` | URL public file sampul di bucket `covers` |
| `file_path` | `ebook/menulis-yang-menjual-v1.pdf` |
| `is_active` | aktif |

Harga disimpan dalam rupiah penuh: tulis `35000`, bukan `35.000` atau `35000.00`.

## E. Membuat akun admin dengan aman

1. Buka **Authentication → Users → Add user → Create new user**.
2. Masukkan email admin dan password unik. Untuk produksi, aktifkan konfirmasi email dan verifikasi alamat email tersebut.
3. Di **SQL Editor**, jalankan query ini. Ganti alamat email terlebih dahulu:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
where email = 'EMAIL-ADMIN-ANDA@CONTOH.COM';
```

4. Pastikan hasil query menunjukkan satu baris berubah. Setelah itu admin harus logout lalu login kembali agar token JWT baru memuat peran `admin`.
5. Aktifkan MFA untuk akun admin melalui pengaturan Authentication bila tersedia pada paket/proyek Anda.

`raw_app_meta_data` hanya boleh diubah dari lingkungan tepercaya (Dashboard, SQL Editor yang terbatas, atau fungsi server dengan secret key). Jangan membuat form yang mengizinkan pengguna mengubah field ini.

## F. Menyambungkan ke Netlify

1. Deploy folder aplikasi ke Netlify melalui Git lebih disarankan, karena folder `netlify/functions` harus ikut terunggah. Jika memakai drag-and-drop, pastikan metode tersebut mendukung Functions atau deploy repository Git.
2. Di **Netlify → Site configuration → Environment variables**, buat variabel berikut:

   - `SUPABASE_URL` = Project URL dari Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = secret/service role key dari **Project Settings → API**

3. Klik deploy ulang.
4. Jangan menaruh kedua nilai di file `app.js`, HTML, frontend config, maupun repository. `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dibaca oleh Netlify Function.

## G. Menguji alur transaksi server

Fungsi server sudah tersedia. Setelah antarmuka checkout dihubungkan ke fungsi `create-order`, lakukan tes berikut. Jangan menerima pembeli sebelum tes ini selesai.

1. Kirim pesanan uji ke `/.netlify/functions/create-order` menggunakan data produk yang ada di tabel `products`.
2. Di Supabase, buka `orders`. Pastikan ada baris baru dengan `status = pending`, total sesuai harga database, dan bukti ada di `payment-proofs`.
3. Setelah pembayaran memang masuk dan cocok, ubah `status` menjadi `paid` serta isi `paid_at` dengan waktu sekarang.
4. Ambil `access_token` dari pesanan dan buka:

```text
https://NAMA-SITUS-ANDA.netlify.app/.netlify/functions/download?token=ACCESS_TOKEN
```

5. Fungsi akan mengembalikan link unduhan terbatas waktu. Sebelum status `paid`, akses harus ditolak.

## H. Checklist keamanan sebelum menerima pembeli

- [ ] `digital-files` dan `payment-proofs` tidak public.
- [ ] RLS tetap aktif; jangan menonaktifkannya untuk “memperbaiki” error.
- [ ] Hanya akun admin yang memiliki `app_metadata.role = admin`.
- [ ] Secret/service-role key hanya berada di Netlify environment variables.
- [ ] Password admin kuat dan MFA aktif bila tersedia.
- [ ] Pembayaran ditetapkan `paid` hanya setelah saldo benar-benar masuk, atau webhook gateway resmi sudah memvalidasi signature.
- [ ] Uji download untuk pesanan `paid` dan penolakan untuk pesanan `pending`.
- [ ] Simpan cadangan file produk di lokasi terpisah; backup database tidak otomatis berarti backup semua objek Storage. [Referensi database](https://supabase.com/docs/guides/database/overview).

## Pemecahan masalah

**Upload 403 / policy violation** — cek policy Storage dan pastikan proses upload memiliki policy yang cocok. Untuk upload melalui API, Supabase dapat membutuhkan izin `SELECT` yang sesuai selain `INSERT`. [Panduan error 403 Storage](https://supabase.com/docs/guides/troubleshooting/storage-error-403-forbidden-new-row-violates-row-level-security-policy-on-upload-a94384).

**Admin tetap tidak mendapat akses setelah role ditambahkan** — logout dan login kembali agar JWT diperbarui. Klaim pada JWT tidak selalu langsung berubah setelah `app_metadata` diubah.

**Link unduhan gagal** — cek bahwa `orders.status` tepat bernilai `paid`, `file_path` produk benar, file ada di `digital-files`, serta kedua environment variable Netlify sudah diset lalu deploy ulang.

**Bukti transfer terlihat tetapi belum boleh dikirim** — ini normal. Gambar, tanggal, atau OCR bukan bukti pembayaran yang cukup aman. Cek mutasi saldo atau gunakan payment gateway dengan webhook terverifikasi.
