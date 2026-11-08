const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceFile = path.join(root, "index.html");
const androidFolder = __dirname;
const srcFolder = path.join(androidFolder, "src");

if (!fs.existsSync(sourceFile)) {
  throw new Error("Could not find the main index.html file.");
}

let html = fs.readFileSync(sourceFile, "utf8");

const scriptPattern = /<script type="module">([\s\S]*?)<\/script>/i;
const match = html.match(scriptPattern);

if (!match) {
  throw new Error("Could not find the Firebase module script.");
}

let javascript = match[1];

javascript = `
import { PushNotifications } from "@capacitor/push-notifications";

${javascript}
`;

html = html.replace(
  scriptPattern,
  '<script type="module" src="/src/main.js"></script>'
);

fs.mkdirSync(srcFolder, { recursive: true });

fs.writeFileSync(
  path.join(androidFolder, "index.html"),
  html
);

fs.writeFileSync(
  path.join(srcFolder, "main.js"),
  javascript
);

console.log("Android source files prepared successfully.");
