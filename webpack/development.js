const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");

const baseConfig = require("./base");

module.exports = merge(baseConfig, {
  mode: "development",
  devtool: "eval-cheap-module-source-map",
  resolve: {
    unsafeCache: true
  },
  entry: {
    app: ["react-hot-loader/patch", path.resolve(__dirname, "../app.js")]
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "../dev"),
    publicPath: "/"
  },
  devServer: {
    hot: true,
    contentBase: path.resolve(__dirname, "../dev"),
    publicPath: "/",
    historyApiFallback: true,
    stats: "minimal",
    port: 8080
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("development")
    })
  ]
});
