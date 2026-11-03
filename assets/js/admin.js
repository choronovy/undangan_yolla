/**
 * ADMIN PANEL LOGIC (100% MURNI JSON & LOCALSTORAGE)
 * Rudi & Yolla Wedding Invitation
 * 
 * Fitur:
 * 1. Autentikasi Admin (Username: admin, Pass: infix)
 * 2. Kelola Percakapan & Doa (Database murni wishes.json & localStorage)
 * 3. Generator Undangan Personal & WhatsApp Message Builder
 * 4. Kelola Buku Tamu (Database murni guests.json & localStorage)
 * 5. Import Massal Tamu (Bulk Add)
 * 6. Export ke CSV / Excel & Download JSON langsung
 * 7. Live Real-time BroadcastChannel sync dengan index.html tanpa reload
 */

(function () {
  'use strict';

  // Kredensial Admin Sesuai Permintaan
  const VALID_USER = 'admin';
  const VALID_PASS = 'infix';
  const AUTH_KEY = 'wedding_admin_auth';

  // File JSON & Storage Keys
  const WISHES_JSON_URL = 'wishes.json';
  const GUESTS_JSON_URL = 'guests.json';
  const SETTINGS_JSON_URL = 'settings.json';
  const WISHES_STORAGE_KEY = 'wedding_wishes_data_v2';
  try {
    localStorage.removeItem('wedding_wishes_data');
  } catch (e) {}
  const GUESTS_STORAGE_KEY = 'wedding_guests_data';
  const SETTINGS_STORAGE_KEY = 'wedding_settings_data';

  // BroadcastChannel untuk sinkronisasi seketika dengan index.html
  let liveChannel = null;
  try {
    liveChannel = new BroadcastChannel('wedding_live_channel');
    liveChannel.onmessage = (e) => {
      if (e.data && e.data.type === 'NEW_WISH') {
        loadWishes();
        showToast('Ada ucapan baru masuk dari: ' + (e.data.data?.name || 'Tamu'));
      }
    };
  } catch (e) {}

  window.addEventListener('storage', (e) => {
    if (e.key === WISHES_STORAGE_KEY) {
      loadWishes();
    }
  });

  // Elements: Login
  const loginSection = document.getElementById('admin-login-section');
  const dashboardSection = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('admin-login-form');
  const userInput = document.getElementById('admin-username');
  const passInput = document.getElementById('admin-password');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const btnTogglePwd = document.getElementById('btn-toggle-pwd');
  const pwdIcon = document.getElementById('pwd-icon');
  const btnLogout = document.getElementById('btn-admin-logout');

  // Elements: Tabs
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  // Elements: Percakapan (Wishes)
  const statTotal = document.getElementById('stat-total-wishes');
  const statHadir = document.getElementById('stat-hadir');
  const statTidakHadir = document.getElementById('stat-tidak-hadir');
  const statTotalGuests = document.getElementById('stat-total-guests');
  const wishesTableBody = document.getElementById('wishes-table-body');
  const filterStatusSelect = document.getElementById('filter-status');
  const searchWishInput = document.getElementById('search-input');
  const btnRefreshWishes = document.getElementById('btn-refresh-data');
  const btnExportWishesCsv = document.getElementById('btn-export-csv');

  // Elements: Generator & Guestbook
  const genNameInput = document.getElementById('gen-guest-name');
  const genSuffixSelect = document.getElementById('gen-guest-suffix');
  const genCategorySelect = document.getElementById('gen-guest-category');
  const genPhoneInput = document.getElementById('gen-guest-phone');
  const btnGenGuest = document.getElementById('btn-generate-guest');
  const genResultCard = document.getElementById('gen-result-card');
  const genOutputUrl = document.getElementById('gen-output-url');
  const genOutputWa = document.getElementById('gen-output-wa');
  const btnCopyGenUrl = document.getElementById('btn-copy-gen-url');
  const btnPreviewGenUrl = document.getElementById('btn-preview-gen-url');
  const btnCopyWaText = document.getElementById('btn-copy-wa-text');
  const btnSendWhatsapp = document.getElementById('btn-send-whatsapp');
  const guestsTableBody = document.getElementById('guests-table-body');
  const badgeTotalGuests = document.getElementById('badge-total-guests');
  const searchGuestInput = document.getElementById('search-guest-input');
  const btnExportGuestsCsv = document.getElementById('btn-export-guests-csv');

  // Elements: Bulk Add Modal
  const bulkModal = document.getElementById('bulk-modal');
  const btnToggleBulk = document.getElementById('btn-open-bulk-modal');
  const btnCloseBulk = document.getElementById('btn-close-bulk-modal');
  const btnCancelBulk = document.getElementById('btn-cancel-bulk-modal');
  const btnSubmitBulk = document.getElementById('btn-submit-bulk');
  const bulkNamesInput = document.getElementById('bulk-guest-names');
  const bulkSuffixSelect = document.getElementById('bulk-guest-suffix');
  const bulkCategorySelect = document.getElementById('bulk-guest-category');

  // Elements: Settings Form
  const settingsForm = document.getElementById('settings-form');
  const settingVenue29 = document.getElementById('setting-venue-29');
  const settingAddress29 = document.getElementById('setting-address-29');
  const settingMaps29 = document.getElementById('setting-maps-29');

  // State
  let allWishes = [];
  let allGuests = [];

  let adminRealtimeSubscribed = false;
  function setupAdminRealtime() {
    if (adminRealtimeSubscribed) return;
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      adminRealtimeSubscribed = true;
      try {
        supabaseClient
          .channel('admin_cloud_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes' }, () => {
            loadWishes();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, () => {
            loadGuests();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => {
            loadCheckins();
          })
          .subscribe();
      } catch (e) {}
    }
  }

  // ==========================================
  // 1. AUTENTIKASI (USERNAME: admin, PASS: infix)
  // ==========================================
  function checkAuth() {
    const isAuth = localStorage.getItem(AUTH_KEY);
    if (isAuth === 'true') {
      if (loginSection) loginSection.classList.add('hidden');
      if (dashboardSection) dashboardSection.classList.remove('hidden');
      loadAllData();
      setupAdminRealtime();
    } else {
      if (loginSection) loginSection.classList.remove('hidden');
      if (dashboardSection) dashboardSection.classList.add('hidden');
    }
  }

  if (btnTogglePwd && passInput) {
    btnTogglePwd.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';
      if (pwdIcon) {
        pwdIcon.textContent = isPassword ? 'visibility_off' : 'visibility';
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = (userInput ? userInput.value.trim() : '');
      const password = (passInput ? passInput.value.trim() : '');

      if (username === VALID_USER && password === VALID_PASS) {
        localStorage.setItem(AUTH_KEY, 'true');
        if (loginErrorMsg) loginErrorMsg.classList.add('hidden');
        if (userInput) userInput.value = '';
        if (passInput) passInput.value = '';
        checkAuth();
        showToast('Login berhasil! Selamat datang Admin.');
      } else {
        if (loginErrorMsg) {
          loginErrorMsg.textContent = 'Username atau Password salah! (Default: admin / infix)';
          loginErrorMsg.classList.remove('hidden');
        }
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
        localStorage.removeItem(AUTH_KEY);
        checkAuth();
        showToast('Anda telah logout.');
      }
    });
  }

  // ==========================================
  // 2. NAVIGASI TABS & RESPONSIVE MENU BAR
  // ==========================================
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
  const mobileMenuPanel = document.getElementById('mobile-menu-panel');
  const btnToggleMenuBar = document.getElementById('btn-toggle-menu-bar');
  const btnCloseMenuBar = document.getElementById('btn-close-menu-bar');
  const btnDrawerLogout = document.getElementById('btn-drawer-logout');
  const drawerTabBtns = document.querySelectorAll('.admin-drawer-tab-btn');

  function openMobileMenu() {
    if (!mobileMenuDrawer || !mobileMenuPanel) return;
    mobileMenuDrawer.classList.remove('opacity-0', 'pointer-events-none');
    mobileMenuDrawer.classList.add('opacity-100', 'pointer-events-auto');
    mobileMenuPanel.classList.remove('translate-x-full');
    mobileMenuPanel.classList.add('translate-x-0');
  }

  function closeMobileMenu() {
    if (!mobileMenuDrawer || !mobileMenuPanel) return;
    mobileMenuDrawer.classList.remove('opacity-100', 'pointer-events-auto');
    mobileMenuDrawer.classList.add('opacity-0', 'pointer-events-none');
    mobileMenuPanel.classList.remove('translate-x-0');
    mobileMenuPanel.classList.add('translate-x-full');
  }

  if (btnToggleMenuBar) btnToggleMenuBar.addEventListener('click', openMobileMenu);
  if (btnCloseMenuBar) btnCloseMenuBar.addEventListener('click', closeMobileMenu);
  if (mobileMenuDrawer) {
    mobileMenuDrawer.addEventListener('click', (e) => {
      if (e.target === mobileMenuDrawer) closeMobileMenu();
    });
  }
  if (btnDrawerLogout) {
    btnDrawerLogout.addEventListener('click', () => {
      closeMobileMenu();
      if (btnAdminLogout) btnAdminLogout.click();
    });
  }

  function switchTab(targetTab) {
    if (!targetTab) return;
    const cleanId = targetTab.startsWith('tab-') ? targetTab : ('tab-' + targetTab);

    // 1. Update horizontal menu bar buttons
    tabBtns.forEach((b) => {
      const bTab = b.getAttribute('data-tab') || '';
      const bClean = bTab.startsWith('tab-') ? bTab : ('tab-' + bTab);
      if (bClean === cleanId) {
        b.classList.add('active', 'bg-white', 'text-primary', 'shadow-xs', 'border', 'border-slate-200/80', 'font-bold');
        b.classList.remove('text-slate-600', 'hover:bg-white/60');
      } else {
        b.classList.remove('active', 'bg-white', 'text-primary', 'shadow-xs', 'border', 'border-slate-200/80', 'font-bold');
        b.classList.add('text-slate-600', 'hover:bg-white/60');
      }
    });

    // 2. Update drawer tab buttons
    drawerTabBtns.forEach((b) => {
      const bTab = b.getAttribute('data-tab') || '';
      const bClean = bTab.startsWith('tab-') ? bTab : ('tab-' + bTab);
      if (bClean === cleanId) {
        b.classList.add('active', 'bg-primary/10', 'text-primary', 'border-primary/20');
        b.classList.remove('text-slate-600', 'hover:bg-slate-50', 'border-transparent');
      } else {
        b.classList.remove('active', 'bg-primary/10', 'text-primary', 'border-primary/20');
        b.classList.add('text-slate-600', 'hover:bg-slate-50', 'border-transparent');
      }
    });

    // 3. Switch visible content
    tabContents.forEach((c) => c.classList.add('hidden'));
    const activeContent = document.getElementById(cleanId);
    if (activeContent) activeContent.classList.remove('hidden');

    // 4. Close drawer if open
    closeMobileMenu();
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
      const targetTab = this.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  drawerTabBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
      const targetTab = this.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // ==========================================
  // 3. LOAD DATA (MURNI JSON + LOCALSTORAGE)
  // ==========================================
  async function loadAllData() {
    await Promise.all([
      loadWishes(),
      loadGuests(),
      loadCheckins(),
      loadSettings()
    ]);
  }

  function getLocalTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // A. PERCAKAPAN & DOA (WISHES)
  async function loadWishes() {
    let baseWishes = [];

    // 1. Ambil dari Supabase Cloud jika terkonfigurasi
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
        console.warn('[Supabase Admin] Gagal fetch data:', err);
      }
    }

    // 2. Fallback offline / local JSON
    if (!baseWishes || baseWishes.length === 0) {
      try {
        const res = await fetch(`${WISHES_JSON_URL}?t=${Date.now()}`);
        if (res.ok) {
          baseWishes = await res.json();
        }
      } catch (e) {}
    }

    let storedWishes = [];
    try {
      const raw = localStorage.getItem(WISHES_STORAGE_KEY);
      if (raw) storedWishes = JSON.parse(raw);
    } catch (e) {}

    // Gabungkan tanpa duplikat
    let merged = Array.isArray(storedWishes) && storedWishes.length > 0 ? [...storedWishes] : [...baseWishes];
    if (Array.isArray(baseWishes)) {
      baseWishes.forEach((b) => {
        if (!merged.some((m) => m.id === b.id || (m.name === b.name && m.message === b.message))) {
          merged.push(b);
        }
      });
    }

    allWishes = merged;
    try {
      localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {}

    updateWishesStats();
    renderWishesTable();
  }

  function updateWishesStats() {
    const total = allWishes.length;
    let hadir = 0;
    let tidakHadir = 0;

    allWishes.forEach((w) => {
      const s = (w.status || '').toLowerCase();
      if (s === 'hadir') hadir++;
      else tidakHadir++;
    });

    if (statTotal) statTotal.textContent = total;
    if (statHadir) statHadir.textContent = hadir;
    if (statTidakHadir) statTidakHadir.textContent = tidakHadir;
    if (statTotalGuests) statTotalGuests.textContent = allGuests.length;

    // Sinkronisasi badge counter menu bar
    const navWishes = document.getElementById('nav-count-wishes');
    const drawerWishes = document.getElementById('drawer-wishes-badge');
    if (navWishes) navWishes.textContent = total;
    if (drawerWishes) drawerWishes.textContent = total;
  }

  function renderWishesTable() {
    if (!wishesTableBody) return;

    const filter = filterStatusSelect ? filterStatusSelect.value : 'all';
    const keyword = searchWishInput ? searchWishInput.value.toLowerCase().trim() : '';

    const filtered = allWishes.filter((item) => {
      const s = (item.status || '').toLowerCase();
      const isHadir = (s === 'hadir');
      const isTidakHadir = !isHadir;

      const matchFilter = (filter === 'all') ||
        (filter === 'hadir' && isHadir) ||
        (filter === 'tidak_hadir' && isTidakHadir);

      const name = (item.name || '').toLowerCase();
      const msg = (item.message || '').toLowerCase();
      const matchKeyword = !keyword || name.includes(keyword) || msg.includes(keyword);

      return matchFilter && matchKeyword;
    });

    if (filtered.length === 0) {
      wishesTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-400 text-xs">
            ${allWishes.length === 0 ? 'Belum ada percakapan / ucapan dari tamu.' : 'Tidak ada data ucapan yang sesuai filter pencarian.'}
          </td>
        </tr>
      `;
      return;
    }

    wishesTableBody.innerHTML = filtered.map((item, idx) => {
      const s = (item.status || 'hadir').toLowerCase();
      let badgeHtml = '';
      if (s === 'hadir') {
        badgeHtml = '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Hadir</span>';
      } else {
        badgeHtml = '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Tidak Hadir</span>';
      }

      const timeFormatted = item.created_at ? item.created_at.replace('T', ' ').substring(0, 16) : '-';

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
          <td class="py-3 px-4 text-center text-xs font-mono text-slate-400">${idx + 1}</td>
          <td class="py-3 px-4">
            <span class="text-xs font-bold text-slate-800">${escapeHtml(item.name || 'Tamu')}</span>
          </td>
          <td class="py-3 px-4">${badgeHtml}</td>
          <td class="py-3 px-4">
            <p class="text-xs text-slate-600 max-w-md line-clamp-2 leading-relaxed">${escapeHtml(item.message || '')}</p>
          </td>
          <td class="py-3 px-4 text-xs font-mono text-slate-400 whitespace-nowrap">${timeFormatted}</td>
          <td class="py-3 px-4 text-right">
            <button type="button" class="btn-delete-wish p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" data-id="${item.id}" title="Hapus Ucapan Ini">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach delete listeners
    wishesTableBody.querySelectorAll('.btn-delete-wish').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        deleteWish(id);
      });
    });
  }

  async function deleteWish(wishId) {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan/ucapan ini?')) return;

    // Hapus dari Supabase Cloud jika terhubung
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        await supabaseClient.from('wishes').delete().eq('id', wishId);
      } catch (err) {
        console.warn('[Supabase Admin] Gagal menghapus dari cloud:', err);
      }
    }

    allWishes = allWishes.filter((w) => w.id !== wishId);
    try {
      localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(allWishes));
    } catch (e) {}

    updateWishesStats();
    renderWishesTable();

    // Broadcast ke index.html
    if (liveChannel) {
      try {
        liveChannel.postMessage({ type: 'DELETE_WISH', id: wishId });
      } catch (e) {}
    }

    showToast('Ucapan berhasil dihapus.');
  }

  // B. BUKU TAMU & GENERATOR (GUESTS)
  async function loadGuests() {
    let localGuests = [];
    let hasLocal = false;
    try {
      const raw = localStorage.getItem(GUESTS_STORAGE_KEY);
      if (raw !== null) {
        localGuests = JSON.parse(raw) || [];
        hasLocal = true;
      }
    } catch (e) {}

    if (!hasLocal) {
      let baseGuests = [];
      try {
        const res = await fetch(`${GUESTS_JSON_URL}?t=${Date.now()}`);
        if (res.ok) {
          baseGuests = await res.json();
        }
      } catch (e) {}
      localGuests = Array.isArray(baseGuests) ? baseGuests : [];
    }

    // Jika Supabase Cloud aktif, data dari cloud menjadi sumber kebenaran (Source of Truth)
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        const { data: cloudGuests, error } = await supabaseClient
          .from('guests')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(cloudGuests)) {
          localGuests = cloudGuests;
        }
      } catch (e) {
        console.warn('[Supabase Guests Fetch Error]', e);
      }
    }

    allGuests = localGuests;
    try {
      localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(allGuests));
    } catch (e) {}

    if (badgeTotalGuests) badgeTotalGuests.textContent = `${allGuests.length} Tamu Terdaftar`;
    if (statTotalGuests) statTotalGuests.textContent = allGuests.length;
    renderGuestsTable();
  }

  function renderGuestsTable() {
    // Sinkronisasi badge counter tamu di menu bar
    const navGuests = document.getElementById('nav-count-guests');
    const drawerGuests = document.getElementById('drawer-guests-badge');
    if (navGuests) navGuests.textContent = allGuests.length;
    if (drawerGuests) drawerGuests.textContent = allGuests.length;

    if (!guestsTableBody) return;

    const keyword = searchGuestInput ? searchGuestInput.value.toLowerCase().trim() : '';
    const filtered = allGuests.filter((g) => {
      if (!keyword) return true;
      const n = (g.name || '').toLowerCase();
      const p = (g.phone || '').toLowerCase();
      const c = (g.category || '').toLowerCase();
      return n.includes(keyword) || p.includes(keyword) || c.includes(keyword);
    });

    if (filtered.length === 0) {
      guestsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-400 text-xs">
            ${allGuests.length === 0 ? 'Belum ada data tamu di buku tamu.' : 'Tidak ditemukan nama tamu yang cocok.'}
          </td>
        </tr>
      `;
      return;
    }

    guestsTableBody.innerHTML = filtered.map((guest, idx) => {
      const fullUrl = guest.url || (window.location.origin + window.location.pathname.replace('admin.html', 'index.html') + '?to=' + encodeURIComponent(guest.name || ''));
      const waMsg = buildWhatsAppMessage(guest.name, fullUrl);
      const waLink = guest.phone ?
        `https://wa.me/${guest.phone}?text=${encodeURIComponent(waMsg)}` :
        `https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`;

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
          <td class="py-3 px-4 text-center text-xs font-mono text-slate-400">${idx + 1}</td>
          <td class="py-3 px-4">
            <span class="text-xs font-bold text-slate-800 block">${escapeHtml(guest.name || '')}</span>
            <span class="text-[10px] text-slate-400 font-mono">${guest.phone ? '+' + guest.phone : 'Tanpa No. WA'}</span>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              ${escapeHtml(guest.category || 'Umum')}
            </span>
          </td>
          <td class="py-3 px-4">
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium transition-colors shadow-xs">
              <span class="material-symbols-outlined text-[14px]">send</span>
              <span>Kirim WA</span>
            </a>
          </td>
          <td class="py-3 px-4 text-center">
            <button type="button" class="btn-show-guest-qr inline-flex items-center gap-1 px-2.5 py-1 bg-[#1d3d55] hover:bg-black text-white rounded-lg text-[11px] font-semibold transition-colors shadow-xs cursor-pointer" data-id="${guest.id}" data-name="${escapeHtml(guest.name || '')}" data-category="${escapeHtml(guest.category || 'Tamu')}" data-url="${escapeHtml(fullUrl)}">
              <span class="material-symbols-outlined text-[15px]">qr_code_2</span>
              <span>Lihat QR</span>
            </button>
          </td>
          <td class="py-3 px-4 text-center">
            ${isGuestCheckedIn(guest) ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span class="material-symbols-outlined text-[12px]">check</span>
                <span>Hadir</span>
              </span>
            ` : `
              <button type="button" class="btn-table-checkin px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 border border-slate-200 transition-colors cursor-pointer" data-name="${escapeHtml(guest.name || '')}">
                + Check-In
              </button>
            `}
          </td>
          <td class="py-3 px-4">
            <input type="text" readonly value="${escapeHtml(fullUrl)}" class="w-44 text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 focus:outline-none">
          </td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1">
              <button type="button" class="btn-copy-guest-url p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 transition-colors" data-url="${escapeHtml(fullUrl)}" title="Salin Tautan">
                <span class="material-symbols-outlined text-[17px]">content_copy</span>
              </button>
              <button type="button" class="btn-delete-guest p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" data-id="${guest.id}" title="Hapus Tamu">
                <span class="material-symbols-outlined text-[17px]">delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach QR modal viewer listeners
    guestsTableBody.querySelectorAll('.btn-show-guest-qr').forEach((btn) => {
      btn.addEventListener('click', function () {
        const name = this.getAttribute('data-name');
        const category = this.getAttribute('data-category');
        const url = this.getAttribute('data-url');
        openGuestQrModal(name, category, url);
      });
    });

    // Attach table quick checkin
    guestsTableBody.querySelectorAll('.btn-table-checkin').forEach((btn) => {
      btn.addEventListener('click', function () {
        const name = this.getAttribute('data-name');
        processGuestCheckIn(name);
      });
    });

    // Attach copy & delete listeners
    guestsTableBody.querySelectorAll('.btn-copy-guest-url').forEach((btn) => {
      btn.addEventListener('click', function () {
        const url = this.getAttribute('data-url');
        copyText(url, 'Tautan undangan tamu disalin!');
      });
    });

    guestsTableBody.querySelectorAll('.btn-delete-guest').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        deleteGuest(id);
      });
    });
  }

  async function deleteGuest(guestId) {
    if (!confirm('Apakah Anda yakin ingin menghapus tamu ini dari daftar?')) return;

    allGuests = allGuests.filter((g) => g.id !== guestId);
    try {
      localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(allGuests));
    } catch (e) {}

    // Hapus dari Supabase Cloud
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        await supabaseClient.from('guests').delete().eq('id', guestId);
      } catch (e) {
        console.warn('[Supabase Guest Delete Error]', e);
      }
    }

    if (badgeTotalGuests) badgeTotalGuests.textContent = `${allGuests.length} Tamu Terdaftar`;
    if (statTotalGuests) statTotalGuests.textContent = allGuests.length;
    renderGuestsTable();
    showToast('Data tamu berhasil dihapus.');
  }

  // Generate Guest link & WA message
  if (btnGenGuest) {
    btnGenGuest.addEventListener('click', () => {
      const rawName = genNameInput ? genNameInput.value.trim() : '';
      if (!rawName) {
        alert('Mohon masukkan nama tamu undangan terlebih dahulu.');
        if (genNameInput) genNameInput.focus();
        return;
      }

      let fullName = rawName;
      const category = 'Tamu';
      let phone = genPhoneInput ? genPhoneInput.value.trim().replace(/[^0-9]/g, '') : '';
      if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
      } else if (phone && !phone.startsWith('62')) {
        phone = '62' + phone;
      }

      const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', 'index.html');
      const guestUrl = `${baseUrl}?to=${encodeURIComponent(fullName)}`;
      const waMsg = buildWhatsAppMessage(fullName, guestUrl);

      // Simpan langsung ke state & localStorage
      const newGuest = {
        id: 'guest_' + Date.now(),
        name: fullName,
        phone: phone,
        category: category,
        url: guestUrl,
        created_at: getLocalTimestamp()
      };

      allGuests.unshift(newGuest);
      try {
        localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(allGuests));
      } catch (e) {}

      // Simpan ke Supabase Cloud
      if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabaseClient
          .from('guests')
          .insert([newGuest])
          .then(() => {})
          .catch((e) => console.warn('[Supabase Guest Insert Error]', e));
      }

      if (badgeTotalGuests) badgeTotalGuests.textContent = `${allGuests.length} Tamu Terdaftar`;
      if (statTotalGuests) statTotalGuests.textContent = allGuests.length;
      renderGuestsTable();

      // Display result
      if (genOutputUrl) genOutputUrl.value = guestUrl;
      if (genOutputWa) genOutputWa.value = waMsg;
      if (btnPreviewGenUrl) btnPreviewGenUrl.href = guestUrl;

      if (btnSendWhatsapp) {
        btnSendWhatsapp.href = phone ?
          `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}` :
          `https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`;
      }

      // Generate QR Code in Result Box
      const genQrWrapper = document.getElementById('gen-qrcode-wrapper');
      if (genQrWrapper) {
        genQrWrapper.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
          try {
            new QRCode(genQrWrapper, {
              text: guestUrl,
              width: 130,
              height: 130,
              colorDark: '#1d3d55',
              colorLight: '#ffffff',
              correctLevel: (typeof QRCode !== 'undefined' && QRCode.CorrectLevel && QRCode.CorrectLevel.H) ? QRCode.CorrectLevel.H : 2
            });
          } catch (e) {
            console.error('Error generating generator QR:', e);
          }
        }
      }

      // Download QR Button in Result Box
      const btnDownloadGenQr = document.getElementById('btn-download-gen-qr');
      if (btnDownloadGenQr) {
        btnDownloadGenQr.onclick = () => {
          downloadQRCodeFromContainer(genQrWrapper, `QR_Undangan_${fullName.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
        };
      }

      if (genResultCard) {
        genResultCard.classList.remove('hidden');
        genResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      showToast(`Tautan untuk "${fullName}" berhasil dibuat & disimpan ke buku tamu!`);
    });
  }

  if (btnCopyGenUrl && genOutputUrl) {
    btnCopyGenUrl.addEventListener('click', () => {
      copyText(genOutputUrl.value, 'Tautan undangan tamu berhasil disalin!');
    });
  }

  if (btnCopyWaText && genOutputWa) {
    btnCopyWaText.addEventListener('click', () => {
      copyText(genOutputWa.value, 'Seluruh format pesan WhatsApp berhasil disalin!');
    });
  }

  // C. BULK ADD GUESTS
  function toggleBulkModal(show) {
    if (!bulkModal) return;
    if (show) {
      bulkModal.classList.remove('hidden');
    } else {
      bulkModal.classList.add('hidden');
    }
  }

  if (btnToggleBulk) btnToggleBulk.addEventListener('click', () => toggleBulkModal(true));
  if (btnCloseBulk) btnCloseBulk.addEventListener('click', () => toggleBulkModal(false));
  if (btnCancelBulk) btnCancelBulk.addEventListener('click', () => toggleBulkModal(false));

  if (btnSubmitBulk) {
    btnSubmitBulk.addEventListener('click', () => {
      const names = bulkNamesInput ? bulkNamesInput.value.trim() : '';
      if (!names) {
        alert('Mohon masukkan minimal 1 nama tamu.');
        return;
      }

      const lines = names.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

      const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', 'index.html');
      let count = 0;

      lines.forEach((line) => {
        const fullName = line;
        const guestUrl = `${baseUrl}?to=${encodeURIComponent(fullName)}`;

        allGuests.unshift({
          id: 'guest_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          name: fullName,
          phone: '',
          category: category,
          url: guestUrl,
          created_at: getLocalTimestamp()
        });
        count++;
      });

      try {
        localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(allGuests));
      } catch (e) {}

      if (badgeTotalGuests) badgeTotalGuests.textContent = `${allGuests.length} Tamu Terdaftar`;
      if (statTotalGuests) statTotalGuests.textContent = allGuests.length;
      renderGuestsTable();

      if (bulkNamesInput) bulkNamesInput.value = '';
      toggleBulkModal(false);
      showToast(`Berhasil menambahkan ${count} tamu baru ke buku tamu!`);
    });
  }

  // D. EVENT SETTINGS (UPDATE 29 NOV INFO - MURNI JSON/LOCALSTORAGE)
  async function loadSettings() {
    let settings = {
      venue29: 'Kp. Sindangelet, Cisayong',
      address29: 'Kp. Sindangelet Jl. Raya Cisayong No.184, RT.2/RW.3, Sukaraharja, Kec. Cisayong, Kabupaten Tasikmalaya, Jawa Barat 46153',
      maps29: 'https://maps.google.com/?q=Kp+Sindangelet+Jl+Raya+Cisayong+No+184+RT+2+RW+3+Sukaraharja+Cisayong+Tasikmalaya'
    };

    try {
      const res = await fetch(`${SETTINGS_JSON_URL}?t=${Date.now()}`);
      if (res.ok) {
        const fileData = await res.json();
        if (fileData) {
          settings.venue29 = fileData.venue_29 || settings.venue29;
          settings.address29 = fileData.address_29 || settings.address29;
          settings.maps29 = fileData.maps_29 || settings.maps29;
        }
      }
    } catch (e) {}

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        settings = { ...settings, ...parsed };
      }
    } catch (e) {}

    if (settingVenue29) settingVenue29.value = settings.venue29 || '';
    if (settingAddress29) settingAddress29.value = settings.address29 || '';
    if (settingMaps29) settingMaps29.value = settings.maps29 || '';
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const settingsData = {
        venue29: settingVenue29 ? settingVenue29.value.trim() : '',
        address29: settingAddress29 ? settingAddress29.value.trim() : '',
        maps29: settingMaps29 ? settingMaps29.value.trim() : '',
        updated_at: getLocalTimestamp()
      };

      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsData));
      } catch (e) {}

      if (liveChannel) {
        try {
          liveChannel.postMessage({ type: 'UPDATE_SETTINGS', data: settingsData });
        } catch (e) {}
      }

      showToast('Pengaturan acara 29 November berhasil disimpan!');
    });
  }

  // E. EXPORT CSV & DOWNLOAD JSON
  if (btnExportWishesCsv) {
    btnExportWishesCsv.addEventListener('click', () => {
      if (allWishes.length === 0) {
        alert('Belum ada data ucapan untuk diexport.');
        return;
      }
      exportToCsv('wishes_rudi_yolla.csv', [
        ['No', 'Nama Tamu', 'Konfirmasi Kehadiran', 'Pesan / Doa Restu', 'Waktu Kirim'],
        ...allWishes.map((w, idx) => [
          idx + 1,
          w.name || '',
          (w.status || 'hadir') === 'hadir' ? 'Hadir' : 'Tidak Hadir',
          (w.message || '').replace(/\n/g, ' '),
          w.created_at || ''
        ])
      ]);
    });
  }

  if (btnExportGuestsCsv) {
    btnExportGuestsCsv.addEventListener('click', () => {
      if (allGuests.length === 0) {
        alert('Belum ada data buku tamu untuk diexport.');
        return;
      }
      exportToCsv('buku_tamu_rudi_yolla.csv', [
        ['No', 'Nama Tamu Undangan', 'Nomor WhatsApp', 'Kategori', 'Tautan Personal'],
        ...allGuests.map((g, idx) => [
          idx + 1,
          g.name || '',
          g.phone ? '+' + g.phone : '',
          g.category || 'Umum',
          g.url || ''
        ])
      ]);
    });
  }

  // Filter & Search Event Listeners
  if (filterStatusSelect) {
    filterStatusSelect.addEventListener('change', renderWishesTable);
  }

  if (searchWishInput) {
    searchWishInput.addEventListener('input', renderWishesTable);
  }

  if (btnRefreshWishes) {
    btnRefreshWishes.addEventListener('click', () => {
      loadWishes();
      showToast('Data ucapan berhasil dimuat ulang.');
    });
  }

  if (searchGuestInput) {
    searchGuestInput.addEventListener('input', renderGuestsTable);
  }

  // ==========================================
  // HELPERS
  // ==========================================
  function buildWhatsAppMessage(guestName, guestUrl) {
    return `Kepada Yth.
Bapak/Ibu/Saudara/i
*${guestName}*

_Assalamu’alaikum Warahmatullahi Wabarakatuh_

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri hari bahagia kami:

*Pernikahan Rudi & Yolla*
Hari/Tanggal: *Jumat, 27 November 2026*
Lokasi: *Rancageneng 2, Kota Tasikmalaya*

Tautan undangan resmi & konfirmasi kehadiran:
${guestUrl}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih.
_Wassalamu’alaikum Warahmatullahi Wabarakatuh_

Salam hangat,
*Rudi & Yolla*`;
  }

  function copyText(text, successMsg) {
    if (!navigator.clipboard) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(successMsg);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg);
    }).catch(() => {
      showToast('Gagal menyalin teks ke clipboard.', 'error');
    });
  }

  function exportToCsv(filename, rows) {
    const processRow = (row) => row.map((val) => {
      let v = (val === null || val === undefined) ? '' : String(val);
      v = v.replace(/"/g, '""');
      return `"${v}"`;
    }).join(',');

    const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`File "${filename}" berhasil diunduh!`);
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

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const isError = type === 'error';
    toast.className = `fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold text-white transition-all duration-300 transform translate-y-3 opacity-0 ${isError ? 'bg-rose-600' : 'bg-slate-800'}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-sm">${isError ? 'error' : 'check_circle'}</span>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-3', 'opacity-0');
      setTimeout(() => toast.remove(), 350);
    }, 3000);
  }


  // ==========================================
  // HELPER MODAL & DOWNLOAD QR CODE
  // ==========================================
  const modalGuestQr = document.getElementById('modal-guest-qr');
  const btnCloseQrModal = document.getElementById('btn-close-qr-modal');
  const btnCancelQrModal = document.getElementById('btn-cancel-qr-modal');
  const btnDownloadModalQr = document.getElementById('btn-download-modal-qr');
  const qrModalName = document.getElementById('qr-modal-guest-name');
  const qrModalCat = document.getElementById('qr-modal-guest-category');
  const qrModalCanvasBox = document.getElementById('qr-modal-canvas-box');

  let currentModalQrName = '';

  function openGuestQrModal(name, category, url) {
    if (!modalGuestQr) return;
    currentModalQrName = name || 'Tamu';
    if (qrModalName) qrModalName.textContent = name;
    if (qrModalCat) qrModalCat.textContent = category || 'Tamu';

    if (qrModalCanvasBox) {
      qrModalCanvasBox.innerHTML = '';
      if (typeof QRCode !== 'undefined') {
        try {
          new QRCode(qrModalCanvasBox, {
            text: url,
            width: 190,
            height: 190,
            colorDark: '#1d3d55',
            colorLight: '#ffffff',
            correctLevel: (typeof QRCode !== 'undefined' && QRCode.CorrectLevel && QRCode.CorrectLevel.H) ? QRCode.CorrectLevel.H : 2
          });
        } catch (e) {
          console.error('Error rendering modal QR:', e);
        }
      }
    }

    modalGuestQr.classList.remove('hidden');
  }

  function closeGuestQrModal() {
    if (modalGuestQr) modalGuestQr.classList.add('hidden');
  }

  if (btnCloseQrModal) btnCloseQrModal.addEventListener('click', closeGuestQrModal);
  if (btnCancelQrModal) btnCancelQrModal.addEventListener('click', closeGuestQrModal);
  if (modalGuestQr) {
    modalGuestQr.addEventListener('click', (e) => {
      if (e.target === modalGuestQr) closeGuestQrModal();
    });
  }

  if (btnDownloadModalQr) {
    btnDownloadModalQr.addEventListener('click', () => {
      if (!qrModalCanvasBox) return;
      downloadQRCodeFromContainer(qrModalCanvasBox, `QR_Undangan_${currentModalQrName.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
    });
  }

  function downloadQRCodeFromContainer(container, filename = 'qr-code.png') {
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('QR Code berhasil diunduh!');
      return;
    }
    const img = container.querySelector('img');
    if (img && img.src) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = img.src;
      link.click();
      showToast('QR Code berhasil diunduh!');
      return;
    }
    showToast('Gagal mengunduh QR Code.');
  }


  // ==========================================
  // FITUR SCAN QR & PRESENSI KEHADIRAN TAMU
  // ==========================================
  const CHECKINS_STORAGE_KEY = 'wedding_checkins_data';
  let allCheckins = [];
  let html5QrScannerInstance = null;
  let isCameraScanning = false;

  function isGuestCheckedIn(guest) {
    if (!guest) return false;
    const gName = (guest.name || '').toLowerCase().trim();
    return allCheckins.some(c => (c.guest_id && c.guest_id === guest.id) || (c.name || '').toLowerCase().trim() === gName);
  }

  async function loadCheckins() {
    let localCheckins = [];
    try {
      const raw = localStorage.getItem(CHECKINS_STORAGE_KEY);
      if (raw) localCheckins = JSON.parse(raw);
    } catch (e) {
      localCheckins = [];
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        const { data: cloudCheckins, error } = await supabaseClient
          .from('checkins')
          .select('*')
          .order('checkin_time', { ascending: false });
        if (!error && Array.isArray(cloudCheckins)) {
          localCheckins = cloudCheckins;
        }
      } catch (e) {
        console.warn('[Supabase Checkins Fetch Error]', e);
      }
    }

    allCheckins = localCheckins;
    renderPresensiUI();
  }

  function saveCheckins() {
    try {
      localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(allCheckins));
    } catch (e) {}
    renderPresensiUI();
    renderGuestsTable();
  }

  function playChimeTone(isSuccess = true) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (isSuccess) {
        // High pleasant two-tone chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Warning buzz tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}
  }

  function renderPresensiUI() {
    // 1. Sinkronisasi Badge Navigasi
    const navCheckedIn = document.getElementById('nav-count-checkedin');
    const drawerCheckedIn = document.getElementById('drawer-checkedin-badge');
    const badgeTotalCheckedIn = document.getElementById('badge-total-checkedin');
    if (navCheckedIn) navCheckedIn.textContent = allCheckins.length;
    if (drawerCheckedIn) drawerCheckedIn.textContent = allCheckins.length;
    if (badgeTotalCheckedIn) badgeTotalCheckedIn.textContent = `${allCheckins.length} Hadir`;

    // 2. Sinkronisasi KPI Stats
    const statTotal = document.getElementById('stat-presensi-total');
    const statChecked = document.getElementById('stat-presensi-checkedin');
    const statPending = document.getElementById('stat-presensi-pending');
    const statPercent = document.getElementById('stat-presensi-percent');

    const totalGuestsCount = allGuests.length || allCheckins.length;
    const checkedCount = allCheckins.length;
    const pendingCount = Math.max(0, totalGuestsCount - checkedCount);
    const percentage = totalGuestsCount > 0 ? Math.round((checkedCount / totalGuestsCount) * 100) : 0;

    if (statTotal) statTotal.textContent = totalGuestsCount;
    if (statChecked) statChecked.textContent = checkedCount;
    if (statPending) statPending.textContent = pendingCount;
    if (statPercent) statPercent.textContent = `${percentage}%`;

    // 3. Render Tabel Presensi
    const presensiTableBody = document.getElementById('presensi-table-body');
    if (!presensiTableBody) return;

    const searchInput = document.getElementById('search-checkedin-input');
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = allCheckins.filter(c => {
      if (!keyword) return true;
      const n = (c.name || '').toLowerCase();
      const code = (c.ticket_code || '').toLowerCase();
      const cat = (c.category || '').toLowerCase();
      return n.includes(keyword) || code.includes(keyword) || cat.includes(keyword);
    });

    if (filtered.length === 0) {
      presensiTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8 text-slate-400 text-xs">
            ${allCheckins.length === 0 ? 'Belum ada tamu yang scan QR kehadiran.' : 'Tidak ditemukan nama tamu hadir yang cocok.'}
          </td>
        </tr>
      `;
      return;
    }

    presensiTableBody.innerHTML = filtered.map((item, idx) => {
      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
          <td class="py-3 px-4 text-center text-xs font-mono text-slate-400">${idx + 1}</td>
          <td class="py-3 px-4">
            <span class="text-xs font-bold text-slate-800 block">${escapeHtml(item.name || '')}</span>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              ${escapeHtml(item.category || 'Tamu')}
            </span>
          </td>
          <td class="py-3 px-4">
            <span class="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              ${escapeHtml(item.ticket_code || '-')}
            </span>
          </td>
          <td class="py-3 px-4 text-xs font-medium text-slate-600">
            ${escapeHtml(item.checkin_time || '-')}
          </td>
          <td class="py-3 px-4 text-center">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span class="material-symbols-outlined text-[13px]">verified</span>
              <span>Sudah Scan</span>
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <button type="button" class="btn-cancel-checkin text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer" data-id="${item.id}" title="Batalkan Presensi Tamu Ini">
              <span class="material-symbols-outlined text-[17px]">close</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach listeners for cancel checkin
    presensiTableBody.querySelectorAll('.btn-cancel-checkin').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        cancelCheckIn(id);
      });
    });
  }

  function cancelCheckIn(checkinId) {
    if (!confirm('Apakah Anda yakin ingin membatalkan presensi kehadiran tamu ini?')) return;
    allCheckins = allCheckins.filter(c => c.id !== checkinId);
    saveCheckins();

    // Hapus presensi dari Supabase Cloud
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      supabaseClient
        .from('checkins')
        .delete()
        .eq('id', checkinId)
        .then(() => {})
        .catch((e) => console.warn('[Supabase Checkin Delete Error]', e));
    }
    showToast('Presensi kehadiran tamu berhasil dibatalkan.');
  }

  // Parse QR Payload and Process Check-In
  function handleScannedQRPayload(rawText) {
    if (!rawText) return;
    let guestName = '';
    let ticketCode = '';

    try {
      if (rawText.includes('?') && (rawText.includes('to=') || rawText.includes('nama='))) {
        const url = new URL(rawText, window.location.origin);
        guestName = url.searchParams.get('to') || url.searchParams.get('nama') || '';
        ticketCode = url.searchParams.get('code') || '';
      } else if (rawText.startsWith('http://') || rawText.startsWith('https://')) {
        const url = new URL(rawText);
        guestName = url.searchParams.get('to') || url.searchParams.get('nama') || '';
        ticketCode = url.searchParams.get('code') || '';
      }
    } catch (e) {}

    if (!guestName) {
      guestName = rawText.trim();
    }

    processGuestCheckIn(guestName, ticketCode);
  }

  function processGuestCheckIn(rawInputName, customTicketCode = '') {
    if (!rawInputName || !rawInputName.trim()) {
      alert('Mohon masukkan nama tamu atau kode tiket terlebih dahulu.');
      return;
    }

    const cleanInput = rawInputName.trim();
    const lowerInput = cleanInput.toLowerCase();

    // 1. Cari kecocokan di allGuests
    let matchedGuest = allGuests.find(g => {
      if ((g.name || '').toLowerCase() === lowerInput) return true;
      if (g.id === cleanInput) return true;
      if (g.phone && g.phone === cleanInput) return true;
      return false;
    });

    // Cari juga partial match jika nama mirip
    if (!matchedGuest) {
      matchedGuest = allGuests.find(g => (g.name || '').toLowerCase().includes(lowerInput));
    }

    // Jika belum terdaftar di allGuests, daftarkan otomatis
    if (!matchedGuest) {
      matchedGuest = {
        id: 'guest_' + Date.now(),
        name: cleanInput,
        phone: '',
        category: 'Tamu',
        url: window.location.origin + window.location.pathname.replace('admin.html', 'index.html') + '?to=' + encodeURIComponent(cleanInput),
        created_at: getLocalTimestamp()
      };
      allGuests.push(matchedGuest);
      try {
        localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(allGuests));
      } catch (e) {}
    }

    // Generate ticket code deterministically jika belum ada
    let finalCode = customTicketCode;
    if (!finalCode) {
      let hash = 0;
      for (let i = 0; i < matchedGuest.name.length; i++) {
        hash = ((hash << 5) - hash) + matchedGuest.name.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);
      finalCode = `RY-2711-${hex}`;
    }

    // 2. Cek apakah sudah pernah check-in sebelumnya
    const existing = allCheckins.find(c => {
      return (c.guest_id && c.guest_id === matchedGuest.id) ||
             (c.name || '').toLowerCase() === (matchedGuest.name || '').toLowerCase();
    });

    const feedbackCard = document.getElementById('scan-feedback-card');
    const feedbackIcon = document.getElementById('scan-feedback-icon');
    const feedbackBadge = document.getElementById('scan-feedback-badge');
    const feedbackName = document.getElementById('scan-feedback-name');
    const feedbackCat = document.getElementById('scan-feedback-category');
    const feedbackCode = document.getElementById('scan-feedback-code');
    const feedbackTime = document.getElementById('scan-feedback-time');
    const feedbackNote = document.getElementById('scan-feedback-note');

    if (existing) {
      // SUDAH CHECK-IN SEBELUMNYA (DUPLICATE SCAN)
      playChimeTone(false);

      if (feedbackCard) {
        feedbackCard.className = 'p-5 rounded-2xl border transition-all animate-scale-up space-y-3 bg-amber-50/80 border-amber-300';
        if (feedbackIcon) feedbackIcon.className = 'w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0';
        if (feedbackBadge) {
          feedbackBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-800';
          feedbackBadge.textContent = 'PERINGATAN: SUDAH CHECK-IN';
        }
        if (feedbackName) feedbackName.textContent = matchedGuest.name;
        if (feedbackCat) feedbackCat.textContent = `Kategori: ${matchedGuest.category || 'Tamu'}`;
        if (feedbackCode) feedbackCode.textContent = existing.ticket_code || finalCode;
        if (feedbackTime) feedbackTime.textContent = existing.checkin_time;
        if (feedbackNote) feedbackNote.textContent = `Tamu ini sudah pernah melakukan scan presensi pada pukul ${existing.checkin_time}.`;
        feedbackCard.classList.remove('hidden');
      }

      showToast(`Perhatian: "${matchedGuest.name}" SUDAH check-in sebelumnya pada pukul ${existing.checkin_time}`, 'error');
      return;
    }

    // CHECK-IN BARU (VALID)
    playChimeTone(true);
    const nowTime = getLocalTimestamp();

    const newCheckinRecord = {
      id: 'chk_' + Date.now(),
      guest_id: matchedGuest.id,
      name: matchedGuest.name,
      category: matchedGuest.category || 'Tamu',
      ticket_code: finalCode,
      checkin_time: nowTime
    };

    allCheckins.unshift(newCheckinRecord);
    saveCheckins();

    // Simpan presensi ke Supabase Cloud
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      supabaseClient
        .from('checkins')
        .insert([newCheckinRecord])
        .then(() => {})
        .catch((e) => console.warn('[Supabase Checkin Insert Error]', e));
    }

    if (feedbackCard) {
      feedbackCard.className = 'p-5 rounded-2xl border transition-all animate-scale-up space-y-3 bg-emerald-50/80 border-emerald-300';
      if (feedbackIcon) feedbackIcon.className = 'w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0';
      if (feedbackBadge) {
        feedbackBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-800';
        feedbackBadge.textContent = 'CHECK-IN BERHASIL (VALID)';
      }
      if (feedbackName) feedbackName.textContent = matchedGuest.name;
      if (feedbackCat) feedbackCat.textContent = `Kategori: ${matchedGuest.category || 'Tamu'}`;
      if (feedbackCode) feedbackCode.textContent = finalCode;
      if (feedbackTime) feedbackTime.textContent = nowTime;
      if (feedbackNote) feedbackNote.textContent = 'Presensi berhasil dicatat! Selamat datang kepada tamu undangan di resepsi pernikahan.';
      feedbackCard.classList.remove('hidden');
    }

    showToast(`Presensi untuk "${matchedGuest.name}" berhasil dicatat!`);
  }

  // Camera Scanner Setup
  function initCameraScanner() {
    const btnStart = document.getElementById('btn-start-scanner');
    const btnStop = document.getElementById('btn-stop-scanner');
    const placeholder = document.getElementById('qr-camera-placeholder');
    const laser = document.getElementById('qr-scanner-laser');
    const fileInput = document.getElementById('qr-file-input');
    const manualBtn = document.getElementById('btn-manual-checkin');
    const manualInput = document.getElementById('manual-checkin-input');
    const searchCheckinInput = document.getElementById('search-checkedin-input');
    const btnExportPresensi = document.getElementById('btn-export-presensi-csv');
    const btnResetPresensi = document.getElementById('btn-reset-presensi');

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        if (typeof Html5Qrcode === 'undefined') {
          alert('Library scanner kamera sedang dimuat, silakan coba sesaat lagi.');
          return;
        }

        if (!html5QrScannerInstance) {
          html5QrScannerInstance = new Html5Qrcode('qr-camera-stream');
        }

        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        };

        html5QrScannerInstance.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Callback ketika QR berhasil terdeteksi
            handleScannedQRPayload(decodedText);
          },
          () => {} // Abaikan frame tanpa barcode
        ).then(() => {
          isCameraScanning = true;
          if (placeholder) placeholder.classList.add('hidden');
          if (laser) laser.classList.remove('hidden');
          btnStart.classList.add('hidden');
          if (btnStop) btnStop.classList.remove('hidden');
        }).catch(err => {
          console.error('Camera start error:', err);
          alert('Tidak dapat mengaktifkan kamera. Pastikan izin kamera telah diberikan di browser Anda.');
        });
      });
    }

    if (btnStop) {
      btnStop.addEventListener('click', () => {
        if (html5QrScannerInstance && isCameraScanning) {
          html5QrScannerInstance.stop().then(() => {
            isCameraScanning = false;
            if (placeholder) placeholder.classList.remove('hidden');
            if (laser) laser.classList.add('hidden');
            btnStart.classList.remove('hidden');
            btnStop.classList.add('hidden');
          }).catch(err => console.error(err));
        }
      });
    }

    // Scan dari file gambar
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (typeof Html5Qrcode === 'undefined') return;

        const fileScanner = new Html5Qrcode('qr-camera-stream');
        fileScanner.scanFile(file, true)
          .then((decodedText) => {
            handleScannedQRPayload(decodedText);
          })
          .catch(err => {
            alert('Tidak ditemukan QR Code yang valid pada gambar tersebut.');
          });
      });
    }

    // Manual checkin button & Enter key
    if (manualBtn && manualInput) {
      const doManual = () => {
        const val = manualInput.value.trim();
        if (!val) return;
        processGuestCheckIn(val);
        manualInput.value = '';
      };

      manualBtn.addEventListener('click', doManual);
      manualInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doManual();
        }
      });
    }

    // Search checked-in guests
    if (searchCheckinInput) {
      searchCheckinInput.addEventListener('input', () => {
        renderPresensiUI();
      });
    }

    // Export Presensi CSV
    if (btnExportPresensi) {
      btnExportPresensi.addEventListener('click', () => {
        if (allCheckins.length === 0) {
          alert('Belum ada data tamu yang melakukan presensi.');
          return;
        }

        let csv = 'No,Nama Tamu,Kategori,Kode Tiket,Waktu Presensi\n';
        allCheckins.forEach((c, idx) => {
          const name = `"${(c.name || '').replace(/"/g, '""')}"`;
          const cat = `"${(c.category || 'Tamu').replace(/"/g, '""')}"`;
          const code = `"${(c.ticket_code || '').replace(/"/g, '""')}"`;
          const time = `"${(c.checkin_time || '').replace(/"/g, '""')}"`;
          csv += `${idx + 1},${name},${cat},${code},${time}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Data_Presensi_Tamu_Rudi_Yolla_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Data presensi berhasil diexport ke CSV!');
      });
    }

    // Reset presensi
    if (btnResetPresensi) {
      btnResetPresensi.addEventListener('click', () => {
        if (allCheckins.length === 0) {
          alert('Data presensi masih kosong.');
          return;
        }
        if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data presensi tamu? Tindakan ini akan mengosongkan riwayat scan QR.')) {
          allCheckins = [];
          saveCheckins();
          const feedbackCard = document.getElementById('scan-feedback-card');
          if (feedbackCard) feedbackCard.classList.add('hidden');
          showToast('Seluruh data presensi tamu berhasil direset.');
        }
      });
    }
  }

  // ==========================================
  // INITIALIZE ON DOM READY
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initCameraScanner();
  });

})();
