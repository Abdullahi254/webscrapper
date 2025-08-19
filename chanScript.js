// scraper-alarm.js
import puppeteer from "puppeteer";
import { exec } from "child_process";
import path from "path";

const TARGET_URL = "https://chan.mookh.com/";
const CHECK_INTERVAL_MS = 60 * 1000; // every minute

let alerted = false;

// helper: play sound via PowerShell
function playAlarm() {
  const soundPath = path.resolve("alarm.wav"); // put alarm.mp3 in same folder
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

  const times = await page.$$eval(
    "p.text-center.text-sm.font-bold.whitespace-nowrap",
    els => els.map(el => el.textContent.trim())
  );

  console.log("Times found on page:", times);

  if (times.includes("17 : 00")) {
    console.log("✅ Found '17 : 00'! Triggering alarm...");
    playAlarm();
    alerted = true;
  } else {
    console.log('"17 : 00" not found yet.');
  }

  await browser.close();
}

// Run immediately + every minute
checkSite();
setInterval(checkSite, CHECK_INTERVAL_MS);
