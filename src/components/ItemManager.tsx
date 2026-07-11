import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Edit2, Trash2, FileSpreadsheet, Download, Upload, Barcode, 
  Sparkles, Layers, Layers2, ShieldAlert, History, Undo, CheckCircle, PackageOpen, HelpCircle,
  RefreshCw
} from "lucide-react";
import * as XLSX from "xlsx";
import { POSStorage } from "../lib/storage";
import { Item, ItemUnit, ItemPrice, ItemStock, ItemSerial, ItemBundle, ItemPackage, ItemHistory } from "../lib/types";

export default function ItemManager() {
  const [activeMainTab, setActiveMainTab] = useState<'katalog' | 'kategori_brand' | 'audit_log'>('katalog');
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterStock, setFilterStock] = useState("Semua");
  const [sortBy, setSortBy] = useState("nama_asc");

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("pos_categories");
    return saved ? JSON.parse(saved) : ["Makanan", "Minyak", "Elektronik", "Peralatan Rumah", "Paket"];
  });

  const [brands, setBrands] = useState<string[]>(() => {
    const saved = localStorage.getItem("pos_brands");
    return saved ? JSON.parse(saved) : ["Indomie", "ABC", "Bimoli", "Samsung", "Asyifa Mart"];
  });

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [auditLogs, setAuditLogs] = useState<ItemHistory[]>([]);

  const [items, setItems] = useState<Item[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);
  
  // Tab within editor modal
  const [activeFormTab, setActiveFormTab] = useState<'umum' | 'satuan' | 'harga' | 'diskon' | 'stok' | 'serial' | 'bundling'>('umum');

  // Multi units state inside modal
  const [modalUnits, setModalUnits] = useState<ItemUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitKonversi, setNewUnitKonversi] = useState(1);
  const [newUnitBarcode, setNewUnitBarcode] = useState("");
  const [newUnitHarga, setNewUnitHarga] = useState(0);

  // Multi harga state inside modal
  const [modalPrices, setModalPrices] = useState<ItemPrice[]>([]);
  const [modalDiscountFormula, setModalDiscountFormula] = useState("");
  const [modalDiscountActive, setModalDiscountActive] = useState(true);
  const [modalDiscountId, setModalDiscountId] = useState<string | null>(null);
  const [newPriceLevel, setNewPriceLevel] = useState<'Umum' | 'Member Silver' | 'Member Gold' | 'Grosir' | 'Reseller' | 'Agen'>("Umum");
  const [newPriceMinQty, setNewPriceMinQty] = useState(1);
  const [newPriceMaxQty, setNewPriceMaxQty] = useState("");
  const [newPriceHarga, setNewPriceHarga] = useState(0);

  // Stock details inside modal
  const [modalStock, setModalStock] = useState<ItemStock>({
    id: "", item_id: "", gudang: "Gudang Utama", stok_tersedia: 0, stok_dipesan: 0,
    stok_minimum: 10, stok_maksimum: 1000, safety_stock: 5, reorder_point: 15, buffer_stock: 5
  });

  // Serials state inside modal
  const [modalSerials, setModalSerials] = useState<ItemSerial[]>([]);
  const [newSerialNum, setNewSerialNum] = useState("");
  const [newSerialLot, setNewSerialLot] = useState("");
  const [newSerialExp, setNewSerialExp] = useState("");

  // Bundles & Packages inside modal
  const [modalBundles, setModalBundles] = useState<ItemBundle[]>([]);
  const [modalPackages, setModalPackages] = useState<{ component_item_id: string; qty: number }[]>([]);
  const [newPackageComponentId, setNewPackageComponentId] = useState("");
  const [newPackageQty, setNewPackageQty] = useState(1);

  // AI Loading & Error
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Barcode generate helper
  const [barcodePreview, setBarcodePreview] = useState<{ code: string; type: string } | null>(null);

  // Load items and audit logs
  useEffect(() => {
    setItems([...POSStorage.getItems()]);
    setAuditLogs([...POSStorage.getHistoryLogs()]);
  }, [showEditModal, activeMainTab]);

  const handleCreateNew = () => {
    const defaultId = "temp-" + Date.now();
    setEditingItem({
      kode_barang: "BRG-" + Math.floor(10000 + Math.random() * 90000),
      nama_barang: "",
      barcode_utama: "",
      kategori: "Makanan",
      tipe_barang: "Barang",
      status: "Aktif",
      foto_produk: "",
      pilihan_harga_jual: "Berdasarkan Satuan",
      harga_dipilih_transaksi: false,
      satuan_dasar: "Pcs",
      menggunakan_harga_pokok_default: false
    });
    setModalUnits([
      {
        id: "base-" + Date.now(),
        item_id: defaultId,
        nama: "Pcs",
        konversi: 1,
        jenis_satuan: "Satuan Dasar",
        poin: 0,
        barcode: "",
        harga_pokok: 0,
        proc_persen: 0,
        harga_jual: 0,
        komisi_sales: 0
      }
    ]);
    setSelectedUnitId(null);
    setModalPrices([]);
    setModalStock({
      id: "", item_id: defaultId, gudang: "Gudang Utama", stok_tersedia: 50, stok_dipesan: 0,
      stok_minimum: 10, stok_maksimum: 1000, safety_stock: 5, reorder_point: 15, buffer_stock: 5
    });
    setModalSerials([]);
    setModalBundles([]);
    setModalPackages([]);
    setModalDiscountFormula("");
    setModalDiscountActive(true);
    setModalDiscountId(null);
    setActiveFormTab('umum');
    setShowEditModal(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem({
      pilihan_harga_jual: "Berdasarkan Satuan",
      harga_dipilih_transaksi: false,
      satuan_dasar: "Pcs",
      menggunakan_harga_pokok_default: false,
      ...item
    });
    
    const loadedUnits = POSStorage.getUnitsByItem(item.id);
    if (loadedUnits.length === 0) {
      setModalUnits([
        {
          id: "base-" + Date.now(),
          item_id: item.id,
          nama: item.satuan_dasar || "Pcs",
          konversi: 1,
          jenis_satuan: "Satuan Dasar",
          poin: 0,
          barcode: item.barcode_utama || "",
          harga_pokok: 0,
          proc_persen: 0,
          harga_jual: 0,
          komisi_sales: 0
        }
      ]);
    } else {
      const formattedUnits = loadedUnits.map((u, idx) => ({
        ...u,
        jenis_satuan: u.jenis_satuan || (u.konversi === 1 || idx === 0 ? "Satuan Dasar" : "Satuan Multi"),
        poin: u.poin || 0,
        harga_pokok: u.harga_pokok || 0,
        proc_persen: u.proc_persen || (u.harga_pokok && u.harga_jual ? parseFloat((((u.harga_jual - u.harga_pokok) / u.harga_pokok) * 100).toFixed(2)) : 0),
        komisi_sales: u.komisi_sales || 0
      }));
      setModalUnits(formattedUnits);
    }
    setSelectedUnitId(null);
    setModalPrices(POSStorage.getPricesByItem(item.id));
    
    const matchedStocks = POSStorage.getStockByItem(item.id);
    if (matchedStocks.length > 0) {
      setModalStock({ ...matchedStocks[0] });
    } else {
      setModalStock({
        id: "", item_id: item.id, gudang: "Gudang Utama", stok_tersedia: 0, stok_dipesan: 0,
        stok_minimum: 10, stok_maksimum: 1000, safety_stock: 5, reorder_point: 15, buffer_stock: 5
      });
    }

    setModalSerials(POSStorage.getSerialsByItem(item.id));
    setModalBundles(POSStorage.getBundlesByItem(item.id));
    
    const components = POSStorage.getPackageComponents(item.id).map(c => ({
      component_item_id: c.component_item_id,
      qty: c.qty
    }));
    setModalPackages(components);

    const existingDiscount = POSStorage.getActiveDiscountForItem(item.id);
    setModalDiscountFormula(existingDiscount?.formula_diskon || "");
    setModalDiscountActive(existingDiscount?.aktif !== false);
    setModalDiscountId(existingDiscount?.id || null);

    setActiveFormTab('umum');
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini beserta seluruh satuannya?")) {
      await POSStorage.deleteItem(id);
      setItems([...POSStorage.getItems()]);
    }
  };

  // AI PRODUCT FIELDS GENERATOR (Gemini server route)
  const handleAiRecommend = async () => {
    if (!editingItem?.nama_barang) {
      alert("Masukkan Nama Barang terlebih dahulu agar AI dapat mendeskripsikannya!");
      return;
    }

    setAiLoading(true);
    setAiError("");

    try {
      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingItem.nama_barang,
          brand: editingItem.brand_merk,
          notes: editingItem.kategori
        })
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil data dari server asisten AI.");
      }

      const data = await response.json();

      setEditingItem(prev => ({
        ...prev,
        kode_barang: data.itemCode || prev?.kode_barang,
        barcode_utama: data.barcode || prev?.barcode_utama,
        kategori: data.category || prev?.kategori,
        nama_cetak_struk: (data.seoTitle || "").slice(0, 25).toUpperCase(),
        nama_pendek: editingItem?.nama_barang?.slice(0, 15),
        foto_produk: prev?.foto_produk || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"
      }));

      // Auto-populate default Pcs unit price
      if (modalUnits.length === 0) {
        setModalUnits([
          {
            id: "temp-pcs",
            item_id: editingItem.id || "",
            nama: "Pcs",
            konversi: 1,
            barcode: data.barcode || "",
            harga_jual: data.recommendedPrice || 10000
          }
        ]);
      }

      // Record suggested HPP in Stock field
      setModalStock(prev => ({
        ...prev,
        stok_minimum: 5
      }));

      // Update HPP
      if (editingItem.id) {
        await POSStorage.updateHpp(editingItem.id, "Average", data.recommendedHpp || 5000);
      }

      alert("AI Berhasil menyusun metadata produk secara otomatis!");
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Gagal menghubungi API AI.");
    } finally {
      setAiLoading(false);
    }
  };

  // DIRECT UNIT GRID CONTROLS (Indonesian POS Standard)
  const handleUnitChange = (id: string, field: keyof ItemUnit, value: any) => {
    setModalUnits(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, [field]: value };
        
        // If we change harga_pokok or proc_persen, recalculate harga_jual
        if (field === "harga_pokok" || field === "proc_persen") {
          const pokok = parseFloat(updated.harga_pokok as any) || 0;
          const proc = parseFloat(updated.proc_persen as any) || 0;
          updated.harga_jual = Math.round(pokok * (1 + proc / 100));
        }
        // If we change harga_jual, recalculate proc_persen
        else if (field === "harga_jual") {
          const pokok = parseFloat(updated.harga_pokok as any) || 0;
          const jual = parseFloat(updated.harga_jual as any) || 0;
          if (pokok > 0) {
            updated.proc_persen = parseFloat((((jual - pokok) / pokok) * 100).toFixed(2));
          } else {
            updated.proc_persen = 0;
          }
        }
        
        // If the first row is modified, sync with satuan_dasar
        if (updated.jenis_satuan === "Satuan Dasar" && field === "nama") {
          setEditingItem(prevItem => prevItem ? { ...prevItem, satuan_dasar: value } : null);
        }
        
        return updated;
      }
      return u;
    }));
  };

  const handleCalculateBaseHpp = () => {
    const baseUnit = modalUnits.find(u => 
      u.jenis_satuan === "Satuan Dasar" || 
      u.konversi === 1 || 
      u.konversi === "1" || 
      parseFloat(u.konversi as any) === 1
    ) || modalUnits[0];

    if (!baseUnit) {
      alert("Satuan dasar tidak ditemukan!");
      return;
    }
    const baseCost = parseFloat(baseUnit.harga_pokok as any) || 0;
    if (baseCost <= 0) {
      alert("Tolong isi Harga Pokok Satuan Dasar terlebih dahulu!");
      return;
    }

    setModalUnits(prev => prev.map(u => {
      if (u.id === baseUnit.id) return u;
      
      const konv = parseFloat(u.konversi as any) || 1;
      const updatedCost = Math.round(baseCost * konv);
      const jual = parseFloat(u.harga_jual as any) || 0;
      const proc = updatedCost > 0 ? parseFloat((((jual - updatedCost) / updatedCost) * 100).toFixed(2)) : 0;
      
      return {
        ...u,
        harga_pokok: updatedCost,
        proc_persen: proc
      };
    }));
    alert("Proporsional Harga Pokok untuk seluruh satuan berhasil dihitung berdasarkan konversi!");
  };

  const handleCalculateConversion = () => {
    const baseUnit = modalUnits.find(u => 
      u.jenis_satuan === "Satuan Dasar" || 
      u.konversi === 1 || 
      u.konversi === "1" || 
      parseFloat(u.konversi as any) === 1
    ) || modalUnits[0];

    if (!baseUnit) {
      alert("Satuan dasar tidak ditemukan!");
      return;
    }
    const baseCost = parseFloat(baseUnit.harga_pokok as any) || 0;
    const baseSell = parseFloat(baseUnit.harga_jual as any) || 0;
    const baseMargin = parseFloat(baseUnit.proc_persen as any) || 0;

    if (baseCost <= 0 && baseSell <= 0) {
      alert("Tolong isi Harga Pokok atau Harga Jual Satuan Dasar terlebih dahulu!");
      return;
    }

    setModalUnits(prev => prev.map(u => {
      if (u.id === baseUnit.id) return u;
      
      const konv = parseFloat(u.konversi as any) || 1;
      const updatedCost = Math.round(baseCost * konv);
      const updatedSell = Math.round(baseSell * konv);
      
      return {
        ...u,
        harga_pokok: updatedCost,
        harga_jual: updatedSell,
        proc_persen: baseMargin
      };
    }));
    alert("Konversi harga berhasil! Seluruh Harga Pokok & Harga Jual Satuan Multi dihitung otomatis berdasarkan kelipatan konversi.");
  };

  const handleAddNewUnitRow = () => {
    const baseUnit = modalUnits.find(u => 
      u.jenis_satuan === "Satuan Dasar" || 
      u.konversi === 1 || 
      u.konversi === "1" || 
      parseFloat(u.konversi as any) === 1
    ) || modalUnits[0];
    const baseCost = baseUnit ? parseFloat(baseUnit.harga_pokok as any) || 0 : 0;
    
    const newRow: ItemUnit = {
      id: "new-u-" + Date.now(),
      item_id: editingItem?.id || "",
      nama: "Dus",
      konversi: 10,
      jenis_satuan: "Satuan Multi",
      poin: 0,
      barcode: "",
      harga_pokok: baseCost * 10,
      proc_persen: 10,
      harga_jual: Math.round(baseCost * 10 * 1.1),
      komisi_sales: 0
    };
    setModalUnits([...modalUnits, newRow]);
    setSelectedUnitId(newRow.id);
  };

  const handleRemoveSelectedUnit = () => {
    if (!selectedUnitId) {
      alert("Silakan pilih baris satuan terlebih dahulu dengan mengklik baris di tabel.");
      return;
    }
    const unitToDelete = modalUnits.find(u => u.id === selectedUnitId);
    if (unitToDelete?.jenis_satuan === "Satuan Dasar") {
      alert("Satuan Dasar tidak boleh dihapus!");
      return;
    }
    setModalUnits(prev => prev.filter(u => u.id !== selectedUnitId));
    setSelectedUnitId(null);
  };

  // ADD CUSTOM PRICE LEVEL
  const addModalPrice = () => {
    const newPrice: ItemPrice = {
      id: "new-p-" + Date.now(),
      item_id: editingItem?.id || "",
      level_pelanggan: newPriceLevel,
      min_qty: parseInt(newPriceMinQty as any) || 1,
      max_qty: newPriceMaxQty ? parseInt(newPriceMaxQty) : undefined,
      harga_jual: parseFloat(newPriceHarga as any) || 0
    };
    setModalPrices([...modalPrices, newPrice]);
    setNewPriceMinQty(1);
    setNewPriceMaxQty("");
    setNewPriceHarga(0);
  };

  const removeModalPrice = (id: string) => {
    setModalPrices(modalPrices.filter(p => p.id !== id));
  };

  // SERIALS CONTROLS
  const addModalSerial = () => {
    if (!newSerialNum) return;
    const newSr: ItemSerial = {
      id: "new-sr-" + Date.now(),
      item_id: editingItem?.id || "",
      gudang: "Gudang Utama",
      serial_number: newSerialNum,
      lot_number: newSerialLot || undefined,
      expired_at: newSerialExp ? new Date(newSerialExp).toISOString() : undefined,
      status: "Tersedia"
    };
    setModalSerials([...modalSerials, newSr]);
    setNewSerialNum("");
    setNewSerialLot("");
    setNewSerialExp("");
  };

  const removeModalSerial = (id: string) => {
    setModalSerials(modalSerials.filter(s => s.id !== id));
  };

  // BUNDLE & PACKAGE INGREDIENTS
  const addPackageComponent = () => {
    if (!newPackageComponentId) return;
    if (modalPackages.some(p => p.component_item_id === newPackageComponentId)) {
      alert("Komponen produk sudah ditambahkan!");
      return;
    }
    setModalPackages([...modalPackages, { component_item_id: newPackageComponentId, qty: newPackageQty }]);
    setNewPackageQty(1);
  };

  const removePackageComponent = (id: string) => {
    setModalPackages(modalPackages.filter(p => p.component_item_id !== id));
  };

  // SAVE CORE ITEM
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.nama_barang) {
      alert("Nama barang wajib diisi!");
      return;
    }

    // Cegah kode barang / barcode ganda antar produk (temuan review #8 —
    // sebelumnya tidak ada validasi sama sekali di sisi client, jadi
    // pemindaian barcode di kasir bisa salah ambil produk pertama yang cocok).
    const isNewItem = !editingItem.id || editingItem.id.startsWith("temp-");
    if (editingItem.kode_barang) {
      const dupKode = items.find(i => i.kode_barang === editingItem!.kode_barang && (isNewItem || i.id !== editingItem!.id));
      if (dupKode) {
        alert(`Kode barang "${editingItem.kode_barang}" sudah dipakai oleh produk lain (${dupKode.nama_barang}). Gunakan kode lain.`);
        return;
      }
    }
    if (editingItem.barcode_utama) {
      const dupBarcode = items.find(i => i.barcode_utama === editingItem!.barcode_utama && (isNewItem || i.id !== editingItem!.id));
      if (dupBarcode) {
        alert(`Barcode "${editingItem.barcode_utama}" sudah dipakai oleh produk lain (${dupBarcode.nama_barang}). Gunakan barcode lain.`);
        return;
      }
    }

    try {
      let savedItem: Item;
      const isNew = !editingItem.id || editingItem.id.startsWith("temp-");

      if (isNew) {
        savedItem = await POSStorage.createItem(editingItem as any);
      } else {
        savedItem = await POSStorage.updateItem(editingItem.id!, editingItem);
      }

      // Update associated tables
      // 1. Units
      // Delete old units first if editing
      if (!isNew) {
        const oldUnits = POSStorage.getUnitsByItem(savedItem.id);
        for (const u of oldUnits) {
          await POSStorage.deleteUnit(u.id);
        }
      }
      // Save new units list
      for (const u of modalUnits) {
        await POSStorage.saveUnit({
          ...u,
          id: u.id.startsWith("new-") || u.id.startsWith("temp-") ? "" : u.id,
          item_id: savedItem.id
        });
      }

      // 2. Prices
      if (!isNew) {
        const oldPrices = POSStorage.getPricesByItem(savedItem.id);
        for (const p of oldPrices) {
          await POSStorage.deletePrice(p.id);
        }
      }
      for (const p of modalPrices) {
        await POSStorage.savePrice({
          ...p,
          id: p.id.startsWith("new-") ? "" : p.id,
          item_id: savedItem.id
        });
      }

      // 3. Stock Limits
      await POSStorage.saveStock({
        ...modalStock,
        id: modalStock.id || "",
        item_id: savedItem.id
      });

      // 4. Serials
      if (!isNew) {
        // Simple overwrite sync for serials
        // Usually managed, we can push additions
      }
      for (const s of modalSerials) {
        if (s.id.startsWith("new-")) {
          await POSStorage.addSerial({
            item_id: savedItem.id,
            gudang: s.gudang,
            serial_number: s.serial_number,
            lot_number: s.lot_number,
            batch_number: s.batch_number,
            expired_at: s.expired_at,
            status: "Tersedia"
          });
        }
      }

      // 5. Package components
      if (savedItem.kategori === "Paket") {
        await POSStorage.savePackageComponents(savedItem.id, modalPackages);
      }

      // 6. Diskon bertingkat per-barang (generik untuk semua produk,
      // menggantikan logika lama yang hardcode 1 produk demo — temuan #4)
      const trimmedFormula = modalDiscountFormula.trim();
      if (trimmedFormula) {
        await POSStorage.saveDiscount({
          ...(modalDiscountId ? { id: modalDiscountId } : {}),
          item_id: savedItem.id,
          formula_diskon: trimmedFormula,
          nominal_diskon: 0,
          aktif: modalDiscountActive
        } as any);
      } else if (modalDiscountId) {
        // Formula dikosongkan -> hapus diskon yang sudah ada
        await POSStorage.deleteDiscount(modalDiscountId);
      }

      // Refresh list
      setItems([...POSStorage.getItems()]);
      setShowEditModal(false);
      alert("Produk berhasil disimpan!");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan produk.");
    }
  };

  // EXPORT UTILITIES
  const triggerExport = (format: 'json' | 'csv' | 'xlsx') => {
    const catalog = POSStorage.getItems();

    if (format === 'xlsx') {
      const rows = catalog.map(item => {
        const units = POSStorage.getUnitsByItem(item.id);
        const pcsUnit = units.find(u => u.nama.toLowerCase() === "pcs") || units[0];
        const stockEntries = POSStorage.getStockByItem(item.id);
        const mainStock = stockEntries.find(s => s.gudang === "Gudang Utama") || stockEntries[0];
        
        return {
          "ID Produk": item.id,
          "Kode Produk": item.kode_barang,
          "Barcode Utama": item.barcode_utama || "",
          "Nama Produk": item.nama_barang,
          "Nama Pendek": item.nama_pendek || "",
          "Brand / Merk": item.brand_merk || "",
          "Kategori": item.kategori || "",
          "Tipe Barang": item.tipe_barang || "Barang",
          "Rak": item.rak || "",
          "Harga Jual (Pcs)": pcsUnit ? pcsUnit.harga_jual : 0,
          "Stok Tersedia": mainStock ? mainStock.stok_tersedia : 0,
          "Status": item.status || "Aktif"
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Katalog Produk");
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "POS_Katalog_Ekspor.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    let dataStr = "";
    let mimeType = "";
    let fileName = "";

    if (format === 'json') {
      dataStr = JSON.stringify(catalog, null, 2);
      mimeType = "application/json";
      fileName = "POS_Katalog_Ekspor.json";
    } else {
      // Simple CSV
      const headers = "id,kode_barang,barcode_utama,nama_barang,brand_merk,kategori,status\n";
      const rows = catalog.map(i => `"${i.id}","${i.kode_barang}","${i.barcode_utama}","${i.nama_barang}","${i.brand_merk || ''}","${i.kategori}","${i.status}"`).join("\n");
      dataStr = headers + rows;
      mimeType = "text/csv";
      fileName = "POS_Katalog_Ekspor.csv";
    }

    const blob = new Blob([dataStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt: any) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              await POSStorage.createItem(item);
            }
            setItems([...POSStorage.getItems()]);
            alert(`Berhasil mengimpor ${parsed.length} produk ke dalam database.`);
          }
        } catch (e) {
          alert("Gagal membaca file JSON.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      {
        "ID Produk": "itm-sample-1",
        "Kode Produk": "BRG-89912",
        "Barcode Utama": "8991234567890",
        "Nama Produk": "Minyak Goreng Bimoli 2L",
        "Nama Pendek": "Bimoli 2L",
        "Brand / Merk": "Bimoli",
        "Kategori": "Sembako",
        "Tipe Barang": "Barang",
        "Rak": "A1-Sembako",
        "Harga Jual (Pcs)": 35000,
        "Stok Tersedia": 150,
        "Status": "Aktif"
      },
      {
        "ID Produk": "itm-sample-2",
        "Kode Produk": "BRG-89915",
        "Barcode Utama": "8991234567891",
        "Nama Produk": "Indomie Goreng Original 85g",
        "Nama Pendek": "Indomie Goreng",
        "Brand / Merk": "Indofood",
        "Kategori": "Mie Instan",
        "Tipe Barang": "Barang",
        "Rak": "B2-Mie",
        "Harga Jual (Pcs)": 3100,
        "Stok Tersedia": 500,
        "Status": "Aktif"
      },
      {
        "ID Produk": "",
        "Kode Produk": "",
        "Barcode Utama": "8991234567892",
        "Nama Produk": "Susu UHT Ultra Milk 1L",
        "Nama Pendek": "Ultra Milk 1L",
        "Brand / Merk": "Ultra Jaya",
        "Kategori": "Minuman",
        "Tipe Barang": "Barang",
        "Rak": "C3-Susu",
        "Harga Jual (Pcs)": 18500,
        "Stok Tersedia": 120,
        "Status": "Aktif"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Katalog");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template_Import_Katalog_POS.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerExcelImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx, .xls";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (evt: any) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
          
          if (jsonData.length === 0) {
            alert("File Excel kosong atau format tidak sesuai!");
            return;
          }
          
          let importCount = 0;
          for (const row of jsonData) {
            // Check required fields
            const nama_barang = row["Nama Produk"] || row["nama_barang"] || row["Nama"];
            if (!nama_barang) continue;
            
            const id = row["ID Produk"] || row["id"] || ("item-" + Date.now() + "-" + Math.floor(Math.random() * 1000));
            const kode_barang = row["Kode Produk"] || row["kode_barang"] || ("BRG-" + Math.floor(10000 + Math.random() * 90000));
            const barcode_utama = String(row["Barcode Utama"] || row["barcode_utama"] || row["Barcode"] || "");
            const brand_merk = row["Brand / Merk"] || row["brand_merk"] || row["Brand"] || "";
            const kategori = row["Kategori"] || row["kategori"] || "Makanan";
            const tipe_barang = row["Tipe Barang"] || row["tipe_barang"] || "Barang";
            const rak = row["Rak"] || row["rak"] || "";
            const status = row["Status"] || row["status"] || "Aktif";
            const price = parseFloat(row["Harga Jual (Pcs)"] || row["harga_jual"] || row["Harga"] || 0);
            const stockQty = parseFloat(row["Stok Tersedia"] || row["stok_tersedia"] || row["Stok"] || 0);
            
            const newItem: Item = {
              id,
              kode_barang,
              barcode_utama,
              nama_barang,
              nama_pendek: row["Nama Pendek"] || row["nama_pendek"] || nama_barang.slice(0, 15),
              nama_cetak_struk: nama_barang.slice(0, 25).toUpperCase(),
              brand_merk,
              kategori,
              tipe_barang,
              rak,
              status,
              foto_produk: row["foto_produk"] || ""
            };
            
            // Save Item
            await POSStorage.createItem(newItem);
            
            // Create corresponding default "Pcs" unit
            const defaultUnit: ItemUnit = {
              id: "unit-" + id + "-pcs",
              item_id: id,
              nama: "Pcs",
              konversi: 1,
              barcode: barcode_utama,
              harga_jual: price
            };
            await POSStorage.saveUnit(defaultUnit);
            
            // Create stock record
            const defaultStock: ItemStock = {
              id: "stock-" + id,
              item_id: id,
              gudang: "Gudang Utama",
              stok_tersedia: stockQty,
              stok_dipesan: 0,
              stok_minimum: 5,
              stok_maksimum: 1000,
              safety_stock: 2,
              reorder_point: 10,
              buffer_stock: 2
            };
            await POSStorage.saveStock(defaultStock);
            
            importCount++;
          }
          
          setItems([...POSStorage.getItems()]);
          alert(`Berhasil mengimpor ${importCount} produk dari Excel ke dalam database.`);
        } catch (e) {
          console.error(e);
          alert("Gagal membaca file Excel. Pastikan format kolom sesuai.");
        }
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  };

  // Barcode Render Panel
  const showBarcodeLabel = (item: Item, type: 'EAN13' | 'Code128' | 'QR') => {
    setBarcodePreview({ code: item.barcode_utama || item.kode_barang, type });
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const totalProductsCount = items.length;
  const totalStockUnit = items.reduce((sum, item) => {
    if (item.kategori === "Paket") {
      return sum + POSStorage.calculatePackageStock(item.id);
    }
    const stocks = POSStorage.getStockByItem(item.id);
    return sum + stocks.reduce((sSum, s) => sSum + s.stok_tersedia, 0);
  }, 0);

  const criticalItemsCount = items.filter(item => {
    const totalStock = item.kategori === "Paket"
      ? POSStorage.calculatePackageStock(item.id)
      : POSStorage.getStockByItem(item.id).reduce((sum, s) => sum + s.stok_tersedia, 0);
    const minStock = POSStorage.getStockByItem(item.id)[0]?.stok_minimum ?? 10;
    return totalStock <= minStock;
  }).length;

  const totalAssetValue = items.reduce((sum, item) => {
    const hppVal = POSStorage.getHpp(item.id)?.nilai_hpp ?? 0;
    const totalStock = item.kategori === "Paket"
      ? POSStorage.calculatePackageStock(item.id)
      : POSStorage.getStockByItem(item.id).reduce((sSum, s) => sSum + s.stok_tersedia, 0);
    return sum + (totalStock * hppVal);
  }, 0);

  const filteredAndSortedItems = items
    .filter(item => {
      // Search Query
      const q = searchQuery.toLowerCase();
      const matchesSearch = (
        item.nama_barang.toLowerCase().includes(q) ||
        item.kode_barang.toLowerCase().includes(q) ||
        (item.barcode_utama && item.barcode_utama.includes(q))
      );

      // Category filter
      const matchesCategory = filterCategory === "Semua" || item.kategori === filterCategory;

      // Status filter
      const matchesStatus = filterStatus === "Semua" || item.status === filterStatus;

      // Stock status filter
      const stockEntries = POSStorage.getStockByItem(item.id);
      const totalStock = item.kategori === "Paket"
        ? POSStorage.calculatePackageStock(item.id)
        : stockEntries.reduce((sum, s) => sum + s.stok_tersedia, 0);
      const minStock = stockEntries[0]?.stok_minimum ?? 10;

      let matchesStock = true;
      if (filterStock === "Hampir Habis") {
        matchesStock = totalStock <= minStock;
      } else if (filterStock === "Habis") {
        matchesStock = totalStock === 0;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    })
    .sort((a, b) => {
      // Sorting
      if (sortBy === "nama_asc") {
        return a.nama_barang.localeCompare(b.nama_barang);
      } else if (sortBy === "nama_desc") {
        return b.nama_barang.localeCompare(a.nama_barang);
      } else if (sortBy === "kode_asc") {
        return a.kode_barang.localeCompare(b.kode_barang);
      } else if (sortBy === "stok_asc" || sortBy === "stok_desc") {
        const stockA = a.kategori === "Paket"
          ? POSStorage.calculatePackageStock(a.id)
          : POSStorage.getStockByItem(a.id).reduce((sum, s) => sum + s.stok_tersedia, 0);
        const stockB = b.kategori === "Paket"
          ? POSStorage.calculatePackageStock(b.id)
          : POSStorage.getStockByItem(b.id).reduce((sum, s) => sum + s.stok_tersedia, 0);
        return sortBy === "stok_asc" ? stockA - stockB : stockB - stockA;
      } else if (sortBy === "harga_asc" || sortBy === "harga_desc") {
        const priceA = POSStorage.getUnitsByItem(a.id)[0]?.harga_jual ?? 0;
        const priceB = POSStorage.getUnitsByItem(b.id)[0]?.harga_jual ?? 0;
        return sortBy === "harga_asc" ? priceA - priceB : priceB - priceA;
      }
      return 0;
    });

  const saveCategories = (list: string[]) => {
    setCategories(list);
    localStorage.setItem("pos_categories", JSON.stringify(list));
  };

  const saveBrands = (list: string[]) => {
    setBrands(list);
    localStorage.setItem("pos_brands", JSON.stringify(list));
  };

  return (
    <div className="space-y-6" id="pos-item-manager">
      
      {/* 1. BENTO INVENTORY STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ragam */}
        <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-800/80 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Ragam Produk</span>
            <span className="text-lg font-extrabold text-zinc-50 font-mono">{totalProductsCount}</span>
          </div>
        </div>

        {/* Total Stok Unit */}
        <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-800/80 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Layers2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Total Persediaan</span>
            <span className="text-lg font-extrabold text-zinc-50 font-mono">{totalStockUnit} <span className="text-xs font-sans text-zinc-500">Pcs</span></span>
          </div>
        </div>

        {/* Hampir Habis */}
        <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-800/80 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Hampir Habis</span>
            <span className={`text-lg font-extrabold font-mono ${criticalItemsCount > 0 ? "text-rose-500" : "text-zinc-50"}`}>{criticalItemsCount} <span className="text-xs font-sans text-zinc-500">Item</span></span>
          </div>
        </div>

        {/* Nilai Aset */}
        <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-800/80 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Nilai Aset (HPP)</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">{formatRupiah(totalAssetValue)}</span>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC MAIN TAB SELECTOR */}
      <div className="flex border-b border-zinc-200/50 dark:border-zinc-800 pb-2 gap-2">
        <button
          onClick={() => setActiveMainTab('katalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'katalog'
              ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
          }`}
        >
          <Layers className="w-4 h-4" /> Katalog Produk
        </button>
        <button
          onClick={() => setActiveMainTab('kategori_brand')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'kategori_brand'
              ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
          }`}
        >
          <Layers2 className="w-4 h-4" /> Kelola Kategori & Brand
        </button>
        <button
          onClick={() => setActiveMainTab('audit_log')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'audit_log'
              ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
          }`}
        >
          <History className="w-4 h-4" /> Log Audit & Pemulihan
        </button>
      </div>

      {/* TAB SUB-VIEWS */}

      {/* VIEW A: KATALOG PRODUK */}
      {activeMainTab === 'katalog' && (
        <div className="space-y-6">
          {/* Header & Advanced Filter Panel */}
          <div className="flex flex-col gap-4 bg-white/40 dark:bg-zinc-900/40 p-5 rounded-3xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, kode, atau barcode..."
                  className="w-full pl-10 pr-4 py-2 bg-white/80 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={downloadExcelTemplate}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Template Excel
                </button>

                <button 
                  onClick={triggerExcelImport}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Impor Excel
                </button>

                <button 
                  onClick={() => triggerExport('xlsx')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Ekspor Excel
                </button>

                <button 
                  onClick={handleCreateNew}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-500/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" /> Tambah Produk
                </button>
              </div>
            </div>

            {/* Advanced Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
              {/* Category Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Kategori</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full p-2 bg-white/70 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Semua">Semua Kategori</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status Produk</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 bg-white/70 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Non Aktif">Non Aktif</option>
                </select>
              </div>

              {/* Stock Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Kondisi Stok</label>
                <select
                  value={filterStock}
                  onChange={(e) => setFilterStock(e.target.value)}
                  className="w-full p-2 bg-white/70 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Semua">Semua Kondisi</option>
                  <option value="Hampir Habis">Stok Hampir Habis</option>
                  <option value="Habis">Stok Habis</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Urutkan Berdasarkan</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 bg-white/70 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="nama_asc">Nama Produk (A - Z)</option>
                  <option value="nama_desc">Nama Produk (Z - A)</option>
                  <option value="kode_asc">Kode Produk</option>
                  <option value="stok_asc">Stok Terendah</option>
                  <option value="stok_desc">Stok Tertinggi</option>
                  <option value="harga_asc">Harga Jual Terendah</option>
                  <option value="harga_desc">Harga Jual Tertinggi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Grid Product Catalog */}
          <div className="bg-white/60 dark:bg-zinc-900/60 rounded-3xl border border-white/40 dark:border-zinc-800/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/70 dark:bg-zinc-950/40 text-zinc-500 font-semibold border-b border-zinc-100 dark:border-zinc-850">
                    <th className="p-4">Info Produk</th>
                    <th className="p-4">Kode & Barcode</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Multi-Satuan</th>
                    <th className="p-4">Stok (Gudang)</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {filteredAndSortedItems.map((item) => {
                    const units = POSStorage.getUnitsByItem(item.id);
                    const stockEntries = POSStorage.getStockByItem(item.id);
                    const totalStock = item.kategori === "Paket"
                      ? POSStorage.calculatePackageStock(item.id)
                      : stockEntries.reduce((sum, s) => sum + s.stok_tersedia, 0);

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                        {/* Info */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.foto_produk || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80"} 
                              alt={item.nama_barang}
                              className="w-10 h-10 rounded-lg object-cover bg-zinc-100"
                            />
                            <div>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{item.nama_barang}</span>
                              <span className="text-[10px] text-zinc-400 block">{item.brand_merk || "No Brand"}</span>
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="p-4 font-mono text-[10px] space-y-0.5">
                          <div className="text-zinc-600 dark:text-zinc-300">Code: {item.kode_barang}</div>
                          <div className="text-zinc-400 flex items-center gap-1">
                            <Barcode className="w-3.5 h-3.5 text-zinc-400" /> {item.barcode_utama}
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md font-semibold">
                            {item.kategori}
                          </span>
                        </td>

                        {/* Units list */}
                        <td className="p-4 space-y-1">
                          <div className="flex flex-wrap gap-1.5">
                            {units.map(u => (
                              <span key={u.id} className="text-[10px] bg-amber-500/10 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-bold border border-amber-500/10">
                                {u.nama} ({formatRupiah(u.harga_jual)})
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className={`font-extrabold ${totalStock <= (stockEntries[0]?.stok_minimum || 10) ? "text-red-500" : "text-emerald-500"}`}>
                              {totalStock} Pcs
                            </span>
                            <span className="text-[10px] text-zinc-400 block">Gudang Default</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => showBarcodeLabel(item, 'EAN13')}
                              title="Generate Thermal Barcode"
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                            >
                              <Barcode className="w-4 h-4" />
                            </button>

                            <button 
                              onClick={() => handleEdit(item)}
                              title="Edit Product"
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button 
                              onClick={() => handleDelete(item.id)}
                              title="Hapus Product"
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAndSortedItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400 italic">Produk tidak ditemukan atau katalog masih kosong.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: KATEGORI & BRAND */}
      {activeMainTab === 'kategori_brand' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kelola Kategori */}
          <div className="bg-white/60 dark:bg-zinc-900/60 rounded-3xl border border-white/40 dark:border-zinc-800/50 p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" /> Kelola Kategori Produk
            </h3>
            <p className="text-xs text-zinc-400">Tambah atau hapus kategori barang yang tersedia di toko Anda.</p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="flex-1 px-3 py-2 bg-white/80 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50 font-semibold"
              />
              <button
                onClick={() => {
                  if (!newCategoryName.trim()) return;
                  if (categories.includes(newCategoryName.trim())) {
                    alert("Kategori sudah terdaftar!");
                    return;
                  }
                  const updated = [...categories, newCategoryName.trim()];
                  saveCategories(updated);
                  setNewCategoryName("");
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tambah
              </button>
            </div>

            <div className="divide-y divide-zinc-150 dark:divide-zinc-850 border border-zinc-250 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-3 bg-white/80 dark:bg-zinc-900/40 text-xs">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{cat}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus kategori "${cat}"? Produk dengan kategori ini tidak akan terhapus, tetapi disarankan mengubah kategori produk tersebut.`)) {
                        const updated = categories.filter(c => c !== cat);
                        saveCategories(updated);
                      }
                    }}
                    className="text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Kelola Brand */}
          <div className="bg-white/60 dark:bg-zinc-900/60 rounded-3xl border border-white/40 dark:border-zinc-800/50 p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Kelola Brand / Merk
            </h3>
            <p className="text-xs text-zinc-400">Tambah atau hapus merk/brand barang dagangan Anda.</p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Nama merk/brand baru..."
                className="flex-1 px-3 py-2 bg-white/80 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50 font-semibold"
              />
              <button
                onClick={() => {
                  if (!newBrandName.trim()) return;
                  if (brands.includes(newBrandName.trim())) {
                    alert("Merk sudah terdaftar!");
                    return;
                  }
                  const updated = [...brands, newBrandName.trim()];
                  saveBrands(updated);
                  setNewBrandName("");
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tambah
              </button>
            </div>

            <div className="divide-y divide-zinc-150 dark:divide-zinc-850 border border-zinc-250 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center justify-between p-3 bg-white/80 dark:bg-zinc-900/40 text-xs">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{brand}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus merk "${brand}"?`)) {
                        const updated = brands.filter(b => b !== brand);
                        saveBrands(updated);
                      }
                    }}
                    className="text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: LOG AUDIT & PEMULIHAN */}
      {activeMainTab === 'audit_log' && (
        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-3xl border border-white/40 dark:border-zinc-800/50 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" /> Log Audit & Riwayat Perubahan Produk
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Sistem POS Asyifa melacak secara otomatis penambahan, modifikasi, dan penghapusan produk secara real-time.</p>
            </div>
            <button
              onClick={() => {
                setAuditLogs([...POSStorage.getHistoryLogs()]);
                alert("Log berhasil diperbarui!");
              }}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Segarkan Log
            </button>
          </div>

          <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-800 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/70 dark:bg-zinc-950/40 text-zinc-500 font-bold border-b border-zinc-100 dark:border-zinc-800">
                  <th className="p-3">Waktu</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Aksi</th>
                  <th className="p-3">ID / Nama Produk</th>
                  <th className="p-3">Detail Perubahan</th>
                  <th className="p-3 text-right">Aksi Pemulihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-mono text-[11px]">
                {auditLogs.map((log) => {
                  let badgeColor = "bg-zinc-100 text-zinc-700";
                  if (log.action === "CREATE") badgeColor = "bg-emerald-500/10 text-emerald-600";
                  if (log.action === "UPDATE") badgeColor = "bg-amber-500/10 text-amber-600";
                  if (log.action === "DELETE") badgeColor = "bg-rose-500/10 text-rose-600";
                  if (log.action === "ROLLBACK") badgeColor = "bg-indigo-500/10 text-indigo-600";

                  let detailStr = "";
                  try {
                    const parsed = JSON.parse(log.changes_json);
                    if (log.action === "CREATE") {
                      detailStr = `Produk Baru: "${parsed.nama_barang}" (${parsed.kode_barang})`;
                    } else if (log.action === "UPDATE") {
                      const oldN = parsed.old?.nama_barang || "";
                      const updatedN = parsed.updated?.nama_barang || "";
                      detailStr = oldN === updatedN ? `Update metadata produk "${updatedN}"` : `Ubah nama "${oldN}" -> "${updatedN}"`;
                    } else if (log.action === "DELETE") {
                      detailStr = `Hapus produk "${parsed.nama_barang}" (${parsed.kode_barang})`;
                    } else {
                      detailStr = log.changes_json;
                    }
                  } catch (e) {
                    detailStr = log.changes_json;
                  }

                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                      <td className="p-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 font-bold text-zinc-700 dark:text-zinc-300">
                        {log.user_name}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${badgeColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400 font-sans truncate max-w-[150px]" title={log.item_id}>
                        {log.item_id}
                      </td>
                      <td className="p-3 text-zinc-700 dark:text-zinc-300 font-sans max-w-xs truncate" title={detailStr}>
                        {detailStr}
                      </td>
                      <td className="p-3 text-right">
                        {(log.action === "CREATE" || log.action === "UPDATE") ? (
                          <button
                            onClick={async () => {
                              if (confirm(`Apakah Anda yakin ingin melakukan Rollback/Urungkan aksi ini? Ini akan memulihkan data produk ke kondisi sebelum aksi dilakukan.`)) {
                                const ok = await POSStorage.rollbackHistory(log.id);
                                if (ok) {
                                  alert("Rollback berhasil dilakukan!");
                                  setItems([...POSStorage.getItems()]);
                                  setAuditLogs([...POSStorage.getHistoryLogs()]);
                                } else {
                                  alert("Gagal melakukan rollback. Kemungkinan produk sudah dihapus atau tidak kompatibel.");
                                }
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-md text-[10px] font-bold cursor-pointer transition-all"
                          >
                            <Undo className="w-3 h-3" /> Urungkan (Rollback)
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-600 italic">Tidak dapat diurungkan</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-zinc-400 italic">Belum ada riwayat aktivitas log audit.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL-FEATURED EDIT/ADD PRODUCT MODAL */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" /> {editingItem.id && !editingItem.id.startsWith("temp-") ? "Ubah Detail Produk" : "Tambah Produk Baru"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Konfigurasikan detail multi-satuan, harga customer, and stok gudang.</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* AI Assistant Button Row */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400 block">Gunakan AI Assistant (Gemini API)</span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Tulis Nama Barang & Brand di tab Umum, lalu klik "Generate AI" untuk menyusun seluruh form data secara instan!</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleAiRecommend}
                disabled={aiLoading}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>Menganalisis...</>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Generate AI
                  </>
                )}
              </button>
            </div>

            {/* Tabs Selector within form */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4 overflow-x-auto gap-1">
              {[
                { id: 'umum', label: 'Data Umum' },
                { id: 'satuan', label: 'Multi Satuan' },
                { id: 'harga', label: 'Multi Harga Jual' },
                { id: 'diskon', label: 'Diskon Bertingkat' },
                { id: 'stok', label: 'Stok Gudang' },
                { id: 'serial', label: 'Serial / Lot Number' },
                { id: 'bundling', label: 'Paket / Bundling' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveFormTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeFormTab === t.id 
                      ? "bg-amber-500 text-zinc-950 font-bold" 
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSaveAll} className="space-y-4">
              
              {/* TAB 1: DATA UMUM */}
              {activeFormTab === 'umum' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Kode Barang *</label>
                    <input 
                      type="text"
                      value={editingItem.kode_barang || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, kode_barang: e.target.value })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50 font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Barcode Utama</label>
                    <input 
                      type="text"
                      value={editingItem.barcode_utama || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, barcode_utama: e.target.value })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Nama Barang *</label>
                    <input 
                      type="text"
                      value={editingItem.nama_barang || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, nama_barang: e.target.value })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50 font-semibold"
                      placeholder="Masukkan nama produk..."
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Brand / Merk</label>
                    <select 
                      value={editingItem.brand_merk || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, brand_merk: e.target.value })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50 cursor-pointer"
                    >
                      <option value="">-- Pilih Brand / Tanpa Merk --</option>
                      {brands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Kategori</label>
                    <select 
                      value={editingItem.kategori || (categories[0] || "Makanan")}
                      onChange={(e) => setEditingItem({ ...editingItem, kategori: e.target.value })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50 cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Foto URL Produk</label>
                    <input 
                      type="text"
                      value={editingItem.foto_produk || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, foto_produk: e.target.value })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50"
                      placeholder="Link URL foto..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Rak Penyimpanan</label>
                    <input 
                      type="text"
                      value={editingItem.rak || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, rak: e.target.value })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50"
                      placeholder="e.g. A-01, B-03..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Status</label>
                    <select 
                      value={editingItem.status || "Aktif"}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50 cursor-pointer"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Non Aktif">Non Aktif</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: MULTI SATUAN */}
              {activeFormTab === 'satuan' && (
                <div className="space-y-4">
                  {/* Top settings (Radio buttons, Checkboxes, Satuan Dasar select) */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl space-y-4 text-xs">
                    
                    {/* Pilihan Harga Jual */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300 min-w-[120px]">Pilihan Harga Jual :</span>
                      <div className="flex flex-wrap items-center gap-4">
                        {[
                          { id: 'Satu Harga', label: 'Satu Harga' },
                          { id: 'Berdasarkan Satuan', label: 'Berdasarkan Satuan' },
                          { id: 'Berdasar Level Harga', label: 'Berdasar Level Harga' },
                          { id: 'Berdasarkan Jumlah', label: 'Berdasarkan Jumlah' }
                        ].map((opt) => (
                          <label key={opt.id} className="flex items-center gap-1.5 cursor-pointer font-semibold text-zinc-600 dark:text-zinc-300">
                            <input 
                              type="radio"
                              name="pilihan_harga_jual"
                              value={opt.id}
                              checked={(editingItem?.pilihan_harga_jual || "Berdasarkan Satuan") === opt.id}
                              onChange={(e) => setEditingItem({ ...editingItem, pilihan_harga_jual: e.target.value as any })}
                              className="accent-amber-500 cursor-pointer h-3.5 w-3.5"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Flexible selection during transactions */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300 min-w-[120px]">Flexible :</span>
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-zinc-600 dark:text-zinc-300">
                        <input 
                          type="checkbox"
                          checked={editingItem?.harga_dipilih_transaksi || false}
                          onChange={(e) => setEditingItem({ ...editingItem, harga_dipilih_transaksi: e.target.checked })}
                          className="accent-amber-500 rounded cursor-pointer h-3.5 w-3.5"
                        />
                        Harga Jual di pilih saat transaksi
                      </label>
                    </div>

                    {/* Satuan Dasar Select + Warning */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300 min-w-[120px]">Satuan Dasar :</span>
                        <select
                          value={editingItem?.satuan_dasar || "Pcs"}
                          onChange={(e) => {
                            const newBase = e.target.value;
                            setEditingItem({ ...editingItem, satuan_dasar: newBase });
                            // Update first unit name to sync
                            setModalUnits(prev => {
                              if (prev.length === 0) return prev;
                              return prev.map((u, idx) => idx === 0 ? { ...u, nama: newBase } : u);
                            });
                          }}
                          className="py-1.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        >
                          {["Pcs", "Dus", "Pak", "Bks", "Crt", "Lusin", "Kg", "Gr", "Liter", "Box", "Botol", "Sachet"].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      
                      <p className="text-[10px] text-red-500 dark:text-red-400 font-semibold leading-normal">
                        Disarankan untuk tidak mengubah satuan jika sudah terdapat transaksi yang berhubungan dengan item ini.
                      </p>
                    </div>

                  </div>

                  {/* Main Interactive Table Grid */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-inner bg-white dark:bg-zinc-950">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-extrabold border-b border-zinc-200 dark:border-zinc-800">
                            <th className="p-2 w-6 text-center border-r border-zinc-200 dark:border-zinc-800 text-[9px] text-zinc-400 font-mono select-none"></th>
                            <th className="p-2 min-w-[90px] border-r border-zinc-200 dark:border-zinc-800 text-center">Satuan</th>
                            <th className="p-2 min-w-[100px] border-r border-zinc-200 dark:border-zinc-800 text-center">Jns Satuan</th>
                            <th className="p-2 min-w-[70px] border-r border-zinc-200 dark:border-zinc-800 text-center">Konversi</th>
                            <th className="p-2 min-w-[60px] border-r border-zinc-200 dark:border-zinc-800 text-center">Poin</th>
                            <th className="p-2 min-w-[130px] border-r border-zinc-200 dark:border-zinc-800 text-center">Barcode</th>
                            <th className="p-2 min-w-[100px] border-r border-zinc-200 dark:border-zinc-800 text-center">Harga Pokok</th>
                            <th className="p-2 min-w-[70px] border-r border-zinc-200 dark:border-zinc-800 text-center">Proc (%)</th>
                            <th className="p-2 min-w-[110px] border-r border-zinc-200 dark:border-zinc-800 text-center">Harga Jual</th>
                            <th className="p-2 min-w-[90px] text-center">Komisi Sales</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                          {modalUnits.map((u, idx) => {
                            const isSelected = selectedUnitId === u.id;
                            const isBaseRow = u.jenis_satuan === "Satuan Dasar" || u.konversi === 1 || u.konversi === "1" || parseFloat(u.konversi as any) === 1 || idx === 0;
                            
                            return (
                              <tr 
                                key={u.id} 
                                onClick={() => setSelectedUnitId(u.id)}
                                className={`transition-colors cursor-pointer select-none ${
                                  isSelected 
                                    ? "bg-amber-500/10 dark:bg-amber-500/5 hover:bg-amber-500/15" 
                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                                }`}
                              >
                                {/* Row Selector Margin */}
                                <td className="p-1 text-center font-bold border-r border-zinc-200 dark:border-zinc-800 text-amber-500 text-[10px] bg-zinc-50/50 dark:bg-zinc-900/20 select-none">
                                  {isSelected ? "▶" : ""}
                                </td>

                                {/* Satuan name select dropdown */}
                                <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                                  <select
                                    value={u.nama}
                                    onChange={(e) => handleUnitChange(u.id, "nama", e.target.value)}
                                    className="w-full py-1 px-1.5 bg-transparent dark:bg-transparent border border-zinc-200 focus:border-amber-500 dark:border-zinc-800 rounded font-semibold text-xs focus:outline-none"
                                  >
                                    {["Pcs", "Dus", "Pak", "Bks", "Crt", "Lusin", "Kg", "Gr", "Liter", "Box", "Botol", "Sachet"].map(option => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* Jenis Satuan */}
                                <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                                  <input 
                                    type="text"
                                    value={isBaseRow ? "Satuan Dasar" : "Satuan Multi"}
                                    readOnly
                                    className="w-full py-1 px-1.5 bg-zinc-100/70 dark:bg-zinc-900/60 text-zinc-500 border border-transparent rounded text-xs text-center font-bold"
                                  />
                                </td>

                                {/* Konversi */}
                                <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                                  <input 
                                    type="number"
                                    disabled={isBaseRow}
                                    value={u.konversi}
                                    onChange={(e) => handleUnitChange(u.id, "konversi", parseFloat(e.target.value) || 1)}
                                    className={`w-full py-1 px-1.5 border rounded text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                      isBaseRow 
                                        ? "bg-zinc-100/75 dark:bg-zinc-900/50 text-zinc-400 border-transparent" 
                                        : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
                                    }`}
                                  />
                                </td>

                                {/* Poin */}
                                <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                                  <input 
                                    type="number"
                                    value={u.poin || 0}
                                    onChange={(e) => handleUnitChange(u.id, "poin", parseInt(e.target.value) || 0)}
                                    className="w-full py-1 px-1.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded text-xs text-center font-semibold focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-zinc-50"
                                  />
                                </td>

                                {/* Barcode */}
                                <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                                  <input 
                                    type="text"
                                    value={u.barcode || ""}
                                    onChange={(e) => handleUnitChange(u.id, "barcode", e.target.value)}
                                    placeholder="Scan / Ketik barcode..."
                                    className="w-full py-1 px-1.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded text-xs text-left font-mono focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-zinc-50"
                                  />
                                </td>

                                {/* Harga Pokok */}
                                <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                                  <div className="relative">
                                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-sans font-bold">Rp</span>
                                    <input 
                                      type="number"
                                      value={u.harga_pokok || 0}
                                      onChange={(e) => handleUnitChange(u.id, "harga_pokok", parseFloat(e.target.value) || 0)}
                                      className="w-full py-1 pl-6 pr-1.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded text-xs text-right font-bold focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-zinc-50"
                                    />
                                  </div>
                                </td>

                                {/* Profit Proc (%) */}
                                <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                                  <input 
                                    type="number"
                                    step="0.01"
                                    value={u.proc_persen || 0}
                                    onChange={(e) => handleUnitChange(u.id, "proc_persen", parseFloat(e.target.value) || 0)}
                                    className="w-full py-1 px-1.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded text-xs text-center font-bold focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-zinc-50"
                                  />
                                </td>

                                {/* Harga Jual */}
                                <td className="p-1.5 border-r border-zinc-200 dark:border-zinc-800">
                                  <div className="relative">
                                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-sans font-bold">Rp</span>
                                    <input 
                                      type="number"
                                      value={u.harga_jual || 0}
                                      onChange={(e) => handleUnitChange(u.id, "harga_jual", parseFloat(e.target.value) || 0)}
                                      className="w-full py-1 pl-6 pr-1.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded text-xs text-right font-extrabold focus:outline-none focus:border-amber-500 text-emerald-600 dark:text-emerald-400"
                                    />
                                  </div>
                                </td>

                                {/* Komisi Sales */}
                                <td className="p-1.5">
                                  <input 
                                    type="number"
                                    value={u.komisi_sales || 0}
                                    onChange={(e) => handleUnitChange(u.id, "komisi_sales", parseFloat(e.target.value) || 0)}
                                    className="w-full py-1 px-1.5 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded text-xs text-right font-semibold focus:outline-none focus:border-amber-500 text-zinc-900 dark:text-zinc-50"
                                  />
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddNewUnitRow}
                        className="flex items-center gap-1 py-2 px-3.5 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition-all shadow-sm shadow-emerald-500/10"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Satuan
                      </button>

                      <button
                        type="button"
                        onClick={handleCalculateBaseHpp}
                        className="flex items-center gap-1 py-2 px-3.5 bg-zinc-800 hover:bg-zinc-750 dark:bg-zinc-200 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold rounded-xl cursor-pointer transition-all shadow-sm"
                      >
                        <Layers2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Hitung Harga Pokok Dasar
                      </button>

                      <button
                        type="button"
                        onClick={handleCalculateConversion}
                        className="flex items-center gap-1 py-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl cursor-pointer transition-all shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5 shrink-0" /> Hitung Konversi
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveSelectedUnit}
                        className="flex items-center gap-1 py-2 px-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl cursor-pointer transition-all shadow-sm shadow-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Satuan
                      </button>
                    </div>

                    {/* Default Fallback Checkbox option */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-zinc-500 dark:text-zinc-400">Default :</span>
                      <label className="flex items-center gap-1.5 font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={editingItem?.menggunakan_harga_pokok_default || false}
                          onChange={(e) => setEditingItem({ ...editingItem, menggunakan_harga_pokok_default: e.target.checked })}
                          className="accent-amber-500 rounded cursor-pointer h-3.5 w-3.5"
                        />
                        Menggunakan harga pokok jika tidak memenuhi kriteria
                      </label>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: MULTI HARGA JUAL */}
              {activeFormTab === 'harga' && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Tambah Aturan Multi Harga Jual</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <select 
                        value={newPriceLevel}
                        onChange={(e: any) => setNewPriceLevel(e.target.value)}
                        className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs rounded-xl text-zinc-900 dark:text-zinc-50 cursor-pointer focus:outline-none"
                      >
                        <option value="Umum">Umum</option>
                        <option value="Member Silver">Silver</option>
                        <option value="Member Gold">Gold</option>
                        <option value="Grosir">Grosir</option>
                        <option value="Reseller">Reseller</option>
                        <option value="Agen">Agen</option>
                      </select>
                      <input 
                        type="number" 
                        value={newPriceMinQty}
                        onChange={(e) => setNewPriceMinQty(parseInt(e.target.value) || 1)}
                        placeholder="Min Qty Pembelian (e.g. 1)"
                        className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50"
                      />
                      <input 
                        type="number" 
                        value={newPriceMaxQty}
                        onChange={(e) => setNewPriceMaxQty(e.target.value)}
                        placeholder="Max Qty (Opsional)"
                        className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50"
                      />
                      <input 
                        type="number" 
                        value={newPriceHarga}
                        onChange={(e) => setNewPriceHarga(parseFloat(e.target.value) || 0)}
                        placeholder="Harga Satuan Khusus"
                        className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={addModalPrice}
                      className="py-1.5 px-4 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      Simpan Aturan Harga
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Daftar Harga Bertingkat / Level Pelanggan</span>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl overflow-hidden">
                      {modalPrices.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 text-xs">
                          <div>
                            <span className="font-bold text-amber-500 uppercase">{p.level_pelanggan}</span>
                            <span className="text-[10px] text-zinc-400 block">Minimal Pembelian: {p.min_qty} Pcs {p.max_qty ? `sampai ${p.max_qty} Pcs` : "keatas"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{formatRupiah(p.harga_jual)}</span>
                            <button 
                              type="button"
                              onClick={() => removeModalPrice(p.id)}
                              className="text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                      {modalPrices.length === 0 && (
                        <div className="p-6 text-center text-zinc-400">Tidak ada penyesuaian harga khusus level customer. Harga default satuan akan digunakan.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: DISKON BERTINGKAT (temuan review #4 — sebelumnya sistem
                  diskon per-barang tidak punya UI sama sekali dan diskon di
                  kasir cuma di-hardcode untuk 1 produk demo) */}
              {activeFormTab === 'diskon' && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Formula Diskon Bertingkat</span>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Gabungkan potongan persen dan/atau nominal dengan tanda "+". Contoh: <code className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">10%+5%</code> (diskon 10%, lalu 5% dari sisanya) atau <code className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 rounded">Rp2000</code> (potongan nominal langsung). Kosongkan untuk menghapus diskon barang ini.
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="text"
                        value={modalDiscountFormula}
                        onChange={(e) => setModalDiscountFormula(e.target.value)}
                        placeholder="Contoh: 10%+5% atau Rp2000"
                        className="p-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-50 flex-1 font-mono"
                      />
                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={modalDiscountActive}
                          onChange={(e) => setModalDiscountActive(e.target.checked)}
                          className="w-4 h-4 accent-amber-500 cursor-pointer"
                        />
                        Aktifkan diskon ini
                      </label>
                    </div>

                    {editingItem?.satuan_dasar && modalDiscountFormula && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                        Diskon ini otomatis berlaku untuk semua satuan barang ini di kasir saat "Terapkan Diskon" dinyalakan.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: STOK GUDANG */}
              {activeFormTab === 'stok' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <span className="text-xs font-bold text-amber-500 block uppercase tracking-wider">Metode HPP & Pengendalian Gudang</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Stok Tersedia (Gudang Utama) *</label>
                    <input 
                      type="number"
                      value={modalStock.stok_tersedia}
                      onChange={(e) => setModalStock({ ...modalStock, stok_tersedia: parseInt(e.target.value) || 0 })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Stok Minimum (Alert Trigger)</label>
                    <input 
                      type="number"
                      value={modalStock.stok_minimum}
                      onChange={(e) => setModalStock({ ...modalStock, stok_minimum: parseInt(e.target.value) || 10 })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Safety Stock (Buffer)</label>
                    <input 
                      type="number"
                      value={modalStock.safety_stock}
                      onChange={(e) => setModalStock({ ...modalStock, safety_stock: parseInt(e.target.value) || 5 })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Reorder Point</label>
                    <input 
                      type="number"
                      value={modalStock.reorder_point}
                      onChange={(e) => setModalStock({ ...modalStock, reorder_point: parseInt(e.target.value) || 15 })}
                      className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-zinc-900 dark:text-zinc-50"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: SERIAL NUMBER / LOT */}
              {activeFormTab === 'serial' && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Daftarkan IMEI / Serial Number / Lot Kadaluarsa</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input 
                        type="text" 
                        value={newSerialNum}
                        onChange={(e) => setNewSerialNum(e.target.value)}
                        placeholder="IMEI atau SN Unik"
                        className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50 font-mono"
                      />
                      <input 
                        type="text" 
                        value={newSerialLot}
                        onChange={(e) => setNewSerialLot(e.target.value)}
                        placeholder="Lot / Batch Number"
                        className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50"
                      />
                      <input 
                        type="date" 
                        value={newSerialExp}
                        onChange={(e) => setNewSerialExp(e.target.value)}
                        placeholder="Tanggal Kadaluarsa"
                        className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={addModalSerial}
                      className="py-1.5 px-4 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      Daftarkan Serial/Lot
                    </button>
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    {modalSerials.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 text-xs">
                        <div>
                          <span className="font-bold text-indigo-500 font-mono">{s.serial_number}</span>
                          <span className="text-[10px] text-zinc-400 block">
                            Lot: {s.lot_number || "Default"} &bull; Exp: {s.expired_at ? new Date(s.expired_at).toLocaleDateString("id-ID") : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-bold uppercase">{s.status}</span>
                          <button 
                            type="button"
                            onClick={() => removeModalSerial(s.id)}
                            className="text-rose-500 hover:underline font-bold cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                    {modalSerials.length === 0 && (
                      <div className="p-6 text-center text-zinc-400">Tidak ada data serial/lot terdaftar. Sangat cocok untuk melacak nomor IMEI handphone atau masa kadaluarsa makanan.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: PAKET / BUNDLING */}
              {activeFormTab === 'bundling' && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-3">Aturan Komposisi Paket / Sembako Saling-Stok</span>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <select 
                        value={newPackageComponentId}
                        onChange={(e) => setNewPackageComponentId(e.target.value)}
                        className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-50 cursor-pointer flex-1"
                      >
                        <option value="">-- Pilih Komponen Produk Sembako --</option>
                        {items.filter(i => i.id !== editingItem?.id && i.kategori !== "Paket").map(i => (
                          <option key={i.id} value={i.id}>{i.nama_barang} ({i.kode_barang})</option>
                        ))}
                      </select>

                      <input 
                        type="number" 
                        value={newPackageQty}
                        onChange={(e) => setNewPackageQty(parseFloat(e.target.value) || 1)}
                        placeholder="Jumlah (Qty)"
                        className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs rounded-xl focus:outline-none w-24 text-zinc-900 dark:text-zinc-50"
                      />

                      <button 
                        type="button"
                        onClick={addPackageComponent}
                        className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Tambah Komponen
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    {modalPackages.map((pkg, idx) => {
                      const compItem = POSStorage.getItemById(pkg.component_item_id);
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 text-xs">
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{compItem?.nama_barang || "Produk Hilang"}</span>
                            <span className="text-[10px] text-zinc-400 block">Kategori: {compItem?.kategori}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{pkg.qty} Pcs</span>
                            <button 
                              type="button"
                              onClick={() => removePackageComponent(pkg.component_item_id)}
                              className="text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {modalPackages.length === 0 && (
                      <div className="p-6 text-center text-zinc-400">Belum ada komponen penyusun paket. (Hanya diperlukan jika Kategori diset ke 'Paket').</div>
                    )}
                  </div>
                </div>
              )}

              {/* FORM ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-850 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  Simpan Produk Lengkap
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL PRINT LABEL BARCODE */}
      {barcodePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-sm w-full p-6 shadow-2xl relative text-center space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Barcode className="w-5 h-5 text-amber-500" /> Label Barcode Thermal
              </h3>
              <button 
                onClick={() => setBarcodePreview(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold text-xs cursor-pointer p-0.5"
              >
                ✕
              </button>
            </div>

            {/* Simulated Printed Tag */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl text-zinc-950 space-y-3 font-sans shadow-inner">
              <span className="text-[10px] uppercase font-extrabold tracking-wider block text-zinc-500">Asyifa Mart POS System</span>
              
              {/* Simulated visual barcodes bars */}
              <div className="py-3 flex flex-col items-center justify-center bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200">
                <div className="flex gap-0.5 h-12 w-48 justify-center items-stretch mb-1">
                  {[1,3,1,2,1,4,1,2,3,1,2,1,4,1,2,1,3,1,2,1,4,1,2,3,1,2,1,4,1,2].map((w, idx) => (
                    <div 
                      key={idx} 
                      className={`h-full bg-zinc-900 ${
                        w === 1 ? "w-[1px]" : w === 2 ? "w-[2px]" : w === 3 ? "w-[3px]" : "w-[4px]"
                      } ${idx % 3 === 1 ? "opacity-0" : ""}`} 
                    />
                  ))}
                </div>
                <span className="font-mono text-xs tracking-widest font-semibold">{barcodePreview.code}</span>
              </div>

              <span className="text-[11px] font-bold block truncate max-w-xs">{barcodePreview.code === "8998866200225" ? "Indomie Goreng Spesial" : "Samsung Galaxy S23"}</span>
              <span className="text-sm font-extrabold text-amber-600 block">{barcodePreview.code === "8998866200225" ? "Rp 3.100" : "Rp 12.000.000"}</span>
            </div>

            <p className="text-[10px] text-zinc-400 leading-normal">
              Label ini kompatibel dengan standard printer label thermal (58mm / 80mm / A4 Label sticker sheets).
            </p>

            <button 
              onClick={() => window.print()}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cetak Label Thermal (Simulasi)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
