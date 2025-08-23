let currentApiPage = 1;
let currentCategoryIndex = 0;
let categories = [];

// API endpoints
const API_BASE_URL = "http://localhost:8000/api/category";
const CATEGORY_LIST_URL = `${API_BASE_URL}?page=`;
const NEXT_CATEGORY_URL = `${API_BASE_URL}/next`;
const UNLOCK_CATEGORY_URL = `${API_BASE_URL}/unlock`;

// Listen for commands from popup or content scripts
chrome.runtime.onMessage.addListener((message) => {
  console.log("📩 Background received:", message);
  if (message.type === "START_SCRAPING") {
    startCategoryScraping();
  }
  if (message.type === "OPEN_URLS") {
    console.log("🔗 Opening property URLs:", message.urls);
    message.urls.forEach(url => chrome.tabs.create({ url }));
  }
  if (message.type === "CATEGORY_DONE") {
    console.log("✅ Category done. Moving to next...");
    handleNextCategoryOrPage();
  }
});

// Fetch and lock a category using device ID
async function startCategoryScraping() {
  chrome.storage.local.get("deviceId", async ({ deviceId }) => {
    if (!deviceId) {
      console.error("❌ No deviceId found. Please restart extension.");
      return;
    }

    try {
      // Lock category via API
      const res = await fetch(`${NEXT_CATEGORY_URL}?deviceId=${deviceId}`);
      const json = await res.json();

      if (json.success && json.data) {
        currentCategory = json.data;
        console.log("🔒 Locked category:", currentCategory.categoryName);
        openCurrentCategory(currentCategory);
      } else {
        console.warn("❌ No more categories available.");
      }
    } catch (err) {
      console.error("❌ Error locking category:", err);
    }
  });
}

// Unlock category then proceed to next via API
function unlockAndMoveToNextCategory() {
  chrome.storage.local.get("deviceId", async ({ deviceId }) => {
    if (!currentCategory?._id) return;

    try {
      await fetch(UNLOCK_CATEGORY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: currentCategory._id,
          deviceId: deviceId,
        }),
      });
      console.log("🔓 Unlocked category:", currentCategory.categoryName);
      currentCategory = null;
      startCategoryScraping();
    } catch (err) {
      console.error("❌ Failed to unlock category:", err);
    }
  });
}

// Open category tab and inject automation script
function openCurrentCategory(category) {
  chrome.tabs.create({ url: category.categoryUrl }, (tab) => {
    const tabId = tab.id;
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.scripting.executeScript({
          target: { tabId },
          files: ["automation.js"],
        }, () => {
          console.log("⚙️ Automation script injected.");
        });
      }
    });
  });
}

// Handle category pagination
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

// Fetch categories for pagination
async function fetchCategories(page) {
  try {
    console.log(`🌐 Fetching categories (page ${page})`);
    const response = await fetch(CATEGORY_LIST_URL + page);
    const json = await response.json();
    categories = json.success && json.data.categories.length > 0
      ? json.data.categories
      : [];
    console.log(`📦 Got ${categories.length} categories`);
    currentCategoryIndex = 0;
  } catch (error) {
    console.error("❌ API error:", error);
    categories = [];
  }
}

// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("deviceId", (result) => {
    if (!result.deviceId) {
      const newDeviceId = crypto.randomUUID();
      chrome.storage.local.set({ deviceId: newDeviceId }, () => {
        console.log("✅ Generated deviceId on install:", newDeviceId);
      });
    }
  });
});
