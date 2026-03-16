function recoverNavigationInteractivity() {
  const root = document.documentElement;
  const body = document.body;

  if (!root || !body) return;

  const hasOpenOverlay = Boolean(
    document.querySelector(
      '[data-state="open"].fixed.inset-0, [data-state="open"][class*="fixed"][class*="inset-0"]',
    ),
  );

  if (!hasOpenOverlay) {
    body.style.removeProperty("pointer-events");
    body.style.removeProperty("overflow");
  }

  document
    .querySelectorAll<HTMLElement>(
      '[data-state="closed"].fixed.inset-0, [data-state="closed"][class*="fixed"][class*="inset-0"]',
    )
    .forEach((element) => {
      element.style.pointerEvents = "none";
    });
}

export default defineNuxtPlugin(() => {
  const runRecovery = () => {
    window.requestAnimationFrame(() => {
      recoverNavigationInteractivity();
    });
  };

  window.addEventListener("focus", runRecovery);
  window.addEventListener("pageshow", runRecovery);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      runRecovery();
    }
  });
});
