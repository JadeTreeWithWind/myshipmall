export const usePwaInstall = () => {
  const deferredPrompt = useState<any>("pwa-prompt", () => null);
  const showInstallBanner = useState("pwa-show-banner", () => false);

  const initInstallPrompt = () => {
    if (import.meta.server) return;

    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // 使用者 3 天內關掉過就不再顯示
    const dismissed = localStorage.getItem("pwa-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 3 * 24 * 60 * 60 * 1000)
      return;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt.value = e;
      showInstallBanner.value = true;
    });

    window.addEventListener("appinstalled", () => {
      showInstallBanner.value = false;
      deferredPrompt.value = null;
    });
  };

  const install = async () => {
    if (!deferredPrompt.value) return;
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    if (outcome === "accepted") {
      showInstallBanner.value = false;
    }
    deferredPrompt.value = null;
  };

  const dismiss = () => {
    showInstallBanner.value = false;
    deferredPrompt.value = null;
    localStorage.setItem("pwa-dismissed", String(Date.now()));
  };

  return { showInstallBanner, initInstallPrompt, install, dismiss };
};
