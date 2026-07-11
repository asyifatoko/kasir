export interface Item {
  id: string; // UUID
  kode_barang: string;
  barcode_utama: string;
  multi_barcode?: string[]; // display helper
  qr_code?: string;
  nama_barang: string;
  nama_pendek?: string;
  nama_cetak_struk?: string;
  brand_merk?: string;
  kategori: string;
  sub_kategori?: string;
  supplier_utama?: string;
  departemen?: string;
  rak?: string;
  gudang_default?: string;
  warna?: string;
  ukuran?: string;
  berat?: number; // gram / kg
  volume?: number; // ml / l
  tipe_barang: 'Barang';
  status: 'Aktif' | 'Non Aktif';
  foto_produk?: string;
  galeri_produk?: string[];
  dokumen_produk?: string[];
  pilihan_harga_jual?: 'Satu Harga' | 'Berdasarkan Satuan' | 'Berdasar Level Harga' | 'Berdasarkan Jumlah';
  harga_dipilih_transaksi?: boolean;
  satuan_dasar?: string;
  menggunakan_harga_pokok_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ItemUnit {
  id: string;
  item_id: string;
  nama: string; // Dus, Pak, Pcs, etc.
  konversi: number; // e.g. 1 Dus = 24 Pcs (konversi = 24)
  barcode?: string;
  harga_jual: number;
  berat?: number;
  jenis_satuan?: string; // Satuan Dasar, etc.
  poin?: number;
  harga_pokok?: number;
  proc_persen?: number;
  komisi_sales?: number;
}

export interface ItemBarcode {
  id: string;
  item_id: string;
  barcode: string;
  tipe: 'Scanner' | 'Timbangan Barcode' | 'QR Code' | 'Internal Code';
}

export interface ItemPrice {
  id: string;
  item_id: string;
  unit_id?: string;
  level_pelanggan: 'Umum' | 'Member Silver' | 'Member Gold' | 'Grosir' | 'Reseller' | 'Agen';
  min_qty: number;
  max_qty?: number;
  harga_jual: number;
  promo_nama?: string;
  promo_mulai?: string;
  promo_selesai?: string;
}

export interface ItemStock {
  id: string;
  item_id: string;
  gudang: string; // e.g., 'Gudang Utama', 'Gudang Toko'
  stok_tersedia: number;
  stok_dipesan: number;
  stok_minimum: number;
  stok_maksimum: number;
  safety_stock: number;
  reorder_point: number;
  buffer_stock: number;
}

export interface ItemSerial {
  id: string;
  item_id: string;
  gudang: string;
  serial_number: string; // IMEI / SN
  lot_number?: string;
  batch_number?: string;
  expired_at?: string;
  status: 'Tersedia' | 'Terjual' | 'Rusak';
}

export interface ItemDiscount {
  id: string;
  item_id: string;
  formula_diskon: string; // e.g., "10%+5%", "Rp2000"
  nominal_diskon: number; // calculated total discount
  aktif?: boolean; // false = nonaktif, tidak dipakai saat hitung harga
}

export interface ItemHpp {
  id: string;
  item_id: string;
  metode: 'FIFO' | 'Average' | 'Last Purchase' | 'Standard Cost';
  nilai_hpp: number;
}

export interface ItemPurchasePrice {
  id: string;
  item_id: string;
  supplier: string;
  tanggal: string;
  harga_beli: number;
  diskon?: string;
  ppn: number; // percentage
  biaya_kirim: number;
  biaya_lain: number;
  hpp_berubah?: number;
}

export interface ItemBundle {
  id: string;
  item_id: string;
  nama_bundle: string;
  tipe_bundle: 'Buy 2 Get 1' | 'Bundle Discount' | 'Mix and Match' | 'Cross Selling' | 'Upselling';
  diskon_persen?: number;
  diskon_nominal?: number;
}

export interface ItemPackage {
  id: string;
  package_item_id: string; // item_id of the package
  component_item_id: string; // item_id of the sub-product
  qty: number;
}

export interface ItemStockLog {
  id: string;
  item_id: string;
  gudang: string;
  tipe_transaksi: 'Penjualan' | 'Pembelian' | 'Stok Opname' | 'Koreksi';
  qty: number;
  stok_sebelum: number;
  stok_sesudah: number;
  user_name: string;
  notes?: string;
  created_at: string;
}

export interface ItemHistory {
  id: string;
  item_id: string;
  user_name: string;
  ip_address?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ROLLBACK';
  changes_json: string; // stringified detail changes
  created_at: string;
}

// POS Transaction interfaces
export interface CartItem {
  id: string; // Unique cart item ID (UUID or generated)
  item: Item;
  selectedUnit: ItemUnit;
  qty: number;
  price: number; // final calculated price after discount / customer level
  originalPrice: number;
  discountFormula: string;
  discountAmount: number;
  serialNumber?: string;
}

export interface Transaction {
  id: string;
  tanggal: string;
  invoice_no: string;
  items: CartItem[];
  total_item: number;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  customer_level: 'Umum' | 'Member Silver' | 'Member Gold' | 'Grosir' | 'Reseller' | 'Agen';
  payment_method: 'Cash' | 'QRIS' | 'Debit' | 'Kredit' | 'Tunai' | 'Qris' | 'Transfer';
  cash_paid?: number;
  change?: number;
  user_cashier: string;
  shift_id?: string;
  gudang?: string; // gudang/outlet asal stok dipotong, dipakai untuk rollback yang akurat
  is_rolled_back?: boolean;
  rolled_back_at?: string;
}

export interface CashierShift {
  id: string;
  cashier_name: string;
  start_time: string;
  end_time?: string;
  starting_cash: number;
  expected_closing_cash?: number;
  actual_closing_cash?: number;
  difference?: number;
  status: 'Open' | 'Closed';
  total_cash_sales: number;
  total_non_cash_sales: number;
  notes?: string;
}

export interface StoreSettings {
  nama_toko: string;
  alamat_toko: string;
  no_telepon: string;
  slogan_toko: string;
  lebar_kertas: "58mm" | "80mm";
  ukuran_font: "kecil" | "sedang" | "besar";
  tampilkan_logo: boolean;
  tampilkan_barcode: boolean;
  header_kustom: string;
  footer_kustom: string;
  gudang_aktif?: string; // gudang/outlet tempat kasir ini berjualan, dipakai untuk potong stok yang benar
  passwords?: {
    owner: string;
    admin: string;
    kasir: string;
  };
}

export interface SupplierPurchaseItem {
  id: string;
  item_id: string;
  item_name: string;
  unit_id: string;
  unit_name: string;
  qty: number;
  harga_beli_satuan: number;
  total_harga: number;
}

export interface SupplierPurchase {
  id: string;
  nomor_referensi: string;
  tanggal: string;
  supplier_name: string;
  items: SupplierPurchaseItem[];
  grand_total: number;
  status_pembayaran: 'Lunas' | 'Hutang';
  gudang_tujuan: string;
  catatan?: string;
  user_name: string;
}

export interface StockOpname {
  id: string;
  tanggal: string;
  item_id: string;
  item_name: string;
  gudang: string;
  stok_sistem: number;
  stok_fisik: number;
  selisih: number;
  satuan_dasar: string;
  catatan: string;
  user_name: string;
}

export type UserRole = "owner" | "admin" | "kasir";

