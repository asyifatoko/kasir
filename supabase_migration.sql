-- =========================================================
-- MIGRASI KASIR POS ASYIFA — SKEMA LENGKAP + AUTH + RLS
-- Jalankan seluruh file ini di Supabase SQL Editor.
-- Aman dijalankan berkali-kali (pakai IF NOT EXISTS / OR REPLACE).
-- =========================================================

-- =========================================================
-- BAGIAN 0. Ekstensi yang dibutuhkan
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- BAGIAN 1. TABEL MASTER BARANG (sudah ada di versi lama,
-- disalin ulang di sini supaya file ini bisa dipakai dari nol)
-- =========================================================
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_barang VARCHAR(100) UNIQUE NOT NULL,
    barcode_utama VARCHAR(100),
    qr_code TEXT,
    nama_barang VARCHAR(255) NOT NULL,
    nama_pendek VARCHAR(100),
    nama_cetak_struk VARCHAR(150),
    brand_merk VARCHAR(100),
    kategori VARCHAR(100),
    sub_kategori VARCHAR(100),
    supplier_utama VARCHAR(255),
    departemen VARCHAR(100),
    rak VARCHAR(100),
    gudang_default VARCHAR(100),
    warna VARCHAR(50),
    ukuran VARCHAR(50),
    berat NUMERIC(10, 2),
    volume NUMERIC(10, 2),
    tipe_barang VARCHAR(50) DEFAULT 'Barang',
    status VARCHAR(50) DEFAULT 'Aktif',
    foto_produk TEXT,
    galeri_produk TEXT[],
    dokumen_produk TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    nama VARCHAR(50) NOT NULL,
    konversi NUMERIC(10, 2) DEFAULT 1,
    barcode VARCHAR(100),
    harga_jual NUMERIC(15, 2) DEFAULT 0,
    berat NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    barcode VARCHAR(100) NOT NULL,
    tipe VARCHAR(50) DEFAULT 'Scanner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Cegah barcode ganda antar barang (temuan #8 di review)
CREATE UNIQUE INDEX IF NOT EXISTS uq_item_barcodes_barcode ON item_barcodes (barcode);

CREATE TABLE IF NOT EXISTS item_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES item_units(id) ON DELETE SET NULL,
    level_pelanggan VARCHAR(50) DEFAULT 'Umum',
    min_qty INT DEFAULT 1,
    max_qty INT,
    harga_jual NUMERIC(15, 2) NOT NULL,
    promo_nama VARCHAR(100),
    promo_mulai TIMESTAMP WITH TIME ZONE,
    promo_selesai TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    gudang VARCHAR(100) DEFAULT 'Utama',
    stok_tersedia INT DEFAULT 0,
    stok_dipesan INT DEFAULT 0,
    stok_minimum INT DEFAULT 10,
    stok_maksimum INT DEFAULT 1000,
    safety_stock INT DEFAULT 5,
    reorder_point INT DEFAULT 15,
    buffer_stock INT DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_serials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    gudang VARCHAR(100) DEFAULT 'Utama',
    serial_number VARCHAR(150) NOT NULL,
    lot_number VARCHAR(100),
    batch_number VARCHAR(100),
    expired_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Tersedia',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_discount (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    formula_diskon VARCHAR(100) NOT NULL,
    nominal_diskon NUMERIC(15, 2) DEFAULT 0,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_hpp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    metode VARCHAR(50) DEFAULT 'Average',
    nilai_hpp NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_purchase_price (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    supplier VARCHAR(255),
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    harga_beli NUMERIC(15, 2) NOT NULL,
    diskon VARCHAR(50),
    ppn NUMERIC(5, 2) DEFAULT 0,
    biaya_kirim NUMERIC(15, 2) DEFAULT 0,
    biaya_lain NUMERIC(15, 2) DEFAULT 0,
    hpp_berubah NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_bundle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    nama_bundle VARCHAR(255) NOT NULL,
    tipe_bundle VARCHAR(100) DEFAULT 'Buy 2 Get 1',
    diskon_persen NUMERIC(5, 2),
    diskon_nominal NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    component_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    qty NUMERIC(10, 2) DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    gudang VARCHAR(100) DEFAULT 'Utama',
    tipe_transaksi VARCHAR(100) NOT NULL,
    qty INT NOT NULL,
    stok_sebelum INT NOT NULL,
    stok_sesudah INT NOT NULL,
    user_name VARCHAR(100) DEFAULT 'System',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    changes_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_search ON items (kode_barang, barcode_utama, nama_barang, kategori);

-- =========================================================
-- BAGIAN 2. TABEL YANG SEBELUMNYA HILANG DARI SKEMA
-- (transaksi, shift, pengaturan toko, pembelian, stok opname)
-- Sebelumnya tabel-tabel ini TIDAK PERNAH dibuat, sehingga
-- POSStorage diam-diam hanya menyimpannya di localStorage saja.
-- =========================================================

CREATE TABLE IF NOT EXISTS store_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row, satu toko satu baris
    nama_toko VARCHAR(255) NOT NULL DEFAULT 'Toko Saya',
    alamat_toko TEXT,
    no_telepon VARCHAR(50),
    slogan_toko VARCHAR(255),
    lebar_kertas VARCHAR(10) DEFAULT '58mm',
    ukuran_font VARCHAR(20) DEFAULT 'sedang',
    tampilkan_logo BOOLEAN DEFAULT true,
    tampilkan_barcode BOOLEAN DEFAULT true,
    header_kustom TEXT,
    footer_kustom TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Catatan: kolom "passwords" SENGAJA TIDAK dibuat di sini.
-- Password tidak lagi disimpan sebagai teks biasa di tabel data;
-- login sekarang memakai Supabase Auth (lihat Bagian 3).

CREATE TABLE IF NOT EXISTS cashier_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_name VARCHAR(150) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    starting_cash NUMERIC(15,2) DEFAULT 0,
    expected_closing_cash NUMERIC(15,2),
    actual_closing_cash NUMERIC(15,2),
    difference NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'Open',
    total_cash_sales NUMERIC(15,2) DEFAULT 0,
    total_non_cash_sales NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    items JSONB NOT NULL,             -- snapshot cart item (harga sudah final, aman dari perubahan harga di kemudian hari)
    total_item INT DEFAULT 0,
    subtotal NUMERIC(15,2) DEFAULT 0,
    discount_total NUMERIC(15,2) DEFAULT 0,
    tax_total NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) DEFAULT 0,
    customer_level VARCHAR(50) DEFAULT 'Umum',
    payment_method VARCHAR(50) DEFAULT 'Tunai',
    cash_paid NUMERIC(15,2),
    change NUMERIC(15,2),
    user_cashier VARCHAR(150),
    shift_id UUID REFERENCES cashier_shifts(id),
    gudang VARCHAR(100) DEFAULT 'Gudang Toko',
    is_rolled_back BOOLEAN DEFAULT false,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS supplier_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_referensi VARCHAR(100) UNIQUE NOT NULL,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    supplier_name VARCHAR(255),
    items JSONB NOT NULL,
    grand_total NUMERIC(15,2) DEFAULT 0,
    status_pembayaran VARCHAR(20) DEFAULT 'Lunas',
    gudang_tujuan VARCHAR(100),
    catatan TEXT,
    user_name VARCHAR(150),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS stock_opnames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    item_name VARCHAR(255),
    gudang VARCHAR(100),
    stok_sistem INT DEFAULT 0,
    stok_fisik INT DEFAULT 0,
    selisih INT DEFAULT 0,
    satuan_dasar VARCHAR(50),
    catatan TEXT,
    user_name VARCHAR(150),
    created_by UUID REFERENCES auth.users(id)
);

-- =========================================================
-- BAGIAN 3. AUTH & ROLE (owner / admin / kasir)
-- =========================================================
-- Setelah menjalankan SQL ini:
--  1. Buka Supabase Dashboard -> Authentication -> Users -> Add user
--     Buat 3 (atau lebih) akun, misalnya:
--       owner@tokoanda.com   (role: owner)
--       admin@tokoanda.com   (role: admin)
--       kasir1@tokoanda.com  (role: kasir)
--  2. Jalankan INSERT di bagian bawah file ini untuk mengisi
--     tabel profiles dengan role masing-masing (ganti UUID-nya
--     sesuai user id yang muncul di Dashboard).

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(150),
    role VARCHAR(20) NOT NULL DEFAULT 'kasir' CHECK (role IN ('owner','admin','kasir')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Helper function: ambil role user yang sedang login (dipakai di semua policy)
CREATE OR REPLACE FUNCTION current_role_pos()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- =========================================================
-- BAGIAN 4. ROW LEVEL SECURITY
-- Prinsip:
--   - Semua role yang sudah login (owner/admin/kasir) boleh
--     MEMBACA data katalog & stok (kasir perlu ini untuk jualan).
--   - Hanya owner & admin yang boleh MENGUBAH data master
--     (barang, harga, stok, diskon, pengaturan toko).
--   - Kasir hanya boleh menulis ke transaksi, shift, & stok log
--     (hasil transaksi penjualan), tidak bisa ubah data master.
--   - Tidak ada akses sama sekali untuk anon (belum login).
-- =========================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'items','item_units','item_barcodes','item_prices','item_stock',
    'item_serials','item_discount','item_hpp','item_purchase_price',
    'item_bundle','item_packages','item_stock_logs','item_history',
    'store_settings','cashier_shifts','transactions','supplier_purchases',
    'stock_opnames','profiles'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- --- profiles: user hanya boleh lihat baris dirinya sendiri ---
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (id = auth.uid());

-- --- Tabel master barang: baca oleh semua role login,
--     tulis hanya owner/admin ---
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'items','item_units','item_barcodes','item_prices',
    'item_serials','item_discount','item_hpp','item_purchase_price',
    'item_bundle','item_packages','item_history'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_read ON %I;', t, t);
    EXECUTE format(
      'CREATE POLICY %I_read ON %I FOR SELECT USING (current_role_pos() IN (''owner'',''admin'',''kasir''));',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS %I_write ON %I;', t, t);
    EXECUTE format(
      'CREATE POLICY %I_write ON %I FOR ALL USING (current_role_pos() IN (''owner'',''admin'')) WITH CHECK (current_role_pos() IN (''owner'',''admin''));',
      t, t
    );
  END LOOP;
END $$;

-- --- item_stock: kasus KHUSUS, beda dari tabel master lain di atas.
--     Baca: semua role login. INSERT/DELETE (menambah/menghapus baris
--     gudang): hanya owner/admin. UPDATE (mengubah stok_tersedia):
--     kasir JUGA harus boleh, karena checkout normal & rollback
--     transaksi memanggil UPDATE ke tabel ini untuk memotong/
--     mengembalikan stok — kalau kasir tidak diizinkan, penjualan
--     akan terlihat sukses di layar tapi stoknya tidak pernah
--     tersinkron ke Supabase (baris ini blokir diam-diam oleh RLS).
DROP POLICY IF EXISTS item_stock_read ON item_stock;
CREATE POLICY item_stock_read ON item_stock
  FOR SELECT USING (current_role_pos() IN ('owner','admin','kasir'));
DROP POLICY IF EXISTS item_stock_update ON item_stock;
CREATE POLICY item_stock_update ON item_stock
  FOR UPDATE USING (current_role_pos() IN ('owner','admin','kasir'))
  WITH CHECK (current_role_pos() IN ('owner','admin','kasir'));
DROP POLICY IF EXISTS item_stock_insert ON item_stock;
CREATE POLICY item_stock_insert ON item_stock
  FOR INSERT WITH CHECK (current_role_pos() IN ('owner','admin'));
DROP POLICY IF EXISTS item_stock_delete ON item_stock;
CREATE POLICY item_stock_delete ON item_stock
  FOR DELETE USING (current_role_pos() IN ('owner','admin'));

-- --- item_stock_logs: dibaca semua role, ditulis semua role login
--     (kasir & owner/admin sama-sama memicu log lewat transaksi/opname) ---
DROP POLICY IF EXISTS item_stock_logs_read ON item_stock_logs;
CREATE POLICY item_stock_logs_read ON item_stock_logs
  FOR SELECT USING (current_role_pos() IN ('owner','admin','kasir'));
DROP POLICY IF EXISTS item_stock_logs_insert ON item_stock_logs;
CREATE POLICY item_stock_logs_insert ON item_stock_logs
  FOR INSERT WITH CHECK (current_role_pos() IN ('owner','admin','kasir'));
-- Tidak ada policy UPDATE/DELETE -> log tidak bisa diubah/dihapus siapa pun (audit trail aman)

-- --- store_settings: baca semua role, tulis hanya owner ---
DROP POLICY IF EXISTS store_settings_read ON store_settings;
CREATE POLICY store_settings_read ON store_settings
  FOR SELECT USING (current_role_pos() IN ('owner','admin','kasir'));
DROP POLICY IF EXISTS store_settings_write ON store_settings;
CREATE POLICY store_settings_write ON store_settings
  FOR ALL USING (current_role_pos() = 'owner') WITH CHECK (current_role_pos() = 'owner');

-- --- cashier_shifts: kasir boleh baca & buat/ubah shift miliknya
--     sendiri, owner/admin boleh lihat & ubah semua ---
DROP POLICY IF EXISTS cashier_shifts_read ON cashier_shifts;
CREATE POLICY cashier_shifts_read ON cashier_shifts
  FOR SELECT USING (current_role_pos() IN ('owner','admin','kasir'));
DROP POLICY IF EXISTS cashier_shifts_insert ON cashier_shifts;
CREATE POLICY cashier_shifts_insert ON cashier_shifts
  FOR INSERT WITH CHECK (current_role_pos() IN ('owner','admin','kasir'));
DROP POLICY IF EXISTS cashier_shifts_update ON cashier_shifts;
CREATE POLICY cashier_shifts_update ON cashier_shifts
  FOR UPDATE USING (
    current_role_pos() IN ('owner','admin')
    OR (current_role_pos() = 'kasir' AND created_by = auth.uid())
  );

-- --- transactions: kasir boleh insert (jualan) & baca semua
--     (untuk cek riwayat), tapi TIDAK BOLEH update/delete langsung.
--     Pembatalan transaksi dilakukan lewat kolom is_rolled_back
--     yang hanya owner/admin boleh set. ---
DROP POLICY IF EXISTS transactions_read ON transactions;
CREATE POLICY transactions_read ON transactions
  FOR SELECT USING (current_role_pos() IN ('owner','admin','kasir'));
DROP POLICY IF EXISTS transactions_insert ON transactions;
CREATE POLICY transactions_insert ON transactions
  FOR INSERT WITH CHECK (current_role_pos() IN ('owner','admin','kasir'));
DROP POLICY IF EXISTS transactions_update ON transactions;
CREATE POLICY transactions_update ON transactions
  FOR UPDATE USING (current_role_pos() IN ('owner','admin'));
-- Sengaja tidak ada policy DELETE -> transaksi tidak pernah benar-benar
-- dihapus, hanya ditandai is_rolled_back = true (audit trail terjaga).

-- --- supplier_purchases & stock_opnames: hanya owner/admin ---
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['supplier_purchases','stock_opnames'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_all ON %I;', t, t);
    EXECUTE format(
      'CREATE POLICY %I_all ON %I FOR ALL USING (current_role_pos() IN (''owner'',''admin'')) WITH CHECK (current_role_pos() IN (''owner'',''admin''));',
      t, t
    );
  END LOOP;
END $$;

-- =========================================================
-- BAGIAN 5. Contoh mengisi profiles (JALANKAN MANUAL,
-- ganti UUID sesuai user yang dibuat di Authentication > Users)
-- =========================================================
-- insert into profiles (id, nama, role) values
--   ('00000000-0000-0000-0000-000000000001', 'Pemilik Toko', 'owner'),
--   ('00000000-0000-0000-0000-000000000002', 'Admin Toko', 'admin'),
--   ('00000000-0000-0000-0000-000000000003', 'Kasir 1', 'kasir');

-- insert into store_settings (id, nama_toko, alamat_toko, no_telepon, slogan_toko, header_kustom, footer_kustom)
-- values (1, 'ASYIFA MART', 'Kota Bekasi, Jawa Barat', '0812-3456-7890', 'Belanja Hemat & Lengkap',
--         'ASYIFA MART\nKota Bekasi, Jawa Barat', 'TERIMA KASIH ATAS KUNJUNGAN ANDA')
-- on conflict (id) do nothing;
