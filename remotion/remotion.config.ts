import { Config } from "@remotion/cli/config";
import path from "path";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

Config.overrideWebpackConfig((currentConfig) => {
  // __dirname is unreliable inside Remotion config (resolves to CLI internals)
  // Use process.cwd() which is always the project root
  const srcPath = path.resolve(process.cwd(), "src");

  const existingAlias = currentConfig.resolve?.alias ?? {};
  const alias = typeof existingAlias === "object" && !Array.isArray(existingAlias)
    ? { ...existingAlias, "@": srcPath }
    : { "@": srcPath };

  return {
    ...currentConfig,
    resolve: {
      ...currentConfig.resolve,
      alias,
    },
  };
});
