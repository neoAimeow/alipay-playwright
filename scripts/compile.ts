import builder from "electron-builder";
import fs from "fs";

const Platform = builder.Platform;

if (process.env.VITE_APP_VERSION === undefined) {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  process.env.VITE_APP_VERSION = packageJson.version;
}

const config: builder.Configuration = {
  win: {
    target: "nsis",
  },
  // mac: {},
  directories: {
    output: "dist",
    buildResources: "buildResources",
  },
  files: ["main/dist/**", "preload/dist/**", "renderer/dist/**"],
  extraMetadata: {
    version: process.env.VITE_APP_VERSION,
  },
  extraResources: [
    "buildResources/db.sqlite",
    "node_modules/.prisma/**/*",
    "node_modules/@prisma/client/**/*",
    "buildResources/ms-playwright-win/**/*",
  ],
};

const targets = new Map()
  // .set(Platform.LINUX, new Map())
  .set(Platform.WINDOWS, new Map());
// .set(Platform.MAC, new Map());

builder
  .build({
    targets: targets,
    config,
  })
  .then((result) => {
    console.log(JSON.stringify(result));
  })
  .catch((error) => {
    console.error(error);
  });
