const path = require("path");

module.exports = ["source-map"].map((devtool) => ({
  mode: "production",
  entry: "./source/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "lodge.js",
  },
  devtool,
}));
