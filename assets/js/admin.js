/**
 * ADMIN PANEL LOGIC (100% MURNI JSON & LOCALSTORAGE)
 * Rudi & Yola Wedding Invitation
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
  const WISHES_STORAGE_KEY = 'wedding_wishes_data';
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

  // ==========================================
  // 1. AUTENTIKASI (USERNAME: admin, PASS: infix)
  // ==========================================
  function checkAuth() {
    const isAuth = localStorage.getItem(AUTH_KEY);
    if (isAuth === 'true') {
      if (loginSection) loginSection.classList.add('hidden');
      if (dashboardSection) dashboardSection.classList.remove('hidden');
      loadAllData();
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
  // 2. NAVIGASI TABS
  // ==========================================
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
      const targetTab = this.getAttribute('data-tab');

      tabBtns.forEach((b) => {
        b.classList.remove('active', 'text-primary', 'border-b-2', 'border-primary', 'bg-blue-50/60');
        b.classList.add('text-slate-500');
      });
      this.classList.add('active', 'text-primary', 'border-b-2', 'border-primary', 'bg-blue-50/60');
      this.classList.remove('text-slate-500');

      tabContents.forEach((c) => c.classList.add('hidden'));
      const activeContent = document.getElementById('tab-' + targetTab);
      if (activeContent) activeContent.classList.remove('hidden');
    });
  });

  // ==========================================
  // 3. LOAD DATA (MURNI JSON + LOCALSTORAGE)
  // ==========================================
  async function loadAllData() {
    await Promise.all([
      loadWishes(),
      loadGuests(),
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
    try {
      const res = await fetch(`${WISHES_JSON_URL}?t=${Date.now()}`);
      if (res.ok) {
        baseWishes = await res.json();
      }
    } catch (e) {}

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

  function deleteWish(wishId) {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan/ucapan ini?')) return;

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
    let baseGuests = [];
    try {
      const res = await fetch(`${GUESTS_JSON_URL}?t=${Date.now()}`);
      if (res.ok) {
        baseGuests = await res.json();
      }
    } catch (e) {}

    let storedGuests = [];
    try {
      const raw = localStorage.getItem(GUESTS_STORAGE_KEY);
      if (raw) storedGuests = JSON.parse(raw);
    } catch (e) {}

    let merged = Array.isArray(storedGuests) && storedGuests.length > 0 ? [...storedGuests] : [...baseGuests];
    if (Array.isArray(baseGuests)) {
      baseGuests.forEach((b) => {
        if (!merged.some((m) => m.id === b.id || m.name === b.name)) {
          merged.push(b);
        }
      });
    }

    allGuests = merged;
    try {
      localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {}

    if (badgeTotalGuests) badgeTotalGuests.textContent = `${allGuests.length} Tamu Terdaftar`;
    if (statTotalGuests) statTotalGuests.textContent = allGuests.length;
    renderGuestsTable();
  }

  function renderGuestsTable() {
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
            <input type="text" readonly value="${escapeHtml(fullUrl)}" class="w-44 text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 focus:outline-none">
          </td>
          <td class="py-3 px-4">
            <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium transition-colors shadow-xs">
              <span class="material-symbols-outlined text-[14px]">send</span>
              <span>Kirim WA</span>
            </a>
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

  function deleteGuest(guestId) {
    if (!confirm('Apakah Anda yakin ingin menghapus tamu ini dari daftar?')) return;

    allGuests = allGuests.filter((g) => g.id !== guestId);
    try {
      localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(allGuests));
    } catch (e) {}

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
      const suffix = genSuffixSelect ? genSuffixSelect.value : '';
      if (suffix && !fullName.includes(suffix)) {
        fullName += ' ' + suffix;
      }

      const category = genCategorySelect ? genCategorySelect.value : 'Umum';
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

      const suffix = bulkSuffixSelect ? bulkSuffixSelect.value : '';
      const category = bulkCategorySelect ? bulkCategorySelect.value : 'Umum';
      const lines = names.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

      const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', 'index.html');
      let count = 0;

      lines.forEach((line) => {
        let fullName = line;
        if (suffix && !fullName.includes(suffix)) fullName += ' ' + suffix;
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
      venue29: 'Grand Ballroom Hotel Santika Premiere Jakarta',
      address29: 'Grand Ballroom Hotel Santika Premiere / Gedung Serbaguna Jakarta (Detail alamat spesifik disematkan di sini).',
      maps29: 'https://maps.google.com/?q=Hotel+Santika+Premiere+Jakarta'
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
      exportToCsv('wishes_rudi_yola.csv', [
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
      exportToCsv('buku_tamu_rudi_yola.csv', [
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

💍 *Pernikahan Rudi & Yola*
🗓 *Jumat, 27 November 2026*
📍 *The Manor Andara, Jakarta*

Tautan undangan resmi & konfirmasi kehadiran:
${guestUrl}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih.
_Wassalamu’alaikum Warahmatullahi Wabarakatuh_

Salam hangat,
*Rudi & Yola*`;
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
  // INITIALIZE ON DOM READY
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
  });

})();
