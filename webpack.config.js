const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const path = require("path");

module.exports = ["source-map"].map((devtool) => ({
  mode: "development",
  watch: true,
  module: {
    rules: [
      {
        test: /.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
  ],
  entry: {
    lodge: "./source/lodge.js",
    lightbox: "./source/lightbox/lightbox.js",
    overlay: "./source/templates/overlay.css",
    checkout: "./source/templates/checkout.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `[name].js`,
  },
  optimization: {
    minimizer: [new CssMinimizerPlugin()],
  },
  devtool,
}));
