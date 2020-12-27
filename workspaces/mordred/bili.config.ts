import { Config } from "bili";
import typescript from "rollup-plugin-typescript2";

export default {
  input: "src/index.ts",
  plugins: {
    typescript2: typescript(),
  },
  externals: ["react", "react-dom"],
  bundleNodeModules: ["tslib"],
  globals: {
    react: "React",
    "react-dom": "ReactDOM",
  },
  output: {
    moduleName: "Mordred",
    format: ["cjs", "esm", "umd-min"],
  },
} as Config;
