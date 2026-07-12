import { useEffect, useState } from "react";

// Menangkap event "beforeinstallprompt" milik browser supaya kita bisa
// menampilkan tombol "Install App" sendiri di dalam UI, alih-alih
// mengandalkan ikon install bawaan browser yang mudah tidak disadari
// pengguna toko. Event ini hanya muncul kalau browser menilai app sudah
// memenuhi syarat PWA (ada manifest + service worker aktif).
export function usePwaInstall() {
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    // Kalau app dibuka dari kondisi sudah ter-install (standalone mode),
    // tombol install memang tidak perlu ditampilkan sama sekali.
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return { canInstall: !!installEvent && !isInstalled, promptInstall, isInstalled };
}
