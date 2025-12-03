const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@uiElements": path.resolve(__dirname, "src/components/index.js"),
      "@config": path.resolve(__dirname, "src/config"),
      "@uiElements/*": path.resolve(__dirname, "src/components/ui"),
      "@components": path.resolve(__dirname, "src/components"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@layout": path.resolve(__dirname, "src/layout"),
      "@plugin": path.resolve(__dirname, "src/plugin"),
      "@filters": path.resolve(__dirname, "src/components/filter"),
      "@kanban": path.resolve(__dirname, "src/components/kanban"),
      "@wsTabels": path.resolve(__dirname, "src/components/dynamicTables"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@custom": path.resolve(__dirname, "src/custom_modules"),
      "@lib": path.resolve(__dirname, "src/lib"),
      "@ws-utils": path.resolve(__dirname, "src/ws-utils"),
      "@": path.resolve(__dirname, "src"),
    }
  }
};
