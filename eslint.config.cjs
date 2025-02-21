module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended",
  ],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "detect" } },
  plugins: ["react", "react-hooks", "prettier"],
  ignorePatterns: ["node_modules/", "dist/"],
  rules: {
    "prettier/prettier": "error",
    "react/prop-types": "off",
  },
};
