/**
 * content.js - PRISM Autofill Content Script
 * Detects forms, matches fields, and injects PRISM data.
 */

(function () {
  console.log("[PRISM Autofill] Content script active.");

  let autofillData = null;
  let isRunning = false;

  /**
   * Request data from background script only if we don't have it yet.
   */
  async function ensureAutofillData() {
    if (autofillData) return true;

    console.log("[PRISM Autofill] Requesting data from background...");
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: "FETCH_AUTOFILL_DATA" }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("[PRISM Autofill] Runtime error:", chrome.runtime.lastError.message);
            if (chrome.runtime.lastError.message.includes("context invalidated")) {
              console.error("[PRISM Autofill] Extension reloaded. Please refresh the page to continue.");
            }
            resolve(false);
            return;
          }

          if (response && response.success) {
            autofillData = response.data;
            console.log("[PRISM Autofill] Data received:", Object.keys(autofillData));
            resolve(true);
          } else {
            console.warn("[PRISM Autofill] Fetch failed:", response?.error || "Unknown error");
            resolve(false);
          }
        });
      } catch (e) {
        console.error("[PRISM Autofill] Send message failed:", e.message);
        resolve(false);
      }
    });
  }

  /**
   * Main autofill execution logic.
   */
  async function runAutofill() {
    if (isRunning) return;
    isRunning = true;

    try {
      const inputs = Array.from(document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select"));
      if (inputs.length === 0) {
        isRunning = false;
        return;
      }

      const dataReady = await ensureAutofillData();
      if (!dataReady || !autofillData) {
        isRunning = false;
        return;
      }

      console.log(`[PRISM Autofill] Evaluating ${inputs.length} fields...`);
      let filledCount = 0;

      inputs.forEach((input) => {
        // Rule: Only fill empty fields
        if (input.value && input.value.trim() !== "") return;

        const prismKey = typeof normalizeFieldToPrismKey === 'function' 
          ? normalizeFieldToPrismKey(input) 
          : null;

        if (prismKey) {
          console.log(`[PRISM Autofill] Match found: field "${input.id || input.name || input.placeholder}" -> prismKey "${prismKey}"`);
          
          if (autofillData[prismKey]) {
            const valToFill = autofillData[prismKey];
            input.value = valToFill;

            // Trigger events
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            
            // Visual feedback
            input.style.backgroundColor = "rgba(112, 88, 49, 0.05)";
            input.style.border = "1px solid #705831";
            setTimeout(() => {
              input.style.backgroundColor = "";
              input.style.border = "";
            }, 3000);

            filledCount++;
          } else {
            console.log(`[PRISM Autofill] Map exists for "${prismKey}" but no data found in vault.`);
          }
        }
      });

      if (filledCount > 0) {
        console.log(`[PRISM Autofill] Successfully hydrated ${filledCount} fields.`);
      } else {
        console.log("[PRISM Autofill] No empty matching fields found to fill.");
      }
    } catch (e) {
      console.error("[PRISM Autofill] Execution error:", e);
    } finally {
      isRunning = false;
    }
  }

  // Listen for manual trigger from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "TRIGGER_AUTOFILL") {
      console.log("[PRISM Autofill] Manual trigger received.");
      runAutofill();
    } else if (msg.type === "GET_TOKEN_FROM_PAGE") {
      // Extract token from localStorage if available
      const token = localStorage.getItem('prism_token');
      if (token) {
        console.log("[PRISM Autofill] Token found in page, sending to popup");
        sendResponse({ token });
      } else {
        console.log("[PRISM Autofill] No token found in page");
        sendResponse({ token: null });
      }
    }
  });

  // 1. Initial run
  runAutofill();

  // 2. MutationObserver
  const observer = new MutationObserver((mutations) => {
    if (mutations.some(m => m.addedNodes.length > 0)) {
      clearTimeout(window.prismAutofillTimeout);
      window.prismAutofillTimeout = setTimeout(runAutofill, 800);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
