import React, { useState, useEffect } from "react";
import { 
  Database, Wifi, ShieldCheck, RefreshCw, FileText, Check, HelpCircle, HardDrive, 
  Store, ReceiptText, Save, MapPin, Phone, MessageSquare, Sliders, AlertCircle,
  Crown, Shield, Coins, Lock, Eye, EyeOff
} from "lucide-react";
import { POSStorage } from "../lib/storage";
import { StoreSettings } from "../lib/types";

export default function DatabaseSettings() {
  const [activeSubTab, setActiveSubTab] = useState<'store_receipt' | 'database' | 'passwords'>('store_receipt');
  const [copied, setCopied] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [storageStats, setStorageStats] = useState({
    items: 0,
    transactions: 0,
    units: 0
  });

  const [pwOwner, setPwOwner] = useState("owner123");
  const [pwAdmin, setPwAdmin] = useState("admin123");
  const [pwKasir, setPwKasir] = useState("kasir123");
  const [showPwFields, setShowPwFields] = useState({ owner: false, admin: false, kasir: false });
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    nama_toko: "ASYIFA MART",
    alamat_toko: "Kota Bekasi, Jawa Barat",
    no_telepon: "0812-3456-7890",
    slogan_toko: "Belanja Hemat & Lengkap",
    lebar_kertas: "58mm",
    ukuran_font: "sedang",
    tampilkan_logo: true,
    tampilkan_barcode: true,
    header_kustom: "ASYIFA MART\nKota Bekasi, Jawa Barat",
    footer_kustom: "TERIMA KASIH ATAS KUNJUNGAN ANDA\nBarang yang sudah dibeli tidak dapat ditukar"
  });

  useEffect(() => {
    setStorageStats({
      items: POSStorage.getItems().length,
      transactions: POSStorage.getTransactions().length,
      units: POSStorage.getItems().reduce((sum, item) => sum + POSStorage.getUnitsByItem(item.id).length, 0)
    });
    
    // Load store settings
    const loadedSettings = POSStorage.getSettings();
    if (loadedSettings) {
      setStoreSettings(loadedSettings);
      if (loadedSettings.passwords) {
        setPwOwner(loadedSettings.passwords.owner);
        setPwAdmin(loadedSettings.passwords.admin);
        setPwKasir(loadedSettings.passwords.kasir);
      }
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    POSStorage.saveSettings(storeSettings);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleSavePasswords = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...storeSettings,
      passwords: {
        owner: pwOwner || "owner123",
        admin: pwAdmin || "admin123",
        kasir: pwKasir || "kasir123"
      }
    };
    setStoreSettings(updated);
    POSStorage.saveSettings(updated);
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const handleResetDb = async () => {
    if (confirm("⚠️ PERINGATAN: Tindakan ini akan menghapus semua perubahan Anda dan memuat ulang data contoh pabrik (Indomie, Sembako, Samsung Galaxy). Lanjutkan?")) {
      await POSStorage.resetToFactoryDefaults();
      alert("Database POS telah berhasil disetel ulang ke setelan awal pabrik!");
      window.location.reload();
    }
  };

  const sqlSchema = `-- =========================================================
-- SQL DDL SCHEMA UNTUK SUPABASE POSTGRESQL (POS MULTI-SATUAN)
-- Salin skrip berikut ke SQL Editor di Dashboard Supabase Anda.
-- =========================================================

-- 1. Tabel Produk / Barang Utama
CREATE TABLE IF NOT EXISTS pos_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_barang VARCHAR(50) UNIQUE NOT NULL,
    barcode_utama VARCHAR(100) UNIQUE,
    nama_barang VARCHAR(255) NOT NULL,
    nama_pendek VARCHAR(100),
    nama_cetak_struk VARCHAR(50),
    brand_merk VARCHAR(100),
    kategori VARCHAR(100) NOT NULL,
    tipe_barang VARCHAR(100) DEFAULT 'Barang',
    status VARCHAR(50) DEFAULT 'Aktif',
    foto_produk TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Multi Satuan Konversi
CREATE TABLE IF NOT EXISTS pos_item_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES pos_items(id) ON DELETE CASCADE,
    nama VARCHAR(50) NOT NULL,
    konversi NUMERIC(10, 2) DEFAULT 1.00 NOT NULL,
    barcode VARCHAR(100),
    harga_jual NUMERIC(15, 2) DEFAULT 0.00 NOT NULL
);

-- 3. Tabel Tingkat Harga (Customer Tier Levels & Volume)
CREATE TABLE IF NOT EXISTS pos_item_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES pos_items(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES pos_item_units(id) ON DELETE CASCADE,
    level_pelanggan VARCHAR(50) DEFAULT 'Umum',
    min_qty INT DEFAULT 1,
    max_qty INT,
    harga_jual NUMERIC(15, 2) NOT NULL,
    promo_nama VARCHAR(255),
    promo_mulai TIMESTAMP WITH TIME ZONE,
    promo_selesai TIMESTAMP WITH TIME ZONE
);

-- 4. Tabel Stok Gudang Saling-Stok
CREATE TABLE IF NOT EXISTS pos_item_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES pos_items(id) ON DELETE CASCADE,
    gudang VARCHAR(100) DEFAULT 'Gudang Utama',
    stok_tersedia NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    stok_dipesan NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    stok_minimum NUMERIC(12, 2) DEFAULT 10.00,
    stok_maksimum NUMERIC(12, 2) DEFAULT 1000.00,
    safety_stock NUMERIC(12, 2) DEFAULT 5.00,
    reorder_point NUMERIC(12, 2) DEFAULT 15.00,
    buffer_stock NUMERIC(12, 2) DEFAULT 5.00
);

-- 5. Tabel Serial Number / IMEI (Electronics & Lots)
CREATE TABLE IF NOT EXISTS pos_item_serials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES pos_items(id) ON DELETE CASCADE,
    gudang VARCHAR(100) DEFAULT 'Gudang Utama',
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    lot_number VARCHAR(100),
    batch_number VARCHAR(100),
    expired_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Tersedia'
);

-- 6. Tabel Histori Transaksi Penjualan
CREATE TABLE IF NOT EXISTS pos_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    discount_total NUMERIC(15, 2) DEFAULT 0.00,
    tax_total NUMERIC(15, 2) DEFAULT 0.00,
    grand_total NUMERIC(15, 2) NOT NULL,
    customer_level VARCHAR(50) DEFAULT 'Umum',
    payment_method VARCHAR(50) DEFAULT 'Cash',
    cash_paid NUMERIC(15, 2),
    change NUMERIC(15, 2),
    user_cashier VARCHAR(100) NOT NULL,
    items JSONB NOT NULL
);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="pos-comprehensive-settings">
      
      {/* Sub-Tab Navigation Header */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 pb-px gap-6 flex-wrap">
        <button
          onClick={() => setActiveSubTab('store_receipt')}
          className={`flex items-center gap-2 pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'store_receipt'
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Store className="w-4.5 h-4.5" /> Pengaturan Toko & Struk Thermal
        </button>

        <button
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-2 pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'database'
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Database className="w-4.5 h-4.5" /> Konektivitas Database (SQL)
        </button>

        <button
          onClick={() => setActiveSubTab('passwords')}
          className={`flex items-center gap-2 pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'passwords'
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <ShieldCheck className="w-4.5 h-4.5" /> Atur Kata Sandi Akses (Password)
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === 'store_receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* KIRI: Form Pengaturan (7 Grid) */}
          <form onSubmit={handleSaveSettings} className="lg:col-span-7 space-y-6">
            
            {/* Bagian 1: Informasi Toko */}
            <div className="bg-white/40 dark:bg-zinc-900/40 p-5 rounded-3xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <Store className="w-4.5 h-4.5 text-emerald-500" /> Informasi Utama Toko
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Nama Toko / Swalayan</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={storeSettings.nama_toko}
                      onChange={(e) => setStoreSettings({ ...storeSettings, nama_toko: e.target.value.toUpperCase() })}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                      placeholder="E.g., ASYIFA MART"
                    />
                    <Store className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Nomor Telepon Toko</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={storeSettings.no_telepon}
                      onChange={(e) => setStoreSettings({ ...storeSettings, no_telepon: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                      placeholder="E.g., 0812-3456-7890"
                    />
                    <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Alamat Lengkap Toko</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={storeSettings.alamat_toko}
                      onChange={(e) => setStoreSettings({ ...storeSettings, alamat_toko: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                      placeholder="E.g., Jl. Raya Hankam No. 12, Bekasi"
                    />
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Slogan / Keterangan Toko</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={storeSettings.slogan_toko}
                      onChange={(e) => setStoreSettings({ ...storeSettings, slogan_toko: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                      placeholder="E.g., Belanja Cerdas, Harga Pas!"
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 2: Setelan Struk Thermal */}
            <div className="bg-white/40 dark:bg-zinc-900/40 p-5 rounded-3xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <ReceiptText className="w-4.5 h-4.5 text-emerald-500" /> Format & Layout Struk Thermal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Lebar Kertas Struk */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Lebar Kertas Printer</label>
                  <div className="flex gap-2">
                    {(["58mm", "80mm"] as const).map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setStoreSettings({ ...storeSettings, lebar_kertas: w })}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          storeSettings.lebar_kertas === w
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-350"
                        }`}
                      >
                        {w === "58mm" ? "58mm (Standar Mini)" : "80mm (Lebar POS)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ukuran Font Struk */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Ukuran Huruf Cetakan</label>
                  <div className="flex gap-2">
                    {(["kecil", "sedang", "besar"] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setStoreSettings({ ...storeSettings, ukuran_font: f })}
                        className={`flex-1 py-2 px-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer capitalize ${
                          storeSettings.ukuran_font === f
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-350"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Switch Toggles */}
                <div className="space-y-3 md:col-span-2 py-1">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Visual Elemen</label>
                  
                  <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white block">Tampilkan Logo Kustom</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Menampilkan icon tas belanja di bagian paling atas struk.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={storeSettings.tampilkan_logo}
                        onChange={(e) => setStoreSettings({ ...storeSettings, tampilkan_logo: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-800/80">
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white block">Tampilkan Barcode Transaksi</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Mencetak representasi barcode nomor invoice di bagian bawah struk.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={storeSettings.tampilkan_barcode}
                        onChange={(e) => setStoreSettings({ ...storeSettings, tampilkan_barcode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                </div>

                {/* Custom Header & Footer textareas */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Teks Header Tambahan</label>
                    <span className="text-[9px] text-zinc-400">Ditampilkan di atas daftar barang</span>
                  </div>
                  <textarea
                    rows={2}
                    value={storeSettings.header_kustom}
                    onChange={(e) => setStoreSettings({ ...storeSettings, header_kustom: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                    placeholder="E.g., NPWP: 01.234.567.8-901.000&#10;SPP: 12345/6789"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Teks Footer Tambahan (Pesan Penutup)</label>
                    <span className="text-[9px] text-zinc-400">Ditampilkan di bagian paling bawah struk</span>
                  </div>
                  <textarea
                    rows={2}
                    value={storeSettings.footer_kustom}
                    onChange={(e) => setStoreSettings({ ...storeSettings, footer_kustom: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                    placeholder="E.g., Terima Kasih Atas Kunjungan Anda&#10;Barang yang sudah dibeli tidak dapat ditukar!"
                  />
                </div>

              </div>
            </div>

            {/* Simpan Button & Alert */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                {showSaveSuccess && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 animate-pulse bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/25">
                    <Check className="w-4 h-4" /> Pengaturan berhasil disimpan ke POSStorage!
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/15 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Save className="w-4 h-4" /> Simpan Semua Pengaturan
              </button>
            </div>

          </form>

          {/* KANAN: Live Thermal Receipt Preview (5 Grid) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
            <span className="text-xs font-extrabold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5 pl-2">
              <Sliders className="w-4 h-4 text-emerald-500" /> Pratinjau Struk Thermal Live
            </span>

            {/* Receipt container styled like actual paper roll */}
            <div className="bg-white/95 dark:bg-zinc-100 p-4 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-300 relative overflow-hidden flex flex-col items-center">
              
              {/* Receipt cut notch top and bottom decoration */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-b from-zinc-200 to-transparent" />
              
              {/* Receipt Content */}
              <div 
                style={{ 
                  width: storeSettings.lebar_kertas === "58mm" ? "250px" : "330px" 
                }}
                className={`text-zinc-950 font-mono leading-relaxed transition-all duration-300 ${
                  storeSettings.ukuran_font === "kecil" 
                    ? "text-[10px]" 
                    : storeSettings.ukuran_font === "besar" 
                      ? "text-xs" 
                      : "text-[11px]"
                }`}
              >
                {/* Logo kustom */}
                {storeSettings.tampilkan_logo && (
                  <div className="text-center flex flex-col items-center pt-2 pb-1.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-1">
                      <Store className="w-5 h-5" />
                    </div>
                  </div>
                )}

                {/* Header Utama */}
                <div className="text-center font-bold border-b border-dashed border-zinc-400 pb-2 mb-2">
                  <h4 className="text-xs uppercase tracking-wider font-extrabold">{storeSettings.nama_toko || "TOKO POS"}</h4>
                  <p className="font-normal text-[10px] mt-0.5">{storeSettings.alamat_toko || "Alamat Toko"}</p>
                  <p className="font-normal text-[10px]">Telp: {storeSettings.no_telepon || "-"}</p>
                </div>

                {/* Custom Header Text */}
                {storeSettings.header_kustom && (
                  <div className="whitespace-pre-line text-center text-[10px] border-b border-dashed border-zinc-400 pb-2 mb-2 text-zinc-600">
                    {storeSettings.header_kustom}
                  </div>
                )}

                {/* Metadata Transaksi */}
                <div className="border-b border-dashed border-zinc-400 pb-2 mb-2 space-y-0.5 text-[10px] text-zinc-700">
                  <div className="flex justify-between">
                    <span>No: INV/20260710/012</span>
                    <span>10/07/2026 19:15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir: Admin Asyifa</span>
                    <span>Tipe: Member Silver</span>
                  </div>
                </div>

                {/* Daftar Belanja Item */}
                <div className="border-b border-dashed border-zinc-400 pb-2 mb-2 space-y-2">
                  <div>
                    <div className="flex justify-between font-bold">
                      <span>MINYAK GORENG BIMOLI 2L</span>
                      <span>52.000</span>
                    </div>
                    <div className="text-[10px] text-zinc-600 pl-1">2 Pcs x 26.000</div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold">
                      <span>INDOMIE GORENG SPESIAL</span>
                      <span>15.500</span>
                    </div>
                    <div className="text-[10px] text-zinc-600 pl-1">5 Pcs x 3.100</div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold">
                      <span>SAUS SAMBAL ABC 135ML</span>
                      <span>9.000</span>
                    </div>
                    <div className="text-[10px] text-zinc-600 pl-1">1 Pcs x 9.000</div>
                  </div>
                </div>

                {/* Subtotal & Total */}
                <div className="space-y-0.5 text-[10px] font-bold text-zinc-800">
                  <div className="flex justify-between">
                    <span className="font-normal">Subtotal:</span>
                    <span>76.500</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span className="font-normal">Diskon Member (5%):</span>
                    <span>-3.825</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-normal">PPN (11%):</span>
                    <span>7.994</span>
                  </div>
                  
                  <div className="flex justify-between text-xs pt-1.5 border-t border-dashed border-zinc-400 font-extrabold text-zinc-950">
                    <span>TOTAL BAYAR:</span>
                    <span>80.669</span>
                  </div>

                  <div className="flex justify-between pt-1 text-zinc-600 font-normal">
                    <span>Metode Pembayaran:</span>
                    <span>Cash / Tunai</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 font-normal">
                    <span>Tunai:</span>
                    <span>100.000</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-extrabold text-[11px]">
                    <span>KEMBALIAN:</span>
                    <span>19.331</span>
                  </div>
                </div>

                {/* Custom Footer / Pesan Penutup */}
                {storeSettings.footer_kustom && (
                  <div className="whitespace-pre-line text-center text-[10px] border-t border-dashed border-zinc-400 pt-2.5 mt-2 text-zinc-600 leading-normal">
                    {storeSettings.footer_kustom}
                  </div>
                )}

                {/* Slogan Toko */}
                {storeSettings.slogan_toko && (
                  <p className="text-center text-[9px] text-zinc-500 font-semibold tracking-wide uppercase mt-1">
                    *** {storeSettings.slogan_toko} ***
                  </p>
                )}

                {/* Barcode Transaksi kustom */}
                {storeSettings.tampilkan_barcode && (
                  <div className="text-center flex flex-col items-center pt-3 pb-1">
                    {/* Faux Barcode lines */}
                    <div className="h-6 w-36 bg-zinc-900 flex justify-around items-stretch p-[1px] opacity-80">
                      <div className="bg-white w-1" /><div className="bg-white w-2" />
                      <div className="bg-white w-[1px]" /><div className="bg-white w-1.5" />
                      <div className="bg-white w-[2px]" /><div className="bg-white w-[1px]" />
                      <div className="bg-white w-2" /><div className="bg-white w-[1px]" />
                      <div className="bg-white w-1" /><div className="bg-white w-3" />
                      <div className="bg-white w-[1px]" /><div className="bg-white w-1" />
                    </div>
                    <span className="text-[8px] text-zinc-500 mt-0.5">INV20260710012</span>
                  </div>
                )}

              </div>

              {/* Receipt tear jagged cut decoration */}
              <div className="w-full flex justify-between text-zinc-300 text-[8px] mt-4 select-none opacity-50 tracking-[-2px] border-t border-dashed border-zinc-300 pt-1">
                {"v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v^v".slice(0, storeSettings.lebar_kertas === "58mm" ? 30 : 42)}
              </div>
            </div>

            <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-800 text-[10px] text-zinc-400 leading-relaxed flex gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <p>Struk thermal di atas adalah visual simulasi instan. Printer struk kasir fisik thermal Anda akan mencetak struk dengan presisi layout di atas ketika Anda menekan tombol **Cetak Struk** di Kasir POS.</p>
            </div>

          </div>

        </div>
      )}

      {activeSubTab === 'database' && (
        /* KONEKTIVITAS DATABASE (Original Screen) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
          
          {/* Kiri: Status & Sync Widgets */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white/40 dark:bg-zinc-900/40 p-5 rounded-3xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Wifi className="w-5 h-5 text-emerald-500" /> Konektivitas Database
              </h3>

              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/15 flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block">Sistem Aktif & Offline-Ready</span>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Seluruh data disinkronkan ke LocalStorage secara instan dan siap disambungkan ke Supabase Postgres API.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Status Server:</span>
                  <span className="font-semibold text-emerald-500">TERHUBUNG (3000)</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Sync Gateway:</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Dual Local-Cloud</span>
                </div>
              </div>
            </div>

            {/* Database Stats Card */}
            <div className="bg-white/40 dark:bg-zinc-900/40 p-5 rounded-3xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <HardDrive className="w-5 h-5 text-emerald-500" /> Statistik Penyimpanan
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                  <span className="text-zinc-500 font-medium">Total Produk Terdaftar</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{storageStats.items} Items</span>
                </div>
                <div className="flex justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                  <span className="text-zinc-500 font-medium">Aturan Multi Satuan</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{storageStats.units} Konversi</span>
                </div>
                <div className="flex justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                  <span className="text-zinc-500 font-medium">Transaksi Penjualan</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{storageStats.transactions} Struk</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetDb}
                className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-450 text-xs font-bold rounded-xl transition-all border border-rose-500/10 cursor-pointer"
              >
                Reset Semua Data Pabrik (Setel Awal)
              </button>
            </div>
          </div>

          {/* Kanan: Supabase SQL Setup Instruction (2 grid) */}
          <div className="lg:col-span-2 bg-white/40 dark:bg-zinc-900/40 p-5 rounded-3xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Database className="w-5 h-5 text-emerald-500" /> Hubungkan Ke Supabase PostgreSQL
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">Gunakan skrip DDL berikut untuk membuat struktur database relasional secara instan di Supabase SQL Editor.</p>
              </div>
              
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Berhasil Salin
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" /> Salin Skrip DDL
                  </>
                )}
              </button>
            </div>

            {/* SQL Preview Code Block */}
            <div className="relative">
              <pre className="p-4 bg-zinc-950 text-zinc-200 rounded-2xl border border-zinc-800/80 font-mono text-[10px] overflow-x-auto max-h-[350px] leading-normal shadow-inner scrollbar-thin">
                {sqlSchema}
              </pre>
            </div>

            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed space-y-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block">Langkah Konfigurasi Supabase:</span>
              <ol className="list-decimal list-inside space-y-1">
                <li>Buka akun <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">Supabase.com</a> dan buat sebuah project baru.</li>
                <li>Navigasi ke menu **SQL Editor** pada sidebar kiri panel Supabase Anda.</li>
                <li>Klik **New Query**, tempelkan skrip SQL yang telah disalin di atas, lalu tekan tombol **Run**.</li>
                <li>Aplikasi POS modern Anda akan secara otomatis terintegrasi penuh secara real-time!</li>
              </ol>
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'passwords' && (
        /* PASSWORD MANAGEMENT TAB */
        <form onSubmit={handleSavePasswords} className="max-w-2xl bg-white/40 dark:bg-zinc-900/40 p-6 md:p-8 rounded-3xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl space-y-6 shadow-sm animate-fade-in">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5.5 h-5.5 text-emerald-500" /> Keamanan Kata Sandi Hak Akses
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Atur dan perbarui kata sandi untuk tingkat hak akses Owner, Admin, dan Kasir secara berkala demi keamanan finansial toko Anda.
            </p>
          </div>

          <div className="space-y-4">
            {/* Owner Password Card */}
            <div className="p-4 bg-zinc-500/5 dark:bg-zinc-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Password Owner / Pemilik</span>
                  <span className="text-[10px] text-zinc-400">Akses tak terbatas (termasuk menu Settings ini)</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showPwFields.owner ? "text" : "password"}
                  value={pwOwner}
                  onChange={(e) => setPwOwner(e.target.value)}
                  placeholder="Masukkan password Owner..."
                  className="w-full pl-9 pr-12 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPwFields(prev => ({ ...prev, owner: !prev.owner }))}
                  className="absolute right-3 top-2.5 p-0.5 text-zinc-400 hover:text-zinc-300 cursor-pointer"
                >
                  {showPwFields.owner ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Admin Password Card */}
            <div className="p-4 bg-zinc-500/5 dark:bg-zinc-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Password Administrator</span>
                  <span className="text-[10px] text-zinc-400">Akses Dashboard, Kasir POS, & Daftar Barang</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showPwFields.admin ? "text" : "password"}
                  value={pwAdmin}
                  onChange={(e) => setPwAdmin(e.target.value)}
                  placeholder="Masukkan password Admin..."
                  className="w-full pl-9 pr-12 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPwFields(prev => ({ ...prev, admin: !prev.admin }))}
                  className="absolute right-3 top-2.5 p-0.5 text-zinc-400 hover:text-zinc-300 cursor-pointer"
                >
                  {showPwFields.admin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Kasir Password Card */}
            <div className="p-4 bg-zinc-500/5 dark:bg-zinc-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">Password Petugas Kasir</span>
                  <span className="text-[10px] text-zinc-400">Hanya akses Kasir POS & Riwayat Transaksi</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showPwFields.kasir ? "text" : "password"}
                  value={pwKasir}
                  onChange={(e) => setPwKasir(e.target.value)}
                  placeholder="Masukkan password Kasir..."
                  className="w-full pl-9 pr-12 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPwFields(prev => ({ ...prev, kasir: !prev.kasir }))}
                  className="absolute right-3 top-2.5 p-0.5 text-zinc-400 hover:text-zinc-300 cursor-pointer"
                >
                  {showPwFields.kasir ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {passwordSaved && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Kata sandi berhasil diperbarui dan disimpan secara aman ke database lokal!</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-[1.01] transition-all cursor-pointer shadow-md"
            >
              <Save className="w-4.5 h-4.5" /> Simpan Perubahan Password
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
