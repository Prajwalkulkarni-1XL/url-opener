// Constants
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 1000;
const SPA_CHECK_INTERVAL_MS = 1000;

// TODO: change according to need 
const BATCH_DELAY_MS = 3 * 60 * 1000;
const NEXT_PAGE_DELAY_MS = 15 * 60 * 1000;

let isRunning = false;
let lastUrl = location.href;

console.log("Automation script started.");

// Start the automation when script loads
waitForListingsAndRunAutomation();

// Keep checking for URL changes (to handle Single Page Apps)
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    isRunning = false;
    waitForListingsAndRunAutomation();
  }
}, SPA_CHECK_INTERVAL_MS);

// Wait until listings are available, then start automation
function waitForListingsAndRunAutomation(retry = 0) {
  if (isRunning) return;

  const listings = document.querySelectorAll("a[href*='/property/details-']");

  // Retry if listings not yet loaded
  if (listings.length === 0 && retry < MAX_RETRIES) {
    console.log("Waiting for listings... retry", retry);
    setTimeout(() => waitForListingsAndRunAutomation(retry + 1), RETRY_DELAY_MS);
    return;
  }

  if (listings.length === 0) {
    console.warn("Still no listings found after max retries.");
    return;
  }

  console.log("Listings found. Starting automation.");
  isRunning = true;
  runAutomation();
}

// Main function to extract property links and send in two batches
function runAutomation() {
  const links = [...document.querySelectorAll("a[href*='/property/details-']")];
  const uniqueUrls = [...new Set(
    links.map((a) => a.href).filter((url) =>
      url.match(/https:\/\/www\.bayut\.com\/property\/details-\d+\.html/)
    )
  )];

  // Filter valid and unique property URLs
  if (uniqueUrls.length === 0) {
    console.warn("No property URLs found.");
    isRunning = false;
    return;
  }

  const total = uniqueUrls.length;
  const half = Math.ceil(total / 2);
  const firstBatch = uniqueUrls.slice(0, half);
  const secondBatch = uniqueUrls.slice(half);

  // Send first batch immediately
  console.log(`Sending first batch of ${firstBatch.length} URLs to background...`);
  chrome.runtime.sendMessage({
    type: "OPEN_URLS",
    urls: firstBatch,
  });

  // Send second batch after delay
  setTimeout(() => {
    if (secondBatch.length > 0) {
      console.log(`Sending second batch of ${secondBatch.length} URLs to background...`);
      chrome.runtime.sendMessage({
        type: "OPEN_URLS",
        urls: secondBatch,
      });
    }
  }, BATCH_DELAY_MS);

  // Go to next page after delay
  setTimeout(() => {
    console.log("⏭ Proceeding to next page after 5 minutes...");
    goToNextPage();
  }, NEXT_PAGE_DELAY_MS);
}

// Go to the next page or notify that this category is done
function goToNextPage() {
  const nextBtn = document.querySelector('a[title="Next"]');

  if (nextBtn && nextBtn.href) {
    console.log("⏭ Clicking Next...");
    isRunning = false;
    nextBtn.click();
  } else {
    console.log("No Next button. Finishing up...");
    console.log("Sending CATEGORY_DONE");

    const port = chrome.runtime.connect({ name: "category" });
    port.postMessage({ type: "CATEGORY_DONE", urls: "" });

    port.onMessage.addListener((response) => {
      console.log("✅ Response from background:", response);
    });
  }
}
