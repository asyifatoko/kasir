import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, ShoppingCart, Layers, History, Settings, 
  Clock, Wifi, Sparkles, UserCheck, Menu, X, LogOut, Warehouse,
  Sun, Moon
} from "lucide-react";
import POSDashboard from "./components/POSDashboard";
import POSCashier from "./components/POSCashier";
import ItemManager from "./components/ItemManager";
import TransactionHistory from "./components/TransactionHistory";
import DatabaseSettings from "./components/DatabaseSettings";
import LoginScreen from "./components/LoginScreen";
import StockAndPurchase from "./components/StockAndPurchase";
import { UserRole } from "./lib/types";
import { POSStorage } from "./lib/storage";
import { getCurrentSupabaseRole, logoutSupabase } from "./lib/auth";
import { supabase } from "./lib/supabase";
import { useTheme } from "./lib/ThemeContext";

export default function App() {
  const { theme, toggleTheme, isDark } = useTheme();

  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(() => {
    return localStorage.getItem("pos_current_role") as UserRole | null;
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cashier' | 'items' | 'stock' | 'history' | 'settings'>('dashboard');
  const [timeStr, setTimeStr] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isOfflineSession = !POSStorage.isSupabaseActive();

  useEffect(() => {
    if (isOfflineSession) return;
    let isMounted = true;
    getCurrentSupabaseRole().then((role) => {
      if (isMounted && role) {
        setCurrentUserRole(role);
        localStorage.setItem("pos_current_role", role);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setCurrentUserRole(null);
        localStorage.removeItem("pos_current_role");
        return;
      }
      const role = await getCurrentSupabaseRole();
      if (role) {
        setCurrentUserRole(role);
        localStorage.setItem("pos_current_role", role);
      }
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [isOfflineSession]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("id-ID", {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cashier', label: 'Kasir POS', icon: ShoppingCart },
    { id: 'items', label: 'Daftar Barang', icon: Layers },
    { id: 'stock', label: 'Stok & Logistik', icon: Warehouse },
    { id: 'history', label: 'Riwayat Transaksi', icon: History },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ] as const;

  const getAuthorizedMenuItems = () => {
    if (!currentUserRole) return [];
    if (currentUserRole === "owner") return menuItems;
    if (currentUserRole === "admin") return menuItems.filter(item => item.id !== "settings");
    return menuItems.filter(item => item.id === "cashier" || item.id === "history");
  };

  useEffect(() => {
    if (currentUserRole) {
      const allowedIds = getAuthorizedMenuItems().map(item => item.id);
      if (!allowedIds.includes(activeTab as any)) {
        setActiveTab(allowedIds[0] as any);
      }
    }
  }, [currentUserRole]);

  const handleLoginSuccess = (role: UserRole) => {
    setCurrentUserRole(role);
    localStorage.setItem("pos_current_role", role);
    setActiveTab(role === "kasir" ? "cashier" : "dashboard");
  };

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem kasir ASYIFA?")) {
      if (!isOfflineSession) await logoutSupabase();
      setCurrentUserRole(null);
      localStorage.removeItem("pos_current_role");
    }
  };

  const getRoleBadgeLabel = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'Owner / Pemilik';
      case 'admin': return 'Administrator';
      case 'kasir': return 'Petugas Kasir';
      default: return 'User';
    }
  };

  if (!currentUserRole) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const authorizedMenuItems = getAuthorizedMenuItems();

  // Shared styles derived from current theme
  const rootBg    = isDark ? "bg-slate-900"  : "bg-slate-100";
  const sidebarBg = isDark ? "bg-slate-950"  : "bg-white";
  const sidebarBorder = isDark ? "border-slate-800/80" : "border-slate-200";
  const navActive = isDark
    ? "bg-slate-800 text-slate-50 font-bold border-emerald-500 shadow-md"
    : "bg-emerald-50 text-emerald-700 font-bold border-emerald-500 shadow-sm";
  const navInactive = isDark
    ? "text-slate-400 border-transparent hover:text-white hover:bg-slate-800/30"
    : "text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-100";
  const footerBg = isDark ? "bg-slate-950/40" : "bg-slate-50/80";
  const textPrimary  = isDark ? "text-slate-50"  : "text-slate-900";
  const textSecond   = isDark ? "text-slate-400" : "text-slate-500";
  const badgeTime    = isDark ? "bg-slate-800 border-slate-700/80 text-slate-400" : "bg-white border-slate-200 text-slate-600";
  const roleBadge    = isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700";
  const divider      = isDark ? "border-slate-800/60" : "border-slate-200";
  const headerBg     = isDark ? "bg-slate-950"  : "bg-white";
  const headerBorder = isDark ? "border-slate-800/85" : "border-slate-200";
  const mobileMenuBg = isDark ? "bg-slate-950"  : "bg-white";
  const mobileMenuBorder = isDark ? "border-slate-850" : "border-slate-100";
  const mobileActive = isDark
    ? "bg-slate-800 text-emerald-400 border-l-4 border-emerald-500 pl-3"
    : "bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 pl-3";
  const mobileInactive = isDark
    ? "text-slate-400 hover:text-white hover:bg-slate-900"
    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50";
  const toggleBg = isDark
    ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
    : "bg-slate-100 text-slate-600 hover:bg-slate-200";

  return (
    <div className={`min-h-screen ${rootBg} ${textPrimary} font-sans flex flex-col md:flex-row antialiased transition-colors duration-200`}>

      {/* SIDEBAR - DESKTOP */}
      <aside className={`hidden md:flex md:w-64 ${sidebarBg} text-white flex-col justify-between shrink-0 shadow-xl border-r ${sidebarBorder} relative transition-colors duration-200`}>
        <div className="p-6 space-y-8">

          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <h1 className={`text-base font-extrabold tracking-tight ${textPrimary}`}>ASYIFA POS</h1>
                <span className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">Multi-Satuan</span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              className={`p-2 rounded-lg ${toggleBg} transition-all duration-200 cursor-pointer`}
            >
              {isDark
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Nav */}
          <nav className="space-y-1.5">
            {authorizedMenuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer border-l-4 ${
                    isActive ? navActive : navInactive
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`p-5 border-t ${sidebarBorder} space-y-3 ${footerBg} transition-colors duration-200`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"} flex items-center justify-center shrink-0`}>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className={`text-xs font-bold block truncate ${textPrimary}`}>Asyifa Mart</span>
                <span className="text-[9px] text-amber-400 font-bold block tracking-wide truncate uppercase">{getRoleBadgeLabel(currentUserRole)}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar / Ganti Akun"
              className={`p-1.5 hover:bg-rose-500/15 hover:text-rose-400 ${textSecond} rounded-lg transition-all cursor-pointer`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className={`flex items-center justify-between text-[10px] ${textSecond} pt-1`}>
            <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-emerald-500" /> Sync On</span>
            <span className="font-mono">{timeStr}</span>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className={`md:hidden ${headerBg} ${textPrimary} p-4 flex items-center justify-between shadow-md relative z-40 border-b ${headerBorder} transition-colors duration-200`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-slate-950" />
          </div>
          <h1 className={`text-sm font-bold tracking-tight ${textPrimary}`}>ASYIFA POS</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Mode Terang" : "Mode Gelap"}
            className={`p-1.5 rounded-lg ${toggleBg} transition-all duration-200 cursor-pointer`}
          >
            {isDark
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-1 ${textSecond} hover:${textPrimary} cursor-pointer`}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className={`absolute top-full left-0 w-full ${mobileMenuBg} border-b ${mobileMenuBorder} p-4 space-y-2 flex flex-col shadow-xl transition-colors duration-200`}>
            {authorizedMenuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive ? mobileActive : mobileInactive
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer border-t border-slate-900 mt-2 pt-3"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Keluar / Logout
            </button>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">

        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${divider} pb-4`}>
          <div>
            <h2 className={`text-xl font-extrabold tracking-tight ${textPrimary} capitalize`}>
              {activeTab === 'dashboard' ? 'Overview Toko'
                : activeTab === 'cashier' ? 'Kasir Register'
                : activeTab === 'items' ? 'Katalog Master'
                : activeTab === 'stock' ? 'Stok & Logistik'
                : activeTab === 'history' ? 'Ledger Penjualan'
                : 'Database Setup'}
            </h2>
            <p className={`text-xs ${textSecond} mt-1`}>
              Selamat bekerja! Login sebagai <span className="text-amber-400 font-bold">{getRoleBadgeLabel(currentUserRole)}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 ${badgeTime} rounded-xl border shadow-sm text-xs font-semibold font-mono transition-colors duration-200`}>
              <Clock className="w-4 h-4 text-emerald-500" /> {timeStr || "Loading..."}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 ${roleBadge} rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors duration-200`}>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {getRoleBadgeLabel(currentUserRole)}
            </div>
          </div>
        </div>

        <div className="transition-all duration-200">
          {activeTab === 'dashboard' && <POSDashboard onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'cashier' && <POSCashier />}
          {activeTab === 'items' && <ItemManager />}
          {activeTab === 'stock' && <StockAndPurchase />}
          {activeTab === 'history' && <TransactionHistory />}
          {activeTab === 'settings' && <DatabaseSettings />}
        </div>
      </main>
    </div>
  );
}
