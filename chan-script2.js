// scraper-alarm.js
import puppeteer from "puppeteer";
import { exec } from "child_process";
import path from "path";

const TARGET_URL = "https://chan.mookh.com/";
const CHECK_INTERVAL_MS = 60 * 1000; // every minute

let alerted = false;

// helper: play sound via PowerShell
function playAlarm() {
  const soundPath = path.resolve("alarm.wav"); // make sure alarm.wav exists
  const command = `powershell -c (New-Object Media.SoundPlayer '${soundPath}').PlaySync();`;
  exec(command, (err) => {
    if (err) {
      console.error("Error playing sound:", err.message);
    } else {
      console.log("🔊 Alarm played!");
    }
  });
}

async function checkSite() {
  console.log(`[${new Date().toLocaleTimeString()}] Checking site...`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36"
  );

  await page.goto(TARGET_URL, { waitUntil: "networkidle2" });

  // Check if <p>We will be back online soon.</p> exists
  const maintenanceExists = await page.$$eval("p", (els) =>
    els.some((el) => el.textContent.trim() === "We will be back online soon.")
  );

  if (!maintenanceExists) {
    console.log("⚠️ Maintenance message is GONE! Triggering alarm...");
    if (!alerted) {
      playAlarm();
    //   alerted = true; // avoid spamming
    }
  } else {
    console.log("✅ Maintenance message still present.");
    alerted = false; // reset so it can trigger again when removed later
  }

  await browser.close();
}

// Run immediately + every minute
checkSite();
setInterval(checkSite, CHECK_INTERVAL_MS);
