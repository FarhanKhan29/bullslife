/** Tiny typed event emitter (avoids extra dependencies). */
export class Emitter<Events extends Record<string, (...args: any[]) => void>> {
  private handlers: { [K in keyof Events]?: Set<Events[K]> } = {};

  on<K extends keyof Events>(event: K, fn: Events[K]): () => void {
    (this.handlers[event] ??= new Set()).add(fn);
    return () => this.handlers[event]?.delete(fn);
  }

  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
    this.handlers[event]?.forEach((fn) => {
      try {
        fn(...args);
      } catch (err) {
        console.error(`[emitter] handler for ${String(event)} failed`, err);
      }
    });
  }
}
