// 1. Buat fungsi Async (Karena mengambil data butuh waktu menunggu)
let barangData = [];
let editingId = null;
let lastPreviewUrl = null;
// Pagination state
let currentPage = 1;
const pageSize = 4;
let currentViewData = [];
let totalPages = 1;

// Real-time / polling helpers
let lastDataSignature = "";
let pollTimer = null;
const POLL_INTERVAL_MS = 4000;
let isFetching = false;
let myChartInstance = null;

async function ambilDataBarang(force = false) {
  if (!force && isFetching) return;
  isFetching = true;
  try {
    // 2. Panggil Pelayan (Fetch) menuju URL API
    const response = await fetch("../api_toko/get-barang.php", {
      credentials: "include",
    });

    // 3. Bongkar paket (Ubah string JSON jadi Object JS)
    const hasil = await response.json();
    if (handleAuthError(hasil)) {
      isFetching = false;
      return;
    }

    if (hasil.status === "success") {
      const newData = hasil.data || [];
      // buat signature sederhana untuk deteksi perubahan
      const signature = newData
        .map((d) => `${d.id}:${d.nama_barang}:${d.harga}:${d.gambar || ""}:${d.kode_qr || ""}:${d.latitude || ""}:${d.longitude || ""}`)
        .join("|");

      if (!force && signature === lastDataSignature) {
        // tidak ada perubahan, hanya perbarui kontrol pagination agar tetap sinkron
        currentViewData = barangData;
        updatePaginationControls(currentViewData.length);
        isFetching = false;
        return;
      }

      lastDataSignature = signature;
      // simpan dataset global agar mudah di-filter (search)
      barangData = newData;
      // inisialisasi view dan pagination
      currentViewData = barangData;
      currentPage = 1;
      totalPages = Math.max(1, Math.ceil(currentViewData.length / pageSize));
      renderPage(currentPage);
      await updateChart();
    } else {
      // Jika status tidak success, tampilkan pesan elegan
      document.getElementById("tabel-barang").innerHTML = `
                <div class="col-span-full py-16 text-center animate-[fadeInUp_0.5s_ease-out]">
                    <div class="inline-block p-4 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
                        <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    </div>
                    <h3 class="text-xl text-slate-300 font-medium">Data barang kosong atau tidak ditemukan.</h3>
                </div>
            `;
      // sembunyikan kontrol pagination jika ada
      try {
        const p = document.getElementById("pagination-controls");
        if (p) p.style.display = "none";
      } catch (e) { }
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
    document.getElementById("tabel-barang").innerHTML = `
            <div class="col-span-full text-center py-20 bg-red-900/10 rounded-3xl border border-red-500/20 backdrop-blur-sm mx-auto w-full max-w-2xl animate-[fadeInUp_0.5s_ease-out]">
                <div class="inline-flex justify-center items-center w-16 h-16 rounded-full bg-red-500/20 mb-6">
                    <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 class="font-display font-bold text-2xl text-red-400 mb-2">Gagal Memuat Etalase</h3>
                <p class="text-red-400/70 text-base">Pastikan Web Server dan Database Anda menyala.</p>
            </div>
        `;
    try {
      const p = document.getElementById("pagination-controls");
      if (p) p.style.display = "none";
    } catch (e) { }
  } finally {
    isFetching = false;
  }
}

// 6. Jalankan fungsi saat file JS ini di-load (dipicu pada window 'load' untuk menjaga urutan)

// Render function: bangun grid dari array items
function renderBarang(items) {
  const container = document.getElementById("tabel-barang");
  if (!items || items.length === 0) {
    container.innerHTML = `
        <div class="col-span-full py-16 text-center animate-[fadeInUp_0.5s_ease-out]">
          <div class="inline-block p-4 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
          </div>
          <h3 class="text-xl text-slate-300 font-medium">Data barang kosong atau tidak ditemukan.</h3>
        </div>
      `;
    return;
  }

  let barisHTML = "";
  items.forEach((barang, index) => {
    let hargaFormatted = barang.harga;
    if (!isNaN(parseFloat(barang.harga)) && isFinite(barang.harga)) {
      hargaFormatted = parseFloat(barang.harga).toLocaleString("id-ID");
    }
    const animDelay = index * 100;
    const imgSrc =
      barang.gambar && barang.gambar !== ""
        ? `../api_toko/uploads/${barang.gambar}`
        : "icons/image.png";

    const badgeQr = barang.kode_qr
      ? `<div class="mt-2 inline-flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/50 text-emerald-400 font-mono text-[10px] font-semibold px-2 py-1 rounded-lg max-w-full">
           <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
             <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M8 8h.01M8 12h.01M8 16h.01M12 16h.01" />
           </svg>
           <span class="truncate max-w-[140px]" title="${barang.kode_qr}">${barang.kode_qr}</span>
         </div>`
      : "";

    const linkMaps = (barang.latitude && barang.longitude)
      ? `<a href="https://maps.google.com/?q=${barang.latitude},${barang.longitude}" target="_blank" class="absolute top-2.5 right-2.5 z-20 flex items-center justify-center w-7 h-7 text-cyan-400 hover:text-cyan-300 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/50 rounded-lg transition-all duration-300 shadow-md hover:scale-105" title="Buka Google Maps">
           <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
             <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
             <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
           </svg>
         </a>`
      : "";

    barisHTML += `
          <div id="row-${barang.id}" class="group bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-5 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between min-h-[380px] animate-[fadeInUp_0.6s_ease-out_forwards] hover:shadow-[0_15px_30px_rgba(16,185,129,0.15)] relative overflow-hidden" style="opacity: 0; animation-delay: ${animDelay}ms; transition: background-color 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease;">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <!-- Image Container -->
            <div class="w-full h-40 bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center mb-4 relative z-10 group-hover:border-slate-700/50 transition-colors">
              <img src="${imgSrc}" alt="${barang.nama_barang}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='icons/image.png'" />
              ${linkMaps}
            </div>

            <!-- Card Body & Details -->
            <div class="flex-grow flex flex-col justify-between z-10">
              <div>
                <h3 class="text-base md:text-lg font-bold text-white font-display leading-snug tracking-tight mb-1 line-clamp-2 group-hover:text-emerald-400 transition-colors duration-300">
                  ${barang.nama_barang}
                </h3>
                ${badgeQr}
              </div>
              
              <div>
                <!-- Price Section -->
                <div class="flex items-baseline mt-4 pt-4 border-t border-slate-700/40">
                  <span class="text-emerald-500 font-semibold text-xs mr-1 font-sans">Rp</span>
                  <span class="text-xl md:text-2xl font-extrabold text-white font-display">
                    ${hargaFormatted}
                  </span>
                </div>

                <!-- Actions Container -->
                <div class="grid grid-cols-2 gap-2 mt-4">
                  <!-- Tombol Edit -->
                  <button onclick="editBarang(${barang.id})" class="inline-flex items-center justify-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50 py-2 px-3 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M3 21l4.768-1.265 12.238-12.239L15.232 5.232 2 18.464V21z" />
                    </svg>
                    Edit
                  </button>

                  <!-- Tombol Hapus -->
                  <button onclick="hapusBarang(${barang.id})" class="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 text-red-400 border border-red-500/20 py-2 px-3 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                    </svg>
                    Hapus
                  </button>
                </div>
              </div>
            </div>

            <!-- Background decorative gradients -->
            <div class="absolute -bottom-12 -right-12 w-36 h-36 bg-cyan-500/5 blur-3xl rounded-full group-hover:bg-cyan-500/10 transition-all duration-700 pointer-events-none"></div>
            <div class="absolute top-10 -left-12 w-28 h-28 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-all duration-700 pointer-events-none"></div>
          </div>
        `;
  });

  container.innerHTML = barisHTML;
}

// Render a specific page from `currentViewData`
function renderPage(page) {
  if (!Array.isArray(currentViewData)) currentViewData = [];
  totalPages = Math.max(1, Math.ceil(currentViewData.length / pageSize));
  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;
  currentPage = page;

  const start = (page - 1) * pageSize;
  const pageItems = currentViewData.slice(start, start + pageSize);
  renderBarang(pageItems);
  updatePaginationControls(currentViewData.length);
}

function updatePaginationControls(totalItems) {
  const container = document.getElementById("pagination-controls");
  if (!container) return;
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const infoEl = document.getElementById("pagination-info");

  totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  // Toggle visibility
  if (totalItems <= pageSize) {
    container.style.display = "none";
    return;
  } else {
    container.style.display = "flex";
  }

  if (infoEl)
    infoEl.textContent = `Halaman ${currentPage} dari ${totalPages} — Menampilkan ${Math.min((currentPage - 1) * pageSize + 1, totalItems)}-${Math.min(currentPage * pageSize, totalItems)} dari ${totalItems}`;

  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) renderPage(currentPage - 1);
    };
  }
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) renderPage(currentPage + 1);
    };
  }
}

// ------------------ Chart.js helpers ------------------
function prepareChartData() {
  try {
    // ambil top 5 berdasarkan harga (descending)
    const sorted = (barangData || []).slice().sort((a, b) => {
      const ha = parseFloat(a.harga) || 0;
      const hb = parseFloat(b.harga) || 0;
      return hb - ha;
    });
    const top5 = sorted.slice(0, 5);
    const labels = top5.map((b) => b.nama_barang);
    const data = top5.map((b) => Number(b.harga) || 0);
    return { labels, data };
  } catch (err) {
    console.error("prepareChartData error:", err);
    return { labels: [], data: [] };
  }
}

function createOrUpdateChart() {
  // replaced by async variant below
}

// Ambil data statistik dari endpoint khusus (fallback ke local jika gagal)
async function fetchStatistik() {
  try {
    const resp = await fetch("../api_toko/statistik.php", {
      credentials: "include",
    });
    const json = await resp.json().catch(() => null);
    if (!json) return null;
    if (handleAuthError(json)) return null;
    if (json.status && json.status === "success" && json.chart_data) {
      return {
        labels: Array.isArray(json.chart_data.labels)
          ? json.chart_data.labels
          : [],
        data: Array.isArray(json.chart_data.values)
          ? json.chart_data.values
          : [],
      };
    }
  } catch (err) {
    console.error("fetchStatistik error:", err);
  }
  return null;
}

async function createOrUpdateChart() {
  try {
    const ctx = document.getElementById("myChart");
    if (!ctx) return;

    // coba ambil dari statistik.php terlebih dahulu
    const stat = await fetchStatistik();
    let labels = [];
    let data = [];

    if (stat && stat.labels && stat.labels.length > 0) {
      labels = stat.labels;
      data = stat.data || [];
    } else {
      const cd = prepareChartData();
      labels = cd.labels;
      data = cd.data;
    }

    // gunakan warna yang sesuai tema
    const presetColors = [
      "rgba(16, 185, 129, 0.8)", // Emerald
      "rgba(6, 182, 212, 0.8)",  // Cyan
      "rgba(99, 102, 241, 0.8)", // Indigo
      "rgba(245, 158, 11, 0.8)",  // Amber
      "rgba(244, 63, 94, 0.8)"   // Rose
    ];
    const presetHoverColors = [
      "rgba(16, 185, 129, 1)",
      "rgba(6, 182, 212, 1)",
      "rgba(99, 102, 241, 1)",
      "rgba(245, 158, 11, 1)",
      "rgba(244, 63, 94, 1)"
    ];

    const bgColors = data.map((_, index) => presetColors[index % presetColors.length]);
    const hoverBgColors = data.map((_, index) => presetHoverColors[index % presetHoverColors.length]);

    if (!myChartInstance) {
      myChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Harga (Rp)",
              data: data,
              backgroundColor: bgColors,
              hoverBackgroundColor: hoverBgColors,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
            y: {
              grid: { color: "rgba(148,163,184,0.08)" },
              ticks: {
                color: "#94a3b8",
                callback: function (value) {
                  return new Intl.NumberFormat("id-ID").format(value);
                },
              },
            },
          },
        },
      });
    } else {
      myChartInstance.data.labels = labels;
      myChartInstance.data.datasets[0].data = data;
      myChartInstance.data.datasets[0].backgroundColor = bgColors;
      myChartInstance.data.datasets[0].hoverBackgroundColor = hoverBgColors;
      myChartInstance.update();
    }
  } catch (err) {
    console.error("createOrUpdateChart error:", err);
  }
}

async function updateChart() {
  // small wrapper for naming clarity
  await createOrUpdateChart();
}

// start polling loop
function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => ambilDataBarang(false), POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// start initial polling after first load
window.addEventListener("load", () => {
  // ensure initial fetch forces render
  ambilDataBarang(true).then(() => startPolling());
});

// Fungsi toast kecil untuk menampilkan notifikasi yang sesuai tema (emerald->cyan)
function showToast(message, type = "success") {
  try {
    const gradients = {
      success: "from-emerald-500 to-cyan-500",
      error: "from-red-500 to-rose-500",
      info: "from-slate-600 to-slate-500",
    };

    const gradient = gradients[type] || gradients.success;

    const toast = document.createElement("div");
    toast.setAttribute("role", "status");
    toast.className = `fixed right-6 bottom-6 z-50 pointer-events-auto max-w-sm w-full rounded-xl px-5 py-3 text-white shadow-[0_10px_30px_-10px_rgba(16,185,129,0.25)] border border-emerald-600/20 bg-gradient-to-r ${gradient} font-semibold`;
    // initial inline styles for animation
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "opacity 260ms ease, transform 260ms ease";

    toast.innerHTML = `
      <div class="flex items-center gap-3 text-sm font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0 stroke-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <div class="flex-1">${message}</div>
        <button class="ml-3 text-white/90 hover:text-white close-toast px-2 py-1 rounded-lg" aria-label="Tutup">×</button>
      </div>
    `;

    document.body.appendChild(toast);

    // animate in
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    function hideToast(el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(10px)";
      setTimeout(() => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }

    // close button
    const closeBtn = toast.querySelector(".close-toast");
    if (closeBtn) closeBtn.addEventListener("click", () => hideToast(toast));

    // auto dismiss
    setTimeout(() => hideToast(toast), 3500);
  } catch (err) {
    console.error("showToast error:", err);
  }
}

// Jika server merespon bahwa token tidak valid, keluarkan user
function handleAuthError(resp) {
  try {
    if (!resp) return false;
    const pesan = (resp.pesan || resp.message || "").toString().toLowerCase();
    if (resp.status === "error" && pesan.includes("token")) {
      try {
        showToast("Sesi Anda tidak valid. Silakan login ulang.", "error");
      } catch (err) {
        console.error("showToast not available:", err);
      }
      // Hapus token lalu redirect singkat agar pengguna melihat notifikasi
      localStorage.removeItem("token_toko");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
      return true;
    }
  } catch (err) {
    console.error("handleAuthError error:", err);
  }
  return false;
}

// Custom themed confirm modal for deletions
function showConfirmDelete(message) {
  return new Promise((resolve) => {
    try {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.minHeight = "100vh";
      overlay.style.padding = "1rem";
      overlay.style.boxSizing = "border-box";
      overlay.style.background = "rgba(2,6,23,0.78)";
      overlay.style.zIndex = "9999";
      overlay.setAttribute("role", "dialog");

      overlay.innerHTML = `
        <div class="max-w-md w-full p-6 rounded-2xl bg-slate-900/95 border border-slate-700/50 shadow-lg">
          <div class="flex items-start gap-4">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M6 19h12"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-white">Konfirmasi Hapus</h3>
              <p class="text-slate-300 text-sm mt-1">${message}</p>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button class="btn-cancel bg-slate-800/50 text-slate-200 px-4 py-2 rounded-xl border border-slate-700/40">Batal</button>
            <button class="btn-confirm bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2 rounded-xl">Hapus</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const btnCancel = overlay.querySelector(".btn-cancel");
      const btnConfirm = overlay.querySelector(".btn-confirm");

      function cleanup(result) {
        if (overlay && overlay.parentNode)
          overlay.parentNode.removeChild(overlay);
        document.removeEventListener("keydown", onKeyDown);
        resolve(result);
      }

      function onKeyDown(e) {
        if (e.key === "Escape") cleanup(false);
      }

      btnCancel.addEventListener("click", () => cleanup(false));
      btnConfirm.addEventListener("click", () => cleanup(true));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup(false);
      });
      document.addEventListener("keydown", onKeyDown);
      // focus the cancel button to avoid accidental deletion via Enter
      btnCancel.focus();
    } catch (err) {
      console.error("showConfirmDelete error:", err);
      resolve(false);
    }
  });
}

// Hapus barang: konfirmasi, coba panggil endpoint server, lalu refresh list
async function hapusBarang(id) {
  try {
    const confirmed = await showConfirmDelete(
      "Yakin ingin menghapus data ini?",
    );
    if (!confirmed) return;

    showToast("Menghapus...", "info");

    // Coba panggil endpoint server (jika tersedia). Jika tidak ada,
    // catch akan menampilkan error.
    const response = await fetch("../api_toko/hapus-barang.php", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token_toko") || "",
      },
      body: JSON.stringify({ id }),
    });

    const hasil = await response
      .json()
      .catch(() => ({ status: "error", message: "Response bukan JSON" }));
    if (handleAuthError(hasil)) return;

    if (hasil && hasil.status === "success") {
      showToast("Data berhasil dihapus.", "success");
      ambilDataBarang(true);
    } else {
      showToast(
        hasil && (hasil.message || hasil.pesan)
          ? `Gagal: ${hasil.message || hasil.pesan}`
          : "Gagal menghapus data dari server.",
        "error",
      );
    }
  } catch (err) {
    console.error("hapusBarang error:", err);
    showToast("Gagal menghapus data. Periksa koneksi.", "error");
  }
}

// Edit barang: prompt user untuk nama & harga, lalu kirim ke API update
async function editBarang(id) {
  try {
    const item = barangData.find((b) => String(b.id) === String(id));
    if (!item) {
      showToast("Data tidak ditemukan.", "error");
      return;
    }

    // Masuk ke mode edit: isi form utama
    editingId = String(id);
    const inputId = document.getElementById("input-id");
    const inputNama = document.getElementById("input-nama");
    const inputHarga = document.getElementById("input-harga");
    const fileInput = document.getElementById("input-gambar");
    const previewWrapper = document.getElementById("preview-wrapper");
    const previewImg = document.getElementById("preview-gambar");
    const btnSubmit = document.getElementById("btn-submit");
    const btnCancel = document.getElementById("btn-cancel-edit");

    inputId.value = editingId;
    inputNama.value = item.nama_barang || "";
    inputHarga.value = item.harga || "";

    // QR and GPS inputs
    const inputQr = document.getElementById("form-kode-qr");
    const inputLat = document.getElementById("form-latitude");
    const inputLng = document.getElementById("form-longitude");
    const btnGps = document.getElementById("btn-lacak-gps");

    if (inputQr) inputQr.value = item.kode_qr || "";
    if (inputLat) inputLat.value = item.latitude || "";
    if (inputLng) inputLng.value = item.longitude || "";
    if (btnGps) {
      if (item.latitude && item.longitude) {
        btnGps.innerHTML = "[OK] Lokasi Terkunci";
        btnGps.style.background = "#10b981"; // emerald color background
      } else {
        btnGps.innerHTML = "📍 Lacak GPS";
        btnGps.style.background = "";
      }
    }

    // reset file input value
    try {
      fileInput.value = null;
    } catch (e) {
      /* ignore */
    }

    // Tampilkan preview jika ada gambar
    if (item.gambar && item.gambar !== "") {
      previewImg.src = `../api_toko/uploads/${item.gambar}`;
      previewWrapper.classList.remove("hidden");
    } else {
      previewImg.src = "icons/image.png";
      previewWrapper.classList.remove("hidden");
    }

    // Ubah label tombol dan tampilkan tombol batal
    if (btnSubmit) btnSubmit.textContent = "Perbarui";
    if (btnCancel) btnCancel.classList.remove("hidden");

    // fokus ke nama
    inputNama.focus();
    // scroll ke form
    inputNama.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    console.error("editBarang error:", err);
    showToast("Gagal mengisi form edit.", "error");
  }
}

// Cek apakah browser mendukung Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((registration) => {
        console.log("Service Worker Berhasil Didaftarkan!", registration.scope);
      })
      .catch((err) => {
        console.error("Service Worker Gagal:", err);
      });
  });
}

// Menangkap elemen form
const formTambah = document.getElementById("form-tambah");

// Memasang 'telinga' untuk mendengarkan event 'submit'
formTambah.addEventListener("submit", async function (event) {
  // JURUS UTAMA: Hentikan browser melakukan refresh otomatis!
  event.preventDefault();

  console.log("Form disubmit, tapi halaman tidak berkedip!");

  // 1. Ambil nilai yang diketik user di kotak input
  const namaVal = document.getElementById("input-nama").value;
  const hargaVal = document.getElementById("input-harga").value;
  const qrVal = document.getElementById("form-kode-qr").value;
  const latVal = document.getElementById("form-latitude").value;
  const lngVal = document.getElementById("form-longitude").value;

  // 2. Buat FormData agar bisa mengirim file
  const fileInput = document.getElementById("input-gambar");
  const fd = new FormData();
  fd.append("nama_barang", namaVal);
  fd.append("harga", hargaVal);
  fd.append("kode_qr", qrVal);
  fd.append("latitude", latVal);
  fd.append("longitude", lngVal);
  if (fileInput && fileInput.files && fileInput.files[0]) {
    fd.append("gambar", fileInput.files[0]);
  }

  // Jika sedang dalam mode edit, sertakan id dan ubah endpoint
  let endpoint = "../api_toko/tambah-barang.php";
  if (editingId) {
    fd.append("id", editingId);
    endpoint = "../api_toko/update-barang.php";
  }

  // 3. Kirim FormData via Fetch (jangan set Content-Type manual)
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: localStorage.getItem("token_toko") || "",
      },
      body: fd,
    });

    const hasil = await response.json();
    if (handleAuthError(hasil)) return;

    if (hasil && hasil.status === "success") {
      if (editingId) {
        showToast("Data berhasil diperbarui!", "success");
        // keluar dari mode edit
        editingId = null;
        const inputId = document.getElementById("input-id");
        if (inputId) inputId.value = "";
        const btnSubmit = document.getElementById("btn-submit");
        if (btnSubmit) btnSubmit.textContent = "Simpan";
        const btnCancel = document.getElementById("btn-cancel-edit");
        if (btnCancel) btnCancel.classList.add("hidden");
      } else {
        showToast("Data Berhasil ditambah!", "success");
      }
      // revoke any preview URL (add or edit)
      if (lastPreviewUrl) {
        try {
          URL.revokeObjectURL(lastPreviewUrl);
        } catch (e) { }
        lastPreviewUrl = null;
      }

      // Clear file input and reset preview UI
      const fileInputClear = document.getElementById("input-gambar");
      const previewWrapperClear = document.getElementById("preview-wrapper");
      const previewImgClear = document.getElementById("preview-gambar");
      try {
        if (fileInputClear) fileInputClear.value = null;
      } catch (e) { }
      if (previewWrapperClear) previewWrapperClear.classList.add("hidden");
      if (previewImgClear) previewImgClear.src = "icons/image.png";

      // Reset GPS button status
      const btnGps = document.getElementById("btn-lacak-gps");
      if (btnGps) {
        btnGps.innerHTML = "📍 Lacak GPS";
        btnGps.style.background = "";
        btnGps.disabled = false;
      }

      formTambah.reset(); // Kosongkan form
      ambilDataBarang(true); // Refresh daftar (paksa render)
    } else {
      showToast(
        hasil && (hasil.message || hasil.pesan)
          ? `Gagal: ${hasil.message || hasil.pesan}`
          : editingId
            ? "Gagal memperbarui data."
            : "Gagal menambahkan data.",
        "error",
      );
    }
  } catch (error) {
    console.error("Gagal POST:", error);
    showToast("Gagal mengirim data. Periksa koneksi.", "error");
  }
});

// Tombol batal edit: batalkan mode edit dan reset form
const btnCancelEdit = document.getElementById("btn-cancel-edit");
if (btnCancelEdit) {
  btnCancelEdit.addEventListener("click", () => {
    editingId = null;
    const inputId = document.getElementById("input-id");
    if (inputId) inputId.value = "";
    formTambah.reset();
    const btnSubmit = document.getElementById("btn-submit");
    if (btnSubmit) btnSubmit.textContent = "Simpan";
    const previewWrapper = document.getElementById("preview-wrapper");
    const previewImg = document.getElementById("preview-gambar");
    if (previewWrapper) previewWrapper.classList.add("hidden");
    if (previewImg) previewImg.src = "icons/image.png";

    // Reset GPS button status
    const btnGps = document.getElementById("btn-lacak-gps");
    if (btnGps) {
      btnGps.innerHTML = "📍 Lacak GPS";
      btnGps.style.background = "";
      btnGps.disabled = false;
    }

    // revoke any created object URL
    if (lastPreviewUrl) {
      try {
        URL.revokeObjectURL(lastPreviewUrl);
      } catch (e) { }
      lastPreviewUrl = null;
    }
    // hide the cancel button itself
    btnCancelEdit.classList.add("hidden");
    // focus name input for convenience
    const inputNama = document.getElementById("input-nama");
    if (inputNama) inputNama.focus();
  });
}

// Preview ketika memilih file baru
const fileInputEl = document.getElementById("input-gambar");
if (fileInputEl) {
  fileInputEl.addEventListener("change", (e) => {
    const previewWrapper = document.getElementById("preview-wrapper");
    const previewImg = document.getElementById("preview-gambar");
    if (e.target.files && e.target.files[0]) {
      try {
        // revoke previous URL
        if (lastPreviewUrl) {
          try {
            URL.revokeObjectURL(lastPreviewUrl);
          } catch (er) { }
          lastPreviewUrl = null;
        }
        lastPreviewUrl = URL.createObjectURL(e.target.files[0]);
        previewImg.src = lastPreviewUrl;
        if (previewWrapper) previewWrapper.classList.remove("hidden");
      } catch (err) {
        console.error("preview error:", err);
      }
    } else {
      if (previewWrapper) previewWrapper.classList.add("hidden");
      if (previewImg) previewImg.src = "icons/image.png";
      if (lastPreviewUrl) {
        try {
          URL.revokeObjectURL(lastPreviewUrl);
        } catch (er) { }
        lastPreviewUrl = null;
      }
    }
  });
}

// Search: filter items client-side (debounced)
const inputSearch = document.getElementById("input-search");
let searchTimeout = null;
if (inputSearch) {
  inputSearch.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        currentViewData = barangData;
        currentPage = 1;
        totalPages = Math.max(1, Math.ceil(currentViewData.length / pageSize));
        renderPage(1);
        return;
      }
      const filtered = barangData.filter((b) => {
        const nama = (b.nama_barang || "").toLowerCase();
        const harga = String(b.harga || "").toLowerCase();
        const id = String(b.id || "").toLowerCase();
        const qr = String(b.kode_qr || "").toLowerCase();
        return nama.includes(q) || harga.includes(q) || id.includes(q) || qr.includes(q);
      });
      currentViewData = filtered;
      currentPage = 1;
      totalPages = Math.max(1, Math.ceil(currentViewData.length / pageSize));
      renderPage(1);
    }, 180);
  });
}

const myToken = localStorage.getItem("token_toko");

if (!myToken) {
  try {
    showToast("Anda harus login terlebih dahulu!", "error");
  } catch (err) {
    console.error(err);
  }
  setTimeout(() => {
    window.location.href = "login.html";
  }, 700);
}

// 2. CONTOH MODIFIKASI FETCH TAMBAH/EDIT DATA (Sematkan Header Authorization)
// Berlaku juga untuk fetch Hapus Barang!
// Contoh pola (dinonaktifkan). Jika ingin mengirim token `Authorization`,
// sesuaikan handler submit di atas dan tambahkan header:
// {
//   "Content-Type": "application/json",
//   "Authorization": myToken
// }
// (Kode contoh dihapus untuk menghindari kesalahan sintaks.)

// FUNGSI LOGOUT (Tambahkan tombol "Logout" di index.html yang memanggil fungsi ini)
function logout() {
  localStorage.removeItem("token_toko");
  window.location.href = "login.html";
}

// Event listener untuk Tombol Buka Tab Cetak
const btnCetak = document.getElementById("btn-cetak");
if (btnCetak) {
  btnCetak.addEventListener("click", () => {
    window.open("cetak.html", "_blank");
  });
}

// -- STATE GLOBAL SMART QR & GPS ---------------------------------
let _mainQrScanner = null;   // Instance scanner di modal utama
let _formQrScanner = null;   // Instance scanner di modal form
let _qrLastResult = null;   // Simpan hasil lookup: { kodeQr, barang }
let _qrModalMode = 'search'; // Mode modal QR scanner: 'search' atau 'tambah'

// -- 1. BUKA MODAL SCANNER ------------------------------------
function bukaModalQrScan(mode) {
  _qrLastResult = null;
  _qrModalMode = mode;

  const modal = document.getElementById('modal-qr-scan');
  const titleEl = document.getElementById('qr-modal-title');
  const hintEl = document.getElementById('qr-modal-hint');

  if (titleEl) {
    titleEl.textContent = mode === 'tambah' ? 'Scan QR → Tambah Barang' : 'Scan QR → Cari Barang';
  }
  if (hintEl) {
    hintEl.textContent = mode === 'tambah'
      ? 'Jika belum ada, form tambah akan ter-prefill otomatis.'
      : 'Jika ditemukan di database, barang akan langsung dicari dan di-highlight.';
  }

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  initMainQrScanner(); // Nyalakan kamera
}

// -- 2. INIT SCANNER KAMERA UTAMA ------------------------------
function initMainQrScanner() {
  if (_mainQrScanner) return; // Jangan dobel

  // Html5QrcodeScanner requires element ID
  _mainQrScanner = new Html5QrcodeScanner(
    'qr-reader-main',
    {
      fps: 10,
      qrbox: { width: 240, height: 240 },
      aspectRatio: 1.0
    },
    false
  );

  _mainQrScanner.render(
    async function (decodedText) {      // <- CALLBACK SUKSES
      // Jeda scanner
      try {
        if (_mainQrScanner) _mainQrScanner.pause(true);
      } catch (e) { }

      tampilQrStatus(decodedText, 'loading');

      // Cek ke API
      try {
        const response = await fetch(`../api_toko/get-barang.php?kode_qr=${encodeURIComponent(decodedText)}`, {
          credentials: 'include'
        });
        const hasil = await response.json();

        if (hasil.status === 'success' && hasil.data) {
          _qrLastResult = { kodeQr: decodedText, barang: hasil.data };
          tampilQrStatus(decodedText, 'found', hasil.data);
        } else {
          _qrLastResult = { kodeQr: decodedText, barang: null };
          tampilQrStatus(decodedText, 'notfound');
        }
      } catch (err) {
        console.error("API check failed:", err);
        _qrLastResult = { kodeQr: decodedText, barang: null };
        tampilQrStatus(decodedText, 'notfound');
      }
    },
    function () { } // <- CALLBACK GAGAL: diabaikan
  );
}

// -- 3. TAMPILKAN STATUS HASIL SCAN --------------------------
function tampilQrStatus(kode, state, barang) {
  const statusBox = document.getElementById('qr-status-box');
  const scannedText = document.getElementById('qr-scanned-text');

  if (statusBox) statusBox.classList.remove('hidden');
  if (scannedText) scannedText.textContent = kode;

  const stateLoading = document.getElementById('qr-state-loading');
  const stateFound = document.getElementById('qr-state-found');
  const stateNotFound = document.getElementById('qr-state-notfound');

  if (stateLoading) stateLoading.classList.add('hidden');
  if (stateFound) stateFound.classList.add('hidden');
  if (stateNotFound) stateNotFound.classList.add('hidden');

  if (state === 'loading') {
    if (stateLoading) {
      stateLoading.classList.remove('hidden');
      stateLoading.classList.add('flex');
    }
  } else if (state === 'found' && barang) {
    const foundNama = document.getElementById('qr-found-nama');
    const foundHarga = document.getElementById('qr-found-harga');
    if (foundNama) foundNama.textContent = barang.nama_barang || '';
    if (foundHarga) {
      let prc = barang.harga;
      if (!isNaN(parseFloat(barang.harga)) && isFinite(barang.harga)) {
        prc = parseFloat(barang.harga).toLocaleString('id-ID');
      }
      foundHarga.textContent = 'Rp ' + prc;
    }
    if (stateFound) stateFound.classList.remove('hidden');
  } else {
    if (stateNotFound) stateNotFound.classList.remove('hidden');
  }
}

// -- 4. AKSI: Barang DITEMUKAN -> tampilkan di tabel / grid ---
function eksekusiQrFound() {
  if (!_qrLastResult || !_qrLastResult.barang) return;

  const kode = _qrLastResult.kodeQr;
  const searchInput = document.getElementById('input-search');

  tutupModalQrScan();

  if (searchInput) {
    searchInput.value = kode;
    // Trigger search
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  showToast('🔎 Menampilkan barang: ' + _qrLastResult.barang.nama_barang, 'info');

  // Highlight card setelah data dimuat / dicari
  setTimeout(() => {
    const barang = _qrLastResult.barang;
    if (barang && barang.id) {
      const card = document.getElementById(`row-${barang.id}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // apply glow highlight
        card.style.borderColor = '#10b981';
        card.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.4)';
        card.style.transform = 'scale(1.03)';

        setTimeout(() => {
          card.style.borderColor = '';
          card.style.boxShadow = '';
          card.style.transform = '';
        }, 2500);
      }
    }
  }, 400);
}

// -- 5. AKSI: Barang BARU -> buka form tambah + prefill --------
function eksekusiQrTambah() {
  if (!_qrLastResult) return;
  const kode = _qrLastResult.kodeQr;
  tutupModalQrScan();

  setTimeout(() => {
    // Focus ke form tambah
    const inputQr = document.getElementById('form-kode-qr');
    if (inputQr) {
      inputQr.value = kode;
      inputQr.style.borderColor = '#10b981'; // Highlight hijau
      setTimeout(() => inputQr.style.borderColor = '', 2000);
    }

    const inputNama = document.getElementById('input-nama');
    if (inputNama) {
      inputNama.focus();
      inputNama.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showToast(`📦 Kode "${kode}" terisi. Lengkapi nama & harga.`, 'info');
  }, 300);
}

// -- 6. RESET & SCAN ULANG ------------------------------------
function resetQrScanner() {
  if (_mainQrScanner) {
    _mainQrScanner.clear().catch(() => { });
    _mainQrScanner = null;
  }
  const readerMain = document.getElementById('qr-reader-main');
  if (readerMain) readerMain.innerHTML = '';

  const statusBox = document.getElementById('qr-status-box');
  if (statusBox) statusBox.classList.add('hidden');

  setTimeout(initMainQrScanner, 100); // Re-init scanner
}

// -- 7. TUTUP MODAL SCANNER UTAMA ------------------------------
function tutupModalQrScan() {
  if (_mainQrScanner) {
    _mainQrScanner.clear().catch(() => { });
    _mainQrScanner = null;
  }
  const readerMain = document.getElementById('qr-reader-main');
  if (readerMain) readerMain.innerHTML = '';

  const statusBox = document.getElementById('qr-status-box');
  if (statusBox) statusBox.classList.add('hidden');

  const modal = document.getElementById('modal-qr-scan');
  if (modal) {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
  }
}

// -- 8. INLINE FORM SCANNER ------------------------------------
function toggleFormScanner() {
  const formReader = document.getElementById('form-reader');
  if (!formReader) return;

  if (formReader.classList.contains('hidden')) {
    formReader.classList.remove('hidden');

    _formQrScanner = new Html5QrcodeScanner(
      'form-reader',
      { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1.0 },
      false
    );

    _formQrScanner.render(
      function (decodedText) {
        const inputQr = document.getElementById('form-kode-qr');
        if (inputQr) {
          inputQr.value = decodedText;
          inputQr.style.borderColor = '#10b981';
          setTimeout(() => inputQr.style.borderColor = '', 2000);
        }
        showToast(`📷 QR Code berhasil dipindai!`, 'success');

        // stop scanner
        if (_formQrScanner) {
          _formQrScanner.clear().catch(() => { });
          _formQrScanner = null;
        }
        formReader.classList.add('hidden');
        formReader.innerHTML = '';
      },
      function () { }
    );
  } else {
    if (_formQrScanner) {
      _formQrScanner.clear().catch(() => { });
      _formQrScanner = null;
    }
    formReader.classList.add('hidden');
    formReader.innerHTML = '';
  }
}

// -- 9. GEOLOKASI GPS -----------------------------------------
function dapatkanLokasi() {
  const btnGps = document.getElementById('btn-lacak-gps');
  const inputLat = document.getElementById('form-latitude');
  const inputLng = document.getElementById('form-longitude');

  if (!navigator.geolocation) {
    showToast('Browser tidak mendukung Geolocation.', 'error');
    return;
  }

  if (btnGps) {
    btnGps.disabled = true;
    btnGps.innerHTML = '⏳ Melacak...';
  }

  navigator.geolocation.getCurrentPosition(
    function (position) {
      if (inputLat) inputLat.value = position.coords.latitude.toFixed(7);
      if (inputLng) inputLng.value = position.coords.longitude.toFixed(7);
      showToast('📍 Lokasi GPS berhasil dikunci!', 'success');
      if (btnGps) {
        btnGps.disabled = false;
        btnGps.innerHTML = '[OK] Lokasi Terkunci';
        btnGps.style.background = '#10b981'; // emerald
      }
    },
    function (error) {
      console.error("GPS track failed:", error);
      showToast('Gagal. Pastikan GPS aktif dan izin diberikan.', 'error');
      if (btnGps) {
        btnGps.disabled = false;
        btnGps.innerHTML = '📍 Lacak GPS';
        btnGps.style.background = '';
      }
    },
    { enableHighAccuracy: true, timeout: 7000 }
  );
}
