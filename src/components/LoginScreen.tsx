import React, { useState } from "react";
import { Crown, Shield, Coins, Lock, Eye, EyeOff, Sparkles, AlertCircle, Mail, WifiOff, Wifi, Sun, Moon, Layers, Percent, TrendingUp } from "lucide-react";
import { POSStorage } from "../lib/storage";
import { loginWithSupabase } from "../lib/auth";
import { UserRole } from "../lib/types";
import { useTheme } from "../lib/ThemeContext";

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole) => void;
}

const REMEMBER_EMAIL_KEY = "pos_remember_email";

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { isDark, toggleTheme } = useTheme();
  const isOnline = POSStorage.isSupabaseActive();

  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_EMAIL_KEY) || "");
  const [rememberEmail, setRememberEmail] = useState(() => !!localStorage.getItem(REMEMBER_EMAIL_KEY));
  const [onlinePassword, setOnlinePassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [useOfflineFallback, setUseOfflineFallback] = useState(!isOnline);
  const [selectedRole, setSelectedRole] = useState<UserRole>("kasir");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settings = POSStorage.getSettings();
  const passwords = settings.passwords || {
    owner: "owner123",
    admin: "admin123",
    kasir: "kasir123"
  };

  const handleOnlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await loginWithSupabase(email.trim(), onlinePassword);
    setIsSubmitting(false);
    if (result.ok && result.role) {
      if (rememberEmail) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      onLoginSuccess(result.role);
    } else {
      setError(result.error || "Email atau password salah.");
    }
  };

  const handleOfflineLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const correctPassword = passwords[selectedRole];
    if (password === correctPassword) {
      onLoginSuccess(selectedRole);
    } else {
      setError("Kata sandi yang Anda masukkan salah. Silakan coba lagi!");
    }
  };

  const roleConfigs = [
    {
      role: "owner" as UserRole,
      title: "Owner / Pemilik",
      icon: Crown,
      color: "from-amber-500 to-yellow-500",
      bgLight: isDark ? "bg-amber-500/10" : "bg-amber-50",
      borderActive: "border-amber-500",
      textCol: isDark ? "text-amber-400" : "text-amber-600",
      desc: "Akses Penuh: Laporan finansial, edit stok barang, setup printer, reset database, & ubah password."
    },
    {
      role: "admin" as UserRole,
      title: "Administrator",
      icon: Shield,
      color: "from-emerald-500 to-teal-500",
      bgLight: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
      borderActive: "border-emerald-500",
      textCol: isDark ? "text-emerald-400" : "text-emerald-600",
      desc: "Akses Operasional: Melihat ringkasan dashboard, manajemen katalog barang, & riwayat sales."
    },
    {
      role: "kasir" as UserRole,
      title: "Petugas Kasir",
      icon: Coins,
      color: "from-blue-500 to-indigo-500",
      bgLight: isDark ? "bg-blue-500/10" : "bg-blue-50",
      borderActive: "border-blue-500",
      textCol: isDark ? "text-blue-400" : "text-blue-600",
      desc: "Akses Kasir POS: Registrasi shift kasir, transaksi penjualan barang, print struk thermal, & rollback."
    }
  ];

  const featureHighlights = [
    { icon: Wifi, label: "Kasir Offline & Online", desc: "Tetap jalan walau internet mati" },
    { icon: Layers, label: "Multi-Satuan & Harga", desc: "Pcs, Dus, Karton otomatis" },
    { icon: Percent, label: "Diskon Bertingkat", desc: "Per barang, otomatis dihitung" },
    { icon: TrendingUp, label: "Laporan Untung & HPP", desc: "Omset, profit, stok real-time" },
  ];

  const inputClass = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold tracking-wide text-slate-900";
  const labelClass = "text-xs font-bold text-slate-500 block tracking-wider uppercase";

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row transition-colors duration-200" id="pos-login-page">

      {/* Theme Toggle — top right, always reachable */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
        className={`fixed top-4 right-4 p-2.5 rounded-xl ${isDark ? "bg-slate-800 text-amber-400 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"} transition-all duration-200 cursor-pointer z-50 shadow-sm`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* LEFT: Marketing panel (disembunyikan di layar kecil biar login cepat diakses di HP kasir) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 -translate-y-1/3" />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900">ASYIFA POS</h1>
            <span className="text-[10px] text-emerald-600 font-semibold tracking-widest uppercase">Multi-Satuan</span>
          </div>
        </div>

        <div className="max-w-md space-y-8 relative z-10">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"} text-[11px] font-bold rounded-full`}>
            <Sparkles className="w-3 h-3" /> Asyifa Smart POS &amp; Inventory
          </span>

          <h2 className="text-4xl xl:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Kelola Transaksi dan Stok Toko Anda dengan{" "}
            <span className="text-emerald-500">Mudah.</span>
          </h2>

          <p className="text-sm text-slate-500 leading-relaxed">
            Sistem Kasir (POS) &amp; Manajemen Stok multi-satuan yang cepat dan tetap bisa dipakai
            walau koneksi internet sedang bermasalah.
          </p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-2">
            {featureHighlights.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-100"} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{f.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 relative z-10">
          © {new Date().getFullYear()} Asyifa POS. Seluruh hak cipta dilindungi.
        </p>
      </div>

      {/* RIGHT: Login card */}
      <div className={`flex-1 flex items-center justify-center p-4 md:p-8 ${isDark ? "bg-slate-950/40" : "bg-slate-50"}`}>
        <div className="w-full max-w-md space-y-6">

          {/* Logo ringkas khusus tampilan mobile (panel kiri disembunyikan) */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">ASYIFA POS</h1>
              <span className="text-[10px] text-emerald-600 font-semibold tracking-widest uppercase">Multi-Satuan</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-900/5 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Selamat Datang Kembali</h2>
              <p className="text-xs text-slate-500 mt-1.5">
                {useOfflineFallback
                  ? "Mode offline aktif — masuk dengan password role lokal."
                  : "Masukkan email dan password untuk masuk ke dashboard Asyifa POS."}
              </p>
            </div>

            {!useOfflineFallback ? (
              <form onSubmit={handleOnlineLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className={labelClass}>Alamat Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      placeholder="nama@tokoanda.com"
                      className={inputClass}
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={labelClass}>Kata Sandi</label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={onlinePassword}
                      onChange={(e) => { setOnlinePassword(e.target.value); setError(null); }}
                      placeholder="Masukkan password..."
                      className={`${inputClass} pr-12`}
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
                  />
                  Ingat email saya
                </label>

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex gap-2.5 items-center">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-60">
                  {isSubmitting ? "Memeriksa..." : "Masuk ke Aplikasi"}
                </button>

                <p className="text-center text-[10px] text-slate-400">
                  Lupa password? Hubungi Owner/Admin toko untuk direset.
                </p>

                <button type="button" onClick={() => { setUseOfflineFallback(true); setError(null); }} className="w-full text-center text-[10px] text-slate-400 hover:text-emerald-500 flex items-center justify-center gap-1.5 cursor-pointer">
                  <WifiOff className="w-3 h-3" /> Tidak ada internet? Pakai mode offline
                </button>
              </form>
            ) : (
              <form onSubmit={handleOfflineLogin} className="space-y-5">
                <div className={`p-3 ${isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"} border rounded-xl text-[11px] flex gap-2.5 items-start`}>
                  <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Mode offline memakai password role lokal (kurang aman, hanya untuk keadaan tanpa internet). Setelah online kembali, gunakan login email agar tercatat dengan benar.</span>
                </div>

                <div className="space-y-3">
                  <label className={labelClass}>Pilih Tingkat Akses:</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {roleConfigs.map((cfg) => {
                      const Icon = cfg.icon;
                      const isSelected = selectedRole === cfg.role;
                      return (
                        <button
                          key={cfg.role}
                          type="button"
                          onClick={() => { setSelectedRole(cfg.role); setError(null); }}
                          className={`w-full flex items-start gap-3.5 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                            isSelected ? `${cfg.bgLight} ${cfg.borderActive} shadow-md` : (isDark ? "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80" : "bg-slate-50 border-slate-200 hover:bg-slate-100")
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${cfg.color} flex items-center justify-center shrink-0 shadow-md`}>
                            <Icon className="w-4.5 h-4.5 text-slate-950" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{cfg.title}</span>
                              {isSelected && <span className={`text-[10px] font-extrabold uppercase ${cfg.textCol}`}>AKTIF</span>}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{cfg.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Kata Sandi (Password):</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      placeholder={`Masukkan password ${selectedRole}...`}
                      className={`${inputClass} pr-12`}
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex gap-2.5 items-center">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] transition-all cursor-pointer">
                  Masuk (Mode Offline)
                </button>

                {isOnline && (
                  <button type="button" onClick={() => { setUseOfflineFallback(false); setError(null); }} className="w-full text-center text-[10px] text-slate-400 hover:text-emerald-500 cursor-pointer">
                    Kembali ke login email (online)
                  </button>
                )}
              </form>
            )}
          </div>

          <p className="text-center text-[11px] text-slate-400 lg:hidden">
            © {new Date().getFullYear()} Asyifa POS. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}
