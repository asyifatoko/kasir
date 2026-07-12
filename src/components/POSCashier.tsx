import React, { useState, useEffect, useRef } from "react";
import { 
  Search, ShoppingCart, User, CreditCard, Tag, Layers, CheckCircle2, 
  Trash2, Plus, Minus, KeyRound, Monitor, Sparkles, Scan, ArrowRight,
  Coins, Lock, LogOut, Check, FileText, AlertCircle, Calendar, Percent
} from "lucide-react";
import { POSStorage } from "../lib/storage";
import { Item, CartItem, ItemUnit, ItemSerial, Transaction, CashierShift } from "../lib/types";

export default function POSCashier() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [customerLevel, setCustomerLevel] = useState<'Umum' | 'Member Silver' | 'Member Gold' | 'Grosir' | 'Reseller' | 'Agen'>("Umum");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  const [isDiscountEnabled, setIsDiscountEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("pos_is_discount_enabled");
    return saved !== "false";
  });
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("pos_is_tax_enabled");
    return saved !== "false";
  });

  const toggleDiscount = () => {
    const nextVal = !isDiscountEnabled;
    setIsDiscountEnabled(nextVal);
    localStorage.setItem("pos_is_discount_enabled", String(nextVal));
  };

  const toggleTax = () => {
    const nextVal = !isTaxEnabled;
    setIsTaxEnabled(nextVal);
    localStorage.setItem("pos_is_tax_enabled", String(nextVal));
  };
  
  // Shift state management
  const [activeShift, setActiveShift] = useState<CashierShift | null>(null);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showShiftSummaryReceipt, setShowShiftSummaryReceipt] = useState<CashierShift | null>(null);

  // Open Shift Form state
  const [openCashierName, setOpenCashierName] = useState("");
  const [openStartingCash, setOpenStartingCash] = useState("100000"); // default Rp 100.000 starting cash

  // Close Shift Form state
  const [closeActualCash, setCloseActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  // Load active shift on mount
  useEffect(() => {
    setActiveShift(POSStorage.getActiveShift());
  }, []);

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Debit' | 'Kredit' | 'Tunai' | 'Qris' | 'Transfer'>("Tunai");
  const [cashPaid, setCashPaid] = useState<string>("");
  const [recordedTransaction, setRecordedTransaction] = useState<Transaction | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) {
          handleCheckout();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart]);

  // Calculations
  const storeSettings = POSStorage.getSettings();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountTotal = cart.reduce((sum, item) => sum + (item.discountAmount * item.qty), 0);
  const taxTotal = isTaxEnabled ? Math.round(subtotal * 0.11) : 0; // 11% PPN Indonesian standard
  const grandTotal = subtotal + taxTotal;

  // Filter products
  const items = POSStorage.getItems();
  const categories = ["Semua", ...Array.from(new Set(items.map(i => i.kategori)))];

  const filteredItems = items.filter(item => {
    if (item.status !== "Aktif") return false;
    
    // Category check
    if (selectedCategory !== "Semua" && item.kategori !== selectedCategory) return false;

    // Search query check
    const query = searchQuery.toLowerCase();
    const barcodeMatch = POSStorage.getBarcodesByItem(item.id).some(b => b.barcode.includes(query));
    
    return (
      item.nama_barang.toLowerCase().includes(query) ||
      item.kode_barang.toLowerCase().includes(query) ||
      item.barcode_utama.includes(query) ||
      (item.brand_merk && item.brand_merk.toLowerCase().includes(query)) ||
      barcodeMatch
    );
  });

  // Handle manual/scanner simulated entry
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    // Find item with exact barcode match
    const exactItem = items.find(item => {
      // Check main barcode
      if (item.barcode_utama === barcodeInput) return true;
      // Check secondary multi-barcodes
      const secondaryMatched = POSStorage.getBarcodesByItem(item.id).some(b => b.barcode === barcodeInput);
      if (secondaryMatched) return true;
      // Check unit-specific barcodes
      const unitMatched = POSStorage.getUnitsByItem(item.id).some(u => u.barcode === barcodeInput);
      return unitMatched;
    });

    if (exactItem) {
      // Check if unit barcode was matched
      const matchedUnit = POSStorage.getUnitsByItem(exactItem.id).find(u => u.barcode === barcodeInput);
      addToCart(exactItem, matchedUnit);
      setBarcodeInput("");
    } else {
      alert(`Barcode "${barcodeInput}" tidak ditemukan dalam database!`);
    }
  };

  // ADD TO CART WITH AUTO-PRICE CALCULATIONS
  const addToCart = (item: Item, preferredUnit?: ItemUnit) => {
    // 1. Determine available units
    const units = POSStorage.getUnitsByItem(item.id);
    const defaultUnit = preferredUnit || units.find(u => u.nama === "Pcs") || units[0];

    if (!defaultUnit) return;

    // Check if item is already in cart with that specific unit
    const existingIndex = cart.findIndex(c => c.item.id === item.id && c.selectedUnit.id === defaultUnit.id);

    let updatedCart = [...cart];

    if (existingIndex !== -1) {
      // Increment qty
      updatedCart[existingIndex].qty += 1;
    } else {
      // Add new cart entry
      const serials = POSStorage.getSerialsByItem(item.id).filter(s => s.status === "Tersedia");
      const defaultSerial = serials.length > 0 ? serials[0].serial_number : undefined;

      const newCartItem: CartItem = {
        id: `${item.id}-${defaultUnit.id}`,
        item,
        selectedUnit: defaultUnit,
        qty: 1,
        price: defaultUnit.harga_jual,
        originalPrice: defaultUnit.harga_jual,
        discountFormula: "",
        discountAmount: 0,
        serialNumber: defaultSerial
      };
      updatedCart.push(newCartItem);
    }

    // Apply smart pricing rules
    recalculateCartPrices(updatedCart);
  };

  // Recalculate prices based on Qty tiers, customer levels, diskon bertingkat & bundles
  const recalculateCartPrices = (currentCart: CartItem[]) => {
    const updated = currentCart.map(cartItem => {
      const item = cartItem.item;
      const unit = cartItem.selectedUnit;
      const qty = cartItem.qty;

      // 1. Fetch customized level prices
      const levelPrices = POSStorage.getPricesByItem(item.id);

      // Base original price is from selected unit
      let basePrice = unit.harga_jual;

      // Check level customer specific price
      const customerPriceObj = levelPrices.find(p => p.level_pelanggan === customerLevel && p.unit_id === unit.id && p.min_qty === 1);
      if (customerPriceObj) {
        basePrice = customerPriceObj.harga_jual;
      }

      // 2. Check Volume Tier pricing
      // Find tier price where qty falls between min_qty and max_qty
      const tierPriceObj = levelPrices.find(p => {
        const minOk = qty >= p.min_qty;
        const maxOk = p.max_qty ? qty <= p.max_qty : true;
        return p.level_pelanggan === customerLevel && p.unit_id === unit.id && p.min_qty > 1 && minOk && maxOk;
      });

      if (tierPriceObj) {
        basePrice = tierPriceObj.harga_jual;
      }

      // 3. Apply compound discount bertingkat (e.g. 10%+5%) — diambil dari
      // tabel diskon per-barang (ItemDiscount), berlaku untuk SEMUA barang
      // yang diberi diskon lewat menu Daftar Barang, bukan hanya 1 produk demo.
      const activeDiscount = POSStorage.getActiveDiscountForItem(item.id);
      let discountFormula = isDiscountEnabled && activeDiscount ? activeDiscount.formula_diskon : "";

      // Check Buy 2 Get 1 Bundle
      const bundles = POSStorage.getBundlesByItem(item.id);
      const buy2get1 = bundles.find(b => b.tipe_bundle === "Buy 2 Get 1");
      let calculatedPrice = basePrice;
      let discountAmt = 0;

      if (isDiscountEnabled && buy2get1 && qty >= 3) {
        // Buy 2 Get 1 formula: Deduct 1 unit price for every 3 items
        const freeItems = Math.floor(qty / 3);
        discountAmt = Math.round((freeItems * basePrice) / qty);
        calculatedPrice = basePrice - discountAmt;
        discountFormula = "Buy 2 Get 1";
      } else if (isDiscountEnabled && discountFormula) {
        discountAmt = POSStorage.calculateDiscount(basePrice, discountFormula);
        calculatedPrice = basePrice - discountAmt;
      }

      return {
        ...cartItem,
        originalPrice: basePrice,
        price: calculatedPrice,
        discountFormula,
        discountAmount: discountAmt
      };
    });

    setCart(updated);
  };

  // Refresh price calculations whenever customer level or discount options change
  useEffect(() => {
    if (cart.length > 0) {
      recalculateCartPrices(cart);
    }
  }, [customerLevel, isDiscountEnabled]);

  const updateQty = (id: string, delta: number) => {
    const updated = cart.map(c => {
      if (c.id === id) {
        const nextQty = Math.max(1, c.qty + delta);
        return { ...c, qty: nextQty };
      }
      return c;
    });
    recalculateCartPrices(updated);
  };

  const changeUnit = (id: string, unitName: string) => {
    const itemEntry = cart.find(c => c.id === id);
    if (!itemEntry) return;

    const units = POSStorage.getUnitsByItem(itemEntry.item.id);
    const newUnit = units.find(u => u.nama === unitName);
    if (!newUnit) return;

    // Replace entry with new unit key
    const updated = cart.map(c => {
      if (c.id === id) {
        return {
          ...c,
          id: `${c.item.id}-${newUnit.id}`,
          selectedUnit: newUnit
        };
      }
      return c;
    });
    recalculateCartPrices(updated);
  };

  const changeSerial = (id: string, serialNum: string) => {
    const updated = cart.map(c => {
      if (c.id === id) {
        return { ...c, serialNumber: serialNum };
      }
      return c;
    });
    setCart(updated);
  };

  const removeFromCart = (id: string) => {
    const updated = cart.filter(c => c.id !== id);
    setCart(updated);
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCheckout = () => {
    // Validasi stok SEBELUM buka modal pembayaran (temuan review #5:
    // sebelumnya kasir bisa checkout barang walau stok 0/minus).
    const stockCheck = POSStorage.checkStockAvailability(cart, POSStorage.getActiveGudang());
    if (!stockCheck.ok) {
      alert("Stok tidak mencukupi untuk beberapa barang:\n\n" + stockCheck.problems.join("\n"));
      return;
    }
    setRecordedTransaction(null);
    setCashPaid("");
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    const parsedPaid = parseFloat(cashPaid) || grandTotal;

    const isCashPayment = paymentMethod === "Cash" || paymentMethod === "Tunai";

    if (isCashPayment && parsedPaid < grandTotal) {
      alert("Pembayaran tunai kurang dari total tagihan!");
      return;
    }

    // Cek ulang stok tepat sebelum submit (bisa saja berubah sejak modal dibuka,
    // misalnya kasir lain menjual barang yang sama di device lain).
    const stockCheck = POSStorage.checkStockAvailability(cart, POSStorage.getActiveGudang());
    if (!stockCheck.ok) {
      alert("Stok berubah, tidak lagi mencukupi:\n\n" + stockCheck.problems.join("\n"));
      setShowPaymentModal(false);
      return;
    }

    const txPayload = {
      items: cart,
      total_item: cart.reduce((sum, i) => sum + i.qty, 0),
      subtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      grand_total: grandTotal,
      customer_level: customerLevel,
      payment_method: paymentMethod,
      cash_paid: isCashPayment ? parsedPaid : grandTotal,
      change: isCashPayment ? (parsedPaid - grandTotal) : 0,
      user_cashier: activeShift?.cashier_name || "Kasir Asyifa"
    };

    try {
      const savedTx = await POSStorage.recordTransaction(txPayload);
      setRecordedTransaction(savedTx);
      // Refresh active shift stats
      setActiveShift(POSStorage.getActiveShift());
      clearCart();
      if ((savedTx as any)._syncWarning) {
        // Transaksi & stok tetap AMAN tersimpan di perangkat ini — cuma
        // belum semua bagian tersinkron ke Supabase (mis. internet putus
        // sesaat). Beri tahu kasir tanpa membuatnya panik seolah gagal jual.
        console.warn("Peringatan sinkron:", (savedTx as any)._syncWarning);
        alert("Transaksi berhasil dan tersimpan di perangkat ini.\n\nCatatan: sebagian data belum tersinkron ke server pusat (cek koneksi internet). Data akan otomatis lengkap saat sinkron berikutnya.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Gagal mencatat transaksi.");
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  if (showShiftSummaryReceipt) {
    const s = showShiftSummaryReceipt;
    return (
      <div className="max-w-md mx-auto my-6 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6 text-zinc-200 font-mono" id="shift-receipt-panel">
        <div className="text-center space-y-2 pb-4 border-b border-dashed border-zinc-800">
          <FileText className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-sm font-black tracking-tight text-white uppercase">Laporan Tutup Shift</h2>
          <p className="text-xs text-zinc-400 font-semibold uppercase">{storeSettings?.nama_toko || "ASYIFA MART"}</p>
        </div>

        <div className="space-y-3 text-xs leading-relaxed">
          <div className="flex justify-between">
            <span className="text-zinc-400">Petugas Kasir:</span>
            <span className="font-bold text-white">{s.cashier_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Mulai Shift:</span>
            <span>{new Date(s.start_time).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Akhir Shift:</span>
            <span>{s.end_time ? new Date(s.end_time).toLocaleString("id-ID") : "-"}</span>
          </div>

          <div className="border-t border-dashed border-zinc-800 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Uang Modal Awal:</span>
              <span className="font-semibold text-white">{formatRupiah(s.starting_cash)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Penjualan Tunai (Cash):</span>
              <span className="font-semibold text-emerald-400">+ {formatRupiah(s.total_cash_sales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Penjualan Non-Tunai:</span>
              <span className="font-semibold text-sky-400">+ {formatRupiah(s.total_non_cash_sales)}</span>
            </div>
            <div className="flex justify-between text-white font-bold border-t border-zinc-800 pt-2 text-xs">
              <span>Expected Cash (Seharusnya):</span>
              <span>{formatRupiah(s.expected_closing_cash || 0)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-800 pt-3 space-y-2">
            <div className="flex justify-between text-white font-bold">
              <span>Uang Laci Aktual:</span>
              <span className="text-amber-400">{formatRupiah(s.actual_closing_cash || 0)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold pt-1 border-t border-zinc-800">
              <span>Selisih Laci:</span>
              <span className={(s.difference || 0) < 0 ? "text-red-500 font-bold" : (s.difference || 0) > 0 ? "text-emerald-500 font-bold" : "text-zinc-300"}>
                {s.difference === 0 ? "Pas (Rp 0)" : `${(s.difference || 0) > 0 ? "Kelebihan" : "Kekurangan"} (${formatRupiah(s.difference || 0)})`}
              </span>
            </div>
          </div>

          {s.notes && (
            <div className="border-t border-zinc-800 pt-3 text-[11px] text-zinc-400 italic">
              <strong>Catatan:</strong> {s.notes}
            </div>
          )}
        </div>

        <div className="pt-4 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cetak Struk
          </button>
          <button
            onClick={() => setShowShiftSummaryReceipt(null)}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    );
  }

  if (!activeShift) {
    const quickCashList = [50000, 100000, 200000, 300000, 500000];
    const cashierSuggestions = ["Ahmad Fauzi", "Siti Nurhaliza", "Budi Santoso", "Dewi Lestari"];

    const handleOpenShiftSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!openCashierName.trim()) {
        alert("Silakan isi nama petugas kasir terlebih dahulu!");
        return;
      }
      const cash = parseFloat(openStartingCash) || 0;
      const opened = await POSStorage.openShift(openCashierName.trim(), cash);
      setActiveShift(opened);
    };

    return (
      <div className="max-w-md mx-auto my-12 bg-zinc-950/80 border border-zinc-800/80 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6 text-zinc-200" id="open-shift-portal">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
            <Coins className="w-9 h-9 animate-bounce" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Portal Register Shift</h2>
          <p className="text-xs text-zinc-400">
            Sistem mencatat kasir multi-shift & uang laci (modal awal). Isilah data berikut untuk membuka register POS.
          </p>
        </div>

        <form onSubmit={handleOpenShiftSubmit} className="space-y-5">
          {/* Kasir input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Petugas Kasir (Nama)</label>
            <input
              type="text"
              value={openCashierName}
              onChange={(e) => setOpenCashierName(e.target.value)}
              placeholder="Masukkan nama petugas kasir..."
              className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-white placeholder-zinc-600 font-medium"
              required
            />
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cashierSuggestions.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setOpenCashierName(name)}
                  className="px-2.5 py-1 text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-850 transition-all cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Starting cash input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Uang Modal Laci Awal (Uang Laci)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold font-mono">Rp</span>
              <input
                type="number"
                value={openStartingCash}
                onChange={(e) => setOpenStartingCash(e.target.value)}
                placeholder="0"
                className="w-full py-2.5 pl-10 pr-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-white font-bold font-mono"
                required
              />
            </div>
            {/* Quick Cash Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickCashList.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setOpenStartingCash(amount.toString())}
                  className="px-2.5 py-1 text-[10px] font-bold bg-zinc-900 hover:bg-slate-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-850 transition-all cursor-pointer"
                >
                  {formatRupiah(amount)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-emerald-500/10 cursor-pointer mt-2"
          >
            Buka Register Kasir
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start" id="pos-cashier">
      
      {/* Kolom Kiri: Produk & Scanner (8 grid) */}
      <div className="lg:col-span-8 space-y-6">

        {/* Shift Info & Drawer Cash Bar */}
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Shift Aktif: {activeShift.cashier_name}</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold text-[9px] uppercase rounded">Mulai: {new Date(activeShift.start_time).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Modal Laci: <span className="font-bold text-zinc-300">{formatRupiah(activeShift.starting_cash)}</span> | Tunai: <span className="font-bold text-emerald-400">+{formatRupiah(activeShift.total_cash_sales)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Total Uang Laci</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono block">
                {formatRupiah(activeShift.starting_cash + activeShift.total_cash_sales)}
              </span>
            </div>

            <button
              onClick={() => {
                setCloseActualCash("");
                setCloseNotes("");
                setShowCloseShiftModal(true);
              }}
              className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Tutup Shift
            </button>
          </div>
        </div>
      
        {/* Row 1: Barcode Fast Scanner Panel */}
        <div className="bg-white/40 dark:bg-zinc-900/40 p-4 rounded-2xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl shadow-sm">
          <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Scan className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 animate-pulse" />
              <input 
                type="text" 
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Simulasikan Scan Barcode (e.g. 8998866200225, 8998866500555)..."
                className="w-full pl-11 pr-4 py-3 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50 font-mono"
              />
            </div>
            <button 
              type="submit" 
              className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Scan Enter
            </button>
          </form>
          <span className="text-[10px] text-zinc-400 mt-1.5 block">
            *Tips: Anda dapat menyalin dan menempelkan barcode produk contoh (e.g., Samsung: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 font-mono text-zinc-600 dark:text-zinc-300">8998866500555</code> atau Indomie Dus: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 font-mono text-zinc-600 dark:text-zinc-300">8998866200200</code>) untuk menguji penambahan super-cepat.
          </span>
        </div>

        {/* Row 2: Search, Filter, Categories */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama produk, kategori, atau merk [F2]..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50"
              />
            </div>

            {/* Level Customer Toggle */}
            <div className="flex items-center gap-2 bg-white/60 dark:bg-zinc-900/60 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 px-2 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Level:</span>
              <select 
                value={customerLevel}
                onChange={(e: any) => setCustomerLevel(e.target.value)}
                className="text-xs bg-transparent border-0 focus:outline-none focus:ring-0 text-zinc-800 dark:text-zinc-200 font-semibold cursor-pointer py-1 px-1"
              >
                <option value="Umum">Umum</option>
                <option value="Member Silver">Silver</option>
                <option value="Member Gold">Gold</option>
                <option value="Grosir">Grosir</option>
                <option value="Reseller">Reseller</option>
                <option value="Agen">Agen</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? "bg-amber-500 text-zinc-950 font-semibold shadow-sm" 
                    : "bg-white/60 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-800/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const units = POSStorage.getUnitsByItem(item.id);
            const defaultUnit = units.find(u => u.nama === "Pcs") || units[0];
            const price = defaultUnit ? defaultUnit.harga_jual : 0;
            const stockEntries = POSStorage.getStockByItem(item.id);
            const totalStock = item.kategori === "Paket" 
              ? POSStorage.calculatePackageStock(item.id)
              : stockEntries.reduce((sum, s) => sum + s.stok_tersedia, 0);

            return (
              <div 
                key={item.id} 
                onClick={() => addToCart(item)}
                className="bg-white/60 dark:bg-zinc-900/60 rounded-2xl border border-white/30 dark:border-zinc-800/50 hover:border-amber-500 dark:hover:border-amber-500 shadow-sm overflow-hidden flex flex-col group cursor-pointer transition-all hover:scale-[1.02] duration-200"
              >
                {/* Product Image */}
                <div className="h-32 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                  <img 
                    src={item.foto_produk || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300"} 
                    alt={item.nama_barang} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.kategori === "Paket" && (
                    <span className="absolute top-2 left-2 bg-indigo-500 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-md shadow">
                      Bundling / Paket
                    </span>
                  )}
                  {item.brand_merk && (
                    <span className="absolute top-2 right-2 bg-black/65 backdrop-blur-sm text-white font-medium text-[9px] px-1.5 py-0.5 rounded">
                      {item.brand_merk}
                    </span>
                  )}
                </div>

                {/* Product Meta */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase block">{item.kategori}</span>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 mt-0.5">{item.nama_barang}</h3>
                  </div>

                  <div className="flex items-end justify-between pt-1">
                    <div>
                      <span className="text-xs text-zinc-400 block">Harga {defaultUnit?.nama || "Pcs"}</span>
                      <span className="text-base font-extrabold text-zinc-900 dark:text-white">{formatRupiah(price)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">Stok</span>
                      <span className={`text-xs font-semibold ${totalStock === 0 ? "text-red-500" : "text-emerald-500"}`}>
                        {totalStock} {defaultUnit?.nama || "Pcs"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-16 text-center text-zinc-400 dark:text-zinc-500 bg-white/30 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              Barang tidak ditemukan atau kategori masih kosong.
            </div>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Detail Belanja / Keranjang POS (4 grid) */}
      <div className="lg:col-span-4 bg-white/70 dark:bg-zinc-900/70 p-5 rounded-3xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl shadow-lg flex flex-col min-h-[580px] justify-between">
        
        <div>
          {/* Header Keranjang */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4 mb-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" /> Struk Belanja
            </h2>
            {cart.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Kosongkan
              </button>
            )}
          </div>

          {/* Indikator Status PPN & Diskon Terpasang */}
          <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Status:</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                isDiscountEnabled 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold animate-pulse" 
                  : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/50 text-zinc-400 dark:text-zinc-600 font-normal"
              }`}>
                <Tag className="w-3 h-3 shrink-0" />
                Diskon: {isDiscountEnabled ? "AKTIF" : "OFF"}
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                isTaxEnabled 
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-extrabold" 
                  : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/50 text-zinc-400 dark:text-zinc-600 font-normal"
              }`}>
                <Percent className="w-3 h-3 shrink-0" />
                PPN (11%): {isTaxEnabled ? "AKTIF" : "OFF"}
              </span>
            </div>
            {isDiscountEnabled && discountTotal > 0 && (
              <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                Potongan: {formatRupiah(discountTotal)}
              </div>
            )}
          </div>

          {/* List Item Keranjang */}
          <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
            {cart.map((cartItem) => {
              const item = cartItem.item;
              const units = POSStorage.getUnitsByItem(item.id);
              const serials = POSStorage.getSerialsByItem(item.id).filter(s => s.status === "Tersedia");

              return (
                <div key={cartItem.id} className="p-3 bg-white/80 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">{item.nama_barang}</span>
                      <span className="text-[10px] text-zinc-400 block">Kode: {item.kode_barang}</span>
                    </div>
                    <button 
                      onClick={() => removeFromCart(cartItem.id)}
                      className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Multi Satuan Picker */}
                    <div className="flex items-center gap-1">
                      <select 
                        value={cartItem.selectedUnit.nama}
                        onChange={(e) => changeUnit(cartItem.id, e.target.value)}
                        className="text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded focus:outline-none border-0 cursor-pointer"
                      >
                        {units.map(u => (
                          <option key={u.id} value={u.nama}>{u.nama}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
                      <button 
                        onClick={() => updateQty(cartItem.id, -1)}
                        className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 min-w-[15px] text-center">{cartItem.qty}</span>
                      <button 
                        onClick={() => updateQty(cartItem.id, 1)}
                        className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Serial Number Picker if applicable (Samsung or electronics with serial_number) */}
                  {serials.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[9px] font-bold text-indigo-500">S/N:</span>
                      <select 
                        value={cartItem.serialNumber || ""}
                        onChange={(e) => changeSerial(cartItem.id, e.target.value)}
                        className="text-[9px] bg-indigo-500/10 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-0 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Pilih S/N --</option>
                        {serials.map(s => (
                          <option key={s.id} value={s.serial_number}>{s.serial_number}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Discount details */}
                  {cartItem.discountFormula && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md">
                      <Tag className="w-3 h-3" /> {cartItem.discountFormula} (-{formatRupiah(cartItem.discountAmount)})
                    </div>
                  )}

                  {/* Price calculations */}
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-zinc-100/40 dark:border-zinc-800/40">
                    <span className="text-zinc-400">Harga</span>
                    <div className="text-right">
                      {cartItem.discountAmount > 0 && (
                        <span className="text-[10px] text-zinc-400 line-through mr-1.5">{formatRupiah(cartItem.originalPrice)}</span>
                      )}
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatRupiah(cartItem.price * cartItem.qty)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {cart.length === 0 && (
              <div className="py-24 text-center text-zinc-400 dark:text-zinc-500 space-y-2">
                <ShoppingCart className="w-10 h-10 mx-auto opacity-50 stroke-[1.5]" />
                <p className="text-xs">Keranjang kosong. Klik produk di sebelah kiri atau scan barcode untuk menambahkan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Ringkasan Bayar */}
        <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-4 space-y-4">
          
          {/* Toggles Diskon & PPN */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
            <button
              onClick={toggleDiscount}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                isDiscountEnabled
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold"
                  : "bg-zinc-100/50 dark:bg-zinc-900/50 border-transparent text-zinc-400 dark:text-zinc-600 font-normal"
              }`}
            >
              <Tag className="w-3.5 h-3.5 shrink-0" />
              Diskon {isDiscountEnabled ? "On" : "Off"}
            </button>
            <button
              onClick={toggleTax}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                isTaxEnabled
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold"
                  : "bg-zinc-100/50 dark:bg-zinc-900/50 border-transparent text-zinc-400 dark:text-zinc-600 font-normal"
              }`}
            >
              <Percent className="w-3.5 h-3.5 shrink-0" />
              PPN (11%) {isTaxEnabled ? "On" : "Off"}
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatRupiah(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between items-center bg-emerald-500/5 dark:bg-emerald-950/10 p-1.5 rounded-lg border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1 font-bold">
                  <Tag className="w-3.5 h-3.5" />
                  Total Diskon
                </span>
                <span className="font-bold">- {formatRupiah(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-1.5 rounded-lg text-zinc-500">
              <span className="flex items-center gap-1 font-semibold">
                <Percent className="w-3.5 h-3.5 text-indigo-500" />
                PPN (11%)
                {isTaxEnabled ? (
                  <span className="text-[9px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded font-extrabold tracking-wider uppercase">Aktif</span>
                ) : (
                  <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 px-1 py-0.5 rounded font-normal tracking-wider uppercase">Off</span>
                )}
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatRupiah(taxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-zinc-100 dark:border-zinc-800/50 font-bold text-zinc-900 dark:text-white">
              <span>Grand Total</span>
              <span className="text-base text-amber-500 font-extrabold">{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              cart.length > 0 
                ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-md shadow-amber-500/15" 
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
            }`}
          >
            Bayar Sekarang [F8] <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* MODAL PEMBAYARAN */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" /> Proses Pembayaran
              </h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* If transaction recorded successfully (Receipt panel) */}
            {recordedTransaction ? (
              <div className="space-y-4">
                <div className="text-center py-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                  <span className="text-sm font-bold block">Pembayaran Berhasil!</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Invoice: {recordedTransaction.invoice_no}</span>
                </div>

                {/* Struk Thermal View */}
                <div 
                  style={{ maxWidth: storeSettings.lebar_kertas === "58mm" ? "260px" : "340px", margin: "0 auto" }}
                  className={`p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl font-mono leading-relaxed text-zinc-800 dark:text-zinc-300 ${
                    storeSettings.ukuran_font === "kecil" 
                      ? "text-[10px]" 
                      : storeSettings.ukuran_font === "besar" 
                        ? "text-xs" 
                        : "text-[11px]"
                  }`}
                >
                  {storeSettings.tampilkan_logo && (
                    <div className="text-center text-amber-500 flex justify-center mb-1.5">
                      <ShoppingCart className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}

                  <div className="text-center font-bold border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2 mb-2">
                    <p className="text-sm uppercase tracking-wider font-extrabold">{storeSettings.nama_toko}</p>
                    <p className="font-normal text-[10px]">{storeSettings.alamat_toko}</p>
                    <p className="font-normal text-[10px]">Telp: {storeSettings.no_telepon}</p>
                    <p className="font-normal text-[10px]">{new Date(recordedTransaction.tanggal).toLocaleString("id-ID")}</p>
                  </div>

                  {storeSettings.header_kustom && (
                    <div className="text-center text-[10px] whitespace-pre-line border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2 mb-2 text-zinc-500">
                      {storeSettings.header_kustom}
                    </div>
                  )}

                  <div className="border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2 mb-2 space-y-1">
                    <p>No: {recordedTransaction.invoice_no}</p>
                    <p>Kasir: {recordedTransaction.user_cashier}</p>
                    <p>Tipe: {recordedTransaction.customer_level}</p>
                  </div>

                  <div className="border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2 mb-2 space-y-1.5">
                    {recordedTransaction.items.map((cartItem, i) => (
                      <div key={i} className="flex justify-between">
                        <div>
                          <p className="font-bold">{cartItem.item.nama_cetak_struk || cartItem.item.nama_barang}</p>
                          <p className="text-[10px]">{cartItem.qty} {cartItem.selectedUnit.nama} x {formatRupiah(cartItem.price)}</p>
                        </div>
                        <span className="font-bold">{formatRupiah(cartItem.price * cartItem.qty)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatRupiah(recordedTransaction.subtotal)}</span>
                    </div>
                    {recordedTransaction.discount_total > 0 && (
                      <div className="flex justify-between text-amber-500">
                        <span>Diskon:</span>
                        <span>- {formatRupiah(recordedTransaction.discount_total)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>PPN (11%):</span>
                      <span>{formatRupiah(recordedTransaction.tax_total)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                      <span>TOTAL:</span>
                      <span>{formatRupiah(recordedTransaction.grand_total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Metode:</span>
                      <span>{recordedTransaction.payment_method}</span>
                    </div>
                    {(recordedTransaction.payment_method === "Cash" || recordedTransaction.payment_method === "Tunai") && (
                      <>
                        <div className="flex justify-between">
                          <span>Tunai:</span>
                          <span>{formatRupiah(recordedTransaction.cash_paid || 0)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-500">
                          <span>Kembali:</span>
                          <span>{formatRupiah(recordedTransaction.change || 0)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {storeSettings.footer_kustom && (
                    <div className="text-center text-[10px] whitespace-pre-line border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-2.5 mt-2 text-zinc-500">
                      {storeSettings.footer_kustom}
                    </div>
                  )}

                  {storeSettings.slogan_toko && (
                    <p className="text-center text-[9px] text-zinc-400 font-semibold uppercase mt-1">
                      *** {storeSettings.slogan_toko} ***
                    </p>
                  )}

                  {storeSettings.tampilkan_barcode && (
                    <div className="text-center flex flex-col items-center pt-3 pb-1">
                      <div className="h-6 w-32 bg-zinc-950 dark:bg-zinc-100 flex justify-around items-stretch p-[1px] opacity-80">
                        <div className="bg-white dark:bg-zinc-900 w-1" /><div className="bg-white dark:bg-zinc-900 w-2" />
                        <div className="bg-white dark:bg-zinc-900 w-[1px]" /><div className="bg-white dark:bg-zinc-900 w-1.5" />
                        <div className="bg-white dark:bg-zinc-900 w-[2px]" /><div className="bg-white dark:bg-zinc-900 w-[1px]" />
                        <div className="bg-white dark:bg-zinc-900 w-2" /><div className="bg-white dark:bg-zinc-900 w-[1px]" />
                        <div className="bg-white dark:bg-zinc-900 w-1" /><div className="bg-white dark:bg-zinc-900 w-2" />
                      </div>
                      <span className="text-[8px] text-zinc-500 mt-0.5">{recordedTransaction.invoice_no}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      window.print();
                    }}
                    className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Cetak Struk (Thermal)
                  </button>
                  <button 
                    onClick={() => {
                      setRecordedTransaction(null);
                      setShowPaymentModal(false);
                    }}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              // Payment form
              <div className="space-y-5 text-sm">
                
                {/* Grand Total tagihan */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl text-center border border-zinc-100 dark:border-zinc-850">
                  <span className="text-xs text-zinc-400 font-semibold block">Total Tagihan Belanja</span>
                  <span className="text-3xl font-extrabold text-amber-500 tracking-tight block mt-1">{formatRupiah(grandTotal)}</span>
                </div>

                {/* Payment Methods selector */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-400 block uppercase tracking-wider">Metode Pembayaran</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(["Tunai", "Qris", "Transfer", "Debit", "Kredit"] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 px-0.5 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                          paymentMethod === m 
                            ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400" 
                            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-350"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash payment specific fields */}
                {(paymentMethod === "Cash" || paymentMethod === "Tunai") && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 block uppercase tracking-wider">Jumlah Tunai Diterima</label>
                      <input 
                        type="number" 
                        value={cashPaid}
                        onChange={(e) => setCashPaid(e.target.value)}
                        placeholder="Masukkan nominal uang cash..."
                        className="w-full py-2.5 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold font-mono text-zinc-900 dark:text-zinc-50 text-base"
                      />
                    </div>

                    {/* Quick nominal helpers */}
                    <div className="grid grid-cols-3 gap-2">
                      {[grandTotal, 50000, 100000].map(amount => {
                        const roundAmount = Math.ceil(amount);
                        return (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setCashPaid(roundAmount.toString())}
                            className="py-1 px-1 text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                          >
                            {amount === grandTotal ? "Uang Pas" : formatRupiah(amount)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Change calculator display */}
                    {parseFloat(cashPaid) > 0 && (
                      <div className="flex justify-between items-center p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-xl text-xs">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Kembalian (Tunai):</span>
                        <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(Math.max(0, parseFloat(cashPaid) - grandTotal))}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Payment trigger */}
                <button 
                  onClick={submitPayment}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Konfirmasi Bayar & Cetak
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL TUTUP SHIFT */}
      {showCloseShiftModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <LogOut className="w-5 h-5 text-red-500" /> Tutup Register Shift & Laci Uang
            </h3>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 font-mono">
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase font-bold">Kasir Aktif</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-bold">{activeShift.cashier_name}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase font-bold">Mulai Sejak</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                    {new Date(activeShift.start_time).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 font-mono leading-relaxed">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Modal Uang Laci Awal:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatRupiah(activeShift.starting_cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Penjualan Tunai:</span>
                  <span className="font-bold text-emerald-500">+{formatRupiah(activeShift.total_cash_sales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Penjualan Non-Tunai:</span>
                  <span className="font-bold text-sky-400">+{formatRupiah(activeShift.total_non_cash_sales)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-900 dark:text-white border-t border-zinc-100 dark:border-zinc-800 pt-2 text-sm">
                  <span>Uang Laci Seharusnya:</span>
                  <span>{formatRupiah(activeShift.starting_cash + activeShift.total_cash_sales)}</span>
                </div>
              </div>

              {/* Form Input */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Jumlah Uang Laci Aktual (Riil/Fisik)</label>
                  <input
                    type="number"
                    value={closeActualCash}
                    onChange={(e) => setCloseActualCash(e.target.value)}
                    placeholder="Hitung uang laci riil & masukkan di sini..."
                    className="w-full py-2.5 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold font-mono text-zinc-900 dark:text-zinc-50 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Catatan / Keterangan Shift</label>
                  <textarea
                    rows={2}
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder="Contoh: Selisih Rp 2.000 karena tidak ada kembalian pecahan koin..."
                    className="w-full py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-xs text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                {/* Real-time difference feedback */}
                {closeActualCash !== "" && (
                  <div className="p-3 rounded-xl flex items-center justify-between text-xs font-semibold bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-400">Selisih Keuangan:</span>
                    <span className={`font-extrabold text-sm ${
                      (parseFloat(closeActualCash) - (activeShift.starting_cash + activeShift.total_cash_sales)) === 0 
                        ? "text-emerald-500" 
                        : (parseFloat(closeActualCash) - (activeShift.starting_cash + activeShift.total_cash_sales)) > 0 
                          ? "text-emerald-500" 
                          : "text-red-500"
                    }`}>
                      {(parseFloat(closeActualCash) - (activeShift.starting_cash + activeShift.total_cash_sales)) === 0 
                        ? "Pas (Sesuai)" 
                        : (parseFloat(closeActualCash) - (activeShift.starting_cash + activeShift.total_cash_sales)) > 0 
                          ? `Kelebihan (+${formatRupiah(parseFloat(closeActualCash) - (activeShift.starting_cash + activeShift.total_cash_sales))})` 
                          : `Kekurangan (${formatRupiah(parseFloat(closeActualCash) - (activeShift.starting_cash + activeShift.total_cash_sales))})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-350 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (closeActualCash === "") {
                      alert("Silakan isi jumlah uang laci riil terlebih dahulu!");
                      return;
                    }
                    const closed = await POSStorage.closeShift(parseFloat(closeActualCash) || 0, closeNotes);
                    if (closed) {
                      setActiveShift(null);
                      setShowCloseShiftModal(false);
                      setShowShiftSummaryReceipt(closed);
                    }
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Tutup Shift & Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
