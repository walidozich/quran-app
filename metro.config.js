// Metro config: render .svg imports as React components via svg-transformer,
// so `import Logo from "../assets/logo.svg"` gives a <Logo /> component.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer/expo");
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

// Don't watch the native build dirs (only created for APK builds) — they hold huge
// gradle/cmake caches that blow past the Linux inotify watch limit during Expo Go dev.
config.resolver.blockList = /\/(android\/(\.gradle|\.cxx|build|app\/build)|ios\/build)\/.*/;

module.exports = config;
