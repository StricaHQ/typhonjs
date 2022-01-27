/* eslint-disable import/no-extraneous-dependencies */
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import path from "path";

const config: webpack.Configuration = {
  entry: "./src/index.ts",
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.min.js",
    library: "typhonjs",
  },
  target: "web",
  resolve: {
    symlinks: false,
    fallback: {
      buffer: require.resolve("buffer"),
      stream: require.resolve("stream-browserify"),
    },
    extensions: [".ts", ".js"],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
};

export default config;
