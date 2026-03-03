export default defineNuxtPlugin((nuxtApp) => {
  const previousWarnHandler = nuxtApp.vueApp.config.warnHandler;

  nuxtApp.vueApp.config.warnHandler = (msg, instance, trace) => {
    const isForeignOverlayWarning =
      msg.includes("Extraneous non-props attributes") &&
      (msg.includes("dataAriaHidden") ||
        msg.includes("ariaHidden") ||
        msg.includes("(style)"));

    if (isForeignOverlayWarning) {
      return;
    }

    previousWarnHandler?.(msg, instance, trace);
  };
});
