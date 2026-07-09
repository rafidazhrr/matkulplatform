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
$token_safe = mysqli_real_escape_string($koneksi, $token_dikirim);
$cek_token = mysqli_query($koneksi, "SELECT * FROM users WHERE token='$token_safe'");

if(mysqli_num_rows($cek_token) === 0 || $token_dikirim === '') {
    die(json_encode(["status" => "error", "pesan" => "Akses Ditolak! Token Invalid."]));
}

// Pastikan direktori uploads ada
$uploadRel = 'uploads/';
$uploadDir = __DIR__ . '/' . $uploadRel;
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Siapkan variabel default
$nama = '';
$harga = '';
$gambar_filename = null;

// Tangani form-data (POST + FILES) atau fallback ke JSON lama
if ($_SERVER['REQUEST_METHOD'] === 'POST' && (!empty($_POST) || !empty($_FILES))) {
    $nama = isset($_POST['nama_barang']) ? mysqli_real_escape_string($koneksi, $_POST['nama_barang']) : '';
    $harga = isset($_POST['harga']) ? mysqli_real_escape_string($koneksi, $_POST['harga']) : '';
    $kode_qr = isset($_POST['kode_qr']) ? mysqli_real_escape_string($koneksi, trim($_POST['kode_qr'])) : '';
    $latitude = isset($_POST['latitude']) ? mysqli_real_escape_string($koneksi, trim($_POST['latitude'])) : '';
    $longitude = isset($_POST['longitude']) ? mysqli_real_escape_string($koneksi, trim($_POST['longitude'])) : '';

    // Proses file jika ada
    if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
        $tmp = $_FILES['gambar']['tmp_name'];
        $orig = basename($_FILES['gambar']['name']);
        $ext = pathinfo($orig, PATHINFO_EXTENSION);
        $allowed = ['jpg','jpeg','png','gif','webp'];
        if (!in_array(strtolower($ext), $allowed)) {
            echo json_encode(["status" => "error", "pesan" => "Format gambar tidak didukung."]);
            exit;
        }
        $random = function_exists('random_bytes') ? bin2hex(random_bytes(6)) : substr(md5(uniqid('', true)), 0, 12);
        $newName = time() . '_' . $random . '.' . $ext;
        if (move_uploaded_file($tmp, $uploadDir . $newName)) {
            $gambar_filename = $newName;
        } else {
            echo json_encode(["status" => "error", "pesan" => "Gagal menyimpan file gambar."]);
            exit;
        }
    }

    if ($nama !== '' && $harga !== '') {
        $kode_qr_val = $kode_qr !== '' ? "'$kode_qr'" : "NULL";
        $lat_val = $latitude !== '' ? "'$latitude'" : "NULL";
        $lng_val = $longitude !== '' ? "'$longitude'" : "NULL";

        if ($gambar_filename !== null) {
            $gambar_db = mysqli_real_escape_string($koneksi, $gambar_filename);
            $query = "INSERT INTO barang (nama_barang, harga, gambar, kode_qr, latitude, longitude) VALUES ('$nama', '$harga', '$gambar_db', $kode_qr_val, $lat_val, $lng_val)";
        } else {
            $query = "INSERT INTO barang (nama_barang, harga, kode_qr, latitude, longitude) VALUES ('$nama', '$harga', $kode_qr_val, $lat_val, $lng_val)";
        }

        if (mysqli_query($koneksi, $query)) {
            echo json_encode(["status" => "success", "pesan" => "Data barang berhasil disimpan!", "gambar" => $gambar_filename ? $gambar_filename : null]);
        } else {
            echo json_encode(["status" => "error", "pesan" => "Gagal menyimpan ke database"]);
        }
    } else {
        echo json_encode(["status" => "error", "pesan" => "Data tidak lengkap!"]);
    }

} else {
    // Fallback: menerima JSON seperti sebelumnya
    $json_data = file_get_contents("php://input");
    $data = json_decode($json_data, true);
    if (isset($data['nama_barang']) && isset($data['harga'])) {
        $nama = mysqli_real_escape_string($koneksi, $data['nama_barang']);
        $harga = mysqli_real_escape_string($koneksi, $data['harga']);
        $kode_qr = isset($data['kode_qr']) ? mysqli_real_escape_string($koneksi, trim($data['kode_qr'])) : '';
        $latitude = isset($data['latitude']) ? mysqli_real_escape_string($koneksi, trim($data['latitude'])) : '';
        $longitude = isset($data['longitude']) ? mysqli_real_escape_string($koneksi, trim($data['longitude'])) : '';

        $kode_qr_val = $kode_qr !== '' ? "'$kode_qr'" : "NULL";
        $lat_val = $latitude !== '' ? "'$latitude'" : "NULL";
        $lng_val = $longitude !== '' ? "'$longitude'" : "NULL";

        $query = "INSERT INTO barang (nama_barang, harga, kode_qr, latitude, longitude) VALUES ('$nama', '$harga', $kode_qr_val, $lat_val, $lng_val)";
        if (mysqli_query($koneksi, $query)) {
            echo json_encode(["status" => "success", "pesan" => "Data barang berhasil disimpan!"]);
        } else {
            echo json_encode(["status" => "error", "pesan" => "Gagal menyimpan ke database"]);
        }
    } else {
        echo json_encode(["status" => "error", "pesan" => "Data tidak lengkap!"]);
    }
}

?>