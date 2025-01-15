const webpack = require("webpack");
const path = require("path");

webpack(
  {
    mode: 'development',
    entry: "./shoot_pb.js",
    output: {
      filename: "shoot_pb.js",
      path: path.resolve(__dirname, "dist")
    }
  },
  (err, stats) => {
    console.log(
      stats.toString({
        chunks: false,
        colors: true
      })
    );

    if (err || stats.hasErrors()) {
      console.error(err);
      process.exit(1);
    }
  }
);