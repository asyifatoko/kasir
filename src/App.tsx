import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, ShoppingCart, Layers, History, Settings, 
  Clock, Wifi, Sparkles, UserCheck, Menu, X, LogOut, Warehouse,
  Sun, Moon, Download
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
import { useTheme } from "./lib/theme";
import { usePwaInstall } from "./lib/pwaInstall";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { canInstall, promptInstall } = usePwaInstall();

  // Peran login sekarang divalidasi lewat 2 jalur:
  //  - Online: Supabase Auth session (aman, ditegakkan oleh RLS di server)
  //  - Offline: localStorage "pos_current_role" (cadangan saat tanpa internet)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(() => {
    return localStorage.getItem("pos_current_role") as UserRole | null;
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cashier' | 'items' | 'stock' | 'history' | 'settings'>('dashboard');
  const [timeStr, setTimeStr] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isOfflineSession = !POSStorage.isSupabaseActive();

  // Saat online, sinkronkan role dengan session Supabase Auth yang sesungguhnya
  // (bukan sekadar localStorage) supaya tidak bisa dipalsukan lewat console.
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

  // Dynamic Realtime Clock ticking
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
    if (currentUserRole === "owner") {
      return menuItems;
    } else if (currentUserRole === "admin") {
      return menuItems.filter(item => item.id !== "settings");
    } else { // kasir
      return menuItems.filter(item => item.id === "cashier" || item.id === "history");
    }
  };

  // Keep activeTab synchronized with role allowances
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
    if (role === "kasir") {
      setActiveTab("cashier");
    } else {
      setActiveTab("dashboard");
    }
  };

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem kasir ASYIFA?")) {
      if (!isOfflineSession) {
        await logoutSupabase();
      }
      setCurrentUserRole(null);
      localStorage.removeItem("pos_current_role");
    }
  };

  const getRoleBadgeLabel = (role: UserRole) => {
    switch(role) {
      case 'owner': return 'Owner / Pemilik';
      case 'admin': return 'Administrator';
      case 'kasir': return 'Petugas Kasir';
      default: return 'User';
    }
  };

  if (!currentUserRole) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  const authorizedMenuItems = getAuthorizedMenuItems();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-slate-900 dark:text-slate-100 font-sans flex flex-col md:flex-row antialiased transition-colors duration-200">
      
      {/* 1. SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden md:flex md:w-64 bg-slate-950 text-white flex-col justify-between shrink-0 shadow-xl border-r border-slate-800/80 relative">
        <div className="p-6 space-y-8">
          
          {/* Logo Brand / App Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">ASYIFA POS</h1>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">Multi-Satuan</span>
            </div>
          </div>
 
          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {authorizedMenuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer border-l-4 ${
                    isActive 
                      ? "bg-slate-800 text-slate-50 font-bold border-emerald-500 shadow-md" 
                      : "text-slate-400 border-transparent hover:text-white hover:bg-slate-800/30"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
 
        {/* Sidebar Footer Info */}
        <div className="p-5 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-850 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold block truncate">Asyifa Mart</span>
                <span className="text-[9px] text-amber-400 font-bold block tracking-wide truncate uppercase">{getRoleBadgeLabel(currentUserRole)}</span>
              </div>
            </div>

            {canInstall && (
              <button
                onClick={promptInstall}
                title="Install Aplikasi ke Perangkat"
                className="p-1.5 hover:bg-emerald-500/15 hover:text-emerald-400 text-slate-500 rounded-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              className="p-1.5 hover:bg-emerald-500/15 hover:text-emerald-400 text-slate-500 rounded-lg transition-all cursor-pointer"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLogout}
              title="Keluar / Ganti Akun"
              className="p-1.5 hover:bg-rose-500/15 hover:text-rose-400 text-slate-500 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
 
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-emerald-500" /> Sync On</span>
            <span className="font-mono">{timeStr}</span>
          </div>
        </div>
      </aside>
 
      {/* 2. MOBILE HEADER & NAVIGATION BAR */}
      <header className="md:hidden bg-slate-950 text-white p-4 flex items-center justify-between shadow-md relative z-40 border-b border-slate-800/85">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">ASYIFA POS</h1>
          </div>
        </div>
 
        <div className="flex items-center gap-1">
          {canInstall && (
            <button
              onClick={promptInstall}
              title="Install Aplikasi ke Perangkat"
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <Download className="w-4.5 h-4.5" />
            </button>
          )}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
 
        {/* Mobile Dropdown Menu overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-slate-950 border-b border-slate-850 p-4 space-y-2 flex flex-col shadow-xl">
            {authorizedMenuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? "bg-slate-800 text-emerald-400 border-l-4 border-emerald-500 pl-3" 
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}

            {/* Mobile Logout Button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer border-t border-slate-900 mt-2 pt-3"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Keluar / Logout
            </button>
          </div>
        )}
      </header>
 
      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* Dynamic header welcome bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-slate-800/60 pb-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-slate-50 capitalize">
              {activeTab === 'dashboard' ? 'Overview Toko' : activeTab === 'cashier' ? 'Kasir Register' : activeTab === 'items' ? 'Katalog Master' : activeTab === 'stock' ? 'Stok & Logistik' : activeTab === 'history' ? 'Ledger Penjualan' : 'Database Setup'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">
              Selamat bekerja! Login sebagai <span className="text-emerald-600 dark:text-amber-400 font-bold">{getRoleBadgeLabel(currentUserRole)}</span>.
            </p>
          </div>
 
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-slate-800 rounded-xl border border-zinc-200 dark:border-slate-700/80 shadow-sm text-xs text-zinc-500 dark:text-slate-400 font-semibold font-mono">
              <Clock className="w-4 h-4 text-emerald-500" /> {timeStr || "Loading..."}
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-[11px] font-bold uppercase tracking-wider">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {getRoleBadgeLabel(currentUserRole)}
            </div>
          </div>
        </div>

        {/* ACTIVE TAB COMPONENT SWITCH */}
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
