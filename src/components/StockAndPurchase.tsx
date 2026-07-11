import React, { useState, useEffect } from "react";
import { 
  Truck, 
  ClipboardList, 
  History, 
  Search, 
  Plus, 
  Trash, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  FileText, 
  ArrowRight, 
  Info, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  X,
  Warehouse
} from "lucide-react";
import { POSStorage } from "../lib/storage";
import { 
  Item, 
  ItemUnit, 
  ItemStock, 
  SupplierPurchase, 
  SupplierPurchaseItem, 
  StockOpname, 
  ItemStockLog 
} from "../lib/types";

export default function StockAndPurchase() {
  const [activeTab, setActiveTab] = useState<'purchases' | 'opname' | 'logs'>('purchases');
  
  // Data State
  const [items, setItems] = useState<Item[]>([]);
  const [purchases, setPurchases] = useState<SupplierPurchase[]>([]);
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [stockLogs, setStockLogs] = useState<ItemStockLog[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>(["Gudang Utama", "Gudang Toko"]);

  // Search/Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterType, setFilterType] = useState("");

  // Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Supplier Purchase Form State
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [targetWarehouse, setTargetWarehouse] = useState("Gudang Utama");
  const [paymentStatus, setPaymentStatus] = useState<'Lunas' | 'Hutang'>('Lunas');
  const [purchaseNotes, setPurchaseNotes] = useState("");
  
  // Purchase Cart Items State
  const [purchaseCart, setPurchaseCart] = useState<Omit<SupplierPurchaseItem, "id">[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState(0);

  // Stock Opname Form State
  const [opnameItemId, setOpnameItemId] = useState("");
  const [opnameWarehouse, setOpnameWarehouse] = useState("Gudang Utama");
  const [opnameSystemStock, setOpnameSystemStock] = useState(0);
  const [opnamePhysicalStock, setOpnamePhysicalStock] = useState(0);
  const [opnameNotes, setOpnameNotes] = useState("");

  // UI States
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setItems(POSStorage.getItems());
    setPurchases(POSStorage.getSupplierPurchases());
    setOpnames(POSStorage.getStockOpnames());
    setStockLogs(POSStorage.getStockLogs());

    // Auto generate reference/invoice number for purchase
    const generatedRef = "PO-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);
    setInvoiceNo(generatedRef);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Pre-populate units and defaults when selecting an item in purchase cart
  useEffect(() => {
    if (selectedItemId) {
      const units = POSStorage.getUnitsByItem(selectedItemId);
      if (units.length > 0) {
        setSelectedUnitId(units[0].id);
        setPurchasePrice(units[0].harga_pokok || units[0].harga_jual * 0.7); // estimate cost price if undefined
      } else {
        setSelectedUnitId("");
        setPurchasePrice(0);
      }
    }
  }, [selectedItemId]);

  // Pre-populate system stock when selecting an item/warehouse in Stock Opname
  useEffect(() => {
    if (opnameItemId) {
      const stocks = POSStorage.getStockByItem(opnameItemId);
      const matched = stocks.find(s => s.gudang === opnameWarehouse);
      const currentStockVal = matched ? matched.stok_tersedia : 0;
      setOpnameSystemStock(currentStockVal);
      setOpnamePhysicalStock(currentStockVal); // default physical stock to system stock to start
    } else {
      setOpnameSystemStock(0);
      setOpnamePhysicalStock(0);
    }
  }, [opnameItemId, opnameWarehouse]);

  const handleAddItemToPurchaseCart = () => {
    if (!selectedItemId) {
      showNotification("error", "Silakan pilih barang terlebih dahulu.");
      return;
    }
    if (purchaseQty <= 0) {
      showNotification("error", "Jumlah pembelian harus lebih besar dari 0.");
      return;
    }

    const item = items.find(i => i.id === selectedItemId);
    const units = POSStorage.getUnitsByItem(selectedItemId);
    const unit = units.find(u => u.id === selectedUnitId);

    if (!item || !unit) return;

    // Check if item already exists in cart, if so update quantity
    const existingIndex = purchaseCart.findIndex(cartItem => cartItem.item_id === selectedItemId && cartItem.unit_id === selectedUnitId);
    if (existingIndex !== -1) {
      const updatedCart = [...purchaseCart];
      updatedCart[existingIndex].qty += purchaseQty;
      updatedCart[existingIndex].total_harga = updatedCart[existingIndex].qty * updatedCart[existingIndex].harga_beli_satuan;
      setPurchaseCart(updatedCart);
    } else {
      const newCartItem: Omit<SupplierPurchaseItem, "id"> = {
        item_id: item.id,
        item_name: item.nama_barang,
        unit_id: unit.id,
        unit_name: unit.nama,
        qty: purchaseQty,
        harga_beli_satuan: purchasePrice,
        total_harga: purchaseQty * purchasePrice
      };
      setPurchaseCart([...purchaseCart, newCartItem]);
    }

    // Reset simple add state
    setSelectedItemId("");
    setSelectedUnitId("");
    setPurchaseQty(1);
    setPurchasePrice(0);
    showNotification("success", "Barang ditambahkan ke daftar pembelian.");
  };

  const handleRemoveItemFromPurchaseCart = (index: number) => {
    const updated = [...purchaseCart];
    updated.splice(index, 1);
    setPurchaseCart(updated);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      showNotification("error", "Nama Supplier harus diisi.");
      return;
    }
    if (purchaseCart.length === 0) {
      showNotification("error", "Daftar barang pembelian masih kosong.");
      return;
    }

    const totalAmount = purchaseCart.reduce((sum, item) => sum + item.total_harga, 0);

    const newPurchaseData = {
      nomor_referensi: invoiceNo,
      supplier_name: supplierName,
      items: purchaseCart.map(i => ({ ...i, id: "item-p-" + Math.random().toString().slice(2) })),
      grand_total: totalAmount,
      status_pembayaran: paymentStatus,
      gudang_tujuan: targetWarehouse,
      catatan: purchaseNotes,
      user_name: "Kasir Asyifa" // Default mock cashier
    };

    try {
      await POSStorage.recordSupplierPurchase(newPurchaseData);
      showNotification("success", `Pembelian dari ${supplierName} berhasil dicatat. Stok barang diperbarui.`);
      
      // Reset Form State
      setSupplierName("");
      setPurchaseNotes("");
      setPurchaseCart([]);
      setIsCreatingPurchase(false);
      
      // Reload Data
      loadData();
    } catch (error) {
      showNotification("error", "Gagal menyimpan pembelian.");
      console.error(error);
    }
  };

  const handleSaveStockOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opnameItemId) {
      showNotification("error", "Silakan pilih barang terlebih dahulu.");
      return;
    }

    const item = items.find(i => i.id === opnameItemId);
    if (!item) return;

    const selisih = opnamePhysicalStock - opnameSystemStock;

    const newOpnameData = {
      item_id: item.id,
      item_name: item.nama_barang,
      gudang: opnameWarehouse,
      stok_sistem: opnameSystemStock,
      stok_fisik: opnamePhysicalStock,
      selisih: selisih,
      satuan_dasar: item.satuan_dasar || "Pcs",
      catatan: opnameNotes || `Penyesuaian stok manual (Selisih: ${selisih})`,
      user_name: "Admin Asyifa"
    };

    try {
      await POSStorage.recordStockOpname(newOpnameData);
      showNotification("success", `Stock Opname untuk ${item.nama_barang} berhasil disimpan. Selisih ${selisih} dicatat.`);
      
      // Reset form
      setOpnameItemId("");
      setOpnameNotes("");
      setOpnamePhysicalStock(0);
      setOpnameSystemStock(0);
      
      // Reload Data
      loadData();
    } catch (error) {
      showNotification("error", "Gagal menyimpan Stock Opname.");
      console.error(error);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatTanggal = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Filter calculations
  const filteredPurchases = purchases.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.supplier_name.toLowerCase().includes(q) ||
      p.nomor_referensi.toLowerCase().includes(q) ||
      p.gudang_tujuan.toLowerCase().includes(q)
    );
  });

  const filteredOpnames = opnames.filter(op => {
    const q = searchQuery.toLowerCase();
    return (
      op.item_name.toLowerCase().includes(q) ||
      op.gudang.toLowerCase().includes(q) ||
      op.catatan.toLowerCase().includes(q)
    );
  });

  const filteredLogs = stockLogs.filter(log => {
    const item = items.find(i => i.id === log.item_id);
    const itemName = item ? item.nama_barang : "Barang Terhapus";
    const q = searchQuery.toLowerCase();
    
    const matchesSearch = itemName.toLowerCase().includes(q) || (log.notes && log.notes.toLowerCase().includes(q));
    const matchesWarehouse = filterWarehouse ? log.gudang === filterWarehouse : true;
    const matchesType = filterType ? log.tipe_transaksi === filterType : true;

    return matchesSearch && matchesWarehouse && matchesType;
  });

  return (
    <div className="space-y-6" id="stock-purchase-section">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Manajemen Stok & Logistik</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Kelola pembelian dari supplier utama serta lakukan opname berkala untuk mencocokkan stok fisik barang.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-700/50 self-start">
          <button
            onClick={() => { setActiveTab('purchases'); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'purchases'
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Truck className="w-4 h-4" />
            Pembelian Supplier
          </button>
          <button
            onClick={() => { setActiveTab('opname'); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'opname'
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Stock Opname
          </button>
          <button
            onClick={() => { setActiveTab('logs'); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'logs'
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            Log Mutasi Stok
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl backdrop-blur border transition duration-300 ${
          notification.type === 'success' 
            ? "bg-emerald-500/90 text-white border-emerald-400" 
            : "bg-rose-500/90 text-white border-rose-400"
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* SEARCH AND FILTERS PANEL */}
      {(!isCreatingPurchase || activeTab !== 'purchases') && (
        <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-950 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={
                activeTab === 'purchases' ? "Cari nomor PO, supplier, atau gudang..." :
                activeTab === 'opname' ? "Cari nama barang, gudang, catatan..." :
                "Cari logs barang atau catatan..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition"
            />
          </div>

          {activeTab === 'logs' && (
            <div className="flex gap-2">
              <select
                value={filterWarehouse}
                onChange={(e) => setFilterWarehouse(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs rounded-2xl px-3 py-2 focus:outline-none dark:text-white"
              >
                <option value="">Semua Gudang</option>
                {warehouses.map(wh => (
                  <option key={wh} value={wh}>{wh}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs rounded-2xl px-3 py-2 focus:outline-none dark:text-white"
              >
                <option value="">Semua Tipe Log</option>
                <option value="Penjualan">Penjualan</option>
                <option value="Pembelian">Pembelian</option>
                <option value="Stok Opname">Stok Opname</option>
                <option value="Koreksi">Koreksi</option>
              </select>
            </div>
          )}

          {activeTab === 'purchases' && (
            <button
              onClick={() => {
                setIsCreatingPurchase(true);
                // regenerate PO ref
                const ref = "PO-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);
                setInvoiceNo(ref);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-600/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              Catat PO Supplier
            </button>
          )}
        </div>
      )}

      {/* ======================= TAB 1: PURCHASES FROM SUPPLIER ======================= */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          {isCreatingPurchase ? (
            /* CREATE SUPPLIER PURCHASE RECORD FORM */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Input fields */}
              <div className="lg:col-span-1 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-2">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    Informasi Pembelian
                  </h3>
                  <button
                    onClick={() => {
                      setIsCreatingPurchase(false);
                      setPurchaseCart([]);
                    }}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-400 dark:text-zinc-500 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSavePurchase} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Nomor PO / Referensi</label>
                    <input
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Nama Supplier utama</label>
                    <input
                      type="text"
                      placeholder="Contoh: PT Indofood, PT Unilever"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      required
                      list="supplier-suggestions"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                    />
                    <datalist id="supplier-suggestions">
                      <option value="PT Indofood Sukses Makmur" />
                      <option value="PT Heinz ABC Indonesia" />
                      <option value="PT Salim Ivomas Pratama" />
                      <option value="PT Samsung Electronics Indonesia" />
                      <option value="Unilever Indonesia" />
                      <option value="Mayora Indah" />
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Gudang Penyimpanan</label>
                    <select
                      value={targetWarehouse}
                      onChange={(e) => setTargetWarehouse(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                    >
                      {warehouses.map(wh => (
                        <option key={wh} value={wh}>{wh}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Status Pembayaran</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('Lunas')}
                        className={`py-2 text-xs font-bold rounded-xl transition ${
                          paymentStatus === 'Lunas'
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-500/30"
                            : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border border-transparent"
                        }`}
                      >
                        Lunas
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('Hutang')}
                        className={`py-2 text-xs font-bold rounded-xl transition ${
                          paymentStatus === 'Hutang'
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-500/30"
                            : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border border-transparent"
                        }`}
                      >
                        Hutang
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Catatan Tambahan</label>
                    <textarea
                      placeholder="Keterangan PO, jadwal pengiriman, dll."
                      value={purchaseNotes}
                      onChange={(e) => setPurchaseNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                    />
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-2">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Pembelian</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
                        {formatRupiah(purchaseCart.reduce((sum, item) => sum + item.total_harga, 0))}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      Simpan Transaksi Pembelian
                    </button>
                  </div>
                </form>
              </div>

              {/* Purchase Cart Detail list */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Add Item form card */}
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Pilih Barang Yang Dibeli
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Nama Barang</label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                      >
                        <option value="">-- Pilih Barang --</option>
                        {items.filter(i => i.status === "Aktif").map(item => (
                          <option key={item.id} value={item.id}>{item.nama_barang} ({item.kode_barang})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Satuan Beli</label>
                      <select
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        disabled={!selectedItemId}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white disabled:opacity-50"
                      >
                        <option value="">-- Satuan --</option>
                        {selectedItemId && POSStorage.getUnitsByItem(selectedItemId).map(u => (
                          <option key={u.id} value={u.id}>{u.nama} (Isi: {u.konversi})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Jumlah (Qty)</label>
                      <input
                        type="number"
                        min={1}
                        value={purchaseQty}
                        onChange={(e) => setPurchaseQty(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Harga Beli Satuan (IDR)</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="Harga beli"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddItemToPurchaseCart}
                        className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah ke PO
                      </button>
                    </div>
                  </div>
                </div>

                {/* Purchase list table */}
                <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-800 dark:text-white">Daftar Barang Pembelian ({purchaseCart.length})</span>
                    <span className="text-xs text-zinc-500 font-mono">Gudang Tujuan: {targetWarehouse}</span>
                  </div>

                  {purchaseCart.length === 0 ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                      <Layers className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">Belum ada barang dalam daftar PO. Tambahkan barang di atas.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            <th className="p-4">Barang</th>
                            <th className="p-4">Satuan Beli</th>
                            <th className="p-4 text-center">Qty</th>
                            <th className="p-4 text-right">Harga Beli</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                          {purchaseCart.map((item, index) => (
                            <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition">
                              <td className="p-4 font-bold text-zinc-900 dark:text-white">{item.item_name}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[10px] font-semibold">{item.unit_name}</span>
                              </td>
                              <td className="p-4 text-center font-bold font-mono text-zinc-800 dark:text-zinc-200">{item.qty}</td>
                              <td className="p-4 text-right font-mono text-zinc-700 dark:text-zinc-400">{formatRupiah(item.harga_beli_satuan)}</td>
                              <td className="p-4 text-right font-bold font-mono text-zinc-900 dark:text-white">{formatRupiah(item.total_harga)}</td>
                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemFromPurchaseCart(index)}
                                  className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* LIST OF SUPPLIER PURCHASES */
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800 dark:text-white">Daftar Transaksi PO Supplier ({filteredPurchases.length})</span>
                <span className="text-[10px] text-zinc-400">Total belanja dari supplier dihitung ke HPP rata-rata</span>
              </div>

              {filteredPurchases.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center justify-center">
                  <Truck className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-3" />
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Belum Ada Transaksi Pembelian</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm">Daftar pembelian dari supplier Anda akan tercatat di sini dan menambah stok toko secara otomatis.</p>
                  <button
                    onClick={() => setIsCreatingPurchase(true)}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    Mulai Catat PO Pertama
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <th className="p-4">Tanggal</th>
                        <th className="p-4">No. PO Referensi</th>
                        <th className="p-4">Nama Supplier</th>
                        <th className="p-4">Gudang Tujuan</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Grand Total</th>
                        <th className="p-4 text-center">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                      {filteredPurchases.map((purchase) => {
                        const isExpanded = expandedPurchaseId === purchase.id;
                        return (
                          <React.Fragment key={purchase.id}>
                            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition">
                              <td className="p-4 font-mono text-zinc-500">{formatTanggal(purchase.tanggal)}</td>
                              <td className="p-4 font-bold font-mono text-zinc-900 dark:text-white">{purchase.nomor_referensi}</td>
                              <td className="p-4 font-semibold text-zinc-800 dark:text-zinc-200">{purchase.supplier_name}</td>
                              <td className="p-4">
                                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                  <Warehouse className="w-3.5 h-3.5 text-zinc-400" />
                                  {purchase.gudang_tujuan}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  purchase.status_pembayaran === 'Lunas'
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                                }`}>
                                  {purchase.status_pembayaran}
                                </span>
                              </td>
                              <td className="p-4 text-right font-bold text-zinc-900 dark:text-white">{formatRupiah(purchase.grand_total)}</td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
                                  className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-bold rounded-lg transition"
                                >
                                  {isExpanded ? "Tutup" : "Lihat"}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-zinc-50/50 dark:bg-zinc-900/10">
                                <td colSpan={7} className="p-5 border-t border-zinc-100 dark:border-zinc-800">
                                  <div className="space-y-3 max-w-3xl">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-zinc-800 dark:text-white">Rincian Barang yang Dipesan</span>
                                      {purchase.catatan && (
                                        <span className="text-xs text-zinc-500 italic">Catatan: {purchase.catatan}</span>
                                      )}
                                    </div>
                                    <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800/80 rounded-2xl overflow-hidden">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-zinc-50 dark:bg-zinc-900 text-[10px] font-bold text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                                            <th className="p-3">Nama Barang</th>
                                            <th className="p-3">Satuan</th>
                                            <th className="p-3 text-center">Qty</th>
                                            <th className="p-3 text-right">Harga Satuan</th>
                                            <th className="p-3 text-right">Subtotal</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                          {purchase.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-zinc-50/40">
                                              <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-200">{item.item_name}</td>
                                              <td className="p-3 text-zinc-500">{item.unit_name}</td>
                                              <td className="p-3 text-center font-bold font-mono text-zinc-900 dark:text-white">{item.qty}</td>
                                              <td className="p-3 text-right font-mono text-zinc-600 dark:text-zinc-400">{formatRupiah(item.harga_beli_satuan)}</td>
                                              <td className="p-3 text-right font-bold font-mono text-zinc-900 dark:text-white">{formatRupiah(item.total_harga)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: STOCK OPNAME ======================= */}
      {activeTab === 'opname' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* New Stock Opname Input panel */}
          <div className="lg:col-span-1 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-500" />
              Form Stock Opname
            </h3>

            <form onSubmit={handleSaveStockOpname} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Lokasi Gudang</label>
                <select
                  value={opnameWarehouse}
                  onChange={(e) => setOpnameWarehouse(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                >
                  {warehouses.map(wh => (
                    <option key={wh} value={wh}>{wh}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Barang Yang Dicocokkan</label>
                <select
                  value={opnameItemId}
                  onChange={(e) => setOpnameItemId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white"
                >
                  <option value="">-- Pilih Barang --</option>
                  {items.filter(i => i.status === "Aktif").map(item => (
                    <option key={item.id} value={item.id}>{item.nama_barang} ({item.kode_barang})</option>
                  ))}
                </select>
              </div>

              {opnameItemId && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wide block">Stok Sistem</span>
                    <span className="text-lg font-extrabold font-mono text-zinc-800 dark:text-zinc-200 mt-1 block">
                      {opnameSystemStock} <span className="text-xs font-normal">Pcs</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wide block">Selisih Stok</span>
                    <span className={`text-lg font-extrabold font-mono mt-1 block flex items-center gap-1 ${
                      opnamePhysicalStock - opnameSystemStock > 0 ? "text-emerald-600 dark:text-emerald-400" :
                      opnamePhysicalStock - opnameSystemStock < 0 ? "text-rose-600 dark:text-rose-400" :
                      "text-zinc-500"
                    }`}>
                      {opnamePhysicalStock - opnameSystemStock > 0 ? "+" : ""}
                      {opnamePhysicalStock - opnameSystemStock}
                      {opnamePhysicalStock - opnameSystemStock !== 0 && (
                        opnamePhysicalStock - opnameSystemStock > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Stok Fisik Yang Terlihat</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    disabled={!opnameItemId}
                    value={opnamePhysicalStock}
                    onChange={(e) => setOpnamePhysicalStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white font-bold font-mono disabled:opacity-50"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-zinc-400 uppercase">Satuan Pcs</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block mb-1">Alasan Penyesuaian / Catatan</label>
                <textarea
                  placeholder="Contoh: Barang kadaluarsa dibuang, Koreksi salah hitung"
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  disabled={!opnameItemId}
                  rows={3}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:text-white disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!opnameItemId}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:dark:bg-zinc-900 text-xs font-bold rounded-xl shadow-md transition"
              >
                Simpan Penyesuaian Opname
              </button>
            </form>
          </div>

          {/* List of past Stock Opnames */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 dark:text-white">Riwayat Stock Opname ({filteredOpnames.length})</span>
              <span className="text-[10px] text-zinc-400">Selisih mutasi langsung dicatat ke ledger log mutasi</span>
            </div>

            {filteredOpnames.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <ClipboardList className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-3" />
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Belum Ada Riwayat Opname</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm">Semua riwayat pencocokkan stok fisik barang Anda akan terdaftar rapi di sini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Nama Barang</th>
                      <th className="p-4">Lokasi</th>
                      <th className="p-4 text-center">Stok Sistem</th>
                      <th className="p-4 text-center">Stok Fisik</th>
                      <th className="p-4 text-center">Selisih</th>
                      <th className="p-4">Alasan / Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {filteredOpnames.map((op) => (
                      <tr key={op.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition">
                        <td className="p-4 font-mono text-zinc-400">{formatTanggal(op.tanggal)}</td>
                        <td className="p-4 font-bold text-zinc-900 dark:text-white">{op.item_name}</td>
                        <td className="p-4 text-zinc-600 dark:text-zinc-400">{op.gudang}</td>
                        <td className="p-4 text-center font-mono font-bold text-zinc-600">{op.stok_sistem}</td>
                        <td className="p-4 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">{op.stok_fisik}</td>
                        <td className="p-4 text-center">
                          <span className={`font-mono font-extrabold text-xs px-2 py-0.5 rounded ${
                            op.selisih > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" :
                            op.selisih < 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20" :
                            "bg-zinc-50 text-zinc-500"
                          }`}>
                            {op.selisih > 0 ? "+" : ""}{op.selisih}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-500 max-w-[180px] truncate" title={op.catatan}>{op.catatan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 3: STOCK TRANSACTIONS LEDGER ======================= */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 dark:text-white">Log Mutasi & Arus Stok ({filteredLogs.length})</span>
            <span className="text-[10px] text-zinc-400">Mutasi otomatis dari POS Penjualan, Supplier, dan Opname Manual</span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <History className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-3" />
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Log Mutasi Kosong</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm">Sesuaikan filter pencarian atau mulailah melakukan penjualan/pembelian untuk memicu mutasi stok.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="p-4">Waktu Kejadian</th>
                    <th className="p-4">Nama Barang</th>
                    <th className="p-4">Gudang</th>
                    <th className="p-4">Jenis Transaksi</th>
                    <th className="p-4 text-center">Mutasi Qty</th>
                    <th className="p-4 text-center">Sebelum</th>
                    <th className="p-4 text-center">Sesudah</th>
                    <th className="p-4">Sumber / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  {filteredLogs.map((log) => {
                    const item = items.find(i => i.id === log.item_id);
                    const itemName = item ? item.nama_barang : `Barang ID: ${log.item_id.slice(0, 8)}`;
                    return (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition">
                        <td className="p-4 font-mono text-zinc-400">{formatTanggal(log.created_at)}</td>
                        <td className="p-4 font-bold text-zinc-900 dark:text-white">{itemName}</td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 font-semibold text-zinc-600 dark:text-zinc-400">
                            <Warehouse className="w-3.5 h-3.5 text-zinc-400" />
                            {log.gudang}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            log.tipe_transaksi === 'Penjualan' ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20" :
                            log.tipe_transaksi === 'Pembelian' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" :
                            log.tipe_transaksi === 'Stok Opname' ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20" :
                            "bg-purple-50 text-purple-600 dark:bg-purple-950/20"
                          }`}>
                            {log.tipe_transaksi}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold">
                          <span className={`font-mono text-xs ${
                            log.qty > 0 ? "text-emerald-600" : 
                            log.qty < 0 ? "text-rose-600" : 
                            "text-zinc-500"
                          }`}>
                            {log.qty > 0 ? "+" : ""}{log.qty}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-zinc-500">{log.stok_sebelum}</td>
                        <td className="p-4 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">{log.stok_sesudah}</td>
                        <td className="p-4 text-zinc-500 font-medium max-w-[200px] truncate" title={log.notes}>{log.notes || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
