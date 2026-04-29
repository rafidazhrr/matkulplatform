<?php
include "koneksi.php";

// MENERIMA JSON DARI JAVASCRIPT FETCH
// Fungsi file_get_contents('php://input') adalah standar REST API murni
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

// Validasi jika data tidak kosong
if (isset($data['nama_barang']) && isset($data['harga'])) {

    // Ambil nilai dari array JSON
    // Gunakan mysqli_real_escape_string untuk mencegah SQL Injection dasar
    $nama = mysqli_real_escape_string($koneksi, $data['nama_barang']);
    $harga = mysqli_real_escape_string($koneksi, $data['harga']);

    // Query Insert ke Database
    $query = "INSERT INTO barang (nama_barang, harga) VALUES ('$nama', '$harga')";

    if (mysqli_query($koneksi, $query)) {
        // Jika sukses, kembalikan JSON status success
        echo json_encode(["status" => "success", "pesan" => "Data barang berhasil disimpan!"]);
    } else {
        // Jika gagal query database
        echo json_encode(["status" => "error", "pesan" => "Gagal menyimpan ke database"]);
    }

} else {
    // Jika format JSON dari Frontend salah atau kosong
    echo json_encode(["status" => "error", "pesan" => "Data tidak lengkap!"]);
}
?>