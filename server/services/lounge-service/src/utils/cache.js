const store = new Map();

function get(key) {
  const item = store.get(key);
  if (!item) return null;
  if (item.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return item.value;
}

function set(key, value, ttlMs = Number(process.env.CACHE_TTL_MS || 30_000)) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  return value;
}

function remember(key, loader, ttlMs) {
  const cached = get(key);
  if (cached !== null) return Promise.resolve(cached);
  return Promise.resolve(loader()).then((value) => set(key, value, ttlMs));
}

function clearByPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

module.exports = {
  get,
  set,
  remember,
  clearByPrefix,
};
