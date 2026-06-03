<?php
include "koneksi.php";

// Menangkap Header Authorization yang dikirim Javascript
$headers = apache_request_headers();
$token_dikirim = isset($headers['Authorization']) ? $headers['Authorization'] : '';

// Cek apakah token dikirim, dan apakah token tersebut ada di tabel users
$cek_token = mysqli_query($koneksi, "SELECT * FROM users WHERE token='$token_dikirim'");

if(mysqli_num_rows($cek_token) === 0 || $token_dikirim === '') {
    // JIKA TOKEN PALSU / KOSONG, HENTIKAN PROGRAM DISINI! (die)
    die(json_encode(["status" => "error", "pesan" => "Akses Ditolak! Token Invalid."]));
}
// ===========================================================

// Jika lolos pengecekan di atas, baris di bawah ini (logika Tambah Barang) baru akan dieksekusi
$json_data = file_get_contents("php://input");

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (isset($data['id']) && isset($data['nama_barang']) && isset($data['harga'])) {
    $id = mysqli_real_escape_string($koneksi, $data['id']);
    $nama = mysqli_real_escape_string($koneksi, $data['nama_barang']);
    $harga = mysqli_real_escape_string($koneksi, $data['harga']);

    $query = "UPDATE barang SET nama_barang = '$nama', harga = '$harga' WHERE id = '$id'";

    if (mysqli_query($koneksi, $query)) {
        echo json_encode(["status" => "success", "pesan" => "Data berhasil diperbarui!"]);
    } else {
        echo json_encode(["status" => "error", "pesan" => "Gagal memperbarui data"]);
    }
} else {
    echo json_encode(["status" => "error", "pesan" => "Data tidak lengkap!"]);
}

?>