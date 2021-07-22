module.exports = {
  entry: "./src/index.tsx",
  devtool: "eval-source-map",
  mode: "development",
  module: {
    rules: [
      {
        test: /.tsx?/,
        loader: "ts-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
};
