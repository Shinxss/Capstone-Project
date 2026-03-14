#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const mobileRoot = path.resolve(__dirname, "..");
const appJsonPath = path.join(mobileRoot, "app.json");
const rootGoogleServicesPath = path.join(mobileRoot, "google-services.json");
const androidGoogleServicesPath = path.join(mobileRoot, "android", "app", "google-services.json");
const gradlePath = path.join(mobileRoot, "android", "app", "build.gradle");
const envPath = path.join(mobileRoot, ".env");
const debugKeystorePath = path.join(mobileRoot, "android", "app", "debug.keystore");

const errors = [];
const warnings = [];
const info = [];

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function readJson(filePath) {
  const raw = readText(filePath);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    errors.push(`Invalid JSON: ${path.relative(mobileRoot, filePath)}`);
    return null;
  }
}

function parseEnv(content) {
  const result = {};
  if (!content) return result;

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = value;
  }

  return result;
}

function extractProjectNumber(clientId) {
  if (typeof clientId !== "string") return null;
  const trimmed = clientId.trim();
  const match = trimmed.match(/^([0-9]+)-[a-z0-9-]+\.apps\.googleusercontent\.com$/i);
  return match ? match[1] : null;
}

function normalizeSha(value) {
  if (typeof value !== "string") return "";
  return value.toUpperCase().replace(/[^A-F0-9]/g, "");
}

function readDebugSha1() {
  if (!fs.existsSync(debugKeystorePath)) {
    warnings.push("No debug.keystore found at android/app/debug.keystore.");
    return null;
  }

  try {
    const command = `keytool -list -v -alias androiddebugkey -keystore "${debugKeystorePath}" -storepass android -keypass android`;
    const output = execSync(command, { stdio: ["ignore", "pipe", "pipe"] }).toString();
    const shaMatch = output.match(/SHA1:\s*([A-F0-9:]+)/i);
    return shaMatch ? shaMatch[1].toUpperCase() : null;
  } catch {
    warnings.push("Unable to run keytool to inspect debug.keystore SHA-1.");
    return null;
  }
}

function addMismatchError(label, left, right) {
  errors.push(`${label} mismatch: "${left}" vs "${right}"`);
}

const appJson = readJson(appJsonPath);
const gradle = readText(gradlePath);
const env = parseEnv(readText(envPath));

let googleServicesPath = null;
let googleServices = null;

if (fs.existsSync(rootGoogleServicesPath)) {
  googleServicesPath = rootGoogleServicesPath;
  googleServices = readJson(rootGoogleServicesPath);
} else if (fs.existsSync(androidGoogleServicesPath)) {
  googleServicesPath = androidGoogleServicesPath;
  googleServices = readJson(androidGoogleServicesPath);
} else {
  errors.push("Missing google-services.json (checked root and android/app).");
}

const appPackage = appJson?.expo?.android?.package ?? "";
const gradleApplicationId = gradle?.match(/applicationId\s+['"]([^'"]+)['"]/)?.[1] ?? "";
const gradleNamespace = gradle?.match(/namespace\s+['"]([^'"]+)['"]/)?.[1] ?? "";

const androidClientId = env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
const webClientId = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
const androidClientProjectNumber = extractProjectNumber(androidClientId);
const webClientProjectNumber = extractProjectNumber(webClientId);

if (!androidClientId) {
  errors.push("Missing EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in apps/mobile/.env.");
}
if (!webClientId) {
  errors.push("Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in apps/mobile/.env.");
}
if (androidClientId && webClientId && androidClientId === webClientId) {
  errors.push("Android and Web client IDs are identical. Web client ID must be a Web OAuth client.");
}
if (androidClientId && !androidClientProjectNumber) {
  errors.push("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID format is invalid.");
}
if (webClientId && !webClientProjectNumber) {
  errors.push("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID format is invalid.");
}
if (
  androidClientProjectNumber &&
  webClientProjectNumber &&
  androidClientProjectNumber !== webClientProjectNumber
) {
  addMismatchError("OAuth project number", androidClientProjectNumber, webClientProjectNumber);
}

if (!appPackage) {
  errors.push("Missing expo.android.package in app.json.");
}
if (appPackage && gradleApplicationId && appPackage !== gradleApplicationId) {
  addMismatchError("Package (app.json vs build.gradle applicationId)", appPackage, gradleApplicationId);
}
if (appPackage && gradleNamespace && appPackage !== gradleNamespace) {
  addMismatchError("Package (app.json vs build.gradle namespace)", appPackage, gradleNamespace);
}

let googleProjectNumber = "";
let googlePackage = "";
let oauthClientIds = [];
let androidCertHashes = [];

if (googleServices) {
  googleProjectNumber = googleServices?.project_info?.project_number ?? "";
  const client = googleServices?.client?.[0];
  googlePackage = client?.client_info?.android_client_info?.package_name ?? "";
  const oauthClients = Array.isArray(client?.oauth_client) ? client.oauth_client : [];
  const otherOauthClients = Array.isArray(client?.services?.appinvite_service?.other_platform_oauth_client)
    ? client.services.appinvite_service.other_platform_oauth_client
    : [];

  oauthClientIds = [...oauthClients, ...otherOauthClients]
    .map((entry) => (typeof entry?.client_id === "string" ? entry.client_id.trim() : ""))
    .filter(Boolean);

  androidCertHashes = oauthClients
    .map((entry) =>
      typeof entry?.android_info?.certificate_hash === "string"
        ? entry.android_info.certificate_hash.trim()
        : ""
    )
    .filter(Boolean);

  if (oauthClients.length === 0) {
    warnings.push(
      "google-services.json has no oauth_client entries. This is fine if Firebase is only used for push notifications."
    );
  }
}

if (googleProjectNumber && androidClientProjectNumber && googleProjectNumber !== androidClientProjectNumber) {
  warnings.push(
    `Project split detected (Firebase vs Android OAuth): "${googleProjectNumber}" vs "${androidClientProjectNumber}". This is allowed when Google sign-in uses a separate Google Cloud project.`
  );
}
if (googleProjectNumber && webClientProjectNumber && googleProjectNumber !== webClientProjectNumber) {
  warnings.push(
    `Project split detected (Firebase vs Web OAuth): "${googleProjectNumber}" vs "${webClientProjectNumber}". This is allowed when Google sign-in uses a separate Google Cloud project.`
  );
}
if (googlePackage && appPackage && googlePackage !== appPackage) {
  addMismatchError("Package (google-services.json vs app.json)", googlePackage, appPackage);
}
if (googlePackage && gradleApplicationId && googlePackage !== gradleApplicationId) {
  addMismatchError("Package (google-services.json vs build.gradle applicationId)", googlePackage, gradleApplicationId);
}

if (webClientId && oauthClientIds.length > 0 && !oauthClientIds.includes(webClientId)) {
  warnings.push(
    "Web client ID is not listed in google-services.json oauth entries. Confirm it belongs to the same Firebase project."
  );
}
if (androidClientId && oauthClientIds.length > 0 && !oauthClientIds.includes(androidClientId)) {
  warnings.push(
    "Android client ID is not listed in google-services.json oauth entries. Confirm package name and SHA-1 registration."
  );
}

const debugSha1 = readDebugSha1();
if (debugSha1) {
  info.push(`Local debug.keystore SHA-1: ${debugSha1}`);

  if (androidCertHashes.length > 0) {
    const normalizedDebugSha = normalizeSha(debugSha1);
    const hasMatch = androidCertHashes.some((hash) => normalizeSha(hash) === normalizedDebugSha);
    if (!hasMatch) {
      warnings.push(
        "Local debug SHA-1 is not present in google-services.json Android OAuth entries. Add it in Firebase for debug builds."
      );
    }
  }
}

if (googleServicesPath) {
  info.push(`Using google-services file: ${path.relative(mobileRoot, googleServicesPath)}`);
}
if (googleProjectNumber) {
  info.push(`google-services project number: ${googleProjectNumber}`);
}
if (androidClientProjectNumber) {
  info.push(`Android client project number: ${androidClientProjectNumber}`);
}
if (webClientProjectNumber) {
  info.push(`Web client project number: ${webClientProjectNumber}`);
}
if (appPackage) {
  info.push(`App package: ${appPackage}`);
}

const status = errors.length > 0 ? "FAILED" : warnings.length > 0 ? "PASSED WITH WARNINGS" : "PASSED";
console.log("Google OAuth verification (apps/mobile)");
console.log(`Status: ${status}`);

if (info.length > 0) {
  console.log("\nInfo:");
  for (const line of info) {
    console.log(`- ${line}`);
  }
}

if (warnings.length > 0) {
  console.log("\nWarnings:");
  for (const line of warnings) {
    console.log(`- ${line}`);
  }
}

if (errors.length > 0) {
  console.log("\nErrors:");
  for (const line of errors) {
    console.log(`- ${line}`);
  }
  process.exitCode = 1;
}
