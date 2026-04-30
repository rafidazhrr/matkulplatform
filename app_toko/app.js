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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataKirim), // Object JS diubah jadi String JSON
    });

    const hasil = await response.json();

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
