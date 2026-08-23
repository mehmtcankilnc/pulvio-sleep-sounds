module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Reanimated 4: worklet transform artık react-native-worklets paketinde —
    // react-native-reanimated/plugin kullanmaya devam etmek build zamanında
    // uyarı veriyor. Listede en sonda olmalı (resmi gereksinim).
    plugins: ["react-native-worklets/plugin"],
  };
};
