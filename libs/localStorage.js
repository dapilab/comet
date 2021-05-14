export default {
  get: (key) => window.localStorage.getItem(key),

  set: (key, value) => {
    if (typeof value === "number") value = String(value);
    if (typeof value === "object") value = JSON.stringify(value);
    window.localStorage.setItem(key, value);
  },

  remove: (key) => {
    window.localStorage.removeItem(key);
  },

  clear: () => {
    window.localStorage.clear();
  }
};
