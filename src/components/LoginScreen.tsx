import React, { useState } from "react";
import { Crown, Shield, Coins, Lock, Eye, EyeOff, Sparkles, AlertCircle, Mail, WifiOff, Sun, Moon } from "lucide-react";
import { POSStorage } from "../lib/storage";
import { loginWithSupabase } from "../lib/auth";
import { UserRole } from "../lib/types";
import { useTheme } from "../lib/ThemeContext";

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { isDark, toggleTheme } = useTheme();
  const isOnline = POSStorage.isSupabaseActive();

  const [email, setEmail] = useState("");
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

  // Theme-aware class shorthands
  const rootBg     = isDark ? "bg-slate-900 text-slate-100"  : "bg-slate-100 text-slate-900";
  const cardBg     = isDark ? "bg-slate-950/80 border-slate-800" : "bg-white/90 border-slate-200";
  const inputBg    = isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-900";
  const labelColor = isDark ? "text-slate-400" : "text-slate-500";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecond  = isDark ? "text-slate-400" : "text-slate-500";
  const roleCardInactive = isDark ? "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80" : "bg-slate-50 border-slate-200 hover:bg-slate-100";
  const roleCardTitle    = isDark ? "text-white" : "text-slate-900";
  const roleCardDesc     = isDark ? "text-slate-400" : "text-slate-500";
  const toggleBg   = isDark ? "bg-slate-800 text-yellow-400 hover:bg-slate-700" : "bg-slate-200 text-slate-600 hover:bg-slate-300";

  const inputClass = `w-full pl-10 pr-4 py-3 ${inputBg} rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold tracking-wide transition-colors`;
  const inputIconColor = isDark ? "text-slate-500" : "text-slate-400";

  return (
    <div className={`min-h-screen ${rootBg} flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden transition-colors duration-200`} id="pos-login-page">
      {/* Ambient background glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${isDark ? "bg-emerald-500/5" : "bg-emerald-400/8"} rounded-full blur-[100px] pointer-events-none`} />
      <div className={`absolute top-10 left-10 w-[300px] h-[300px] ${isDark ? "bg-amber-500/5" : "bg-amber-400/6"} rounded-full blur-[80px] pointer-events-none`} />

      {/* Theme Toggle — top right */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
        className={`fixed top-4 right-4 p-2.5 rounded-xl ${toggleBg} transition-all duration-200 cursor-pointer z-50 shadow-sm`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-lg space-y-8 z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 shadow-xl shadow-emerald-500/10">
            <Sparkles className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${textPrimary} uppercase`}>SISTEM KASIR ASYIFA</h1>
            <p className={`text-xs ${textSecond} mt-1 max-w-sm mx-auto`}>
              {useOfflineFallback
                ? "Mode offline aktif — masuk dengan password role lokal."
                : "Masuk dengan akun email yang telah didaftarkan Owner."}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className={`${cardBg} backdrop-blur-xl border rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 transition-colors duration-200`}>

          {!useOfflineFallback ? (
            <form onSubmit={handleOnlineLogin} className="space-y-6">
              <div className="space-y-2">
                <label className={`text-xs font-bold ${labelColor} block tracking-wider uppercase`}>Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="nama@tokoanda.com"
                    className={`${inputClass} border`}
                  />
                  <Mail className={`w-4 h-4 ${inputIconColor} absolute left-3.5 top-3.5`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold ${labelColor} block tracking-wider uppercase`}>Kata Sandi</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={onlinePassword}
                    onChange={(e) => { setOnlinePassword(e.target.value); setError(null); }}
                    placeholder="Masukkan password..."
                    className={`${inputClass} pr-12 border`}
                  />
                  <Lock className={`w-4 h-4 ${inputIconColor} absolute left-3.5 top-3.5`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-3 p-1 ${inputIconColor} hover:text-slate-300 cursor-pointer`}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex gap-2.5 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-60">
                {isSubmitting ? "Memeriksa..." : "Masuk Sistem Kasir"}
              </button>

              <button type="button" onClick={() => { setUseOfflineFallback(true); setError(null); }} className={`w-full text-center text-[10px] ${textSecond} hover:text-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer`}>
                <WifiOff className="w-3 h-3" /> Tidak ada internet? Pakai mode offline
              </button>
            </form>
          ) : (
            <form onSubmit={handleOfflineLogin} className="space-y-6">
              <div className={`p-3 ${isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"} border rounded-xl text-[11px] flex gap-2.5 items-start`}>
                <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Mode offline memakai password role lokal (kurang aman, hanya untuk keadaan tanpa internet). Setelah online kembali, gunakan login email agar tercatat dengan benar.</span>
              </div>

              <div className="space-y-3">
                <label className={`text-xs font-bold ${labelColor} block tracking-wider uppercase`}>Pilih Tingkat Akses:</label>
                <div className="grid grid-cols-1 gap-3">
                  {roleConfigs.map((cfg) => {
                    const Icon = cfg.icon;
                    const isSelected = selectedRole === cfg.role;
                    return (
                      <button
                        key={cfg.role}
                        type="button"
                        onClick={() => { setSelectedRole(cfg.role); setError(null); }}
                        className={`w-full flex items-start gap-4 p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                          isSelected ? `${cfg.bgLight} ${cfg.borderActive} shadow-lg` : roleCardInactive
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cfg.color} flex items-center justify-center shrink-0 shadow-md`}>
                          <Icon className="w-5 h-5 text-slate-950" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${roleCardTitle}`}>{cfg.title}</span>
                            {isSelected && <span className={`text-[10px] font-extrabold uppercase ${cfg.textCol}`}>AKTIF</span>}
                          </div>
                          <p className={`text-[10px] ${roleCardDesc} mt-1 leading-relaxed`}>{cfg.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-bold ${labelColor} tracking-wider uppercase`}>Kata Sandi (Password):</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder={`Masukkan password ${selectedRole}...`}
                    className={`${inputClass} pr-12 border`}
                  />
                  <Lock className={`w-4 h-4 ${inputIconColor} absolute left-3.5 top-3.5`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-3 p-1 ${inputIconColor} hover:text-slate-300 cursor-pointer`}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex gap-2.5 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] transition-all cursor-pointer">
                Masuk (Mode Offline)
              </button>

              {isOnline && (
                <button type="button" onClick={() => { setUseOfflineFallback(false); setError(null); }} className={`w-full text-center text-[10px] ${textSecond} hover:text-emerald-400 cursor-pointer`}>
                  Kembali ke login email (online)
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
