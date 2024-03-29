import { BrowserWindow, shell } from "electron";

import { showDevTools } from "./utils";

let browserWindows = [];

const getMainWindowOptions = () => {
  return {
    width: 1200,
    height: 900,
    minHeight: 600,
    minWidth: 600,
    acceptFirstMouse: true,
    backgroundColor: "#1d2427",
    webPreferences: {
      contextIsolation: true,
      devTools: showDevTools(),
      nodeIntegration: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  };
};

export const createMainWindow = () => {
  // Create the browser window.
  let browserWindow = new BrowserWindow(getMainWindowOptions());

  // and load the index.html of the app.
  browserWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  browserWindow.webContents.openDevTools();

  browserWindow.webContents.once("dom-ready", () => {
    if (browserWindow) {
      browserWindow.show();
    }
  });

  browserWindow.on("closed", () => {
    browserWindows = browserWindows.filter((bw) => browserWindow !== bw);

    browserWindow = null;
  });

  browserWindow.webContents.on("new-window", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  browserWindow.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  browserWindows.push(browserWindow);

  return browserWindow;
};
