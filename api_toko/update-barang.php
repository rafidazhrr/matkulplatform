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

// Cek token
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

// Tangani form-data (POST + FILES)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && (!empty($_POST) || !empty($_FILES))) {
    $id = isset($_POST['id']) ? mysqli_real_escape_string($koneksi, $_POST['id']) : '';
    $nama = isset($_POST['nama_barang']) ? mysqli_real_escape_string($koneksi, $_POST['nama_barang']) : '';
    $harga = isset($_POST['harga']) ? mysqli_real_escape_string($koneksi, $_POST['harga']) : '';

    if ($id === '' || $nama === '' || $harga === '') {
        echo json_encode(["status" => "error", "pesan" => "Data tidak lengkap!"]);
        exit;
    }

    // Ambil nama file gambar lama (jika ada)
    $oldGambar = null;
    $res = mysqli_query($koneksi, "SELECT gambar FROM barang WHERE id='$id'");
    if ($res && mysqli_num_rows($res) > 0) {
        $row = mysqli_fetch_assoc($res);
        $oldGambar = $row['gambar'];
    }

    // Proses file baru bila dikirim
    $newGambar = null;
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
            $newGambar = $newName;
        } else {
            echo json_encode(["status" => "error", "pesan" => "Gagal menyimpan file gambar."]);
            exit;
        }
    }

    // Build query
    if ($newGambar !== null) {
        $g = mysqli_real_escape_string($koneksi, $newGambar);
        $query = "UPDATE barang SET nama_barang='$nama', harga='$harga', gambar='$g' WHERE id='$id'";
    } else {
        $query = "UPDATE barang SET nama_barang='$nama', harga='$harga' WHERE id='$id'";
    }

    if (mysqli_query($koneksi, $query)) {
        // Jika ada file baru dan file lama ada di server, hapus file lama
        if ($newGambar !== null && $oldGambar) {
            $oldPath = $uploadDir . $oldGambar;
            if (is_file($oldPath)) @unlink($oldPath);
        }
        echo json_encode(["status" => "success", "pesan" => "Data berhasil diperbarui!", "gambar" => $newGambar ? $newGambar : $oldGambar]);
    } else {
        echo json_encode(["status" => "error", "pesan" => "Gagal memperbarui data"]);
    }

} else {
    // Fallback: menerima JSON (lama)
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
}

?>