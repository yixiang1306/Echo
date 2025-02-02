import path from "path";
import { app } from "electron";
import { isDev } from "./util.js";

export function getPreloadPath() {
  return path.resolve(
    app.getAppPath(),
    isDev() ? "dist-electron/preload.cjs" : "dist-electron/preload.cjs"
  );
}
