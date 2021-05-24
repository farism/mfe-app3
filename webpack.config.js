const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const path = require("path");
const pkg = require("./package.json");
const name = pkg.name
const deps = pkg.dependencies

const mfe = {
  name,
  paths: [
    'webclient/app3'
  ],
}

module.exports = {
  entry: "./src/index",
  mode: "development",
  target: "web",
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    port: 3002,
  },
  output: {
    filename: "[contenthash].bundle.js",
    chunkFilename: "[id].[chunkhash].js",
    path: path.resolve("dist"),
    publicPath: "",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: ["@babel/preset-react"],
        },
      },
    ],
  },
  plugins: [
    new WebpackManifestPlugin({
      generate: (seed, files, entries) => {
        return {
          ...mfe,
          files: files.reduce(
            (acc, cur) => ({ ...acc, [cur.name]: cur.path }),
            {}
          ),
        };
      },
    }),
    new ModuleFederationPlugin({
      name: mfe.name,
      filename: "remoteEntry.[chunkhash].js",
      exposes: {
        "./Widget": "./src/Widget",
      },
      shared: {
        moment: deps.moment,
        react: {
          requiredVersion: deps.react,
          import: "react", // the "react" package will be used a provided and fallback module
          shareKey: "react", // under this name the shared module will be placed in the share scope
          shareScope: "default", // share scope with this name will be used
          singleton: true, // only a single version of the shared module is allowed
        },
        "react-dom": {
          requiredVersion: deps["react-dom"],
          singleton: true, // only a single version of the shared module is allowed
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
