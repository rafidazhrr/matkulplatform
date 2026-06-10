<?php
include "koneksi.php";

// Skrip sederhana untuk menambahkan kolom `gambar` ke tabel `barang` jika belum ada
$cek = mysqli_query($koneksi, "SHOW COLUMNS FROM barang LIKE 'gambar'");
if (mysqli_num_rows($cek) === 0) {
    $sql = "ALTER TABLE barang ADD COLUMN gambar VARCHAR(255) NULL AFTER harga";
    if (mysqli_query($koneksi, $sql)) {
        echo json_encode(["status" => "success", "pesan" => "Kolom 'gambar' berhasil ditambahkan."]);
    } else {
        echo json_encode(["status" => "error", "pesan" => "Gagal menambahkan kolom: " . mysqli_error($koneksi)]);
    }
} else {
    echo json_encode(["status" => "info", "pesan" => "Kolom 'gambar' sudah ada."]);
}

?>
