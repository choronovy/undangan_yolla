# Undangan Pernikahan Digital Rudi & Yola

Website undangan pernikahan digital interaktif & modern berbasis HTML5, Tailwind CSS, JavaScript murni, dan JSON.

## Fitur Utama
- **Amplop Undangan Interaktif**: Buka amplop dengan sentuhan elegan & musik latar otomatis (*Bermuara - Rizky Febian feat. Mahalini*).
- **Personalized Guest Link**: Tautan undangan khusus sesuai nama tamu (`?to=Nama+Tamu`).
- **Countdown Timer**: Penghitung waktu mundur menuju hari bahagia menyatu lembut dengan latar belakang.
- **Rangkaian Acara**: Info akad & resepsi terstruktur rapi dengan tombol Google Maps & Salin Alamat simetris.
- **Galeri Foto**: Lightbox popup interaktif foto prewedding.
- **Buku Tamu & Ucapan Doa Restu (Real-time JSON)**:
  - Form RSVP konfirmasi kehadiran (**Hadir** & **Tidak Hadir**).
  - Animasi horizontal marquee berjalan ke kiri tanpa henti (*infinite continuous loop*).
  - Fitur jeda interaktif saat disentuh / disorot kursor (*pause on hover & touch*).
- **Dashboard Admin & Generator Undangan** (`admin.html`):
  - Autentikasi Admin (Username: `admin`, Password: `infix`).
  - Manajemen ucapan & doa restu (filter kehadiran, hapus data, ekspor CSV/Excel).
  - Generator tautan undangan personal & format pesan WhatsApp otomatis.
  - Penambahan tamu massal (*bulk add*) & ekspor buku tamu ke CSV.
  - Pengaturan agenda & lokasi acara 29 November.
  - 100% murni JSON & LocalStorage (dapat dijalankan langsung di GitHub Pages, Vercel, maupun Live Server).

## Struktur Direktori
```text
undangan_yolla/
├── index.html              # Halaman utama undangan
├── admin.html              # Dashboard panel admin
├── generator.html          # Generator tautan tamu
├── wishes.json             # Database JSON ucapan & doa
├── guests.json             # Database JSON daftar tamu
├── settings.json           # Database JSON pengaturan acara
├── assets/
│   ├── css/style.css       # Custom CSS & keyframe animasi
│   ├── js/main.js          # Logika interaksi & countdown
│   ├── js/admin.js         # Logika panel admin
│   ├── js/tailwind-theme.js# Konfigurasi tema warna Tailwind
│   ├── img/                # Aset foto & ornamen grafis
│   └── lagu/               # Musik latar pernikahan
└── README.md
```
