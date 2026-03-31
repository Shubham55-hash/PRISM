document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("tokenInput");
  const saveBtn = document.getElementById("saveBtn");
  const statusMsg = document.getElementById("statusMsg");

  // Load existing token if any
  chrome.storage.local.get(["prism_token"], (result) => {
    if (result.prism_token) {
      tokenInput.value = result.prism_token;
      showStatus("Connected to PRISM Identity Vault", "success");
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
      showStatus("Token saved! Ready to autofill.", "success");
      
      // Trigger a manual scan in the current tab immediately
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "TRIGGER_AUTOFILL" });
        }
      });
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
});
