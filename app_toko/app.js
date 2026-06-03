// 1. Buat fungsi Async (Karena mengambil data butuh waktu menunggu)
let barangData = [];
async function ambilDataBarang() {
  try {
    // 2. Panggil Pelayan (Fetch) menuju URL API
    const response = await fetch("../api_toko/get-barang.php");

    // 3. Bongkar paket (Ubah string JSON jadi Object JS)
    const hasil = await response.json();
    if (hasil.status === "success") {
      // simpan dataset global agar mudah di-filter (search)
      barangData = hasil.data;
      renderBarang(barangData);
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
  }
}

// 6. Jalankan fungsi saat file JS ini di-load
ambilDataBarang();

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
    barisHTML += `
          <div class="group relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_15px_40px_-10px_rgba(16,185,129,0.3)] hover:border-emerald-500/30 overflow-hidden cursor-pointer flex flex-col justify-between min-h-[160px] animate-[fadeInUp_0.6s_ease-out_forwards]" style="opacity: 0; animation-delay: ${animDelay}ms;">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10 flex items-center justify-center">
              <h3 class="text-xl md:text-2xl text-center font-bold text-white font-display leading-tight tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300 line-clamp-2">
                ${barang.nama_barang}
              </h3>
            </div>
            <div class="relative z-10 flex items-baseline mt-6 pt-5 border-t border-slate-700/50 group-hover:border-slate-600/50 transition-colors duration-300">
              <span class="text-emerald-500 font-semibold text-lg mr-1.5 font-sans">Rp</span>
              <span class="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-sm group-hover:from-emerald-300 group-hover:to-cyan-300 transition-all duration-300 font-display">
                ${hargaFormatted}
              </span>
            </div>
            <div class="relative mt-6 flex justify-end z-10 space-x-3">
              <!-- Tombol Edit (sesuai tema: emerald->cyan) -->
              <button onclick="editBarang(${barang.id})" class="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white px-3 py-2 rounded-lg shadow-sm transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M3 21l4.768-1.265 12.238-12.239L15.232 5.232 2 18.464V21z" />
                </svg>
                Edit
              </button>

              <!-- Tombol Hapus yang mengikuti tema (gradien + radius) -->
              <button onclick="hapusBarang(${barang.id})" class="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-3 py-2 rounded-lg shadow-sm transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                </svg>
                Hapus
              </button>
            </div>
            <div class="absolute -bottom-12 -right-12 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none"></div>
            <div class="absolute top-10 -left-12 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all duration-700 pointer-events-none"></div>
          </div>
        `;
  });

  container.innerHTML = barisHTML;
}

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
      ambilDataBarang();
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
    // Tampilkan modal edit bertema (menggantikan prompt native)
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "1rem";
    overlay.style.boxSizing = "border-box";
    overlay.style.background = "rgba(2,6,23,0.78)";
    overlay.style.zIndex = "9999";
    overlay.setAttribute("role", "dialog");

    overlay.innerHTML = `
      <div class="max-w-md w-full p-6 rounded-2xl bg-slate-900/95 border border-slate-700/50 shadow-lg">
        <h3 class="text-lg font-bold text-white mb-2">Edit Barang</h3>
        <div class="grid gap-3">
          <label class="text-sm text-slate-300">Nama Barang</label>
          <input id="__edit_nama" class="w-full bg-slate-900/50 border border-slate-600/50 text-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          <label class="text-sm text-slate-300">Harga</label>
          <input id="__edit_harga" type="text" inputmode="numeric" pattern="[0-9,\.]*" class="w-full bg-slate-900/50 border border-slate-600/50 text-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button class="btn-cancel bg-slate-800/50 text-slate-200 px-4 py-2 rounded-xl border border-slate-700/40">Batal</button>
          <button class="btn-save bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-xl">Simpan</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const inputNama = overlay.querySelector("#__edit_nama");
    const inputHarga = overlay.querySelector("#__edit_harga");
    const btnCancel = overlay.querySelector(".btn-cancel");
    const btnSave = overlay.querySelector(".btn-save");

    // Isi nilai awal dari item
    inputNama.value = item.nama_barang || "";
    inputHarga.value = item.harga || "";

    function cleanup() {
      if (overlay && overlay.parentNode)
        overlay.parentNode.removeChild(overlay);
      document.removeEventListener("keydown", onKeyDown);
    }

    function onKeyDown(e) {
      if (e.key === "Escape") cleanup();
      if (e.key === "Enter") {
        e.preventDefault();
        saveHandler();
      }
    }

    async function saveHandler() {
      const namaBaru = inputNama.value;
      const hargaBaru = inputHarga.value;
      cleanup();
      showToast("Menyimpan perubahan...", "info");
      try {
        const response = await fetch("../api_toko/update-barang.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token_toko") || "",
          },
          body: JSON.stringify({ id, nama_barang: namaBaru, harga: hargaBaru }),
        });

        const hasil = await response
          .json()
          .catch(() => ({ status: "error", message: "Response bukan JSON" }));
        if (handleAuthError(hasil)) return;

        if (hasil && hasil.status === "success") {
          showToast("Data berhasil diperbarui.", "success");
          ambilDataBarang();
        } else {
          showToast(
            hasil && (hasil.message || hasil.pesan)
              ? `Gagal: ${hasil.message || hasil.pesan}`
              : "Gagal memperbarui data.",
            "error",
          );
        }
      } catch (err) {
        console.error("editBarang error:", err);
        showToast("Gagal memperbarui data. Periksa koneksi.", "error");
      }
    }

    btnCancel.addEventListener("click", () => cleanup());
    btnSave.addEventListener("click", () => saveHandler());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup();
    });
    document.addEventListener("keydown", onKeyDown);
    inputNama.focus();
  } catch (err) {
    console.error("editBarang error:", err);
    showToast("Gagal memperbarui data. Periksa koneksi.", "error");
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

  // 2. Buat kardus data (Object JS)
  const dataKirim = {
    nama_barang: namaVal,
    harga: hargaVal,
  };

  // 3. Panggil kurir Fetch (dengan atribut tambahan)
  try {
    const response = await fetch("../api_toko/tambah-barang.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token_toko") || "",
      },
      body: JSON.stringify(dataKirim), // Object JS diubah jadi String JSON
    });

    const hasil = await response.json();
    if (handleAuthError(hasil)) return;

    if (hasil.status === "success") {
      showToast("Data Berhasil ditambah!", "success");
      formTambah.reset(); // Kosongkan form
      ambilDataBarang(); // Panggil fungsi tabel (GET) agar data terbaru langsung muncul!
    }
  } catch (error) {
    console.error("Gagal POST:", error);
  }
});

// Search: filter items client-side (debounced)
const inputSearch = document.getElementById("input-search");
let searchTimeout = null;
if (inputSearch) {
  inputSearch.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        renderBarang(barangData);
        return;
      }
      const filtered = barangData.filter((b) => {
        const nama = (b.nama_barang || "").toLowerCase();
        const harga = String(b.harga || "").toLowerCase();
        const id = String(b.id || "").toLowerCase();
        return nama.includes(q) || harga.includes(q) || id.includes(q);
      });
      renderBarang(filtered);
    }, 180);
  });
}

const myToken = localStorage.getItem('token_toko');

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
