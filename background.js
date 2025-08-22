chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_URLS") {
    console.log("🧠 Background received URLs to open:", message.urls);

    for (const url of message.urls) {
      chrome.tabs.create({ url });
    }
  }
});
