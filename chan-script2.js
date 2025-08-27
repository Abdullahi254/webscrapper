// scraper-alarm.js
import puppeteer from "puppeteer";
import { exec } from "child_process";
import path from "path";

const TARGET_URL = "https://chan.mookh.com/event/chan-2024-finals/";
const CHECK_INTERVAL_MS = 60 * 1000; // every minute

let alerted = false;

// helper: play sound (macOS version using afplay)
function playAlarm() {
  const soundPath = path.resolve("alarm.wav"); // make sure alarm.wav exists
  const command = `afplay "${soundPath}"`; // macOS audio command
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
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36"
  );

  await page.goto(TARGET_URL, { waitUntil: "networkidle2" });

  // Check if <p>Tickets Coming Soon!</p> exists
  const maintenanceExists = await page.$$eval("h4", (els) =>
    els.some((el) => el.textContent.trim() === "Tickets Coming Soon!")
  );

  if (!maintenanceExists) {
    console.log("⚠️ Maintenance message is GONE! Triggering alarm...");
    if (!alerted) {
      playAlarm();
      // alerted = true; // uncomment if you only want to trigger once
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
