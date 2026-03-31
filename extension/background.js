import { fetchAutofillData } from './utils/api.js';

// Setup listener for messages from content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_AUTOFILL_DATA") {
    // Fire asynchronously and keep connection open by returning true
    handleAutofillRequest(sendResponse);
    return true; 
  }
});

async function handleAutofillRequest(sendResponse) {
  try {
    const result = await chrome.storage.local.get(["prism_token"]);
    const token = result.prism_token;

    if (!token) {
      console.warn("[PRISM Autofill] Background: No token found in storage.");
      return sendResponse({ success: false, error: "No token found. Please connect in the extension popup." });
    }

    console.log("[PRISM Autofill] Background: Calling backend with token:", token.substring(0, 8) + "...");
    const response = await fetchAutofillData(token);
    
    console.log("[PRISM Autofill] Background: API result:", response?.success ? "SUCCESS" : "FAILED", response?.message || "");

    if (response && response.success) {
      sendResponse({ success: true, data: response.data });
    } else {
      sendResponse({ success: false, error: response?.message || "Failed to fetch data from PRISM." });
    }
  } catch (err) {
    console.error("[PRISM Autofill Background Engine Error]", err);
    sendResponse({ success: false, error: "Internal extension error: " + err.message });
  }
}
