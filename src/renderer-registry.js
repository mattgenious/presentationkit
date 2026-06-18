export function createRendererRegistry(initialRenderers = {}) {
  const renderers = new Map();

  const api = {
    register(name, renderer) {
      if (!name || typeof name !== 'string') {
        throw new Error('Renderer name must be a non-empty string.');
      }

      const entry = typeof renderer === 'function' ? { render: renderer } : renderer;
      if (!entry || typeof entry.render !== 'function') {
        throw new Error(`Renderer "${name}" must provide a render function.`);
      }

      renderers.set(name, Object.freeze({ ...entry, name }));
      return api;
    },

    get(name) {
      return renderers.get(name);
    },

    has(name) {
      return renderers.has(name);
    },

    list() {
      return Array.from(renderers.values());
    },

    names() {
      return Array.from(renderers.keys());
    }
  };

  for (const [name, renderer] of Object.entries(initialRenderers)) {
    api.register(name, renderer);
  }

  return Object.freeze(api);
}
