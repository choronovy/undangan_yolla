/**
 * Undangan Digital Elegan - Rudi & Yola
 * Script Utama: Amplop, Countdown, Auto-Update Lokasi 27/29 Nov, Musik, & Live Guestbook JSON
 */

(function () {
  'use strict';

  // ==========================================
  // 1. URL PARAMETER PARSER (NAMA TAMU)
  // ==========================================
  function getGuestName() {
    const params = new URLSearchParams(window.location.search);
    const guest = params.get('to') || params.get('nama') || params.get('guest') || params.get('u');
    if (guest && guest.trim() !== '') {
      return guest.trim();
    }
    return 'Dimas Prasetya & Partner';
  }

  function applyGuestName() {
    const guestName = getGuestName();
    const guestElements = document.querySelectorAll('.guest-name-text');
    guestElements.forEach((el) => {
      el.textContent = guestName;
    });

    const formNameInput = document.getElementById('wish-name-input');
    if (formNameInput && !formNameInput.value) {
      formNameInput.value = guestName.replace(' & Partner', '').replace(' & Keluarga', '');
    }
  }

  // ==========================================
  // 2. MUSIK & BUKA AMPLOP TRANSISI
  // ==========================================
  const audio = document.getElementById('wedding-audio');
  const musicToggleBtn = document.getElementById('music-toggle-btn');
  const musicBars = document.querySelectorAll('.music-bar');
  let isPlaying = false;

  // Set initial state paused
  musicBars.forEach(bar => {
    bar.style.animationPlayState = 'paused';
    bar.style.opacity = '0.85';
  });

  function pauseMusic() {
    if (!audio) return;
    try {
      audio.pause();
    } catch (e) {
      console.warn('Audio pause error:', e);
    }
    isPlaying = false;
    if (musicToggleBtn) {
      musicToggleBtn.classList.add('opacity-60');
      musicToggleBtn.classList.remove('opacity-100');
    }
    musicBars.forEach(bar => {
      bar.style.animationPlayState = 'paused';
      bar.style.opacity = '0.7';
    });
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  function playMusic() {
    if (!audio) return;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isPlaying = true;
        if (musicToggleBtn) {
          musicToggleBtn.classList.remove('opacity-60');
          musicToggleBtn.classList.add('opacity-100');
        }
        musicBars.forEach(bar => {
          bar.style.animationPlayState = 'running';
          bar.style.opacity = '1';
        });
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      }).catch((err) => {
        console.warn('Autoplay dicegah oleh browser:', err);
      });
    }
  }

  function toggleMusic(playState) {
    if (playState === true || (playState === undefined && audio && audio.paused)) {
      playMusic();
    } else {
      pauseMusic();
    }
  }

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', () => {
      toggleMusic(!isPlaying);
    });
  }

  // =========================================================================
  // KONTROL OTOMATIS: HENTIKAN MUSIK KETIKA KELUAR KE WHATSAPP / APLIKASI LAIN
  // =========================================================================
  let wasPlaying = false;

  function handleExit() {
    if (isPlaying) {
      wasPlaying = true;
      pauseMusic();
    }
  }

  function handleReturn() {
    if (wasPlaying && !document.hidden && document.visibilityState === 'visible') {
      setTimeout(() => {
        if (!document.hidden && document.visibilityState === 'visible') {
          playMusic();
          wasPlaying = false;
        }
      }, 350);
    }
  }

  // 1. Visibilitychange (berpindah tab / minimize / kunci layar)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || document.visibilityState !== 'visible') {
      handleExit();
    } else {
      handleReturn();
    }
  });

  // 2. Window Blur (fokus berpindah ke WhatsApp / status bar / aplikasi lain)
  window.addEventListener('blur', () => {
    handleExit();
  });

  // 3. Window Focus (kembali membuka browser undangan)
  window.addEventListener('focus', () => {
    handleReturn();
  });

  // 4. Page Hide (kembali dari in-app browser ke chat WhatsApp)
  window.addEventListener('pagehide', () => {
    handleExit();
  });

  // 5. Beforeunload & Unload (keluar atau menutup halaman)
  window.addEventListener('beforeunload', () => {
    handleExit();
  });
  window.addEventListener('unload', () => {
    handleExit();
  });

  // 6. Freeze (Android Page Lifecycle)
  document.addEventListener('freeze', () => {
    handleExit();
  });

  // 7. Klik link eksternal (Buka Maps, Kirim WhatsApp, Instagram, dll)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="http"], a[href^="https"], a[href^="whatsapp:"], a[href^="intent:"]');
    if (link && link.target === '_blank') {
      handleExit();
    }
  });

  // 8. Integrasi MediaSession (Pemberitahuan kontrol pemutar musik di notifikasi Android)
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Bermuara',
        artist: 'Rizky Febian & Mahalini',
        album: 'The Wedding of Rudi & Yola'
      });
      navigator.mediaSession.setActionHandler('play', () => playMusic());
      navigator.mediaSession.setActionHandler('pause', () => pauseMusic());
      navigator.mediaSession.setActionHandler('stop', () => pauseMusic());
    } catch (e) {
      console.warn('MediaSession init error:', e);
    }
  }

  const openBtn = document.getElementById('openInvitationBtn');
  const envelopeScreen = document.getElementById('envelope-screen');
  const mainContent = document.getElementById('main-invitation-content');

  if (openBtn) {
    openBtn.addEventListener('click', function (e) {
      // Ripple effect
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
        if (envelopeScreen) {
          envelopeScreen.classList.add('opened');
        }
        document.body.classList.remove('overflow-hidden');
        if (mainContent) {
          mainContent.classList.remove('opacity-0', 'pointer-events-none');
        }

        // Munculkan floating navbar dock bawah dengan animasi halus
        const bottomDock = document.getElementById('bottom-dock-nav');
        if (bottomDock) {
          bottomDock.classList.remove('hidden-dock');
        }

        // Mulai mainkan musik
        toggleMusic(true);

        // Scroll halus ke awal konten jika perlu
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 450);
    });
  }

  // ==========================================
  // 3. LOGIKA WAKTU & UPDATE LOKASI TANGGAL 27 & 29 NOV 2026
  // ==========================================
  // Tanggal Cutoff: 27 November 2026 Pukul 00:00:00 WIB
  const CUTOFF_DATE = new Date('2026-11-27T00:00:00+07:00').getTime();
  const EVENT_DATE_27 = new Date('2026-11-27T08:00:00+07:00').getTime();
  const EVENT_DATE_29 = new Date('2026-11-29T10:00:00+07:00').getTime();

  // Mode simulasi/override (bisa diaktifkan via query string atau tombol toggle)
  // Contoh: ?mode=after27 atau ?mode=before27
  let simulatedMode = null; // 'before' | 'after' | null

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'after27') simulatedMode = 'after';
  if (urlParams.get('mode') === 'before27') simulatedMode = 'before';

  function isAfterOrEqual27Nov() {
    if (simulatedMode === 'after') return true;
    if (simulatedMode === 'before') return false;
    const now = new Date().getTime();
    return now >= CUTOFF_DATE;
  }

  function updateEventAndLocationUI() {
    const isUpdated = isAfterOrEqual27Nov();
    const event27Card = document.getElementById('event-card-27');
    const event29Card = document.getElementById('event-card-29');
    const statusPill = document.getElementById('event-status-pill');
    const countdownTargetText = document.getElementById('countdown-target-text');
    const heroCountdownLabel = document.getElementById('hero-countdown-label');
    const calendarBtn = document.getElementById('btn-calendar');

    if (isUpdated) {
      // State: Sudah 27 November atau setelahnya -> Tampilkan Lokasi & Agenda 29 November 2026
      if (event27Card) {
        event27Card.classList.add('opacity-75', 'bg-slate-50');
        event27Card.querySelector('.event-badge')?.classList.replace('bg-emerald-100', 'bg-slate-200');
        event27Card.querySelector('.event-badge')?.classList.replace('text-emerald-800', 'text-slate-600');
        const badgeEl = event27Card.querySelector('.event-badge');
        if (badgeEl) badgeEl.textContent = 'Akad Nikah (Telah Terlaksana)';
      }

      if (event29Card) {
        event29Card.classList.remove('hidden');
        event29Card.classList.add('ring-2', 'ring-primary', 'shadow-lg');
        const badgeEl = event29Card.querySelector('.event-badge');
        if (badgeEl) {
          badgeEl.className = 'event-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-600 text-white animate-pulse whitespace-nowrap';
          badgeEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-white"></span> <span>Lokasi & Acara Terkini</span>';
        }
      }

      if (statusPill) {
        statusPill.innerHTML = '';
      }

      if (countdownTargetText) {
        countdownTargetText.textContent = 'Menuju Resepsi & Syukuran (Minggu, 29 November 2026)';
      }
      if (heroCountdownLabel) heroCountdownLabel.textContent = 'Menuju Resepsi (29 Nov 2026)';

      if (calendarBtn) {
        calendarBtn.href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Resepsi+(Kumpul+Keluarga)+Rudi+%26+Yola&dates=20261129T030000Z/20261129T090000Z&details=Resepsi+(Kumpul+Keluarga)+Rudi+Rusyandi+%26+Yola+Sri+Nur+Juwita&location=Kp.+Sindangelet+Jl.+Raya+Cisayong+No.184,+Sukaraharja,+Cisayong,+Kabupaten+Tasikmalaya";
      }
    } else {
      // State: Sebelum 27 November 2026 -> Fokus Acara 27 November 2026
      if (event27Card) {
        event27Card.classList.remove('opacity-75', 'bg-slate-50');
        const badgeEl = event27Card.querySelector('.event-badge');
        if (badgeEl) {
          badgeEl.className = 'event-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 whitespace-nowrap';
          badgeEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> <span>Akad Nikah</span>';
        }
      }

      if (event29Card) {
        const badge29 = event29Card.querySelector('.event-badge');
        if (badge29) {
          badge29.className = 'event-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 whitespace-nowrap';
          badge29.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0"></span> <span>Rumah Mempelai Pria</span>';
        }
      }

      if (countdownTargetText) {
        countdownTargetText.textContent = 'Menuju Hari Akad Nikah (Jumat, 27 November 2026)';
      }
      if (heroCountdownLabel) heroCountdownLabel.textContent = 'Menuju Hari Bahagia (27 Nov 2026)';

      if (statusPill) {
        statusPill.innerHTML = '';
      }

      if (calendarBtn) {
        calendarBtn.href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Akad+Nikah+KUA+Bungursari+Rudi+%26+Yola&dates=20261127T020000Z/20261127T080000Z&details=Akad+Nikah+KUA+Bungursari+(09.00+WIB)+Rudi+Rusyandi+%26+Yola+Sri+Nur+Juwita&location=Rancageneng+2,+Sukajaya,+Kec.+Bungursari,+Kota+Tasikmalaya";
      }
    }
  }

  // Countdown timer logic
  function startCountdown() {
    function tick() {
      const isUpdated = isAfterOrEqual27Nov();
      const targetTime = isUpdated ? EVENT_DATE_29 : EVENT_DATE_27;
      const now = new Date().getTime();
      const distance = targetTime - now;

      const dEl = document.getElementById('cd-days');
      const hEl = document.getElementById('cd-hours');
      const mEl = document.getElementById('cd-minutes');
      const sEl = document.getElementById('cd-seconds');

      const heroDEl = document.getElementById('hero-cd-days');
      const heroHEl = document.getElementById('hero-cd-hours');
      const heroMEl = document.getElementById('hero-cd-minutes');
      const heroSEl = document.getElementById('hero-cd-seconds');

      if (distance <= 0) {
        if (dEl) dEl.textContent = '0';
        if (hEl) hEl.textContent = '00';
        if (mEl) mEl.textContent = '00';
        if (sEl) sEl.textContent = '00';
        if (heroDEl) heroDEl.textContent = '0';
        if (heroHEl) heroHEl.textContent = '00';
        if (heroMEl) heroMEl.textContent = '00';
        if (heroSEl) heroSEl.textContent = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const dStr = String(days);
      const hStr = hours < 10 ? '0' + hours : String(hours);
      const mStr = minutes < 10 ? '0' + minutes : String(minutes);
      const sStr = seconds < 10 ? '0' + seconds : String(seconds);

      if (dEl) dEl.textContent = dStr;
      if (hEl) hEl.textContent = hStr;
      if (mEl) mEl.textContent = mStr;
      if (sEl) sEl.textContent = sStr;

      if (heroDEl) heroDEl.textContent = dStr;
      if (heroHEl) heroHEl.textContent = hStr;
      if (heroMEl) heroMEl.textContent = mStr;
      if (heroSEl) heroSEl.textContent = sStr;
    }

    tick();
    setInterval(tick, 1000);
  }

  // Setup Date Simulator Switch (agar user/admin bisa langsung coba preview kedua kondisi)
  function setupDateSimulator() {
    const btnSimBefore = document.getElementById('sim-btn-before');
    const btnSimAfter = document.getElementById('sim-btn-after');
    const btnSimAuto = document.getElementById('sim-btn-auto');

    function updateActiveButton() {
      if (!btnSimBefore || !btnSimAfter || !btnSimAuto) return;
      [btnSimBefore, btnSimAfter, btnSimAuto].forEach(b => {
        b.classList.remove('bg-primary', 'text-white', 'shadow-sm');
        b.classList.add('bg-white', 'text-slate-600');
      });

      if (simulatedMode === 'before') {
        btnSimBefore.classList.add('bg-primary', 'text-white', 'shadow-sm');
        btnSimBefore.classList.remove('bg-white', 'text-slate-600');
      } else if (simulatedMode === 'after') {
        btnSimAfter.classList.add('bg-primary', 'text-white', 'shadow-sm');
        btnSimAfter.classList.remove('bg-white', 'text-slate-600');
      } else {
        btnSimAuto.classList.add('bg-primary', 'text-white', 'shadow-sm');
        btnSimAuto.classList.remove('bg-white', 'text-slate-600');
      }
    }

    if (btnSimBefore) {
      btnSimBefore.addEventListener('click', () => {
        simulatedMode = 'before';
        updateActiveButton();
        updateEventAndLocationUI();
        showToast('Mode: Menampilkan jadwal sebelum 27 November 2026');
      });
    }

    if (btnSimAfter) {
      btnSimAfter.addEventListener('click', () => {
        simulatedMode = 'after';
        updateActiveButton();
        updateEventAndLocationUI();
        showToast('Mode: Menampilkan update lokasi 29 November 2026!');
      });
    }

    if (btnSimAuto) {
      btnSimAuto.addEventListener('click', () => {
        simulatedMode = null;
        updateActiveButton();
        updateEventAndLocationUI();
        showToast('Mode: Otomatis sesuai tanggal sistem hari ini');
      });
    }

    updateActiveButton();
  }

  // ==========================================
  // 4. REAL-TIME LIVE WISHES / GUESTBOOK (MURNI JSON + LOCALSTORAGE)
  // ==========================================
  let knownWishes = [];
  const WISHES_JSON_URL = 'wishes.json';
  const LOCAL_STORAGE_KEY = 'wedding_wishes_data_v2';
  try {
    localStorage.removeItem('wedding_wishes_data');
  } catch (e) {}

  // Broadcast channel untuk sinkronisasi antar tab secara instan tanpa reload
  let liveChannel = null;
  try {
    liveChannel = new BroadcastChannel('wedding_live_channel');
    liveChannel.onmessage = (event) => {
      if (event.data && (event.data.type === 'NEW_WISH' || event.data.type === 'DELETE_WISH' || event.data.type === 'UPDATE_WISHES')) {
        fetchWishes(true);
      }
      if (event.data && event.data.type === 'UPDATE_SETTINGS') {
        loadDynamicEvent29Settings();
      }
    };
  } catch (e) {}

  window.addEventListener('storage', (e) => {
    if (e.key === LOCAL_STORAGE_KEY) {
      fetchWishes(true);
    }
    if (e.key === 'wedding_settings_data') {
      loadDynamicEvent29Settings();
    }
  });

  function getLocalTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return 'Baru saja';
    try {
      let date;
      if (typeof dateStr === 'string' && dateStr.includes(' ')) {
        const [dPart, tPart] = dateStr.split(' ');
        const [y, m, d] = dPart.split('-').map(Number);
        const [hr, min, sec] = (tPart || '00:00:00').split(':').map(Number);
        date = new Date(y, m - 1, d, hr, min, sec || 0);
      } else {
        date = new Date(dateStr);
      }

      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 0 || diffSec <= 45) return 'Baru saja';
      if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))} menit lalu`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} hari lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  function getStatusBadge(status) {
    if (status === 'hadir') {
      return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Hadir</span>';
    } else {
      return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Tidak Hadir</span>';
    }
  }

  function getAvatarLetter(name) {
    if (!name) return 'U';
    const clean = name.replace(/^bpk\.?|^ibu\.?|^mas\.?|^mba\.?/i, '').trim();
    return (clean[0] || 'U').toUpperCase();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderWishesList(wishes, isInitial = false) {
    const container = document.getElementById('wishes-container');
    const counterEl = document.getElementById('wishes-count');
    const hadirCountEl = document.getElementById('count-hadir');

    if (!container) return;

    if (counterEl) counterEl.textContent = wishes.length;
    if (hadirCountEl) {
      const hadirCount = wishes.filter(w => w.status === 'hadir').length;
      hadirCountEl.textContent = `${hadirCount} Hadir`;
    }

    if (wishes.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <span class="material-symbols-outlined text-4xl mb-2">mark_chat_read</span>
          <p class="text-sm">Belum ada ucapan. Jadilah yang pertama memberikan doa restu!</p>
        </div>
      `;
      return;
    }

    // Format single wish card untuk horizontal marquee
    const buildCardHtml = (wish) => `
      <div class="wish-marquee-card">
        <div>
          <div class="flex items-center gap-2.5 mb-2.5">
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-[#43617b] to-[#89a8c4] text-white font-semibold flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
              ${getAvatarLetter(wish.name)}
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-bold text-xs text-[#1d3d55] truncate">${escapeHtml(wish.name || 'Tamu')}</h4>
              <span class="text-[10px] text-slate-400 block">${formatTimeAgo(wish.created_at)}</span>
            </div>
            <div>
              ${getStatusBadge(wish.status)}
            </div>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed line-clamp-3 italic">"${escapeHtml(wish.message || '')}"</p>
        </div>
      </div>
    `;

    // Gandakan daftar agar efek berjalan ke kiri (marquee loop) mulus tanpa putus
    let loopList = [...wishes];
    while (loopList.length < 4) {
      loopList = [...loopList, ...wishes];
    }
    const firstSet = loopList.map(buildCardHtml).join('');
    const secondSet = loopList.map(buildCardHtml).join('');

    // Hitung durasi agar kecepatan membaca nyaman (~7 detik per kartu)
    const animDuration = Math.max(28, loopList.length * 7);

    container.innerHTML = `
      <div class="wishes-marquee-wrapper -mx-4 sm:-mx-6 px-4" id="wishes-marquee-box" title="Arahkan kursor / sentuh untuk menjeda">
        <div class="wishes-marquee-track" style="animation-duration: ${animDuration}s;">
          ${firstSet}
          ${secondSet}
        </div>
      </div>
      <p class="text-center text-[10.5px] text-slate-400 mt-2 flex items-center justify-center gap-1">
        <span class="material-symbols-outlined text-[13px] text-primary">touch_app</span>
        <span>Arahkan kursor / tahan untuk menjeda animasi ucapan</span>
      </p>
    `;

    // Mobile touch interaction to toggle pause
    const marqueeBox = container.querySelector('#wishes-marquee-box');
    if (marqueeBox) {
      marqueeBox.addEventListener('touchstart', function () {
        this.classList.toggle('is-paused');
      }, { passive: true });
    }
  }

  // Fetch data ucapan: Utamakan Supabase Cloud, fallback ke wishes.json & localStorage
  async function fetchWishes(silent = false) {
    let baseWishes = [];

    // 1. Coba ambil dari Supabase Cloud jika terkonfigurasi
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('wishes')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          baseWishes = data;
        }
      } catch (err) {
        console.warn('[Supabase] Gagal fetch data dari cloud:', err);
      }
    }

    // 2. Fallback offline / local JSON jika Supabase belum terisi atau kosong
    if (!baseWishes || baseWishes.length === 0) {
      try {
        const res = await fetch(WISHES_JSON_URL + '?t=' + Date.now());
        if (res.ok) {
          baseWishes = await res.json();
        }
      } catch (e) {}
    }

    // Ambil data dari localStorage
    let storedWishes = [];
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) storedWishes = JSON.parse(raw);
    } catch (e) {}

    // Gabungkan tanpa duplikat
    let merged = Array.isArray(storedWishes) && storedWishes.length > 0 ? [...storedWishes] : [...baseWishes];
    if (Array.isArray(baseWishes)) {
      baseWishes.forEach(b => {
        if (!merged.some(m => m.id === b.id || (m.name === b.name && m.message === b.message))) {
          merged.push(b);
        }
      });
    }

    const isFirstLoad = knownWishes.length === 0;

    // Cek apakah data benar-benar berubah sebelum me-render ulang DOM
    // JANGAN render ulang jika data sama, agar animasi marquee terus berjalan mulus tanpa ter-reset di tengah jalan!
    const isDataChanged = isFirstLoad ||
      merged.length !== knownWishes.length ||
      merged.some((m, idx) => !knownWishes[idx] || m.id !== knownWishes[idx].id || m.message !== knownWishes[idx].message);

    if (isDataChanged) {
      const hasNew = merged.length > knownWishes.length && !isFirstLoad;

      knownWishes = merged;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      } catch (e) {}

      renderWishesList(merged, isFirstLoad);

      if (!silent && hasNew) {
        showToast('Ada ucapan baru yang masuk!');
      }
    }
  }

  // Kirim Ucapan Baru (Simpan ke Supabase Cloud + LocalStorage Real-time)
  async function submitWish(e) {
    e.preventDefault();
    const nameInput = document.getElementById('wish-name-input');
    const msgInput = document.getElementById('wish-msg-input');
    const statusInput = document.querySelector('input[name="attendance-status"]:checked');
    const submitBtn = document.getElementById('wish-submit-btn');

    const name = nameInput ? nameInput.value.trim() : '';
    const message = msgInput ? msgInput.value.trim() : '';
    const status = statusInput ? statusInput.value : 'hadir';

    if (!name || !message) {
      showToast('Mohon lengkapi nama dan pesan ucapan Anda', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span> Mengirim...';
    }

    const newWish = {
      id: 'wish_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: name,
      status: status,
      message: message,
      created_at: getLocalTimestamp()
    };

    // 1. Simpan ke Supabase Cloud Database jika terhubung
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        const { error } = await supabaseClient.from('wishes').insert([{
          id: newWish.id,
          name: newWish.name,
          status: newWish.status,
          message: newWish.message,
          created_at: new Date().toISOString()
        }]);
        if (error) console.warn('[Supabase Insert Error]', error);
      } catch (err) {
        console.warn('[Supabase] Gagal menyimpan ke cloud:', err);
      }
    }

    // 2. Simpan lokal di state & localStorage untuk feedback instan
    knownWishes.unshift(newWish);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(knownWishes));
    } catch (e) {}

    renderWishesList(knownWishes, false);

    // Kirim notifikasi realtime ke tab admin / tab lain
    if (liveChannel) {
      try {
        liveChannel.postMessage({ type: 'NEW_WISH', data: newWish });
      } catch (e) {}
    }

    // Reset input pesan
    if (msgInput) msgInput.value = '';
    showToast('Terima kasih! Doa dan ucapan Anda telah tersimpan.');

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm">send</span> Kirim Ucapan & Doa';
    }
  }

  // Polling & Supabase Real-time Channel Listener
  function startLiveWishesPolling() {
    fetchWishes(true);

    // Jika Supabase aktif, pasang realtime websocket subscription
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        supabaseClient
          .channel('realtime_public_wishes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes' }, () => {
            fetchWishes(true);
          })
          .subscribe();
      } catch (e) {}
    }

    // Fallback interval polling
    setInterval(() => {
      fetchWishes(false);
    }, 4500);
  }

  // ==========================================
  // 5. SALIN TEKS & REKENING (DENGAN FEEDBACK INTERAKTIF)
  // ==========================================
  function setupCopyButtons() {
    const copyBtns = document.querySelectorAll('.btn-copy-account');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', function () {
        const textToCopy = this.getAttribute('data-account');
        if (!textToCopy) return;

        // Visual feedback micro-animation on button
        const originalHTML = this.innerHTML;
        this.innerHTML = `
          <span class="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
          <span class="text-emerald-700 font-semibold">Tersalin!</span>
        `;
        this.classList.add('border-emerald-300', 'bg-emerald-50');

        setTimeout(() => {
          this.innerHTML = originalHTML;
          this.classList.remove('border-emerald-300', 'bg-emerald-50');
        }, 2200);

        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Berhasil disalin: ${textToCopy}`);
        }).catch(() => {
          // Fallback
          const tempInput = document.createElement('input');
          tempInput.value = textToCopy;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          tempInput.remove();
          showToast(`Berhasil disalin: ${textToCopy}`);
        });
      });
    });
  }

  // ==========================================
  // 6. TOAST NOTIFICATION UTILITY
  // ==========================================
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-rose-600' : 'bg-[#1d3d55]';
    const icon = type === 'error' ? 'error' : 'check_circle';

    toast.className = `toast-msg flex items-center gap-2 px-4 py-2.5 rounded-full ${bgColor} text-white shadow-xl text-xs font-medium tracking-wide mb-2 transition-all`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-base">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ==========================================
  // 7. BOTTOM NAVIGATION SCROLL SPY & INTERACTION
  // ==========================================
  function setupBottomNav() {
    const navLinks = document.querySelectorAll('#bottom-dock-nav a[data-path]');
    if (!navLinks.length) return;

    const sectionIds = ['beranda', 'mempelai', 'acara', 'galeri', 'qrcode', 'ucapan'];
    let isNavClicking = false;
    let navClickTimeout = null;
    let scrollTimeout = null;

    function setActiveTab(path) {
      if (!path) return;
      navLinks.forEach((link) => {
        if (link.getAttribute('data-path') === path) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    // ScrollSpy presisi menggunakan getBoundingClientRect()
    function updateActiveOnScroll() {
      if (isNavClicking) return;

      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      // 1. Jika di paling atas halaman (masih sampul / beranda)
      if (scrollY < 120) {
        setActiveTab('beranda');
        return;
      }

      // 2. Jika sudah scroll sampai mendekati paling bawah halaman
      if (windowHeight + scrollY >= scrollHeight - 80) {
        setActiveTab('ucapan');
        return;
      }

      // 3. Evaluasi section berdasarkan posisi relatif di layar (sweet spot ~35% dari atas viewport)
      const triggerPoint = windowHeight * 0.35;
      let activeSectionId = null;

      for (let i = 0; i < sectionIds.length; i++) {
        const section = document.getElementById(sectionIds[i]);
        if (!section) continue;
        const rect = section.getBoundingClientRect();
        // Section aktif jika bagian atasnya telah mencapai trigger point dan belum keluar dari viewport
        if (rect.top <= triggerPoint && rect.bottom > 60) {
          activeSectionId = sectionIds[i];
        }
      }

      if (activeSectionId) {
        setActiveTab(activeSectionId);
      }
    }

    // Handle klik pada tombol dock nav dengan scroll lock (agar tidak dioverwrite saat animasi smooth scroll)
    navLinks.forEach((link) => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('data-path');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          isNavClicking = true;
          setActiveTab(targetId);

          if (navClickTimeout) clearTimeout(navClickTimeout);
          navClickTimeout = setTimeout(() => {
            isNavClicking = false;
            setActiveTab(targetId);
          }, 850);

          const headerOffset = 15;
          const elementPosition = targetEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + (window.pageYOffset || document.documentElement.scrollTop) - headerOffset;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        }
      });
    });

    window.addEventListener('scroll', () => {
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
      scrollTimeout = requestAnimationFrame(updateActiveOnScroll);
    }, { passive: true });

    // Initial sync saat halaman siap
    updateActiveOnScroll();
  }

  // ==========================================
  // 8. SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
  // ==========================================
  function setupScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-init');
    if (!revealElements.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.01,
        rootMargin: '60px 0px 60px 0px'
      });

      revealElements.forEach((el) => observer.observe(el));
    } else {
      revealElements.forEach((el) => el.classList.add('revealed'));
    }
  }

  // ==========================================
  // 9. SCROLL READING PROGRESS BAR
  // ==========================================
  function setupScrollProgressBar() {
    const bar = document.getElementById('scroll-progress-bar');
    if (!bar) return;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
        bar.style.width = `${progress}%`;
      }
    }, { passive: true });
  }

  // ==========================================
  // 10. INTERACTIVE PHOTO LIGHTBOX MODAL
  // ==========================================
  function setupPhotoLightbox() {
    const lightbox = document.getElementById('photo-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('lightbox-close-btn');
    if (!lightbox || !lightboxImg) return;

    function openLightbox(src, caption) {
      lightboxImg.src = src;
      if (lightboxCaption) {
        lightboxCaption.textContent = caption || 'Rudi & Yola';
      }
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!lightbox.classList.contains('active')) {
          lightboxImg.src = '';
        }
      }, 350);
    }

    document.querySelectorAll('[data-lightbox]').forEach((item) => {
      item.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) return;
        const src = this.getAttribute('data-lightbox');
        const caption = this.getAttribute('data-caption') || '';
        if (src) {
          openLightbox(src, caption);
        }
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === closeBtn) {
        closeLightbox();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // Dynamic 29 Nov Event Settings Loader
  async function loadDynamicEvent29Settings() {
    let venue = 'Kp. Sindangelet, Cisayong';
    let address = 'Kp. Sindangelet Jl. Raya Cisayong No.184, RT.2/RW.3, Sukaraharja, Kec. Cisayong, Kabupaten Tasikmalaya, Jawa Barat 46153';
    let maps = 'https://maps.google.com/?q=Kp+Sindangelet+Jl+Raya+Cisayong+No+184+RT+2+RW+3+Sukaraharja+Cisayong+Tasikmalaya';

    try {
      const res = await fetch(`settings.json?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.venue_29) venue = data.venue_29;
        if (data && data.address_29) address = data.address_29;
        if (data && data.maps_29) maps = data.maps_29;
      }
    } catch (e) {}

    try {
      const stored = localStorage.getItem('wedding_settings_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.venue29) venue = parsed.venue29;
        if (parsed.address29) address = parsed.address29;
        if (parsed.maps29) maps = parsed.maps29;
      }
    } catch (e) {}

    const titleEl = document.getElementById('venue-title-29');
    const addrEl = document.getElementById('venue-address-29');
    const mapsEl = document.getElementById('venue-maps-link-29');
    const copyEl = document.getElementById('venue-copy-btn-29');

    if (titleEl) titleEl.textContent = venue;
    if (addrEl) addrEl.textContent = address;
    if (mapsEl) mapsEl.href = maps;
    if (copyEl) copyEl.setAttribute('data-account', address);
  }

  // Simpan Jadwal ke Kalender HP / Device (Modal Pilihan Kalender)
  function setupDeviceCalendarButton() {
    const btnDeviceCal = document.getElementById('btn-save-device-calendar');
    const calModal = document.getElementById('calendar-modal');
    const closeBtn = document.getElementById('close-calendar-modal');
    if (!btnDeviceCal || !calModal) return;

    const openModal = () => {
      calModal.classList.remove('opacity-0', 'pointer-events-none');
      const modalBox = calModal.querySelector('div');
      if (modalBox) {
        modalBox.classList.remove('scale-95');
        modalBox.classList.add('scale-100');
      }
    };

    const closeModal = () => {
      calModal.classList.add('opacity-0', 'pointer-events-none');
      const modalBox = calModal.querySelector('div');
      if (modalBox) {
        modalBox.classList.remove('scale-100');
        modalBox.classList.add('scale-95');
      }
    };

    btnDeviceCal.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    calModal.addEventListener('click', (e) => {
      if (e.target === calModal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !calModal.classList.contains('pointer-events-none')) {
        closeModal();
      }
    });
  }


  // ==========================================
  // 10.B E-TICKET & QR CODE KEHADIRAN TAMU
  // ==========================================
  function generateGuestTicketCode(guestName) {
    let hash = 0;
    for (let i = 0; i < guestName.length; i++) {
      hash = ((hash << 5) - hash) + guestName.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);
    return `RY-2711-${hex}`;
  }

  function initGuestQRCode() {
    const qrContainer = document.getElementById('guest-qr-canvas');
    if (!qrContainer) return;

    const guestName = getGuestName();
    const ticketCode = generateGuestTicketCode(guestName);

    // Update badge kode tiket
    const codeBadge = document.getElementById('guest-ticket-code-badge');
    if (codeBadge) {
      codeBadge.textContent = ticketCode;
    }

    // Bersihkan kontainer QR sebelumnya
    qrContainer.innerHTML = '';

    // URL yang di-encode ke dalam QR
    const baseUrl = window.location.origin + window.location.pathname;
    const fullGuestUrl = `${baseUrl}?to=${encodeURIComponent(guestName)}&code=${ticketCode}`;

    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(qrContainer, {
          text: fullGuestUrl,
          width: 170,
          height: 170,
          colorDark: '#1d3d55',
          colorLight: '#ffffff',
          correctLevel: (typeof QRCode !== 'undefined' && QRCode.CorrectLevel && QRCode.CorrectLevel.H) ? QRCode.CorrectLevel.H : 2
        });
      } catch (err) {
        console.error('Error generating QR Code:', err);
      }
    }

    // Download E-Ticket QR Button
    const btnDownload = document.getElementById('btn-download-ticket-qr');
    if (btnDownload) {
      btnDownload.onclick = () => {
        downloadGuestTicketPass(guestName, ticketCode, qrContainer);
      };
    }
  }

  // Generate luxury VIP pass image onto HTML5 canvas and trigger download
  function downloadGuestTicketPass(guestName, ticketCode, qrContainer) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 600;
    const height = 850;
    canvas.width = width;
    canvas.height = height;

    // 1. Background gradient (Off-white luxury tone)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#faf9f7');
    bgGrad.addColorStop(0.5, '#f0f6fc');
    bgGrad.addColorStop(1, '#faf9f7');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Elegant border
    ctx.strokeStyle = '#cbe1f2';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, width - 52, height - 52);

    // 3. Header Text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5d7389';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('THE WEDDING CELEBRATION OF', width / 2, 75);

    // Couple Name
    ctx.fillStyle = '#1d3d55';
    ctx.font = 'bold 36px "Playfair Display", Georgia, serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('Rudi & Yola', width / 2, 120);

    // Badge VIP ACCESS
    ctx.fillStyle = '#c59b27';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('— VIP GUEST PASS —', width / 2, 148);

    // Divider line
    ctx.strokeStyle = '#dce8f4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 170);
    ctx.lineTo(width - 60, 170);
    ctx.stroke();

    // 4. Guest Name
    ctx.fillStyle = '#89a8c4';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NAMA TAMU UNDANGAN', width / 2, 210);

    ctx.fillStyle = '#1d3d55';
    ctx.font = 'bold 24px "Playfair Display", Georgia, serif';
    let displayName = guestName;
    if (displayName.length > 28) displayName = displayName.substring(0, 26) + '...';
    ctx.fillText(displayName, width / 2, 245);

    // Ticket Code
    ctx.fillStyle = '#5d7389';
    ctx.font = '600 14px monospace';
    ctx.fillText(ticketCode, width / 2, 275);

    // 5. Draw QR Code in center
    const qrCanvas = qrContainer.querySelector('canvas');
    const qrImg = qrContainer.querySelector('img');
    const qrSize = 250;
    const qrX = (width - qrSize) / 2;
    const qrY = 310;

    // QR container box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
    ctx.strokeStyle = '#cbe1f2';
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);

    if (qrCanvas) {
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    } else if (qrImg && qrImg.src) {
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }

    // 6. Monogram inside QR Center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width / 2, qrY + qrSize / 2, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1d3d55';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#1d3d55';
    ctx.font = 'bold 13px "Playfair Display", Georgia, serif';
    ctx.fillText('R&Y', width / 2, qrY + qrSize / 2 + 5);

    // 7. Event Details Bottom
    const bottomY = 640;
    ctx.fillStyle = '#1d3d55';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Jumat, 27 November 2026', width / 2, bottomY);

    ctx.fillStyle = '#5d7389';
    ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Tasikmalaya, Jawa Barat', width / 2, bottomY + 22);

    ctx.fillStyle = '#89a8c4';
    ctx.font = '400 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Tunjukkan kartu ini kepada penerima tamu di pintu masuk resepsi.', width / 2, bottomY + 60);

    // Perforated line bottom
    ctx.strokeStyle = '#cbe1f2';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(40, bottomY + 100);
    ctx.lineTo(width - 40, bottomY + 100);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#c59b27';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SAVE THE DATE • THE WEDDING OF RUDI & YOLA', width / 2, bottomY + 125);

    // Download trigger
    try {
      const link = document.createElement('a');
      const cleanFileName = guestName.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `E-Ticket_Rudi_Yola_${cleanFileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (typeof showToast === 'function') {
        showToast('E-Ticket & QR Code berhasil diunduh ke galeri!');
      }
    } catch (e) {
      console.error('Failed downloading canvas pass:', e);
      if (qrCanvas) {
        const link = document.createElement('a');
        link.download = `QR_Code_${guestName}.png`;
        link.href = qrCanvas.toDataURL('image/png');
        link.click();
      }
    }
  }

  // ==========================================
  // 11. INITIALIZE ALL ON DOM READY
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    applyGuestName();
    initGuestQRCode();
    loadDynamicEvent29Settings();
    updateEventAndLocationUI();
    startCountdown();
    setupDeviceCalendarButton();
    setupDateSimulator();
    setupCopyButtons();
    setupBottomNav();
    setupScrollReveal();
    setupScrollProgressBar();
    setupPhotoLightbox();

    // Wishes form event
    const wishForm = document.getElementById('wish-form');
    if (wishForm) {
      wishForm.addEventListener('submit', submitWish);
    }

    // Jika amplop sudah dalam keadaan terbuka, langsung munculkan dock bawah
    const envScreen = document.getElementById('envelope-screen');
    const bottomDock = document.getElementById('bottom-dock-nav');
    if (envScreen && envScreen.classList.contains('opened') && bottomDock) {
      bottomDock.classList.remove('hidden-dock');
    }

    startLiveWishesPolling();
  });

})();

