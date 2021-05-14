const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const TerserJSPlugin = require("terser-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const baseConfig = require("./base");

module.exports = merge(baseConfig, {
  mode: "production",
  devtool: false,
  entry: {
    app: path.resolve(__dirname, "../app.js")
  },
  output: {
    filename: "[name].[chunkHash].js",
    path: path.resolve(__dirname, "../dist"),
    publicPath: "/"
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    new webpack.HashedModuleIdsPlugin(), // @see https://loveky.github.io/2017/03/29/webpack-module-ids/
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production")
    })
  ],
  optimization: {
    minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})]
  }
});
