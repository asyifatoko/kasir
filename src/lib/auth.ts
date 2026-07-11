import { supabase } from "./supabase";
import { UserRole } from "./types";

// =========================================================
// Auth ganda:
//  1. ONLINE (utama): Supabase Auth (email+password) + tabel
//     `profiles` untuk role. Ini yang divalidasi di server lewat
//     RLS -> aman, tidak bisa dibobol lewat console browser.
//  2. OFFLINE (cadangan): kalau Supabase tidak bisa dihubungi
//     (mati listrik/internet putus), aplikasi tetap bisa dipakai
//     dengan password role lokal seperti versi sebelumnya.
//     Mode ini SENGAJA ditandai tidak aman di UI, dan hanya
//     dipakai bila memang sedang offline.
// =========================================================

export interface AuthResult {
  ok: boolean;
  role?: UserRole;
  error?: string;
}

export async function loginWithSupabase(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: error?.message || "Login gagal" };
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileErr || !profile) {
    await supabase.auth.signOut();
    return { ok: false, error: "Akun ini belum diberi role. Hubungi Owner untuk mengatur akses." };
  }

  return { ok: true, role: profile.role as UserRole };
}

export async function getCurrentSupabaseRole(): Promise<UserRole | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (profile?.role as UserRole) || null;
}

export async function logoutSupabase() {
  await supabase.auth.signOut();
}
