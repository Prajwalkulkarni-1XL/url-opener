document.getElementById('openUrls').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractAndOpenURLs
  });
});

function extractAndOpenURLs() {
  const links = [...document.querySelectorAll("a[href*='/property/details-']")];
  const uniqueUrls = [...new Set(
    links
      .map(a => a.href)
      .filter(url => url.match(/https:\/\/www\.bayut\.com\/property\/details-\d+\.html/))
  )];

  for (let url of uniqueUrls) {
    window.open(url, '_blank');
  }
}
