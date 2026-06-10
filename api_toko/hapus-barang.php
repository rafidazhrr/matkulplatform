<?php
include "koneksi.php";

// Menangkap Header Authorization secara aman di berbagai jenis server (Apache, Nginx, CGI/FPM)
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
$cek_token = mysqli_query($koneksi, "SELECT * FROM users WHERE token='$token_dikirim'");

if(mysqli_num_rows($cek_token) === 0 || $token_dikirim === '') {
    // JIKA TOKEN PALSU / KOSONG, HENTIKAN PROGRAM DISINI! (die)
    die(json_encode(["status" => "error", "pesan" => "Akses Ditolak! Token Invalid."]));
}
// ===========================================================

// Jika lolos pengecekan di atas, baris di bawah ini (logika Hapus Barang) akan dieksekusi
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

// Validasi ID
if (isset($data['id'])) {
    $id_barang = mysqli_real_escape_string($koneksi, $data['id']);

    // Ambil nama file gambar (jika ada) sebelum menghapus record
    $gambar = '';
    $cek = mysqli_query($koneksi, "SELECT gambar FROM barang WHERE id = '$id_barang' LIMIT 1");
    if ($cek && mysqli_num_rows($cek) > 0) {
        $row = mysqli_fetch_assoc($cek);
        $gambar = isset($row['gambar']) ? $row['gambar'] : '';
    }

    // Hapus record dari database
    $query = "DELETE FROM barang WHERE id = '$id_barang'";

    if (mysqli_query($koneksi, $query)) {
        // Jika ada file gambar, coba hapus dari folder uploads
        if ($gambar && trim($gambar) !== '') {
            $uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
            $filePath = $uploadDir . basename($gambar);
            if (is_file($filePath)) {
                @unlink($filePath);
            }
        }

        echo json_encode(["status" => "success", "pesan" => "Data berhasil dihapus!"]); 
    } else {
        echo json_encode(["status" => "error", "pesan" => "Gagal menghapus"]);
    }
} else {
    echo json_encode(["status" => "error", "pesan" => "ID tidak ditemukan!"]); 
}
?>