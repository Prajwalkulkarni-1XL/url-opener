// Constants
const MAX_RETRIES = 10;             // Maximum attempts to wait for listings
const RETRY_DELAY_MS = 1000;        // Delay between each retry (1 second)
const SPA_CHECK_INTERVAL_MS = 1000; // Check for SPA (URL) change every second
const BATCH_DELAY_MS = 3 * 60 * 1000; // Delay before sending second batch (3 minutes)
const NEXT_PAGE_DELAY_MS = 15 * 60 * 1000; // Delay before moving to next page (15 minutes)

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
}, SPA_CHECK_INTERVAL_MS);

// Wait for listings to appear then run automation
function waitForListingsAndRunAutomation(retry = 0) {
  if (isRunning) return;

  const listings = document.querySelectorAll("a[href*='/property/details-']");

  if (listings.length === 0 && retry < MAX_RETRIES) {
    console.log("⏳ Waiting for listings... retry", retry);
    setTimeout(() => waitForListingsAndRunAutomation(retry + 1), RETRY_DELAY_MS);
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

// Extract property links and send to background in 2 batches
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

  const total = uniqueUrls.length;
  const half = Math.ceil(total / 2);
  const firstBatch = uniqueUrls.slice(0, half);
  const secondBatch = uniqueUrls.slice(half);

  console.log(`📤 Sending first batch of ${firstBatch.length} URLs to background...`);
  chrome.runtime.sendMessage({
    type: "OPEN_URLS",
    urls: firstBatch,
  });

  // Send second batch after delay
  setTimeout(() => {
    if (secondBatch.length > 0) {
      console.log(`📤 Sending second batch of ${secondBatch.length} URLs to background...`);
      chrome.runtime.sendMessage({
        type: "OPEN_URLS",
        urls: secondBatch,
      });
    }
  }, BATCH_DELAY_MS);

  // Move to next page after delay
  setTimeout(() => {
    console.log("⏭ Proceeding to next page after 15 minutes...");
    goToNextPage();
  }, NEXT_PAGE_DELAY_MS);
}

// Go to next page if available, otherwise notify background script
function goToNextPage() {
  const nextBtn = document.querySelector('a[title="Next"]');

  if (nextBtn && nextBtn.href) {
    console.log("⏭ Clicking Next...");
    isRunning = false;
    nextBtn.click();
  } else {
    console.log("🏁 No Next button. Sending CATEGORY_DONE.");
    if (!nextBtn || !nextBtn.href) {
      console.log("🏁 No Next button. Sending CATEGORY_DONE.");
      chrome.runtime.sendMessage({ type: "CATEGORY_DONE" });
    }

  }
}
