export default {
  get: (key, type) => {
    const value = window.localStorage.getItem(key);
    if (!value) return value;
    switch (type) {
      case "int":
        return parseInt(value, 10);
      case "float":
        return parseFloat(value);
      default:
        return value;
    }
  },

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
