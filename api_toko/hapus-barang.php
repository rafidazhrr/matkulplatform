<?php
include "koneksi.php";

// 1. Tangkap paket JSON (isinya hanya nomor ID)
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

// 2. Validasi ID
if(isset($data['id'])) {
    $id_barang = mysqli_real_escape_string($koneksi, $data['id']);

    // 3. Query Hapus ke Database
    $query = "DELETE FROM barang WHERE id = '$id_barang'";
    
    if(mysqli_query($koneksi, $query)) {
        echo json_encode(["status" => "success", "pesan" => "Data berhasil dihapus!"]);
    } else {
        echo json_encode(["status" => "error", "pesan" => "Gagal menghapus"]);
    }
} else {
    echo json_encode(["status" => "error", "pesan" => "ID tidak ditemukan!"]);
}
?>