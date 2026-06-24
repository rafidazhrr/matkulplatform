<?php
include "koneksi.php";
header('Content-Type: application/json');

// Ambil 5 barang paling mahal
// Fungsi LIMIT 5 mencegah grafik terlalu padat jika data ada ribuan
$query = "SELECT nama_barang, harga FROM barang ORDER BY harga DESC LIMIT 5";
$hasil = mysqli_query($koneksi, $query);

$labels_barang = []; // Wadah Sumbu X (Teks label bawah grafik)
$values_harga = [];  // Wadah Sumbu Y (Batang grafik)

while ($row = mysqli_fetch_assoc($hasil)) {
    $labels_barang[] = $row['nama_barang'];
    
    // (int) Sangat krusial agar Javascript mengenalinya sebagai Number
    $values_harga[] = (int) $row['harga']; 
}

// Susun respon JSON dengan struktur berlapis agar mudah dibaca Javascript
echo json_encode([
    "status" => "success",
    "pesan" => "Data statistik berhasil dimuat",
    "chart_data" => [
        "labels" => $labels_barang,
        "values" => $values_harga
    ]
]);
?>