const path = require("node:path");

module.exports = function (options) {
  const externals = options.externals ?? [];
  return {
    ...options,
    entry: path.join(__dirname, "src/main.ts"),
    resolve: {
      ...options.resolve,
      alias: {
        ...(options.resolve?.alias ?? {}),
        "@platform": path.resolve(__dirname, "../../app/platform"),
        "@features": path.resolve(__dirname, "../../features"),
      },
      extensions: [".ts", ".js", ".json"],
    },
    output: {
      ...options.output,
      path: path.join(__dirname, "dist"),
      filename: "main.js",
    },
    externals: [
      ...(Array.isArray(externals) ? externals : [externals]),
      ({ request }, callback) => {
        if (request && request.startsWith("node:")) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      },
    ],
  };
};
