const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const autoprefixer = require("autoprefixer");
const tailwindcss = require("tailwindcss");

const devMode = process.env.NODE_ENV !== "production";

module.exports = {
  context: path.resolve(__dirname, ".."),
  resolve: {
    modules: [path.resolve(__dirname, ".."), path.resolve(__dirname, "../node_modules")],
    alias: {
      api: path.resolve(__dirname, "../apis"),
      components: path.resolve(__dirname, "../components"),
      stores: path.resolve(__dirname, "../stores"),
      "shared-style": path.resolve(__dirname, "../shared-style"),
      public: path.resolve(__dirname, "../public"),
      decorators: path.resolve(__dirname, "../decorators"),
      libs: path.resolve(__dirname, "../libs"),
      constant: path.resolve(__dirname, "../config/constant"),
      utils: path.resolve(__dirname, "../utils"),
      types: path.resolve(__dirname, "../types")
    }
  },
  stats: {
    colors: true,
    reasons: true,
    hash: false,
    version: false,
    timings: true,
    chunks: true,
    chunkModules: true,
    cached: false,
    cachedAssets: false
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: "babel-loader"
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: process.env.NODE_ENV === "development"
            }
          },
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              plugins: () => [tailwindcss, autoprefixer]
            }
          },
          "sass-loader"
        ]
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: "file-loader",
        options: {
          name: "[name].[ext]",
          limit: 10000
        }
      },
      {
        test: /\.ya?ml$/,
        type: "json",
        use: "yaml-loader"
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "web",
      template: path.resolve(__dirname, "../app.template.html")
    }),
    new MiniCssExtractPlugin({
      filename: devMode ? "[name].css" : "[name].[hash].css",
      chunkFilename: devMode ? "[id].css" : "[id].[hash].css"
    })
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/](react|react-dom|mobx|mobx-react|classnames|prop-types|superagent)[\\/]/,
          name: "vendor",
          chunks: "all"
        }
      }
    }
  }
};
