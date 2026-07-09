<?php
// 1. Panggil kunci gudang (koneksi)
include "koneksi.php";

// Check if querying by QR code
if (isset($_GET['kode_qr'])) {
    $kode_qr = mysqli_real_escape_string($koneksi, trim($_GET['kode_qr']));
    $query = "SELECT * FROM barang WHERE kode_qr = '$kode_qr' LIMIT 1";
    $hasil = mysqli_query($koneksi, $query);

    if ($baris = mysqli_fetch_assoc($hasil)) {
        $response = [
            "status" => "success",
            "message" => "Barang ditemukan.",
            "data" => $baris
        ];
    } else {
        $response = [
            "status" => "not_found",
            "message" => "Belum ada di database.",
            "data" => null
        ];
    }
    echo json_encode($response);
    exit;
}

// 2. Buat perintah SQL (Minta data ke gudang)
$query = "SELECT * FROM barang ORDER BY id DESC";
$hasil = mysqli_query($koneksi, $query);

// 3. Siapkan keranjang kosong untuk menampung data
$data_barang = array();

// 4. Masukkan data dari gudang ke keranjang satu per satu
while ($baris = mysqli_fetch_assoc($hasil)) {
    $data_barang[] = $baris;
}

// 5. Buat format bungkusan paket (Response API)
$response = [
    "status" => "success",
    "message" => "Berhasil mengambil data",
    "data" => $data_barang
];

// 6. Olah dan tampilkan paket sebagai JSON!
echo json_encode($response);
?>