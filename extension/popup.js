document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("tokenInput");
  const saveBtn = document.getElementById("saveBtn");
  const autoTokenBtn = document.getElementById("autoTokenBtn");
  const statusMsg = document.getElementById("statusMsg");
  const connectionStatus = document.getElementById("connectionStatus");

  // Load existing token if any
  chrome.storage.local.get(["prism_token"], (result) => {
    if (result.prism_token) {
      tokenInput.value = result.prism_token;
      showConnectionStatus("✓ Connected to PRISM", "success");
    } else {
      showConnectionStatus("⚠ Not connected. Please login to PRISM.", "error");
    }
  });

  saveBtn.addEventListener("click", () => {
    const value = tokenInput.value.trim();
    if (!value) {
      showStatus("Token cannot be empty.", "error");
      return;
    }

    // Save token to chrome.storage
    chrome.storage.local.set({ prism_token: value }, () => {
      showStatus("✓ Token saved! Ready to autofill.", "success");
      showConnectionStatus("✓ Connected to PRISM", "success");
      
      // Trigger a manual scan in the current tab immediately
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "TRIGGER_AUTOFILL" });
        }
      });
    });
  });

  autoTokenBtn.addEventListener("click", () => {
    // Try to get token from PRISM web app on localhost
    chrome.tabs.query({}, (tabs) => {
      let found = false;
      for (let tab of tabs) {
        if (tab.url && tab.url.includes("localhost:3000")) {
          found = true;
          chrome.tabs.sendMessage(tab.id, { type: "GET_TOKEN_FROM_PAGE" }, (response) => {
            if (chrome.runtime.lastError) {
              showStatus("Could not connect to PRISM page. Please ensure you're logged in.", "error");
              return;
            }
            if (response && response.token) {
              tokenInput.value = response.token;
              showStatus("Token auto-fetched! Click 'Connect to PRISM' to save.", "success");
            } else {
              showStatus("Token not found. Please login on PRISM first.", "error");
            }
          });
          break;
        }
      }
      if (!found) {
        showStatus("PRISM page not found. Please open http://localhost:3000", "error");
      }
    });
  });

  function showStatus(text, type) {
    statusMsg.textContent = text;
    statusMsg.className = `status active ${type}`;
    
    // Auto hide success messages after 3 seconds
    if (type === "success") {
      setTimeout(() => {
        statusMsg.className = "status";
      }, 3000);
    }
  }

  function showConnectionStatus(text, type) {
    connectionStatus.textContent = text;
    connectionStatus.className = `status active ${type}`;
  }
});
