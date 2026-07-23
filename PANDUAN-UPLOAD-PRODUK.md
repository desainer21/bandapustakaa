# Panduan upload produk digital ke Banda Pustaka

## Jawaban singkat

**Ya.** Unggah file asli yang ingin Anda jual ke bucket **`digital-files`**. File ini adalah produk yang nanti bisa diunduh pembeli setelah pembayaran disetujui.

Contoh:

| Produk yang dijual | File yang diunggah ke `digital-files` |
|---|---|
| E-book | `ebook/panduan-canva.pdf` |
| Template Canva / desain | `template/instagram-pack.zip` |
| Template Notion | `template/notion-planner.zip` atau file panduan PDF |
| Audio | `audio/fokus-tenang.mp3` |
| Video kursus | `video/kelas-video-bagian-1.mp4` |
| Aplikasi | `aplikasi/invoicekit-v1.zip` |

Jangan unggah file produk ke `covers`, karena bucket itu hanya untuk **gambar sampul** yang boleh terlihat publik.

## 1. Siapkan file sebelum upload

1. Pastikan file final bisa dibuka dan tidak rusak.
2. Beri nama file yang jelas, tanpa karakter aneh. Contoh: `ebook-menulis-yang-menjual-v1.pdf`.
3. Untuk template yang terdiri dari banyak file, masukkan semuanya ke satu file `.zip`.
4. Untuk video berukuran besar, pertimbangkan membaginya per bab atau memakai platform video privat. Jangan mengunggah file yang terlalu besar tanpa memeriksa batas paket Storage Anda.
5. Buat gambar sampul terpisah, idealnya JPG/PNG berbentuk persegi atau rasio 4:5. Contoh: `cover-menulis-yang-menjual.jpg`.

Struktur file yang rapi akan memudahkan Anda mengelola toko:

```text
digital-files/
├── ebook/
│   └── ebook-menulis-yang-menjual-v1.pdf
├── template/
│   └── notion-life-planner-v1.zip
├── audio/
│   └── suara-fokus-vol-1.mp3
└── video/
    └── kelas-canva-bab-1.mp4

covers/
├── cover-menulis-yang-menjual.jpg
└── cover-notion-life-planner.jpg
```

## 2. Upload file produk ke `digital-files`

1. Di Supabase, klik **Storage** pada sidebar kiri.
2. Klik bucket **`digital-files`**.
3. Pastikan label **Public** tidak aktif. Jika aktif, jangan upload produk dahulu—ubah bucket menjadi privat.
4. Klik **Create folder**, buat folder kategori, misalnya `ebook`.
5. Buka folder tersebut lalu klik **Upload file**.
6. Pilih file produk asli yang akan dijual, misalnya `ebook-menulis-yang-menjual-v1.pdf`.
7. Setelah upload selesai, klik file dan salin/catat **path**-nya:

```text
ebook/ebook-menulis-yang-menjual-v1.pdf
```

Path ini bukan URL publik. Simpan path tersebut karena dipakai di kolom `file_path` ketika membuat produk.

## 3. Upload gambar sampul ke `covers`

1. Kembali ke halaman **Storage** dan klik bucket **`covers`**.
2. Bucket `covers` boleh bersifat Public karena hanya berisi gambar promosi, bukan file produk.
3. Klik **Upload file**, pilih gambar sampul, misalnya `cover-menulis-yang-menjual.jpg`.
4. Buka file yang sudah terunggah, lalu gunakan opsi **Get public URL** / salin URL publiknya.
5. Simpan URL tersebut. URL ini dipakai di kolom `cover_url`.

Jangan memakai `Get public URL` untuk file dalam `digital-files`. Jika Anda melakukannya, pembeli dapat membagikan link produk dan file tidak lagi terlindungi.

## 4. Daftarkan file menjadi produk yang dijual

Upload saja belum membuat produk muncul di toko. Setelah dua file di atas ada, buka **Table Editor → products → Insert row**, lalu isi:

| Kolom | Apa yang diisi | Contoh |
|---|---|---|
| `name` | Judul produk | `Menulis yang Menjual` |
| `category` | Kategori | `E-book` |
| `price` | Harga rupiah tanpa titik | `35000` |
| `description` | Deskripsi lengkap produk | `E-book 70 halaman tentang copywriting.` |
| `cover_url` | URL public gambar dari `covers` | `https://.../storage/v1/object/public/covers/cover-menulis...jpg` |
| `file_path` | Path file privat dari `digital-files` | `ebook/ebook-menulis-yang-menjual-v1.pdf` |
| `is_active` | Aktifkan agar dapat dijual | `true` / dicentang |

Klik **Save**. Ulangi langkah yang sama untuk setiap produk.

## 5. Contoh lengkap: menjual e-book

Anda ingin menjual e-book PDF seharga Rp35.000:

1. Siapkan `ebook-menulis-yang-menjual.pdf` dan `cover-menulis-yang-menjual.jpg`.
2. Upload PDF ke `digital-files/ebook/`.
3. Catat path: `ebook/ebook-menulis-yang-menjual.pdf`.
4. Upload JPG ke `covers/` lalu salin URL publiknya.
5. Tambahkan satu baris di `products` dengan:

```text
name        : Menulis yang Menjual
category    : E-book
price       : 35000
description : Panduan menulis copy yang jelas dan menjual.
cover_url   : [URL gambar sampul dari covers]
file_path   : ebook/ebook-menulis-yang-menjual.pdf
is_active   : true
```

Saat pembeli selesai membayar dan admin menyetujui pesanan, sistem membuat tautan unduhan sementara untuk PDF ini.

## 6. Jika ingin mengganti produk

- Jangan menimpa file lama bila sudah ada pembeli. Upload versi baru, misalnya `ebook-menulis-yang-menjual-v2.pdf`.
- Ubah `file_path` produk ke file baru setelah memastikan upload berhasil.
- Simpan file lama untuk sementara sebagai cadangan.
- Bila produk tidak lagi dijual, ubah `is_active` menjadi `false`; jangan langsung hapus file atau baris pesanan lama.

## Checklist sebelum mengaktifkan jualan

- [ ] File yang diupload memang file produk yang ingin dijual.
- [ ] File produk masuk ke `digital-files`, bukan `covers`.
- [ ] `digital-files` bersifat privat.
- [ ] Sampul masuk ke `covers` dan tidak berisi materi berbayar.
- [ ] `file_path` di tabel `products` cocok tepat dengan lokasi file.
- [ ] Harga diisi sebagai angka rupiah penuh, tanpa tanda titik/koma.
- [ ] Anda sudah mengunduh/membuka file untuk memastikan tidak rusak.
