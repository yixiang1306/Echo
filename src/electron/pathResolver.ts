import path from "path";
import { app } from "electron";
import { isDev } from "./util.js";

export function getPreloadPath() {
  if (isDev()) {
    return path.join(app.getAppPath(), "./dist-electron/preload.cjs");
  } else {
    return path.join(process.resourcesPath, "dist-electron/preload.cjs");
  }
  // return path.join(
  //   app.getAppPath(),
  //   isDev() ? "." : "..",
  //   "/dist-electron/preload.cjs"
  // );
}
