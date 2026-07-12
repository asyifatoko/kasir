import { supabase } from "./supabase";
import {
  Item,
  ItemUnit,
  ItemBarcode,
  ItemPrice,
  ItemStock,
  ItemSerial,
  ItemDiscount,
  ItemHpp,
  ItemPurchasePrice,
  ItemBundle,
  ItemPackage,
  ItemStockLog,
  ItemHistory,
  Transaction,
  CartItem,
  StoreSettings,
  CashierShift,
  SupplierPurchase,
  SupplierPurchaseItem,
  StockOpname
} from "./types";

const INITIAL_SETTINGS: StoreSettings = {
  nama_toko: "ASYIFA MART",
  alamat_toko: "Kota Bekasi, Jawa Barat",
  no_telepon: "0812-3456-7890",
  slogan_toko: "Belanja Hemat & Lengkap",
  lebar_kertas: "58mm",
  ukuran_font: "sedang",
  tampilkan_logo: true,
  tampilkan_barcode: true,
  header_kustom: "ASYIFA MART\nKota Bekasi, Jawa Barat\nTelp: 0812-3456-7890",
  footer_kustom: "TERIMA KASIH ATAS KUNJUNGAN ANDA\nBarang yang sudah dibeli tidak dapat ditukar",
  passwords: {
    owner: "owner123",
    admin: "admin123",
    kasir: "kasir123"
  }
};

// Helper to generate UUIDs locally when offline/unconnected
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Initial Sample Data to make the application instantly visual and functional
const INITIAL_ITEMS: Item[] = [
  {
    id: "item-indomie-123",
    kode_barang: "BRG-00001",
    barcode_utama: "8998866200225",
    nama_barang: "Indomie Goreng Spesial",
    nama_pendek: "Indomie Goreng",
    nama_cetak_struk: "INDOMIE GORENG SPESIAL",
    brand_merk: "Indomie",
    kategori: "Makanan",
    sub_kategori: "Mie Instan",
    supplier_utama: "PT Indofood Sukses Makmur",
    departemen: "Sembako",
    rak: "A-01",
    gudang_default: "Gudang Utama",
    warna: "Kuning-Merah",
    ukuran: "85g",
    berat: 85,
    volume: 85,
    tipe_barang: "Barang",
    status: "Aktif",
    foto_produk: "https://images.unsplash.com/photo-1612966608997-3000df124ff3?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "item-saus-456",
    kode_barang: "BRG-00002",
    barcode_utama: "8998866100115",
    nama_barang: "Saus Sambal ABC 135ml",
    nama_pendek: "Saus ABC",
    nama_cetak_struk: "SAUS ABC 135ML",
    brand_merk: "ABC",
    kategori: "Makanan",
    sub_kategori: "Penyedap",
    supplier_utama: "PT Heinz ABC Indonesia",
    departemen: "Sembako",
    rak: "A-02",
    gudang_default: "Gudang Toko",
    berat: 135,
    volume: 135,
    tipe_barang: "Barang",
    status: "Aktif",
    foto_produk: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "item-minyak-789",
    kode_barang: "BRG-00003",
    barcode_utama: "8998866400445",
    nama_barang: "Minyak Goreng Bimoli 2L",
    nama_pendek: "Bimoli 2L",
    nama_cetak_struk: "BIMOLI 2L",
    brand_merk: "Bimoli",
    kategori: "Minyak",
    sub_kategori: "Minyak Goreng",
    supplier_utama: "PT Salim Ivomas Pratama",
    departemen: "Sembako",
    rak: "B-03",
    gudang_default: "Gudang Utama",
    berat: 2000,
    volume: 2000,
    tipe_barang: "Barang",
    status: "Aktif",
    foto_produk: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "item-samsung-abc",
    kode_barang: "BRG-00005",
    barcode_utama: "8998866500555",
    nama_barang: "Samsung Galaxy S23 256GB",
    nama_pendek: "Samsung S23",
    nama_cetak_struk: "SAMSUNG S23 256GB",
    brand_merk: "Samsung",
    kategori: "Elektronik",
    sub_kategori: "Smartphone",
    supplier_utama: "PT Samsung Electronics Indonesia",
    departemen: "Gawai",
    rak: "E-01",
    gudang_default: "Gudang Utama",
    warna: "Phantom Black",
    ukuran: "6.1 Inci",
    berat: 168,
    tipe_barang: "Barang",
    status: "Aktif",
    foto_produk: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60"
  },
  {
    id: "item-paket-sembako",
    kode_barang: "PKT-00001",
    barcode_utama: "8999991112223",
    nama_barang: "Paket Sembako Hemat Asyifa",
    nama_pendek: "Sembako Hemat",
    nama_cetak_struk: "PAKET SEMBAKO HEMAT",
    brand_merk: "Asyifa Mart",
    kategori: "Paket",
    sub_kategori: "Sembako",
    supplier_utama: "Asyifa Mart",
    gudang_default: "Gudang Utama",
    tipe_barang: "Barang",
    status: "Aktif",
    foto_produk: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60"
  }
];

const INITIAL_UNITS: ItemUnit[] = [
  // Indomie Units
  { id: "unit-indomie-pcs", item_id: "item-indomie-123", nama: "Pcs", konversi: 1, barcode: "8998866200225", harga_jual: 3100, berat: 85 },
  { id: "unit-indomie-pak", item_id: "item-indomie-123", nama: "Pak", konversi: 5, barcode: "8998866200210", harga_jual: 14500, berat: 425 },
  { id: "unit-indomie-dus", item_id: "item-indomie-123", nama: "Dus", konversi: 40, barcode: "8998866200200", harga_jual: 110000, berat: 3400 },

  // Saus Units
  { id: "unit-saus-pcs", item_id: "item-saus-456", nama: "Pcs", konversi: 1, barcode: "8998866100115", harga_jual: 6500, berat: 135 },
  { id: "unit-saus-box", item_id: "item-saus-456", nama: "Box", konversi: 24, barcode: "8998866100100", harga_jual: 140000, berat: 3240 },

  // Minyak Units
  { id: "unit-minyak-pcs", item_id: "item-minyak-789", nama: "Pcs", konversi: 1, barcode: "8998866400445", harga_jual: 35000, berat: 2000 },

  // Samsung Units
  { id: "unit-samsung-pcs", item_id: "item-samsung-abc", nama: "Pcs", konversi: 1, barcode: "8998866500555", harga_jual: 12000000, berat: 168 },

  // Paket Units
  { id: "unit-paket-pcs", item_id: "item-paket-sembako", nama: "Pcs", konversi: 1, barcode: "8999991112223", harga_jual: 48000, berat: 2500 }
];

const INITIAL_BARCODES: ItemBarcode[] = [
  { id: "bc-1", item_id: "item-indomie-123", barcode: "8998866200225", tipe: "Scanner" },
  { id: "bc-2", item_id: "item-indomie-123", barcode: "8998866200210", tipe: "Scanner" },
  { id: "bc-3", item_id: "item-indomie-123", barcode: "8998866200200", tipe: "Scanner" },
  { id: "bc-4", item_id: "item-saus-456", barcode: "8998866100115", tipe: "Scanner" },
  { id: "bc-5", item_id: "item-saus-456", barcode: "8998866100100", tipe: "Scanner" }
];

const INITIAL_PRICES: ItemPrice[] = [
  // Indomie custom tier pricing and customer levels
  { id: "p-1", item_id: "item-indomie-123", unit_id: "unit-indomie-pcs", level_pelanggan: "Umum", min_qty: 1, harga_jual: 3100 },
  { id: "p-2", item_id: "item-indomie-123", unit_id: "unit-indomie-pcs", level_pelanggan: "Member Silver", min_qty: 1, harga_jual: 3000 },
  { id: "p-3", item_id: "item-indomie-123", unit_id: "unit-indomie-pcs", level_pelanggan: "Member Gold", min_qty: 1, harga_jual: 2950 },
  { id: "p-4", item_id: "item-indomie-123", unit_id: "unit-indomie-pcs", level_pelanggan: "Grosir", min_qty: 1, harga_jual: 2900 },
  { id: "p-5", item_id: "item-indomie-123", unit_id: "unit-indomie-pcs", level_pelanggan: "Reseller", min_qty: 1, harga_jual: 2850 },
  { id: "p-6", item_id: "item-indomie-123", unit_id: "unit-indomie-pcs", level_pelanggan: "Agen", min_qty: 1, harga_jual: 2800 },

  // Tier pricing by volume
  { id: "p-7", item_id: "item-indomie-123", unit_id: "unit-indomie-pcs", level_pelanggan: "Umum", min_qty: 6, max_qty: 20, harga_jual: 3050, promo_nama: "Grosir Kecil" },
  { id: "p-8", item_id: "item-indomie-123", unit_id: "unit-indomie-pcs", level_pelanggan: "Umum", min_qty: 21, max_qty: 100, harga_jual: 3000, promo_nama: "Grosir Sedang" },
  { id: "p-9", item_id: "item-indomie-123", unit_id: "unit-indomie-pcs", level_pelanggan: "Umum", min_qty: 101, harga_jual: 2900, promo_nama: "Super Grosir" },

  // Flash sale Indomie promo
  { id: "p-10", item_id: "item-indomie-123", unit_id: "unit-indomie-pcs", level_pelanggan: "Umum", min_qty: 1, harga_jual: 2500, promo_nama: "Flash Sale Merdeka", promo_mulai: "2026-07-01T00:00:00Z", promo_selesai: "2026-08-01T23:59:59Z" }
];

const INITIAL_STOCKS: ItemStock[] = [
  { id: "s-1", item_id: "item-indomie-123", gudang: "Gudang Utama", stok_tersedia: 450, stok_dipesan: 10, stok_minimum: 50, stok_maksimum: 1000, safety_stock: 20, reorder_point: 40, buffer_stock: 15 },
  { id: "s-2", item_id: "item-indomie-123", gudang: "Gudang Toko", stok_tersedia: 75, stok_dipesan: 0, stok_minimum: 10, stok_maksimum: 200, safety_stock: 5, reorder_point: 8, buffer_stock: 3 },
  { id: "s-3", item_id: "item-saus-456", gudang: "Gudang Utama", stok_tersedia: 120, stok_dipesan: 5, stok_minimum: 20, stok_maksimum: 500, safety_stock: 10, reorder_point: 15, buffer_stock: 5 },
  { id: "s-4", item_id: "item-minyak-789", gudang: "Gudang Utama", stok_tersedia: 8, stok_dipesan: 0, stok_minimum: 15, stok_maksimum: 200, safety_stock: 10, reorder_point: 20, buffer_stock: 10 }, // Below minimum stock alert!
  { id: "s-5", item_id: "item-samsung-abc", gudang: "Gudang Utama", stok_tersedia: 2, stok_dipesan: 0, stok_minimum: 1, stok_maksimum: 10, safety_stock: 1, reorder_point: 2, buffer_stock: 1 }
];

const INITIAL_SERIALS: ItemSerial[] = [
  { id: "sr-1", item_id: "item-samsung-abc", gudang: "Gudang Utama", serial_number: "IMEI-85239128301", lot_number: "LOT-A", batch_number: "BAT-01", status: "Tersedia" },
  { id: "sr-2", item_id: "item-samsung-abc", gudang: "Gudang Utama", serial_number: "IMEI-85239128302", lot_number: "LOT-A", batch_number: "BAT-01", status: "Tersedia" },
  // Minyak Expired Alerts
  { id: "sr-3", item_id: "item-minyak-789", gudang: "Gudang Utama", serial_number: "LOT-BML-01", lot_number: "LOT-BML", batch_number: "B-23", expired_at: "2026-07-11T12:00:00Z", status: "Tersedia" }, // Expiring tomorrow (within 7 days alert!)
  { id: "sr-4", item_id: "item-minyak-789", gudang: "Gudang Utama", serial_number: "LOT-BML-02", lot_number: "LOT-BML", batch_number: "B-22", expired_at: "2026-07-10T12:00:00Z", status: "Tersedia" }, // Expired Today!
  { id: "sr-5", item_id: "item-minyak-789", gudang: "Gudang Utama", serial_number: "LOT-BML-03", lot_number: "LOT-BML", batch_number: "B-21", expired_at: "2026-08-10T12:00:00Z", status: "Tersedia" } // Expiring in 30 days
];

const INITIAL_HPP: ItemHpp[] = [
  { id: "h-1", item_id: "item-indomie-123", metode: "Average", nilai_hpp: 2200 },
  { id: "h-2", item_id: "item-saus-456", metode: "Average", nilai_hpp: 4500 },
  { id: "h-3", item_id: "item-minyak-789", metode: "Average", nilai_hpp: 26000 },
  { id: "h-4", item_id: "item-samsung-abc", metode: "FIFO", nilai_hpp: 9800000 }
];

const INITIAL_DISCOUNTS: ItemDiscount[] = [
  { id: "d-1", item_id: "item-indomie-123", formula_diskon: "10%+5%", nominal_diskon: 450 } // Example complex serial discount
];

const INITIAL_BUNDLES: ItemBundle[] = [
  { id: "b-1", item_id: "item-indomie-123", nama_bundle: "Buy 2 Get 1 Mie Spesial", tipe_bundle: "Buy 2 Get 1" }
];

const INITIAL_PACKAGES: ItemPackage[] = [
  { id: "pkg-1", package_item_id: "item-paket-sembako", component_item_id: "item-minyak-789", qty: 1 },
  { id: "pkg-2", package_item_id: "item-paket-sembako", component_item_id: "item-indomie-123", qty: 5 },
  { id: "pkg-3", package_item_id: "item-paket-sembako", component_item_id: "item-saus-456", qty: 1 }
];

const INITIAL_HISTORY: ItemHistory[] = [
  {
    id: "hist-1",
    item_id: "item-indomie-123",
    user_name: "Admin Asyifa",
    ip_address: "127.0.0.1",
    action: "CREATE",
    changes_json: '{"nama_barang": "Indomie Goreng Spesial", "status": "Aktif"}',
    created_at: new Date().toISOString()
  }
];

export class POSStorage {
  private static isSubSupabaseReady = false;

  // Initialize Local Memory cache
  private static items: Item[] = [];
  private static units: ItemUnit[] = [];
  private static barcodes: ItemBarcode[] = [];
  private static prices: ItemPrice[] = [];
  private static stocks: ItemStock[] = [];
  private static serials: ItemSerial[] = [];
  private static hpps: ItemHpp[] = [];
  private static purchaseHistory: ItemPurchasePrice[] = [];
  private static discounts: ItemDiscount[] = [];
  private static bundles: ItemBundle[] = [];
  private static packages: ItemPackage[] = [];
  private static historyLogs: ItemHistory[] = [];
  private static stockLogs: ItemStockLog[] = [];
  private static transactions: Transaction[] = [];
  private static shifts: CashierShift[] = [];
  private static settings: StoreSettings | null = null;
  private static supplierPurchases: SupplierPurchase[] = [];
  private static stockOpnames: StockOpname[] = [];

  // PWA offline-first load
  public static async init() {
    // Try connecting to Supabase
    try {
      const { error } = await supabase.from("items").select("id").limit(1);
      if (!error) {
        this.isSubSupabaseReady = true;
        console.log("🚀 Supabase connected and tables verified!");
        await this.loadFromSupabase();
      } else {
        throw error;
      }
    } catch (err) {
      console.warn("⚠️ Supabase tables not found/offline. Loading from localStorage or mock defaults.");
      this.isSubSupabaseReady = false;
      this.loadFromLocalStorage();
    }
  }

  public static isSupabaseActive() {
    return this.isSubSupabaseReady;
  }

  private static loadFromLocalStorage() {
    // Load from localStorage or mock defaults
    const itemsLocal = localStorage.getItem("pos_items");
    const unitsLocal = localStorage.getItem("pos_units");
    const barcodesLocal = localStorage.getItem("pos_barcodes");
    const pricesLocal = localStorage.getItem("pos_prices");
    const stocksLocal = localStorage.getItem("pos_stocks");
    const serialsLocal = localStorage.getItem("pos_serials");
    const hppLocal = localStorage.getItem("pos_hpps");
    const discountsLocal = localStorage.getItem("pos_discounts");
    const bundlesLocal = localStorage.getItem("pos_bundles");
    const packagesLocal = localStorage.getItem("pos_packages");
    const historyLocal = localStorage.getItem("pos_history");
    const purchaseLocal = localStorage.getItem("pos_purchases");
    const stockLogsLocal = localStorage.getItem("pos_stock_logs");
    const txLocal = localStorage.getItem("pos_transactions");
    const settingsLocal = localStorage.getItem("pos_settings");
    const shiftsLocal = localStorage.getItem("pos_shifts");
    const supplierPurchasesLocal = localStorage.getItem("pos_supplier_purchases");
    const stockOpnamesLocal = localStorage.getItem("pos_stock_opnames");
 
    this.items = itemsLocal ? JSON.parse(itemsLocal) : INITIAL_ITEMS;
    this.units = unitsLocal ? JSON.parse(unitsLocal) : INITIAL_UNITS;
    this.barcodes = barcodesLocal ? JSON.parse(barcodesLocal) : INITIAL_BARCODES;
    this.prices = pricesLocal ? JSON.parse(pricesLocal) : INITIAL_PRICES;
    this.stocks = stocksLocal ? JSON.parse(stocksLocal) : INITIAL_STOCKS;
    this.serials = serialsLocal ? JSON.parse(serialsLocal) : INITIAL_SERIALS;
    this.hpps = hppLocal ? JSON.parse(hppLocal) : INITIAL_HPP;
    this.discounts = discountsLocal ? JSON.parse(discountsLocal) : INITIAL_DISCOUNTS;
    this.bundles = bundlesLocal ? JSON.parse(bundlesLocal) : INITIAL_BUNDLES;
    this.packages = packagesLocal ? JSON.parse(packagesLocal) : INITIAL_PACKAGES;
    this.historyLogs = historyLocal ? JSON.parse(historyLocal) : INITIAL_HISTORY;
    this.purchaseHistory = purchaseLocal ? JSON.parse(purchaseLocal) : [];
    this.stockLogs = stockLogsLocal ? JSON.parse(stockLogsLocal) : [];
    this.transactions = txLocal ? JSON.parse(txLocal) : [];
    this.shifts = shiftsLocal ? JSON.parse(shiftsLocal) : [];
    this.settings = settingsLocal ? JSON.parse(settingsLocal) : INITIAL_SETTINGS;
    this.supplierPurchases = supplierPurchasesLocal ? JSON.parse(supplierPurchasesLocal) : [];
    this.stockOpnames = stockOpnamesLocal ? JSON.parse(stockOpnamesLocal) : [];

    // Save initial mock data to localStorage so edit persistence works immediately
    if (!itemsLocal) this.saveAllToLocalStorage();
  }

  private static saveAllToLocalStorage() {
    localStorage.setItem("pos_items", JSON.stringify(this.items));
    localStorage.setItem("pos_units", JSON.stringify(this.units));
    localStorage.setItem("pos_barcodes", JSON.stringify(this.barcodes));
    localStorage.setItem("pos_prices", JSON.stringify(this.prices));
    localStorage.setItem("pos_stocks", JSON.stringify(this.stocks));
    localStorage.setItem("pos_serials", JSON.stringify(this.serials));
    localStorage.setItem("pos_hpps", JSON.stringify(this.hpps));
    localStorage.setItem("pos_discounts", JSON.stringify(this.discounts));
    localStorage.setItem("pos_bundles", JSON.stringify(this.bundles));
    localStorage.setItem("pos_packages", JSON.stringify(this.packages));
    localStorage.setItem("pos_history", JSON.stringify(this.historyLogs));
    localStorage.setItem("pos_purchases", JSON.stringify(this.purchaseHistory));
    localStorage.setItem("pos_stock_logs", JSON.stringify(this.stockLogs));
    localStorage.setItem("pos_transactions", JSON.stringify(this.transactions));
    localStorage.setItem("pos_shifts", JSON.stringify(this.shifts));
    localStorage.setItem("pos_settings", JSON.stringify(this.settings || INITIAL_SETTINGS));
    localStorage.setItem("pos_supplier_purchases", JSON.stringify(this.supplierPurchases));
    localStorage.setItem("pos_stock_opnames", JSON.stringify(this.stockOpnames));
  }

  private static async loadFromSupabase() {
    try {
      const [
        { data: items },
        { data: units },
        { data: barcodes },
        { data: prices },
        { data: stocks },
        { data: serials },
        { data: hpps },
        { data: discounts },
        { data: bundles },
        { data: packages },
        { data: history },
        { data: purchases },
        { data: stockLogs },
        { data: transactions },
        { data: shifts },
        { data: settingsRows },
        { data: supplierPurchases },
        { data: stockOpnames }
      ] = await Promise.all([
        supabase.from("items").select("*"),
        supabase.from("item_units").select("*"),
        supabase.from("item_barcodes").select("*"),
        supabase.from("item_prices").select("*"),
        supabase.from("item_stock").select("*"),
        supabase.from("item_serials").select("*"),
        supabase.from("item_hpp").select("*"),
        supabase.from("item_discount").select("*"),
        supabase.from("item_bundle").select("*"),
        supabase.from("item_packages").select("*"),
        supabase.from("item_history").select("*"),
        supabase.from("item_purchase_price").select("*"),
        supabase.from("item_stock_logs").select("*"),
        supabase.from("transactions").select("*"),
        supabase.from("cashier_shifts").select("*"),
        supabase.from("store_settings").select("*"),
        supabase.from("supplier_purchases").select("*"),
        supabase.from("stock_opnames").select("*")
      ]);

      this.items = items || [];
      this.units = units || [];
      this.barcodes = barcodes || [];
      this.prices = prices || [];
      this.stocks = stocks || [];
      this.serials = serials || [];
      this.hpps = hpps || [];
      this.discounts = discounts || [];
      this.bundles = bundles || [];
      this.packages = packages || [];
      this.historyLogs = history || [];
      this.purchaseHistory = purchases || [];
      this.stockLogs = stockLogs || [];
      this.transactions = transactions || [];
      this.shifts = shifts || [];
      this.settings = (settingsRows && settingsRows[0]) || null;
      this.supplierPurchases = supplierPurchases || [];
      this.stockOpnames = stockOpnames || [];

      // If Supabase is empty (brand new install), seed it!
      if (this.items.length === 0) {
        console.log("Seeding Supabase with default products...");
        await this.seedSupabase();
      }
      if (!this.settings) {
        // Belum ada baris pengaturan toko -> buat baris default (id=1, singleton)
        const { data: inserted } = await supabase
          .from("store_settings")
          .insert([{ id: 1, ...INITIAL_SETTINGS, passwords: undefined }])
          .select()
          .single();
        this.settings = inserted || { ...INITIAL_SETTINGS };
      }
    } catch (err) {
      console.error("Failed to load from Supabase, failing back to local storage:", err);
      this.isSubSupabaseReady = false;
      this.loadFromLocalStorage();
    }
  }

  private static async seedSupabase() {
    try {
      await supabase.from("items").insert(INITIAL_ITEMS);
      await supabase.from("item_units").insert(INITIAL_UNITS);
      await supabase.from("item_barcodes").insert(INITIAL_BARCODES);
      await supabase.from("item_prices").insert(INITIAL_PRICES);
      await supabase.from("item_stock").insert(INITIAL_STOCKS);
      await supabase.from("item_serials").insert(INITIAL_SERIALS);
      await supabase.from("item_hpp").insert(INITIAL_HPP);
      await supabase.from("item_discount").insert(INITIAL_DISCOUNTS);
      await supabase.from("item_bundle").insert(INITIAL_BUNDLES);
      await supabase.from("item_packages").insert(INITIAL_PACKAGES);
      await supabase.from("item_history").insert(INITIAL_HISTORY);
      await this.loadFromSupabase();
    } catch (e) {
      console.error("Error seeding Supabase:", e);
    }
  }

  public static async resetToFactoryDefaults() {
    localStorage.clear();
    this.items = [...INITIAL_ITEMS];
    this.units = [...INITIAL_UNITS];
    this.barcodes = [...INITIAL_BARCODES];
    this.prices = [...INITIAL_PRICES];
    this.stocks = [...INITIAL_STOCKS];
    this.serials = [...INITIAL_SERIALS];
    this.hpps = [...INITIAL_HPP];
    this.discounts = [...INITIAL_DISCOUNTS];
    this.bundles = [...INITIAL_BUNDLES];
    this.packages = [...INITIAL_PACKAGES];
    this.historyLogs = [...INITIAL_HISTORY];
    this.purchaseHistory = [];
    this.stockLogs = [];
    this.transactions = [];
    this.supplierPurchases = [];
    this.stockOpnames = [];
    this.settings = { ...INITIAL_SETTINGS };
    this.saveAllToLocalStorage();
  }

  public static getSettings(): StoreSettings {
    if (!this.settings) {
      const settingsLocal = localStorage.getItem("pos_settings");
      this.settings = settingsLocal ? JSON.parse(settingsLocal) : INITIAL_SETTINGS;
    }
    // Password mode-offline disimpan terpisah dari data toko (tidak pernah
    // dikirim ke Supabase). Selalu diisi dari sini supaya konsisten baik
    // saat online maupun offline.
    const offlineLocal = localStorage.getItem("pos_offline_passwords");
    this.settings!.passwords = offlineLocal
      ? JSON.parse(offlineLocal)
      : (this.settings!.passwords || { owner: "owner123", admin: "admin123", kasir: "kasir123" });

    return this.settings || INITIAL_SETTINGS;
  }

  public static async saveSettings(newSettings: StoreSettings) {
    this.settings = newSettings;
    // Password mode-offline selalu disimpan lokal saja, tidak pernah ke Supabase
    // (login online tidak lagi memakai password ini sama sekali).
    localStorage.setItem("pos_offline_passwords", JSON.stringify(newSettings.passwords || {}));

    if (this.isSubSupabaseReady) {
      const { passwords, ...rest } = newSettings;
      await supabase.from("store_settings").upsert([{ id: 1, ...rest }]);
    } else {
      localStorage.setItem("pos_settings", JSON.stringify(newSettings));
    }
  }

  // DISKON BERTINGKAT PARSER
  // E.g., parse "10%+5%+2%" or "Rp2000+5%"
  public static calculateDiscount(originalPrice: number, formula: string): number {
    if (!formula) return 0;
    
    // Clean string
    const parts = formula.split("+").map(p => p.trim());
    let currentPrice = originalPrice;

    for (const part of parts) {
      if (part.endsWith("%")) {
        const percent = parseFloat(part.replace("%", ""));
        if (!isNaN(percent)) {
          currentPrice = currentPrice - (currentPrice * (percent / 100));
        }
      } else if (part.startsWith("Rp") || /^\d+/.test(part)) {
        const nominal = parseFloat(part.replace(/[^\d]/g, ""));
        if (!isNaN(nominal)) {
          currentPrice = Math.max(0, currentPrice - nominal);
        }
      }
    }
    return Math.max(0, originalPrice - currentPrice);
  }

  // CORE CRUD OPERATIONS
  // 1. Items
  public static getItems(): Item[] {
    return this.items;
  }

  public static getItemById(id: string): Item | undefined {
    return this.items.find(i => i.id === id);
  }

  public static async createItem(item: Omit<Item, "id">, userName: string = "Admin"): Promise<Item> {
    const newItem: Item = {
      ...item,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.items.push(newItem);
    // Selalu simpan ke cache lokal dulu (bukan cuma saat offline) supaya
    // data barang TIDAK HILANG walau penulisan ke Supabase gagal/ditolak.
    this.saveAllToLocalStorage();

    // Audit Log
    this.addHistoryLog(newItem.id, userName, "CREATE", JSON.stringify(newItem));

    if (this.isSubSupabaseReady) {
      try {
        const { error } = await supabase.from("items").insert([newItem]);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase write failed, item hanya tersimpan lokal", err);
        // Lempar lagi errornya supaya UI (mis. ItemManager) bisa kasih tahu
        // pengguna bahwa barang TIDAK masuk ke Supabase — sebelumnya error
        // ini ditelan diam-diam dan UI selalu bilang "berhasil disimpan"
        // padahal cuma tersimpan lokal (hilang setelah refresh).
        throw new Error(`Barang tersimpan di perangkat ini, tapi GAGAL sinkron ke Supabase (kemungkinan RLS/izin akun). Detail: ${(err as any)?.message || err}`);
      }
    }

    return newItem;
  }

  public static async updateItem(id: string, updates: Partial<Item>, userName: string = "Admin"): Promise<Item> {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error("Item not found");

    const oldItem = { ...this.items[idx] };
    const updatedItem = {
      ...this.items[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.items[idx] = updatedItem;
    this.saveAllToLocalStorage();

    // Audit Log
    this.addHistoryLog(id, userName, "UPDATE", JSON.stringify({ old: oldItem, updated: updatedItem }));

    if (this.isSubSupabaseReady) {
      try {
        const { error } = await supabase.from("items").update(updates).eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase update failed, item hanya tersimpan lokal", err);
        throw new Error(`Perubahan tersimpan di perangkat ini, tapi GAGAL sinkron ke Supabase. Detail: ${(err as any)?.message || err}`);
      }
    }

    return updatedItem;
  }

  public static async deleteItem(id: string, userName: string = "Admin"): Promise<boolean> {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) return false;

    const oldItem = { ...this.items[idx] };
    this.items.splice(idx, 1);

    // Also delete associations
    this.units = this.units.filter(u => u.item_id !== id);
    this.barcodes = this.barcodes.filter(b => b.item_id !== id);
    this.prices = this.prices.filter(p => p.item_id !== id);
    this.stocks = this.stocks.filter(s => s.item_id !== id);
    this.serials = this.serials.filter(s => s.item_id !== id);
    this.hpps = this.hpps.filter(h => h.item_id !== id);

    this.addHistoryLog(id, userName, "DELETE", JSON.stringify(oldItem));
    this.saveAllToLocalStorage();

    if (this.isSubSupabaseReady) {
      try {
        const { error } = await supabase.from("items").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase delete failed", err);
        throw new Error(`Barang dihapus di perangkat ini, tapi GAGAL sinkron hapus ke Supabase. Detail: ${(err as any)?.message || err}`);
      }
    }

    return true;
  }

  // 2. Units
  public static getUnits(): ItemUnit[] {
    return this.units;
  }

  public static getUnitsByItem(itemId: string): ItemUnit[] {
    return this.units.filter(u => u.item_id === itemId);
  }

  public static async saveUnit(unit: Omit<ItemUnit, "id"> | ItemUnit): Promise<ItemUnit> {
    let savedUnit: ItemUnit;
    if ("id" in unit && unit.id) {
      const idx = this.units.findIndex(u => u.id === unit.id);
      if (idx !== -1) {
        this.units[idx] = unit as ItemUnit;
      } else {
        this.units.push(unit as ItemUnit);
      }
      savedUnit = unit as ItemUnit;
    } else {
      savedUnit = { ...unit, id: generateUUID() } as ItemUnit;
      this.units.push(savedUnit);
    }

    this.saveAllToLocalStorage();

    if (this.isSubSupabaseReady) {
      try {
        const { error } = await supabase.from("item_units").upsert([savedUnit]);
        if (error) throw error;
      } catch (e) {
        console.error("Supabase unit write error", e);
        throw new Error(`Satuan barang tersimpan lokal, tapi GAGAL sinkron ke Supabase. Detail: ${(e as any)?.message || e}`);
      }
    }
    return savedUnit;
  }

  public static async deleteUnit(unitId: string): Promise<boolean> {
    const idx = this.units.findIndex(u => u.id === unitId);
    if (idx === -1) return false;
    this.units.splice(idx, 1);

    this.saveAllToLocalStorage();

    if (this.isSubSupabaseReady) {
      try {
        const { error } = await supabase.from("item_units").delete().eq("id", unitId);
        if (error) throw error;
      } catch (e) {
        console.error("Supabase unit delete error", e);
        throw new Error(`Satuan barang terhapus lokal, tapi GAGAL sinkron hapus ke Supabase. Detail: ${(e as any)?.message || e}`);
      }
    }
    return true;
  }

  // 3. Stock / Inventory
  public static getStocks(): ItemStock[] {
    return this.stocks;
  }

  // Gudang aktif tempat kasir ini berjualan (dipakai supaya potong/kembalikan
  // stok tidak asal ambil gudang pertama yang ditemukan — temuan review #6).
  public static getActiveGudang(): string {
    return this.getSettings().gudang_aktif || "Gudang Toko";
  }

  // Cari record stok item di gudang tertentu; kalau tidak ada di gudang itu,
  // baru jatuh ke record pertama yang tersedia (best-effort fallback).
  public static getStockForGudang(itemId: string, gudang: string): ItemStock | undefined {
    const stocks = this.getStockByItem(itemId);
    return stocks.find(s => s.gudang === gudang) || stocks[0];
  }

  // Cek kecukupan stok untuk seluruh isi keranjang SEBELUM checkout
  // (temuan review #5: sebelumnya tidak ada validasi sama sekali).
  public static checkStockAvailability(cartItems: CartItem[], gudang: string): { ok: boolean; problems: string[] } {
    const problems: string[] = [];
    // Gabungkan qty per item+unit dulu supaya 2 baris keranjang item yang sama tidak lolos validasi
    const neededByItem = new Map<string, number>();

    for (const cartItem of cartItems) {
      const itemId = cartItem.item.id;
      const totalBaseQty = cartItem.qty * cartItem.selectedUnit.konversi;

      const components = this.getPackageComponents(itemId);
      if (components.length > 0) {
        for (const comp of components) {
          const key = comp.component_item_id;
          neededByItem.set(key, (neededByItem.get(key) || 0) + comp.qty * totalBaseQty);
        }
      } else {
        neededByItem.set(itemId, (neededByItem.get(itemId) || 0) + totalBaseQty);
      }
    }

    for (const [itemId, needed] of neededByItem.entries()) {
      const stock = this.getStockForGudang(itemId, gudang);
      const available = stock?.stok_tersedia ?? 0;
      if (needed > available) {
        const itemName = this.getItemById(itemId)?.nama_barang || itemId;
        problems.push(`${itemName}: butuh ${needed}, stok tersedia ${available} (${stock?.gudang || gudang})`);
      }
    }

    return { ok: problems.length === 0, problems };
  }

  // Ambil diskon aktif untuk sebuah barang (generik untuk SEMUA barang,
  // menggantikan logika lama yang di-hardcode hanya untuk 1 produk demo).
  public static getActiveDiscountForItem(itemId: string): ItemDiscount | undefined {
    return this.discounts.find(d => d.item_id === itemId && d.aktif !== false);
  }

  public static async saveDiscount(discount: Omit<ItemDiscount, "id"> | ItemDiscount): Promise<ItemDiscount> {
    const existingIdx = "id" in discount ? this.discounts.findIndex(d => d.id === (discount as ItemDiscount).id) : -1;
    const saved: ItemDiscount = existingIdx !== -1
      ? { ...(discount as ItemDiscount) }
      : { ...discount, id: generateUUID() } as ItemDiscount;

    if (existingIdx !== -1) {
      this.discounts[existingIdx] = saved;
    } else {
      this.discounts.push(saved);
    }

    if (this.isSubSupabaseReady) {
      await supabase.from("item_discount").upsert([saved]);
    } else {
      this.saveAllToLocalStorage();
    }
    return saved;
  }

  public static async deleteDiscount(discountId: string): Promise<boolean> {
    const idx = this.discounts.findIndex(d => d.id === discountId);
    if (idx === -1) return false;
    this.discounts.splice(idx, 1);

    if (this.isSubSupabaseReady) {
      await supabase.from("item_discount").delete().eq("id", discountId);
    } else {
      this.saveAllToLocalStorage();
    }
    return true;
  }

  public static getStockByItem(itemId: string): ItemStock[] {
    const matched = this.stocks.filter(s => s.item_id === itemId);
    if (matched.length > 0) return matched;
    
    // Auto-create a default stock entry if missing
    const defaultStock: ItemStock = {
      id: generateUUID(),
      item_id: itemId,
      gudang: "Gudang Utama",
      stok_tersedia: 0,
      stok_dipesan: 0,
      stok_minimum: 10,
      stok_maksimum: 500,
      safety_stock: 5,
      reorder_point: 15,
      buffer_stock: 5
    };
    this.stocks.push(defaultStock);
    this.saveAllToLocalStorage();
    return [defaultStock];
  }

  public static async saveStock(stock: ItemStock): Promise<ItemStock> {
    const idx = this.stocks.findIndex(s => s.id === stock.id);
    if (idx !== -1) {
      this.stocks[idx] = stock;
    } else {
      this.stocks.push(stock);
    }

    this.saveAllToLocalStorage();

    if (this.isSubSupabaseReady) {
      try {
        const { error } = await supabase.from("item_stock").upsert([stock]);
        if (error) throw error;
      } catch (e) {
        console.error("Supabase stock write error", e);
        throw new Error(`Stok tersimpan lokal, tapi GAGAL sinkron ke Supabase. Detail: ${(e as any)?.message || e}`);
      }
    }
    return stock;
  }

  // 4. Barcodes
  public static getBarcodes(): ItemBarcode[] {
    return this.barcodes;
  }

  public static getBarcodesByItem(itemId: string): ItemBarcode[] {
    return this.barcodes.filter(b => b.item_id === itemId);
  }

  public static async addBarcode(item_id: string, barcode: string, tipe: any): Promise<ItemBarcode> {
    const newBarcode: ItemBarcode = { id: generateUUID(), item_id, barcode, tipe };
    this.barcodes.push(newBarcode);

    if (this.isSubSupabaseReady) {
      try {
        await supabase.from("item_barcodes").insert([newBarcode]);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.saveAllToLocalStorage();
    }
    return newBarcode;
  }

  public static async deleteBarcode(barcodeId: string): Promise<boolean> {
    const idx = this.barcodes.findIndex(b => b.id === barcodeId);
    if (idx === -1) return false;
    this.barcodes.splice(idx, 1);

    if (this.isSubSupabaseReady) {
      try {
        await supabase.from("item_barcodes").delete().eq("id", barcodeId);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.saveAllToLocalStorage();
    }
    return true;
  }

  // 5. Prices
  public static getPricesByItem(itemId: string): ItemPrice[] {
    return this.prices.filter(p => p.item_id === itemId);
  }

  public static async savePrice(price: ItemPrice): Promise<ItemPrice> {
    const idx = this.prices.findIndex(p => p.id === price.id);
    if (idx !== -1) {
      this.prices[idx] = price;
    } else {
      this.prices.push(price);
    }

    if (this.isSubSupabaseReady) {
      try {
        await supabase.from("item_prices").upsert([price]);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.saveAllToLocalStorage();
    }
    return price;
  }

  public static async deletePrice(priceId: string): Promise<boolean> {
    const idx = this.prices.findIndex(p => p.id === priceId);
    if (idx === -1) return false;
    this.prices.splice(idx, 1);

    if (this.isSubSupabaseReady) {
      try {
        await supabase.from("item_prices").delete().eq("id", priceId);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.saveAllToLocalStorage();
    }
    return true;
  }

  // 6. Serials
  public static getSerialsByItem(itemId: string): ItemSerial[] {
    return this.serials.filter(s => s.item_id === itemId);
  }

  public static async addSerial(serial: Omit<ItemSerial, "id">): Promise<ItemSerial> {
    const newSerial: ItemSerial = { ...serial, id: generateUUID() };
    this.serials.push(newSerial);

    if (this.isSubSupabaseReady) {
      try {
        await supabase.from("item_serials").insert([newSerial]);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.saveAllToLocalStorage();
    }
    return newSerial;
  }

  public static async updateSerialStatus(id: string, status: 'Tersedia' | 'Terjual' | 'Rusak'): Promise<boolean> {
    const idx = this.serials.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.serials[idx].status = status;

    if (this.isSubSupabaseReady) {
      try {
        await supabase.from("item_serials").update({ status }).eq("id", id);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.saveAllToLocalStorage();
    }
    return true;
  }

  // 7. Expired & Warnings
  public static getExpiredItems(): { item: Item; serial: ItemSerial; daysLeft: number }[] {
    const now = new Date();
    const result: { item: Item; serial: ItemSerial; daysLeft: number }[] = [];

    this.serials.forEach(sr => {
      if (sr.expired_at && sr.status === "Tersedia") {
        const expDate = new Date(sr.expired_at);
        const timeDiff = expDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const item = this.getItemById(sr.item_id);
        if (item) {
          result.push({ item, serial: sr, daysLeft });
        }
      }
    });

    return result;
  }

  // 8. HPP Recalculation
  public static getHpp(itemId: string): ItemHpp | undefined {
    return this.hpps.find(h => h.item_id === itemId);
  }

  public static async updateHpp(itemId: string, method: 'FIFO' | 'Average' | 'Last Purchase' | 'Standard Cost', val: number): Promise<ItemHpp> {
    const idx = this.hpps.findIndex(h => h.item_id === itemId);
    const updatedHpp: ItemHpp = {
      id: idx !== -1 ? this.hpps[idx].id : generateUUID(),
      item_id: itemId,
      metode: method,
      nilai_hpp: val
    };

    if (idx !== -1) {
      this.hpps[idx] = updatedHpp;
    } else {
      this.hpps.push(updatedHpp);
    }

    if (this.isSubSupabaseReady) {
      try {
        await supabase.from("item_hpp").upsert([updatedHpp]);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.saveAllToLocalStorage();
    }
    return updatedHpp;
  }

  // 9. Purchases & Supplier Harga Beli History
  public static getPurchasesByItem(itemId: string): ItemPurchasePrice[] {
    return this.purchaseHistory.filter(p => p.item_id === itemId);
  }

  public static async recordPurchase(purchase: Omit<ItemPurchasePrice, "id">): Promise<ItemPurchasePrice> {
    const newPurchase: ItemPurchasePrice = { ...purchase, id: generateUUID() };
    this.purchaseHistory.push(newPurchase);

    // Calculate New HPP automatically (Average method)
    const stockEntries = this.getStockByItem(purchase.item_id);
    const currentStock = stockEntries.reduce((acc, s) => acc + s.stok_tersedia, 0);
    const currentHppObj = this.getHpp(purchase.item_id);
    const currentHpp = currentHppObj ? currentHppObj.nilai_hpp : purchase.harga_beli;

    // Standard formula for HPP Average:
    // (Current Stock * Old HPP + Purchase Qty * Purchase Harga Beli) / (Current Stock + Purchase Qty)
    const purchaseQty = 10; // Assume batch order of 10 for HPP calculation if not specified
    const totalNewStock = currentStock + purchaseQty;
    let newHppValue = purchase.harga_beli;
    if (totalNewStock > 0) {
      newHppValue = Math.round(((currentStock * currentHpp) + (purchaseQty * purchase.harga_beli)) / totalNewStock);
    }

    newPurchase.hpp_berubah = newHppValue;
    await this.updateHpp(purchase.item_id, currentHppObj?.metode || "Average", newHppValue);

    // Increment current stock in first warehouse
    if (stockEntries.length > 0) {
      const mainStock = { ...stockEntries[0] };
      mainStock.stok_tersedia += purchaseQty;
      await this.saveStock(mainStock);

      // Add Stock Log
      this.addStockLog(purchase.item_id, mainStock.gudang, "Pembelian", purchaseQty, mainStock.stok_tersedia - purchaseQty, mainStock.stok_tersedia, purchase.supplier);
    }

    if (this.isSubSupabaseReady) {
      try {
        await supabase.from("item_purchase_price").insert([newPurchase]);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.saveAllToLocalStorage();
    }
    return newPurchase;
  }

  // 10. Audit Trails
  public static getHistoryLogs(): ItemHistory[] {
    return this.historyLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  private static addHistoryLog(itemId: string, user: string, action: string, changesJson: string) {
    const newLog: ItemHistory = {
      id: generateUUID(),
      item_id: itemId,
      user_name: user,
      ip_address: "192.168.1.110",
      action: action as any,
      changes_json: changesJson,
      created_at: new Date().toISOString()
    };
    this.historyLogs.push(newLog);
    if (!this.isSubSupabaseReady) {
      localStorage.setItem("pos_history", JSON.stringify(this.historyLogs));
    }
  }

  public static async rollbackHistory(logId: string): Promise<boolean> {
    const log = this.historyLogs.find(l => l.id === logId);
    if (!log) return false;

    try {
      const changes = JSON.parse(log.changes_json);
      if (log.action === "UPDATE" && changes.old) {
        // Rollback details
        await this.updateItem(log.item_id, changes.old, "System (Rollback)");
        return true;
      } else if (log.action === "CREATE") {
        // Remove item
        await this.deleteItem(log.item_id, "System (Rollback)");
        return true;
      }
    } catch (e) {
      console.error("Rollback failed:", e);
    }
    return false;
  }

  // 11. Packages & Components (Automatic package stock calculator)
  public static getPackageComponents(packageItemId: string): ItemPackage[] {
    return this.packages.filter(p => p.package_item_id === packageItemId);
  }

  public static async savePackageComponents(packageItemId: string, components: { component_item_id: string; qty: number }[]): Promise<void> {
    // Delete existing components
    this.packages = this.packages.filter(p => p.package_item_id !== packageItemId);

    for (const c of components) {
      const newPkg: ItemPackage = {
        id: generateUUID(),
        package_item_id: packageItemId,
        component_item_id: c.component_item_id,
        qty: c.qty
      };
      this.packages.push(newPkg);
    }

    if (this.isSubSupabaseReady) {
      try {
        await supabase.from("item_packages").delete().eq("package_item_id", packageItemId);
        if (components.length > 0) {
          const insertPayload = components.map(c => ({
            id: generateUUID(),
            package_item_id: packageItemId,
            component_item_id: c.component_item_id,
            qty: c.qty
          }));
          await supabase.from("item_packages").insert(insertPayload);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      this.saveAllToLocalStorage();
    }
  }

  // Stock for package items is determined strictly by the minimum of component stocks divided by package requirement qty
  public static calculatePackageStock(packageItemId: string): number {
    const components = this.getPackageComponents(packageItemId);
    if (components.length === 0) return 0;

    let minPossible = Infinity;
    for (const c of components) {
      const compStocks = this.getStockByItem(c.component_item_id);
      const compTotalStock = compStocks.reduce((sum, s) => sum + s.stok_tersedia, 0);
      const possiblePackages = Math.floor(compTotalStock / c.qty);
      if (possiblePackages < minPossible) {
        minPossible = possiblePackages;
      }
    }
    return minPossible === Infinity ? 0 : minPossible;
  }

  // 12. Bundles (Buy 2 Get 1 etc)
  public static getBundlesByItem(itemId: string): ItemBundle[] {
    return this.bundles.filter(b => b.item_id === itemId);
  }

  public static async saveBundle(bundle: ItemBundle): Promise<ItemBundle> {
    const idx = this.bundles.findIndex(b => b.id === bundle.id);
    if (idx !== -1) {
      this.bundles[idx] = bundle;
    } else {
      this.bundles.push(bundle);
    }

    if (this.isSubSupabaseReady) {
      try {
        await supabase.from("item_bundle").upsert([bundle]);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.saveAllToLocalStorage();
    }
    return bundle;
  }

  // 13. Transactions / POS sales recording
  public static getTransactions(): Transaction[] {
    return this.transactions.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }

  public static async recordTransaction(tx: Omit<Transaction, "id" | "tanggal" | "invoice_no">): Promise<Transaction> {
    const gudang = this.getActiveGudang();

    // Jaring pengaman terakhir: tolak transaksi kalau stok tidak cukup,
    // meskipun UI seharusnya sudah mengecek ini duluan (temuan review #5).
    const stockCheck = this.checkStockAvailability(tx.items, gudang);
    if (!stockCheck.ok) {
      throw new Error("Stok tidak cukup:\n" + stockCheck.problems.join("\n"));
    }

    const dateStr = new Date().toISOString();
    const invoiceNum = "INV-" + Date.now().toString().slice(-8);
    const activeShift = this.getActiveShift();

    const newTx: Transaction = {
      ...tx,
      id: generateUUID(),
      tanggal: dateStr,
      invoice_no: invoiceNum,
      shift_id: activeShift?.id,
      gudang,
      is_rolled_back: false
    };

    this.transactions.push(newTx);
    // Cache lokal SEGERA (bukan menunggu akhir fungsi) — supaya kalau nanti
    // ada langkah sinkron Supabase yang gagal di tengah jalan, transaksi ini
    // tetap tidak hilang dari perangkat kasir.
    this.saveAllToLocalStorage();

    if (activeShift) {
      const isCash = tx.payment_method === "Cash" || tx.payment_method === "Tunai";
      await this.updateShiftSales(activeShift.id, tx.grand_total, isCash);
    }

    // Kumpulkan peringatan sinkron (kalau ada) tanpa membatalkan transaksi —
    // penjualan yang sudah tercatat di kasir TIDAK BOLEH gagal/hilang cuma
    // karena koneksi ke Supabase bermasalah sesaat.
    const syncWarnings: string[] = [];

    // Deduct stock for each sold item/unit, always in the active gudang
    for (const cartItem of tx.items) {
      const itemId = cartItem.item.id;
      const unit = cartItem.selectedUnit;
      const totalQtyToDeduct = cartItem.qty * unit.konversi; // Convert sold units to base unit count (Pcs)

      // Deduct components stock if the sold item is a Package
      const components = this.getPackageComponents(itemId);
      if (components.length > 0) {
        for (const comp of components) {
          const compDeductQty = comp.qty * totalQtyToDeduct;
          const targetStock = this.getStockForGudang(comp.component_item_id, gudang);
          if (targetStock) {
            const updated = { ...targetStock };
            updated.stok_tersedia = Math.max(0, updated.stok_tersedia - compDeductQty);
            try {
              await this.saveStock(updated);
            } catch (e) {
              syncWarnings.push((e as any)?.message || String(e));
            }

            this.addStockLog(
              comp.component_item_id,
              updated.gudang,
              "Penjualan",
              -compDeductQty,
              updated.stok_tersedia + compDeductQty,
              updated.stok_tersedia,
              `Paket: ${cartItem.item.nama_barang} [${invoiceNum}]`
            );
          }
        }
      } else {
        // Simple product stock deduction
        const targetStock = this.getStockForGudang(itemId, gudang);
        if (targetStock) {
          const updated = { ...targetStock };
          updated.stok_tersedia = Math.max(0, updated.stok_tersedia - totalQtyToDeduct);
          try {
            await this.saveStock(updated);
          } catch (e) {
            syncWarnings.push((e as any)?.message || String(e));
          }

          this.addStockLog(
            itemId,
            updated.gudang,
            "Penjualan",
            -totalQtyToDeduct,
            updated.stok_tersedia + totalQtyToDeduct,
            updated.stok_tersedia,
            invoiceNum
          );
        }
      }

      // Mark Serial Number as sold if relevant
      if (cartItem.serialNumber) {
        const serialsMatched = this.serials.filter(s => s.item_id === itemId && s.serial_number === cartItem.serialNumber);
        if (serialsMatched.length > 0) {
          await this.updateSerialStatus(serialsMatched[0].id, "Terjual");
        }
      }
    }

    if (this.isSubSupabaseReady) {
      try {
        const { error } = await supabase.from("transactions").insert([newTx]);
        if (error) throw error;
      } catch (e) {
        syncWarnings.push((e as any)?.message || String(e));
      }
    }

    if (syncWarnings.length > 0) {
      // Transaksi & stok tetap tersimpan aman di perangkat ini (localStorage),
      // tapi belum semuanya tersinkron ke Supabase. Jangan gagalkan
      // penjualan cuma karena ini — cukup catat sebagai peringatan supaya
      // UI kasir bisa menampilkan notifikasi kecil kalau perlu.
      console.warn("Transaksi tersimpan lokal, sebagian gagal sinkron ke Supabase:", syncWarnings);
      (newTx as any)._syncWarning = syncWarnings.join("; ");
    }

    return newTx;
  }

  // Batalkan transaksi dengan benar: kembalikan stok ke GUDANG YANG SAMA
  // dengan saat dipotong, koreksi balik laporan shift, dan tandai
  // is_rolled_back (bukan dihapus, supaya jejak transaksi tetap ada untuk
  // audit — temuan review #7).
  public static async rollbackTransaction(txId: string, userName: string = "System"): Promise<boolean> {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx || tx.is_rolled_back) return false;

    const gudang = tx.gudang || this.getActiveGudang();

    for (const cartItem of tx.items) {
      const itemId = cartItem.item.id;
      const baseQtyChange = cartItem.qty * cartItem.selectedUnit.konversi;

      const components = this.getPackageComponents(itemId);
      if (components.length > 0) {
        for (const comp of components) {
          const compQty = comp.qty * baseQtyChange;
          const targetStock = this.getStockForGudang(comp.component_item_id, gudang);
          if (targetStock) {
            const updated = { ...targetStock };
            updated.stok_tersedia += compQty;
            try {
              await this.saveStock(updated);
            } catch (e) {
              console.warn("Rollback: gagal sinkron stok komponen paket ke Supabase", e);
            }
            this.addStockLog(comp.component_item_id, updated.gudang, "Koreksi", compQty, updated.stok_tersedia - compQty, updated.stok_tersedia, `Batal Transaksi: ${tx.invoice_no}`);
          }
        }
      } else {
        const targetStock = this.getStockForGudang(itemId, gudang);
        if (targetStock) {
          const updated = { ...targetStock };
          updated.stok_tersedia += baseQtyChange;
          try {
            await this.saveStock(updated);
          } catch (e) {
            console.warn("Rollback: gagal sinkron stok ke Supabase", e);
          }
          this.addStockLog(itemId, updated.gudang, "Koreksi", baseQtyChange, updated.stok_tersedia - baseQtyChange, updated.stok_tersedia, `Batal Transaksi: ${tx.invoice_no}`);
        }
      }
    }

    // Koreksi balik laporan shift supaya tidak lagi terhitung sebagai penjualan
    if (tx.shift_id) {
      const isCash = tx.payment_method === "Cash" || tx.payment_method === "Tunai";
      await this.updateShiftSales(tx.shift_id, -tx.grand_total, isCash);
    }

    tx.is_rolled_back = true;
    tx.rolled_back_at = new Date().toISOString();
    this.saveAllToLocalStorage();

    if (this.isSubSupabaseReady) {
      try {
        const { error } = await supabase.from("transactions").update({ is_rolled_back: true, rolled_back_at: tx.rolled_back_at }).eq("id", txId);
        if (error) throw error;
      } catch (e) {
        console.warn("Rollback: status pembatalan gagal sinkron ke Supabase (tersimpan lokal)", e);
      }
    }

    return true;
  }

  // Stock Log Helpers
  public static getStockLogs(): ItemStockLog[] {
    return this.stockLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // 14. Cashier Shifts (Multi-Shift & Drawer Cash)
  public static getShifts(): CashierShift[] {
    return this.shifts.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }

  public static getActiveShift(): CashierShift | null {
    return this.shifts.find(s => s.status === "Open") || null;
  }

  public static async openShift(cashierName: string, startingCash: number): Promise<CashierShift> {
    const existing = this.getActiveShift();
    if (existing) {
      return existing;
    }

    const newShift: CashierShift = {
      id: generateUUID(),
      cashier_name: cashierName,
      start_time: new Date().toISOString(),
      starting_cash: startingCash,
      expected_closing_cash: startingCash,
      status: "Open",
      total_cash_sales: 0,
      total_non_cash_sales: 0
    };

    this.shifts.push(newShift);
    if (this.isSubSupabaseReady) {
      await supabase.from("cashier_shifts").insert([newShift]);
    } else {
      this.saveAllToLocalStorage();
    }
    return newShift;
  }

  public static async closeShift(actualCash: number, notes?: string): Promise<CashierShift | null> {
    const active = this.getActiveShift();
    if (!active) return null;

    active.status = "Closed";
    active.end_time = new Date().toISOString();
    active.actual_closing_cash = actualCash;
    active.expected_closing_cash = active.starting_cash + active.total_cash_sales;
    active.difference = actualCash - active.expected_closing_cash;
    active.notes = notes;

    if (this.isSubSupabaseReady) {
      await supabase.from("cashier_shifts").update(active).eq("id", active.id);
    } else {
      this.saveAllToLocalStorage();
    }
    return active;
  }

  public static async updateShiftSales(shiftId: string, grandTotal: number, isCash: boolean) {
    const shift = this.shifts.find(s => s.id === shiftId);
    if (!shift) return;

    if (isCash) {
      shift.total_cash_sales += grandTotal;
    } else {
      shift.total_non_cash_sales += grandTotal;
    }
    shift.expected_closing_cash = shift.starting_cash + shift.total_cash_sales;

    if (this.isSubSupabaseReady) {
      await supabase.from("cashier_shifts").update({
        total_cash_sales: shift.total_cash_sales,
        total_non_cash_sales: shift.total_non_cash_sales,
        expected_closing_cash: shift.expected_closing_cash
      }).eq("id", shiftId);
    } else {
      this.saveAllToLocalStorage();
    }
  }

  public static addStockLog(
    item_id: string,
    gudang: string,
    tipe_transaksi: 'Penjualan' | 'Pembelian' | 'Stok Opname' | 'Koreksi',
    qty: number,
    stok_sebelum: number,
    stok_sesudah: number,
    notes?: string
  ) {
    const newLog: ItemStockLog = {
      id: generateUUID(),
      item_id,
      gudang,
      tipe_transaksi,
      qty,
      stok_sebelum,
      stok_sesudah,
      user_name: "Kasir Asyifa",
      notes,
      created_at: new Date().toISOString()
    };
    this.stockLogs.push(newLog);
    if (this.isSubSupabaseReady) {
      supabase.from("item_stock_logs").insert([newLog]).then(({ error }) => {
        if (error) console.error("Supabase stock log insert error", error);
      });
    } else {
      localStorage.setItem("pos_stock_logs", JSON.stringify(this.stockLogs));
    }
  }

  // 15. Supplier Purchases
  public static getSupplierPurchases(): SupplierPurchase[] {
    return this.supplierPurchases.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }

  public static async recordSupplierPurchase(purchaseData: Omit<SupplierPurchase, "id" | "tanggal">): Promise<SupplierPurchase> {
    const id = generateUUID();
    const tanggal = new Date().toISOString();
    
    const newPurchase: SupplierPurchase = {
      ...purchaseData,
      id,
      tanggal
    };

    this.supplierPurchases.push(newPurchase);

    // Update stock & calculate HPP for each item
    for (const pItem of purchaseData.items) {
      const itemId = pItem.item_id;
      const stocks = this.getStockByItem(itemId);
      const units = this.getUnitsByItem(itemId);
      const matchedUnit = units.find(u => u.id === pItem.unit_id) || { konversi: 1, nama: "Pcs" };
      const konversi = matchedUnit.konversi || 1;
      
      const purchaseQtyBase = pItem.qty * konversi; // Convert to base unit quantity
      const purchaseUnitPriceBase = pItem.harga_beli_satuan / konversi; // Convert unit price to base unit price

      // Record a simple HPP update
      const currentStocksTotal = stocks.reduce((sum, s) => sum + s.stok_tersedia, 0);
      const currentHppObj = this.getHpp(itemId);
      const currentHpp = currentHppObj ? currentHppObj.nilai_hpp : purchaseUnitPriceBase;
      
      // Calculate new HPP Average
      const totalNewStock = currentStocksTotal + purchaseQtyBase;
      let newHppValue = purchaseUnitPriceBase;
      if (totalNewStock > 0) {
        newHppValue = Math.round(((currentStocksTotal * currentHpp) + (purchaseQtyBase * purchaseUnitPriceBase)) / totalNewStock);
      }

      await this.updateHpp(itemId, currentHppObj?.metode || "Average", newHppValue);

      // Record into ItemPurchasePrice history
      const itemPurchaseRecord: ItemPurchasePrice = {
        id: generateUUID(),
        item_id: itemId,
        supplier: purchaseData.supplier_name,
        tanggal,
        harga_beli: pItem.harga_beli_satuan, // price per transaction unit
        ppn: 0,
        biaya_kirim: 0,
        biaya_lain: 0,
        hpp_berubah: newHppValue
      };
      this.purchaseHistory.push(itemPurchaseRecord);

      // Increment stock in target warehouse
      let targetStock = stocks.find(s => s.gudang === purchaseData.gudang_tujuan);
      if (!targetStock && stocks.length > 0) {
        // Fallback to first available stock
        targetStock = stocks[0];
      }
      
      if (targetStock) {
        const beforeStock = targetStock.stok_tersedia;
        targetStock.stok_tersedia += purchaseQtyBase;
        await this.saveStock(targetStock);

        // Add Stock Log
        this.addStockLog(
          itemId,
          targetStock.gudang,
          "Pembelian",
          purchaseQtyBase,
          beforeStock,
          targetStock.stok_tersedia,
          `Beli: ${pItem.qty} ${matchedUnit.nama} dari ${purchaseData.supplier_name} [Ref: ${purchaseData.nomor_referensi}]`
        );
      }
    }

    if (this.isSubSupabaseReady) {
      await supabase.from("supplier_purchases").insert([newPurchase]);
    } else {
      this.saveAllToLocalStorage();
    }
    return newPurchase;
  }

  // 16. Stock Opname
  public static getStockOpnames(): StockOpname[] {
    return this.stockOpnames.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }

  public static async recordStockOpname(opnameData: Omit<StockOpname, "id" | "tanggal">): Promise<StockOpname> {
    const id = generateUUID();
    const tanggal = new Date().toISOString();

    const newOpname: StockOpname = {
      ...opnameData,
      id,
      tanggal
    };

    this.stockOpnames.push(newOpname);

    // Update stock directly in warehouse
    const stocks = this.getStockByItem(opnameData.item_id);
    let targetStock = stocks.find(s => s.gudang === opnameData.gudang);
    if (!targetStock && stocks.length > 0) {
      targetStock = stocks[0];
    }

    if (targetStock) {
      const beforeStock = targetStock.stok_tersedia;
      targetStock.stok_tersedia = opnameData.stok_fisik; // Set to observed physical stock
      await this.saveStock(targetStock);

      // Add Stock Log
      this.addStockLog(
        opnameData.item_id,
        targetStock.gudang,
        "Stok Opname",
        opnameData.selisih,
        beforeStock,
        targetStock.stok_tersedia,
        opnameData.catatan || "Penyesuaian stok opname"
      );
    }

    if (this.isSubSupabaseReady) {
      await supabase.from("stock_opnames").insert([newOpname]);
    } else {
      this.saveAllToLocalStorage();
    }
    return newOpname;
  }

  // SQL Schema generation helper for copy-pasting into Supabase SQL editor
  public static getSqlSchemaString(): string {
    return `-- =========================================================
-- SQL SCHEMA KASIR POS UNTUK SUPABASE POSTGRESQL
-- Copy dan jalankan SQL ini di "SQL Editor" panel Supabase Anda.
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
    diskon_bertingkat_json JSONB,
    nominal_diskon NUMERIC(15, 2) DEFAULT 0,
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

-- Indexing for super-fast search
CREATE INDEX IF NOT EXISTS idx_items_search ON items (kode_barang, barcode_utama, nama_barang, kategori);
`;
  }
}
