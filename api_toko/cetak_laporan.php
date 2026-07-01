<?php
// 1. Panggil kunci gudang (koneksi)
include "koneksi.php";

// 2. Menangkap Header Authorization secara aman di berbagai jenis server (Apache, Nginx, CGI/FPM)
$token_dikirim = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $token_dikirim = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $token_dikirim = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $token_dikirim = isset($headers['Authorization']) ? $headers['Authorization'] : '';
}

// Cek apakah token dikirim, dan apakah token tersebut ada di tabel users
$token_safe = mysqli_real_escape_string($koneksi, $token_dikirim);
$cek_token = mysqli_query($koneksi, "SELECT * FROM users WHERE token='$token_safe'");

if(mysqli_num_rows($cek_token) === 0 || $token_dikirim === '') {
    header("HTTP/1.1 401 Unauthorized");
    die(json_encode(["status" => "error", "pesan" => "Akses Ditolak! Token Invalid."]));
}

// 3. Tarik seluruh data barang
$query = "SELECT * FROM barang ORDER BY id DESC";
$hasil = mysqli_query($koneksi, $query);

$data_barang = array();
$total_aset = 0;

while ($baris = mysqli_fetch_assoc($hasil)) {
    // Pastikan harga dikalkulasi sebagai float/int
    $harga = isset($baris['harga']) ? (float)$baris['harga'] : 0;
    $total_aset += $harga;
    
    // Simpan ke array
    $data_barang[] = [
        "id" => $baris['id'],
        "nama_barang" => $baris['nama_barang'],
        "harga" => $harga,
        "gambar" => $baris['gambar']
    ];
}

// 4. Buat format bungkusan respon API
$response = [
    "status" => "success",
    "message" => "Berhasil mengambil data laporan",
    "total_aset" => $total_aset,
    "data" => $data_barang
];

// 5. Kembalikan paket sebagai JSON
echo json_encode($response);
?>
