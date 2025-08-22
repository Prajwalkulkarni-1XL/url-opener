let lastUrl = location.href;
let isRunning = false; // ✅ Controls per-page automation

console.log("🚀 Bayut automation initialized...");

// Initial trigger
waitForListingsAndRunAutomation();

// Detect SPA page navigation
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log("🔁 URL changed:", lastUrl);
    waitForListingsAndRunAutomation();
  }
}, 1000);

// ─────────────────────────────────────────────
// 🧠 Wait for listings to appear, then run
function waitForListingsAndRunAutomation(retry = 0) {
  if (isRunning) {
    console.log("⏸ Already running on this page. Skipping...");
    return;
  }

  const listings = document.querySelectorAll("a[href*='/property/details-']");

  if (listings.length === 0 && retry < 10) {
    console.log("⏳ Waiting for listings to load... retry", retry);
    setTimeout(() => waitForListingsAndRunAutomation(retry + 1), 1000);
    return;
  }

  console.log("✅ Listings detected, starting automation...");
  isRunning = true;
  runAutomation();
}

// ─────────────────────────────────────────────
// 🚀 Automation Logic
function runAutomation() {
  const links = [...document.querySelectorAll("a[href*='/property/details-']")];
  const uniqueUrls = [...new Set(
    links
      .map((a) => a.href)
      .filter((url) =>
        url.match(/https:\/\/www\.bayut\.com\/property\/details-\d+\.html/)
      )
  )];

  if (uniqueUrls.length === 0) {
    console.warn("⚠️ No property URLs found on this page.");
    isRunning = false;
    return;
  }

  console.log(`🔗 Opening ${uniqueUrls.length} property URLs...`);
  uniqueUrls.forEach((url) => window.open(url, "_blank"));

  // Wait 2 minutes before navigating to next page
  setTimeout(() => {
    goToNextPage();
  }, 5 * 60 * 1000);
}

// ─────────────────────────────────────────────
// ⏭ Navigate to next page
function goToNextPage() {
  const nextBtn = document.querySelector('a[title="Next"]');
  if (nextBtn && nextBtn.href) {
    console.log("⏭ Clicking 'Next'...");
    isRunning = false; // ✅ Allow automation on next page
    nextBtn.click();    // Triggers SPA navigation
  } else {
    console.warn("🚫 'Next' button not found.");
  }
}
