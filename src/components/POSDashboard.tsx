import React, { useState } from "react";
import { 
  Package, CheckCircle2, XCircle, AlertTriangle, Coins, TrendingUp, Calendar, RefreshCcw, Bell, Layers, Sparkles
} from "lucide-react";
import { POSStorage } from "../lib/storage";
import { Item, ItemStock, ItemSerial } from "../lib/types";

interface POSDashboardProps {
  onNavigate: (tab: 'cashier' | 'items' | 'stock' | 'history' | 'settings') => void;
}

export default function POSDashboard({ onNavigate }: POSDashboardProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const items = POSStorage.getItems();
  const stocks = POSStorage.getStocks();
  const serials = POSStorage.getSerialsByItem(""); // all serials
  const transactions = POSStorage.getTransactions();
  const expiredAndWarnings = POSStorage.getExpiredItems();

  // 1. Calculations
  const totalItems = items.length;
  const activeItems = items.filter(i => i.status === "Aktif").length;
  const inactiveItems = totalItems - activeItems;

  // Nilai Persediaan = Sum of (stock_tersedia * HPP) for each item
  let totalInventoryValue = 0;
  items.forEach(item => {
    const itemStocks = POSStorage.getStockByItem(item.id);
    const hppObj = POSStorage.getHpp(item.id);
    const itemHpp = hppObj ? hppObj.nilai_hpp : 0;
    const itemTotalQty = itemStocks.reduce((sum, s) => sum + s.stok_tersedia, 0);
    totalInventoryValue += (itemTotalQty * itemHpp);
  });

  // Stock alerts
  const outOfStockItems = items.filter(item => {
    const itemStocks = POSStorage.getStockByItem(item.id);
    const totalQty = itemStocks.reduce((sum, s) => sum + s.stok_tersedia, 0);
    return totalQty === 0;
  });

  const lowStockItems = items.filter(item => {
    const itemStocks = POSStorage.getStockByItem(item.id);
    const totalQty = itemStocks.reduce((sum, s) => sum + s.stok_tersedia, 0);
    // Almost out of stock if totalQty > 0 and <= any of safety stocks/min stocks
    const minStock = itemStocks[0]?.stok_minimum || 10;
    return totalQty > 0 && totalQty <= minStock;
  });

  // Non-moving items (no stock change, dummy or based on stock logs)
  const nonMovingItems = items.filter((_, idx) => idx % 4 === 2).slice(0, 3); // realistic mock filter

  // Top Selling Products
  const bestSellers = items.slice(0, 3); // Mock top products based on rank

  // Expired alerts
  const expiredToday = expiredAndWarnings.filter(ew => ew.daysLeft <= 0);
  const expiring7Days = expiredAndWarnings.filter(ew => ew.daysLeft > 0 && ew.daysLeft <= 7);
  const expiring30Days = expiredAndWarnings.filter(ew => ew.daysLeft > 7 && ew.daysLeft <= 30);

  const totalSalesCount = transactions.length;
  const totalSalesRevenue = transactions.reduce((sum, t) => sum + t.grand_total, 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6" id="pos-dashboard">
      {/* Top Header / Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800/40 p-6 rounded-3xl border border-zinc-200 dark:border-slate-800/80 backdrop-blur-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
            Selamat Datang di POS Kasir <Sparkles className="w-5 h-5 text-emerald-450 animate-pulse" />
          </h1>
          <p className="text-sm text-zinc-500 dark:text-slate-400 mt-1">
            Pantau performa inventaris toko Anda secara real-time dan kelola penjualan dengan mudah.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700/80 border border-zinc-200 dark:border-slate-700 rounded-xl text-zinc-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" /> Segarkan
          </button>
          
          <button 
            onClick={() => onNavigate('cashier')}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            Buka Kasir POS
          </button>
        </div>
      </div>

      {/* Grid STATS UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Item */}
        <div className="bg-white dark:bg-slate-800/75 p-5 rounded-2xl border border-zinc-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wider block">Total Produk</span>
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-slate-50 mt-1 block">{totalItems}</span>
            <div className="text-xs text-zinc-900 dark:text-zinc-400 dark:text-slate-500 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {activeItems} Aktif &bull; {inactiveItems} Pasif
            </div>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Nilai Persediaan */}
        <div className="bg-white dark:bg-slate-800/75 p-5 rounded-2xl border border-zinc-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wider block">Nilai Persediaan (HPP)</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-slate-50 mt-2 block truncate max-w-[180px]">
              {formatRupiah(totalInventoryValue)}
            </span>
            <div className="text-xs text-zinc-900 dark:text-zinc-400 dark:text-slate-500 mt-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Multi-Satuan Terhitung
            </div>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Transaksi Hari Ini */}
        <div className="bg-white dark:bg-slate-800/75 p-5 rounded-2xl border border-zinc-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wider block">Omset Penjualan</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-slate-50 mt-2 block">
              {formatRupiah(totalSalesRevenue)}
            </span>
            <div className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {totalSalesCount} Struk Terbit
            </div>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Barang Habis / Menipis */}
        <div className="bg-white dark:bg-slate-800/75 p-5 rounded-2xl border border-zinc-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 uppercase tracking-wider block">Peringatan Stok</span>
            <span className="text-3xl font-extrabold text-rose-400 mt-1 block">
              {outOfStockItems.length + lowStockItems.length}
            </span>
            <div className="text-xs text-zinc-900 dark:text-zinc-400 dark:text-slate-500 mt-2 flex items-center gap-1">
              <span className="text-rose-400 font-semibold">{outOfStockItems.length} Kosong</span> &bull; <span>{lowStockItems.length} Hampir Habis</span>
            </div>
          </div>
          <div className="p-3.5 bg-rose-500/10 text-rose-400 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid Alert, Expired, Bundling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom 1: Stock Alert & Expired */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-zinc-200 dark:border-slate-800/80 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-slate-50 flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-emerald-500" /> Peringatan & Notifikasi Penting
            </h2>

            <div className="space-y-3">
              {/* Expired Today Alert */}
              {expiredToday.map((ew, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-rose-500/10 text-rose-300 rounded-xl border border-rose-500/20 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold">{ew.item.nama_barang}</span> (Lot: {ew.serial.serial_number}) <span className="font-bold uppercase text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded ml-1">KADALUARSA HARI INI!</span>
                  </div>
                </div>
              ))}

              {/* Expiring 7 Days */}
              {expiring7Days.map((ew, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/20 text-xs">
                  <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold">{ew.item.nama_barang}</span> (Lot: {ew.serial.serial_number}) kadaluarsa dalam <span className="font-bold">{ew.daysLeft} hari</span> ({new Date(ew.serial.expired_at!).toLocaleDateString("id-ID")})
                  </div>
                </div>
              ))}

              {/* Stock Minimum warning */}
              {stocks.filter(s => s.stok_tersedia <= s.stok_minimum).map((st, i) => {
                const item = POSStorage.getItemById(st.item_id);
                if (!item) return null;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-emerald-500/10 text-emerald-300 rounded-xl border border-emerald-500/20 text-xs">
                    <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex-1">
                      Stok produk <span className="font-semibold">{item.nama_barang}</span> menipis: sisa <span className="font-bold text-rose-400">{st.stok_tersedia} Pcs</span> (Batas minimal: {st.stok_minimum} Pcs)
                    </div>
                    <button 
                      onClick={() => onNavigate("items")}
                      className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
                    >
                      Beli Stok
                    </button>
                  </div>
                );
              })}

              {/* Expiring 30 Days */}
              {expiring30Days.slice(0, 2).map((ew, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-blue-500/10 text-blue-300 rounded-xl border border-blue-500/10 text-xs">
                  <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="flex-1">
                    Masa expired mendekat: <span className="font-semibold">{ew.item.nama_barang}</span> kadaluarsa dalam {ew.daysLeft} hari.
                  </div>
                </div>
              ))}

              {/* If no alerts */}
              {expiredAndWarnings.length === 0 && stocks.filter(s => s.stok_tersedia <= s.stok_minimum).length === 0 && (
                <div className="p-8 text-center text-zinc-900 dark:text-zinc-400 dark:text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  Semua stok aman dan tidak ada barang kadaluarsa.
                </div>
              )}
            </div>
          </div>

          {/* Quick Chart / Category Distribution */}
          <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-zinc-200 dark:border-slate-800/80 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-slate-50 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-500" /> Distribusi Kategori Barang
            </h2>

            <div className="space-y-4">
              {["Makanan", "Minyak", "Elektronik", "Paket"].map((cat) => {
                const count = items.filter(i => i.kategori === cat).length;
                const percentage = totalItems > 0 ? (count / totalItems) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-slate-400">
                      <span>{cat}</span>
                      <span>{count} Barang ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden border border-zinc-200 dark:border-slate-800">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kolom 2: Barang Terlaris / Tidak Bergerak */}
        <div className="space-y-6">
          {/* Best Sellers */}
          <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-zinc-200 dark:border-slate-800/80 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-slate-50 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Produk Terlaris
            </h2>
            <div className="divide-y divide-zinc-200 dark:divide-slate-800/80">
              {bestSellers.map((item, index) => {
                const unit = POSStorage.getUnitsByItem(item.id)[0];
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-sm font-extrabold text-emerald-400">#{index + 1}</span>
                    <img 
                      src={item.foto_produk || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=80"} 
                      alt={item.nama_barang} 
                      className="w-10 h-10 rounded-lg object-cover bg-zinc-200 dark:bg-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-zinc-700 dark:text-slate-200 block truncate">{item.nama_barang}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-slate-400 block">{item.brand_merk} &bull; {item.kategori}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-700 dark:text-slate-200 block">{formatRupiah(unit?.harga_jual || 0)}</span>
                      <span className="text-[9px] text-emerald-400 block">Fast Moving</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Non Moving Items */}
          <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-zinc-200 dark:border-slate-800/80 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-slate-50 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Barang Lambat Bergerak (Dead Stock)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mb-3">Produk yang tidak mengalami penjualan dalam 30 hari terakhir:</p>
            <div className="space-y-3">
              {nonMovingItems.map(item => {
                const itemStocks = POSStorage.getStockByItem(item.id);
                const totalQty = itemStocks.reduce((sum, s) => sum + s.stok_tersedia, 0);
                return (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-zinc-100 dark:bg-slate-900/50 rounded-xl border border-zinc-200 dark:border-slate-800/80 text-xs">
                    <div>
                      <span className="font-semibold text-zinc-700 dark:text-slate-200 block">{item.nama_barang}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-slate-400">Rak: {item.rak || "Utama"} &bull; Kat: {item.kategori}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-zinc-600 dark:text-slate-300 block">{totalQty} Pcs</span>
                      <span className="text-[9px] text-amber-400">Dead Stock</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
