document.getElementById("openUrls").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractOpenAndScheduleNextPage,
  });
});

function extractOpenAndScheduleNextPage() {
  // 1. Extract property URLs
  const links = [...document.querySelectorAll("a[href*='/property/details-']")];
  const uniqueUrls = [
    ...new Set(
      links
        .map((a) => a.href)
        .filter((url) =>
          url.match(/https:\/\/www\.bayut\.com\/property\/details-\d+\.html/)
        )
    ),
  ];

  // 2. Open all links
  for (let url of uniqueUrls) {
    window.open(url, "_blank");
  }

  // 3. Wait 2 minutes, then click "Next"
  const waitMs = 2 * 60 * 1000; // 2 minutes

  setTimeout(() => {
    const nextBtn = document.querySelector('a[title="Next"]');
    if (nextBtn) {
      console.log("⏭ Navigating to next page...");
      nextBtn.click();

      // setTimeout(() => {
      //   console.log("🔄 Reloading page to trigger content script...");
      //   location.reload();
      // }, 10000); // Wait 3 seconds to allow navigation
    } else {
      console.warn("🚫 'Next' button not found.");
    }
  }, waitMs);
}
