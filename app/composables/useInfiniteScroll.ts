export function useInfiniteScroll(callback: () => void, options?: IntersectionObserverInit) {
  const sentinel = ref<HTMLElement | null>(null);
  let observer: IntersectionObserver | null = null;

  watch(sentinel, (el, _, onCleanup) => {
    observer?.disconnect();
    observer = null;
    if (!el) return;

    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) callback();
      },
      { rootMargin: "300px", ...options },
    );
    observer.observe(el);
    onCleanup(() => {
      observer?.disconnect();
      observer = null;
    });
  });

  onUnmounted(() => {
    observer?.disconnect();
    observer = null;
  });

  return { sentinel };
}
