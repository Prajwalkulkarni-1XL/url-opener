let isRunning = false;
let lastUrl = location.href;

console.log("🤖 Automation script started.");

// Initial trigger
waitForListingsAndRunAutomation();

// Watch for SPA navigation
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    isRunning = false;
    waitForListingsAndRunAutomation();
  }
}, 1000);

// ─────────────────────────────────────────────
// Wait for listings to appear then run automation
function waitForListingsAndRunAutomation(retry = 0) {
  if (isRunning) return;

  const listings = document.querySelectorAll("a[href*='/property/details-']");

  if (listings.length === 0 && retry < 10) {
    console.log("⏳ Waiting for listings... retry", retry);
    setTimeout(() => waitForListingsAndRunAutomation(retry + 1), 1000);
    return;
  }

  if (listings.length === 0) {
    console.warn("❌ Still no listings found after max retries.");
    return;
  }

  console.log("✅ Listings found. Starting automation.");
  isRunning = true;
  runAutomation();
}

// ─────────────────────────────────────────────
// Main Automation Logic
function runAutomation() {
  const links = [...document.querySelectorAll("a[href*='/property/details-']")];
  const uniqueUrls = [...new Set(
    links.map((a) => a.href).filter((url) =>
      url.match(/https:\/\/www\.bayut\.com\/property\/details-\d+\.html/)
    )
  )];

  if (uniqueUrls.length === 0) {
    console.warn("⚠️ No property URLs found.");
    isRunning = false;
    return;
  }

  console.log(`📤 Sending ${uniqueUrls.length} URLs to background...`);

  chrome.runtime.sendMessage({
    type: "OPEN_URLS",
    urls: uniqueUrls,
  });

  setTimeout(() => {
    goToNextPage();
  }, 2 * 60 * 1000); // 2 minutes
}

// ─────────────────────────────────────────────
// Click Next button or notify background
function goToNextPage() {
  const nextBtn = document.querySelector('a[title="Next"]');

  if (nextBtn && nextBtn.href) {
    console.log("⏭ Clicking Next...");
    isRunning = false;
    nextBtn.click();
  } else {
    console.log("🏁 No Next button. Sending CATEGORY_DONE.");
    chrome.runtime.sendMessage({ type: "CATEGORY_DONE" });
  }
}
