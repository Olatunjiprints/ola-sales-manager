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
import { Capacitor } from "@capacitor/core";

${javascript}

let pushSetupStarted = false;

async function setupOlaPushNotifications(user) {
if (pushSetupStarted || !Capacitor.isNativePlatform()) return;
if (!user || user.uid !== OWNER_UID) return;

pushSetupStarted = true;

try {
let permission = await PushNotifications.checkPermissions();

if (permission.receive !== "granted") {
  permission = await PushNotifications.requestPermissions();
}

if (permission.receive !== "granted") {
  console.log("Notification permission was not granted.");
  pushSetupStarted = false;
  return;
}

await PushNotifications.addListener("registration", async (token) => {
  try {
    await setDoc(
      doc(db, "settings", "pushDevice"),
      {
        token: token.value,
        platform: "android",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    console.log("Ola push notification token saved.");
  } catch (error) {
    console.error("Could not save push token:", error);
  }
});

await PushNotifications.addListener("registrationError", (error) => {
  console.error("Push registration error:", error);
  pushSetupStarted = false;
});

await PushNotifications.register();

} catch (error) {
console.error("Push notification setup failed:", error);
pushSetupStarted = false;
}
}

onAuthStateChanged(auth, (user) => {
if (user && user.uid === OWNER_UID) {
setupOlaPushNotifications(user);
}
});
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
