import React, { useState, useEffect } from "react";
import { History, Search, Undo, ChevronDown, CheckCircle, Trash, RefreshCcw, DollarSign, Coins, Lock, LogOut, FileText, AlertCircle, Calendar } from "lucide-react";
import { POSStorage } from "../lib/storage";
import { Transaction, CashierShift } from "../lib/types";

export default function TransactionHistory() {
  const [activeTab, setActiveTab] = useState<'sales' | 'shifts'>('sales');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  useEffect(() => {
    setTransactions(POSStorage.getTransactions());
    setShifts(POSStorage.getShifts());
  }, []);

  // Pakai POSStorage.rollbackTransaction (bukan tulis localStorage manual)
  // supaya: (a) stok dikembalikan ke gudang yang SAMA saat dipotong,
  // (b) laporan shift dikoreksi balik, (c) transaksi ditandai
  // is_rolled_back (bukan dihapus) supaya jejak audit tetap ada,
  // (d) tersinkron ke Supabase, bukan cuma localStorage — temuan review #7.
  const handleRollback = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;
    if (tx.is_rolled_back) {
      alert("Transaksi ini sudah pernah dibatalkan sebelumnya.");
      return;
    }

    if (confirm("Apakah Anda yakin ingin membatalkan transaksi ini? Stok barang akan dikembalikan otomatis seperti semula dan laporan shift akan dikoreksi.")) {
      try {
        const success = await POSStorage.rollbackTransaction(txId);
        if (success) {
          setTransactions(POSStorage.getTransactions());
          setShifts(POSStorage.getShifts());
          alert("Transaksi berhasil dibatalkan, stok dikembalikan, dan laporan shift telah dikoreksi!");
        } else {
          alert("Gagal membatalkan transaksi (mungkin sudah dibatalkan sebelumnya).");
        }
      } catch (e) {
        console.error(e);
        alert("Terjadi kesalahan saat membatalkan transaksi.");
      }
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Profit/HPP calculations
  const calculateTxProfit = (tx: Transaction) => {
    let totalCost = 0;
    tx.items.forEach(cItem => {
      const hppObj = POSStorage.getHpp(cItem.item.id);
      const hppVal = hppObj ? hppObj.nilai_hpp : 0;
      totalCost += (hppVal * cItem.qty * cItem.selectedUnit.konversi);
    });
    const revenue = tx.subtotal;
    return Math.max(0, revenue - totalCost);
  };

  // Transaksi yang sudah dibatalkan (is_rolled_back) tidak lagi dihitung
  // sebagai omset/profit riil — supaya laporan tidak menggelembung.
  const activeTx = transactions.filter(t => !t.is_rolled_back);
  const totalOmset = activeTx.reduce((sum, t) => sum + t.grand_total, 0);
  const totalProfit = activeTx.reduce((sum, t) => sum + calculateTxProfit(t), 0);

  const filteredTx = transactions.filter(tx => {
    const q = searchQuery.toLowerCase();
    return (
      tx.invoice_no.toLowerCase().includes(q) ||
      tx.user_cashier.toLowerCase().includes(q) ||
      tx.payment_method.toLowerCase().includes(q)
    );
  });

  const filteredShifts = shifts.filter(sh => {
    const q = searchQuery.toLowerCase();
    return sh.cashier_name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6" id="pos-tx-history">
      
      {/* Top statistics summary for history */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/40 dark:bg-zinc-900/40 p-5 rounded-3xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl">
        <div className="p-4 bg-white/60 dark:bg-zinc-950/60 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Penjualan Kotor</span>
          <span className="text-xl font-extrabold text-zinc-900 dark:text-white mt-1.5 block">{formatRupiah(totalOmset)}</span>
          <span className="text-[10px] text-zinc-400 block mt-1">{activeTx.length} Total Penjualan Sukses{transactions.length > activeTx.length ? ` (${transactions.length - activeTx.length} dibatalkan)` : ""}</span>
        </div>

        <div className="p-4 bg-white/60 dark:bg-zinc-950/60 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Estimasi Keuntungan Bersih</span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5 block">{formatRupiah(totalProfit)}</span>
          <span className="text-[10px] text-zinc-400 block mt-1">Terhitung dari Selisih Harga Jual & HPP</span>
        </div>

        <div className="p-4 bg-white/60 dark:bg-zinc-950/60 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Log Riwayat Stok</span>
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">Aktif Melacak Aliran Barang</span>
            <span className="text-[10px] text-zinc-400 block">FIFO / Average terintegrasi</span>
          </div>
          <History className="w-8 h-8 text-indigo-500/80 stroke-[1.5]" />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-zinc-205 dark:border-zinc-800 pb-px">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'sales'
              ? "text-amber-500 font-extrabold"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          }`}
        >
          Riwayat Penjualan (Struk)
          {activeTab === 'sales' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full animate-fade-in" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('shifts');
            setShifts(POSStorage.getShifts()); // Refresh shifts list
          }}
          className={`pb-3 px-4 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'shifts'
              ? "text-amber-500 font-extrabold"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          }`}
        >
          Riwayat Shift Kasir & Laci Uang
          {activeTab === 'shifts' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full animate-fade-in" />
          )}
        </button>
      </div>

      {/* Filter search history */}
      <div className="flex bg-white/40 dark:bg-zinc-900/40 p-3 rounded-2xl border border-white/50 dark:border-zinc-800/50 backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'sales'
                ? "Cari transaksi berdasarkan invoice, kasir, atau metode pembayaran..."
                : "Cari shift berdasarkan nama petugas kasir..."
            }
            className="w-full pl-10 pr-4 py-2 bg-white/80 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-zinc-50"
          />
        </div>
      </div>

      {activeTab === 'sales' ? (
        /* Transaction List Table */
        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-3xl border border-white/40 dark:border-zinc-800/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/70 dark:bg-zinc-950/40 text-zinc-500 font-semibold border-b border-zinc-100 dark:border-zinc-850">
                  <th className="p-4">No. Invoice</th>
                  <th className="p-4">Tanggal & Waktu</th>
                  <th className="p-4">Kasir</th>
                  <th className="p-4">Metode Bayar</th>
                  <th className="p-4">Total Belanja</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {filteredTx.map((tx) => {
                  const isExpanded = expandedTxId === tx.id;
                  const profit = calculateTxProfit(tx);

                  return (
                    <React.Fragment key={tx.id}>
                      <tr 
                        className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 cursor-pointer transition-colors ${tx.is_rolled_back ? "opacity-50" : ""}`}
                        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                      >
                        <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                          <span className={tx.is_rolled_back ? "line-through" : ""}>{tx.invoice_no}</span>
                        </td>
                        <td className="p-4 text-zinc-600 dark:text-zinc-300">
                          {new Date(tx.tanggal).toLocaleString("id-ID")}
                        </td>
                        <td className="p-4 text-zinc-600 dark:text-zinc-300 font-semibold">
                          {tx.user_cashier}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-md">
                            {tx.payment_method}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-zinc-900 dark:text-white">
                          {formatRupiah(tx.grand_total)}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {tx.is_rolled_back ? (
                              <span className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-500/10 text-zinc-500 font-semibold text-[10px] rounded-lg">
                                <Undo className="w-3 h-3" /> Dibatalkan
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleRollback(tx.id)}
                                title="Batalkan Transaksi & Kembalikan Stok"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-[10px] rounded-lg transition-colors cursor-pointer"
                              >
                                <Undo className="w-3 h-3" /> Rollback
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded view for items inside invoice */}
                      {isExpanded && (
                        <tr className="bg-zinc-50/30 dark:bg-zinc-950/20">
                          <td colSpan={6} className="p-4 border-t border-b border-zinc-100 dark:border-zinc-800">
                            <div className="space-y-3 font-sans text-xs">
                              <span className="font-bold text-zinc-700 dark:text-zinc-300 block">Itemized Receipt Details:</span>
                              <div className="space-y-1.5">
                                {tx.items.map((cartItem, idx) => (
                                  <div key={idx} className="flex justify-between p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 text-[11px]">
                                    <div>
                                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{cartItem.item.nama_barang}</span>
                                      <span className="text-zinc-400 text-[10px] block">
                                        {cartItem.qty} {cartItem.selectedUnit.nama} x {formatRupiah(cartItem.price)} 
                                        {cartItem.serialNumber && ` &bull; S/N: ${cartItem.serialNumber}`}
                                      </span>
                                    </div>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                      {formatRupiah(cartItem.price * cartItem.qty)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-1.5">
                                <span>Total profit dari struk ini: <strong className="text-emerald-500 font-bold">{formatRupiah(profit)}</strong></span>
                                <span>Pajak (PPN 11%): {formatRupiah(tx.tax_total)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {filteredTx.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-zinc-400 bg-white/30 dark:bg-zinc-900/30">
                      Tidak ada riwayat transaksi tercatat yang cocok dengan kueri Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Shift History Table */
        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-3xl border border-white/40 dark:border-zinc-800/50 overflow-hidden shadow-sm animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/70 dark:bg-zinc-950/40 text-zinc-500 font-semibold border-b border-zinc-100 dark:border-zinc-850">
                  <th className="p-4">Petugas Kasir</th>
                  <th className="p-4">Waktu Mulai - Selesai</th>
                  <th className="p-4">Modal Awal Laci</th>
                  <th className="p-4">Tunai Masuk</th>
                  <th className="p-4">Fisik Laci</th>
                  <th className="p-4 text-right">Selisih & Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {filteredShifts.map((sh) => {
                  const diff = sh.difference || 0;
                  return (
                    <tr key={sh.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${sh.status === "Open" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{sh.cashier_name}</span>
                          {sh.status === "Open" && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 font-bold text-[8px] uppercase rounded">Aktif</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-zinc-600 dark:text-zinc-350 space-y-0.5">
                        <p className="flex items-center gap-1"><span className="text-zinc-400">Mulai:</span> {new Date(sh.start_time).toLocaleString("id-ID")}</p>
                        <p className="flex items-center gap-1"><span className="text-zinc-400">Selesai:</span> {sh.end_time ? new Date(sh.end_time).toLocaleString("id-ID") : "-"}</p>
                      </td>
                      <td className="p-4 font-mono text-zinc-700 dark:text-zinc-300">
                        {formatRupiah(sh.starting_cash)}
                      </td>
                      <td className="p-4 font-mono text-emerald-500">
                        +{formatRupiah(sh.total_cash_sales)}
                      </td>
                      <td className="p-4 font-mono font-bold text-zinc-900 dark:text-white">
                        {sh.status === "Open" ? "-" : formatRupiah(sh.actual_closing_cash || 0)}
                      </td>
                      <td className="p-4 text-right space-y-1">
                        {sh.status === "Open" ? (
                          <span className="text-[10px] text-zinc-400 italic">Sedang Berjalan</span>
                        ) : (
                          <>
                            <span className={`inline-block px-2 py-0.5 font-bold text-[10px] rounded-md ${
                              diff === 0 
                                ? "bg-emerald-500/10 text-emerald-500" 
                                : diff > 0 
                                  ? "bg-emerald-500/10 text-emerald-500 font-bold" 
                                  : "bg-red-500/10 text-red-500 font-bold"
                            }`}>
                              {diff === 0 ? "Pas (Sesuai)" : diff > 0 ? `Lebih (+${formatRupiah(diff)})` : `Kurang (${formatRupiah(diff)})`}
                            </span>
                            {sh.notes && (
                              <p className="text-[10px] text-zinc-400 italic line-clamp-1 max-w-[200px] ml-auto">"{sh.notes}"</p>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredShifts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-zinc-400 bg-white/30 dark:bg-zinc-900/30">
                      Belum ada riwayat register shift kasir.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
