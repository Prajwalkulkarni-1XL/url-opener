let currentApiPage = 1;
let currentCategoryIndex = 0;
let categories = [];

// ─────────────────────────────────────────────
// Listen to messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📩 Background received message:", message);

  if (message.type === "START_SCRAPING") {
    console.log("🚀 Starting scraping...");
    startCategoryScraping();
  }

  if (message.type === "OPEN_URLS") {
    console.log("🔗 Opening property URLs:", message.urls);
    for (const url of message.urls) {
      chrome.tabs.create({ url });
    }
  }

  if (message.type === "CATEGORY_DONE") {
    console.log("✅ Category done. Moving to next...");
    handleNextCategoryOrPage();
  }
});

// ─────────────────────────────────────────────
// Scraping flow
async function startCategoryScraping() {
  currentApiPage = 1;
  currentCategoryIndex = 0;
  await fetchCategories(currentApiPage);
  openCurrentCategory();
}

async function fetchCategories(page) {
  try {
    console.log(`🌐 Fetching categories from API (page ${page})`);
    const response = await fetch(`http://localhost:8000/api/category?page=${page}`);
    const json = await response.json();

    if (json.success && json.data.categories.length > 0) {
      categories = json.data.categories;
      console.log(`📦 Got ${categories.length} categories`);
      currentCategoryIndex = 0;
    } else {
      console.warn("🚫 No categories found.");
      categories = [];
    }
  } catch (error) {
    console.error("❌ API error:", error);
    categories = [];
  }
}

function openCurrentCategory() {
  const category = categories[currentCategoryIndex];
  if (!category) {
    console.warn("⚠️ No category found.");
    return;
  }

  console.log(`🔍 Opening category ${currentCategoryIndex + 1}: ${category.categoryName}`);
  chrome.tabs.create({ url: category.categoryUrl }, (tab) => {
    const tabId = tab.id;

    // Wait until page load to inject automation script
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);

        chrome.scripting.executeScript({
          target: { tabId },
          files: ["automation.js"],
        }, () => {
          console.log("⚙️ Injected automation script.");
        });
      }
    });
  });
}

async function handleNextCategoryOrPage() {
  currentCategoryIndex++;

  if (currentCategoryIndex >= categories.length) {
    currentApiPage++;
    await fetchCategories(currentApiPage);

    if (categories.length === 0) {
      console.log("🏁 All categories completed.");
      return;
    }

    currentCategoryIndex = 0;
  }

  openCurrentCategory();
}
