require('dotenv').config()

const config = {
  packagerConfig: {
    "osxSign": {
      "identity": "Developer ID Application: Zhimin Huang (9S5K3LWH74)",
      "hardened-runtime": true,
      "gatekeeper-assess": false,
      "entitlements": "entitlements.plist",
      "entitlements-inherit": "entitlements.plist",
      "signature-flags": "library"
    }
  },
  "makers": [
    {
      "name": "@electron-forge/maker-squirrel",
      "config": {
        "name": "Synvert"
      }
    },
    {
      "name": "@electron-forge/maker-zip",
      "platforms": [
        "darwin"
      ]
    },
    {
      "name": "@electron-forge/maker-deb",
      "config": {}
    },
    {
      "name": "@electron-forge/maker-rpm",
      "config": {}
    }
  ],
  "plugins": [
    [
      "@electron-forge/plugin-webpack",
      {
        "mainConfig": "./webpack.main.config.js",
        "renderer": {
          "config": "./webpack.renderer.config.js",
          "entryPoints": [
            {
              "html": "./src/renderer/index.html",
              "js": "./src/renderer/renderer.js",
              "name": "main_window",
              // "webpackConfig": {
              //   devtool: "nosources-source-map"
              // }
            }
          ],
          nodeIntegration: true // defaults to false
        },
        devContentSecurityPolicy: "script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://synvert.test https://synvert-api.xinminlabs.com; img-src 'self' https://synvert.test https://synvert-api.xinminlabs.com; default-src 'self' https://synvert.test https://synvert-api.xinminlabs.com;"
      }
    ]
  ]
}

function notarizeMaybe() {
  if (process.platform !== 'darwin') {
    return;
  }

  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.warn(
      'Should be notarizing, but environment variables APPLE_ID or APPLE_ID_PASSWORD are missing!',
    );
    return;
  }

  config.packagerConfig.osxNotarize = {
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD
  };
}

function updateIcon() {
  if (process.platform === 'darwin') {
    config.packagerConfig.icon = "./src/icons/mac/icon.icns"
  }
  if (process.platform === 'win32') {
    config.packagerConfig.icon = "./src/icons/win/icon.ico"
  }
}

notarizeMaybe();
updateIcon();

// Finally, export it
module.exports = config;
