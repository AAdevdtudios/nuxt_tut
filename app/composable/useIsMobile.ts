export function useIsMobile(breakpoint = 767) {
  const isMobile = ref(false);
  let media: MediaQueryList | null = null;

  const update = (e?: MediaQueryList | MediaQueryListEvent) => {
    isMobile.value = !!e?.matches;
  };

  onMounted(() => {
    if (!window) return;

    media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    update(media);

    media.addEventListener("change", update);
  });

  onUnmounted(() => {
    media?.removeEventListener("change", update);
  });

  return {
    isMobile,
  };
}
