export default {
  path: "/app",
  getComponent: (location, callback) => {
    import("../pages/Application").then((module) => callback(null, module.default));
  },
  indexRoute: {
    getComponent: (location, callback) => {
      import("../pages/Login").then((module) => callback(null, module.default));
    }
  },
  getChildRoutes: (location, callback) => {
    callback(null, []);
  }
};
