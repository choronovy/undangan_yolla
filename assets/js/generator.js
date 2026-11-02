/**
 * Generator Undangan & Tautan Tamu - Rudi & Yola
 * Script untuk generator.html: membuat link personal, salin link, share ke WhatsApp, & riwayat
 */

(function () {
  'use strict';

  const guestNameInput = document.getElementById('guest-name');
  const guestTitleSelect = document.getElementById('guest-title');
  const customTitleInput = document.getElementById('custom-title');
  const customTitleWrapper = document.getElementById('custom-title-wrapper');
  const previewLinkEl = document.getElementById('preview-link');
  const previewWaTextEl = document.getElementById('preview-wa-text');
  const btnCopyLink = document.getElementById('btn-copy-link');
  const btnCopyWa = document.getElementById('btn-copy-wa');
  const btnOpenPreview = document.getElementById('btn-open-preview');
  const btnShareWa = document.getElementById('btn-share-wa');
  const historyListEl = document.getElementById('history-list');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const batchNamesInput = document.getElementById('batch-names');
  const btnGenerateBatch = document.getElementById('btn-generate-batch');
  const batchResultsContainer = document.getElementById('batch-results');

  const STORAGE_KEY = 'wedding_generator_history';

  // Dapatkan base URL index.html
  function getBaseUrl() {
    const loc = window.location;
    const path = loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1);
    return `${loc.origin}${path}index.html`;
  }

  // Dapatkan nama lengkap tamu
  function getFullGuestName() {
    const name = (guestNameInput?.value || '').trim();
    if (!name) return 'Dimas Prasetya & Partner';

    const titleOption = guestTitleSelect ? guestTitleSelect.value : '';
    if (titleOption === 'custom') {
      const customVal = (customTitleInput?.value || '').trim();
      return customVal ? `${name} ${customVal}` : name;
    } else if (titleOption) {
      return `${name} ${titleOption}`;
    }
    return name;
  }

  // Generate URL lengkap
  function generateGuestUrl(fullName) {
    const baseUrl = getBaseUrl();
    const encoded = encodeURIComponent(fullName);
    return `${baseUrl}?to=${encoded}`;
  }

  // Buat pesan WhatsApp
  function generateWaMessage(fullName, url) {
    return `Kepada Yth.
Bapak/Ibu/Saudara/i:
*${fullName}*

_Assalamu’alaikum Warahmatullahi Wabarakatuh_

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada acara pernikahan kami:

✨ *Rudi Dananjaya & Yola Anindita* ✨

🗓 *Jumat, 27 November 2026*
📍 *The Manor Andara, Jakarta*

Untuk informasi detail acara, lokasi, dan memberikan ucapan serta doa restu, silakan buka tautan undangan digital berikut:
👉 ${url}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Atas kehadiran dan doa restunya, kami ucapkan terima kasih yang sebesar-besarnya.

_Wassalamu’alaikum Warahmatullahi Wabarakatuh_

Hormat kami yang berbahagia,
*Rudi & Yola*`;
  }

  // Update Tampilan Preview
  function updatePreview() {
    const fullName = getFullGuestName();
    const url = generateGuestUrl(fullName);
    const waText = generateWaMessage(fullName, url);

    if (previewLinkEl) previewLinkEl.value = url;
    if (previewWaTextEl) previewWaTextEl.value = waText;
    if (btnOpenPreview) btnOpenPreview.href = url;
    if (btnShareWa) {
      btnShareWa.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
    }
  }

  // Setup Riwayat
  function loadHistory() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveToHistory(fullName, url) {
    let history = loadHistory();
    // Cegah duplikat teratas
    history = history.filter(item => item.name !== fullName);
    history.unshift({
      name: fullName,
      url: url,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });
    // Simpan max 30 item
    if (history.length > 30) history = history.slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    if (!historyListEl) return;
    const history = loadHistory();

    if (history.length === 0) {
      historyListEl.innerHTML = `
        <div class="text-center py-6 text-slate-400 text-xs">
          Belum ada riwayat undangan yang dibuat.
        </div>
      `;
      return;
    }

    historyListEl.innerHTML = history.map((item, index) => `
      <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-blue-200 transition-all text-xs gap-2">
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-slate-800 truncate">${item.name}</p>
          <p class="text-slate-400 text-[11px] truncate">${item.url}</p>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button class="btn-copy-history p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors" data-url="${item.url}" title="Salin Tautan">
            <span class="material-symbols-outlined text-[16px]">content_copy</span>
          </button>
          <a href="${item.url}" target="_blank" class="p-1.5 rounded-md hover:bg-slate-100 text-primary transition-colors" title="Buka Link">
            <span class="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
          <button class="btn-wa-history p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 transition-colors" data-name="${item.name}" data-url="${item.url}" title="Kirim WA">
            <span class="material-symbols-outlined text-[16px]">share</span>
          </button>
        </div>
      </div>
    `).join('');

    // Event listener untuk tombol riwayat
    historyListEl.querySelectorAll('.btn-copy-history').forEach(btn => {
      btn.addEventListener('click', function () {
        const url = this.getAttribute('data-url');
        copyToClipboard(url, 'Tautan berhasil disalin!');
      });
    });

    historyListEl.querySelectorAll('.btn-wa-history').forEach(btn => {
      btn.addEventListener('click', function () {
        const name = this.getAttribute('data-name');
        const url = this.getAttribute('data-url');
        const waMsg = generateWaMessage(name, url);
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`, '_blank');
      });
    });
  }

  // Copy helper
  function copyToClipboard(text, msg = 'Tersalin ke papan klip!') {
    navigator.clipboard.writeText(text).then(() => {
      showToast(msg);
    }).catch(() => {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
      showToast(msg);
    });
  }

  // Toast helper
  function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-msg flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1d3d55] text-white shadow-xl text-xs font-medium tracking-wide mb-2';
    toast.innerHTML = `
      <span class="material-symbols-outlined text-base">check_circle</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Event Listeners
  if (guestNameInput) {
    guestNameInput.addEventListener('input', updatePreview);
  }

  if (guestTitleSelect) {
    guestTitleSelect.addEventListener('change', () => {
      if (customTitleWrapper) {
        if (guestTitleSelect.value === 'custom') {
          customTitleWrapper.classList.remove('hidden');
        } else {
          customTitleWrapper.classList.add('hidden');
        }
      }
      updatePreview();
    });
  }

  if (customTitleInput) {
    customTitleInput.addEventListener('input', updatePreview);
  }

  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', () => {
      const fullName = getFullGuestName();
      const url = generateGuestUrl(fullName);
      copyToClipboard(url, 'Link undangan berhasil disalin!');
      saveToHistory(fullName, url);
    });
  }

  if (btnCopyWa) {
    btnCopyWa.addEventListener('click', () => {
      const fullName = getFullGuestName();
      const url = generateGuestUrl(fullName);
      const text = generateWaMessage(fullName, url);
      copyToClipboard(text, 'Pesan WhatsApp berhasil disalin!');
      saveToHistory(fullName, url);
    });
  }

  if (btnShareWa) {
    btnShareWa.addEventListener('click', () => {
      const fullName = getFullGuestName();
      const url = generateGuestUrl(fullName);
      saveToHistory(fullName, url);
    });
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      if (confirm('Hapus seluruh riwayat link yang telah dibuat?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderHistory();
        showToast('Riwayat berhasil dibersihkan.');
      }
    });
  }

  // Batch Generator
  if (btnGenerateBatch && batchNamesInput && batchResultsContainer) {
    btnGenerateBatch.addEventListener('click', () => {
      const rawText = batchNamesInput.value.trim();
      if (!rawText) {
        showToast('Masukkan minimal satu nama tamu pada kotak');
        return;
      }

      const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) return;

      const results = lines.map(name => {
        const url = generateGuestUrl(name);
        saveToHistory(name, url);
        return { name, url };
      });

      batchResultsContainer.classList.remove('hidden');
      batchResultsContainer.innerHTML = `
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
          <p class="text-xs text-blue-900 font-medium">Berhasil meng-generate ${results.length} link tamu undangan!</p>
        </div>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          ${results.map(r => `
            <div class="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs gap-2">
              <span class="font-medium text-slate-800 truncate">${r.name}</span>
              <button class="btn-copy-batch-item px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 font-medium flex items-center gap-1" data-url="${r.url}">
                <span class="material-symbols-outlined text-[14px]">content_copy</span> Salin
              </button>
            </div>
          `).join('')}
        </div>
      `;

      batchResultsContainer.querySelectorAll('.btn-copy-batch-item').forEach(btn => {
        btn.addEventListener('click', function () {
          const url = this.getAttribute('data-url');
          copyToClipboard(url, 'Link berhasil disalin!');
        });
      });

      renderHistory();
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    updatePreview();
    renderHistory();
  });

})();

