import('./automation.js');

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

  console.log(`🔗 Sending ${uniqueUrls.length} property URLs to background...`);

  chrome.runtime.sendMessage({
    type: "OPEN_URLS",
    urls: uniqueUrls,
  });

  // Wait 2 minutes before going to next page
  setTimeout(() => {
    goToNextPage();
  }, 10 * 60 * 1000);
}

const script = document.createElement('script');
script.src = chrome.runtime.getURL('automation.js');
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);
