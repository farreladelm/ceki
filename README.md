<p align="center"><img src="public/favicon.svg" width="64" height="64" alt="Logo Ceki" /></p>

# Ceki — teman semeja.

Pencatat skor **permainan Ceki** yang terang, bergaya kartu, dan dirancang untuk dipakai bersama lewat satu HP. Ceki adalah nama permainan sekaligus nama aplikasi ini. Kamu fokus mainnya; skornya tetap tercatat.

## Jalankan

Gunakan Node.js **22.12+** dan npm.

```sh
npm install
npm run dev
```

Buka **http://localhost:5177**. Port development dan preview dikunci ke **5177**; aplikasi tidak berpindah port diam-diam jika port tersebut sedang dipakai.

> [!TIP]
> Jika PowerShell memblokir `npm.ps1`, gunakan `npm.cmd`, misalnya `npm.cmd run dev`. Tidak perlu mengubah execution policy.

## Dari kartu pertama sampai mahkota terakhir

1. Pilih 2, 3, 4, atau 5 pemain; jumlah manual mendukung **2–24 pemain**. Isi nama atau gunakan nama bawaan.
2. Sepakati target **500**, **1.000**, atau angka bulat positif lainnya.
3. Ketuk **±5, ±10, ±25, ±250, ±500** untuk membentuk skor bersih setiap pemain, atau pilih **Input manual** dan ketik angka bulat. Tombol **+/−** pada input manual mengubah tanda skor. Klik **Terapkan skor** untuk mengganti nilai ronde, bukan menambahnya. Perubahan bisa diurungkan atau di-reset per pemain.
4. Periksa ringkasan, lalu simpan seluruh ronde sekaligus. Skor nol dan negatif tetap valid.
5. Saat target tercapai atau terlewati, skor tertinggi mendapat mahkota **Raja Meja**. Skor tertinggi yang sama menghasilkan juara bersama.

Aplikasi tidak menilai kartu, memberikan bonus tutup, atau menambahkan penalti otomatis. Tombol **−500** bisa digunakan untuk mencatat joker mati. Input manual menerima skor positif, negatif, dan nol; tidak harus kelipatan 5. Angka desimal, pemisah ribuan, dan nilai di luar batas bilangan bulat aman ditolak. Input baru masuk ke draf setelah diterapkan; menekan Batal tidak mengubah skor.

### Koreksi dan riwayat

- Rincian ronde bisa dibuka, dikoreksi, atau dihapus dengan konfirmasi.
- Koreksi menghitung ulang semua total. Pemenang bisa berubah; jika semua pemain kembali di bawah target, permainan dibuka kembali.
- Mengoreksi satu ronde tidak menghapus ronde lainnya.
- **Main lagi** membawa nama dan target ke sesi baru tanpa menimpa sesi sebelumnya.
- Ronde tidak bisa tersimpan ganda karena ketukan tombol simpan yang berulang.

## Penyimpanan

Pemain, target, ronde, dan draf input tersimpan otomatis dalam `localStorage` pada kunci **`ceki.meja.v1`**. Tidak ada akun, backend, sinkronisasi, atau database server. Font juga disajikan dari aplikasi sendiri, bukan layanan font eksternal.

> [!IMPORTANT]
> Catatan terikat pada **browser dan origin yang sama** (protokol, host, dan port). Menghapus data browser, memakai mode privat, mengganti port, atau mengganti domain dapat membuat catatan hilang atau tidak terlihat. Penyimpanan lokal bukan cadangan. Aplikasi ini belum menyediakan mode offline/PWA.

Jika penyimpanan diblokir atau penuh, aplikasi menampilkan peringatan dan mempertahankan data di memori selama halaman masih terbuka. Data tersimpan yang rusak **tidak ditimpa otomatis**; penghapusan memerlukan konfirmasi.

## Pengembangan dan pengujian

| Perintah               | Fungsi                                                                |
| ---------------------- | --------------------------------------------------------------------- |
| `npm run dev`          | Development server di port 5177                                       |
| `npm run build`        | Pemeriksaan TypeScript dan build production ke `dist/`                |
| `npm run preview`      | Preview hasil build di port 5177; hentikan dev server terlebih dahulu |
| `npm run check`        | Pemeriksaan tipe, termasuk tes browser                                |
| `npm test`             | Unit test aturan permainan dan validasi penyimpanan                   |
| `npm run test:e2e`     | Tes browser pada ukuran mobile dan desktop                            |
| `npm run format`       | Merapikan TypeScript, JSX, konfigurasi, dan dokumentasi               |
| `npm run format:check` | Memeriksa konsistensi format                                          |

Tes end-to-end memakai **Google Chrome lokal** melalui Playwright. Pastikan Chrome terpasang. Setiap tes memakai penyimpanan browser terisolasi, bukan data permainan pribadi. Screenshot dan trace pengujian disimpan di `test-results/`.

Pengujian mencakup skor bertanda positif/negatif, input skor manual, ketukan berulang, undo/reset, pemulihan draf setelah reload, target, juara bersama, koreksi hasil akhir, nama ganda, penghapusan, dan kegagalan penyimpanan. Input manual diuji untuk pembatalan, tanda minus di keyboard HP, validasi angka, penggantian skor, serta penyimpanan angka yang bukan kelipatan 5. Tes navigasi memeriksa URL tanpa hash, Back/Forward, refresh halaman bertingkat, tab baru, dan migrasi tautan lama. Lebar formulir diuji dari 320 hingga 1.365 px, termasuk breakpoint dua kolom dan input manual.

## Struktur

```text
src/
  components/    Kartu, ikon SVG, dialog, dan elemen bersama
  game/          Model, reducer, perhitungan, penyimpanan, dan unit test
  lib/           Format angka/tanggal dan navigasi browser History API
  pages/         Beranda, pengaturan, meja, input, riwayat, dan hasil akhir
  styles.css     Tema kartu dan layout mobile-first
e2e/             Skenario browser Playwright
public/          Ikon dan robots.txt
```

Stack: **React, TypeScript, Vite, Tailwind CSS, dan CSS custom**. State permainan menggunakan reducer dan Context; logika skor terpisah dari antarmuka. Animasi menghormati preferensi _reduced motion_.

## Publikasi dan URL

Unggah isi `dist/` ke hosting statis pada root domain. Navigasi memakai URL bersih seperti `/atur`, `/meja/:id`, dan `/riwayat`, tanpa `/#/`. Tautan versi lama seperti `/#/atur` otomatis diganti ke `/atur` tanpa menghapus permainan atau draf.

> [!IMPORTANT]
> Hosting production harus menyediakan **SPA fallback**: permintaan halaman yang bukan file statis diarahkan ke `/index.html`. Ini diperlukan agar membuka tautan langsung atau refresh di `/meja/:id` tidak menghasilkan 404. Vite development dan preview sudah menyediakan fallback tersebut.

Hosting menggunakan **NGINX**. Arahkan `root` ke direktori hasil build `dist/` dan gunakan fallback yang sudah dikonfigurasi. Contoh di dalam blok `server`:

```nginx
location /assets/ {
    try_files $uri =404;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

File JavaScript, CSS, font, dan aset yang ada tetap dilayani sebagai file biasa, bukan diganti HTML. Gunakan alamat situs yang konsisten agar catatan lokal tetap dapat ditemukan.
