// api.js - Network Handler for PRISM Autofill

/**
 * Fetches the user's PRISM identity data utilizing the exact 
 * secure Bearer token mapping requested by the extension design.
 */
export async function fetchAutofillData(token) {
  try {
    console.log(`[PRISM Autofill API] Sending POST to http://127.0.0.1:4000/api/autofill/fetch`);
    const res = await fetch("http://127.0.0.1:4000/api/autofill/fetch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    
    console.log(`[PRISM Autofill API] Response status: ${res.status} ${res.statusText}`);
    
    const text = await res.text();
    console.log(`[PRISM Autofill API] Raw response: ${text.substring(0, 100)}${text.length > 100 ? "..." : ""}`);
    
    try {
      const result = JSON.parse(text);
      return result;
    } catch (jsonErr) {
      console.error("[PRISM Autofill API] JSON Parse Error", jsonErr);
      return { success: false, message: "Response was not valid JSON: " + text.substring(0, 50) };
    }
  } catch (error) {
    console.error("[PRISM Autofill API] Fetch error:", error.message);
    return { success: false, message: "Network error: " + error.message };
  }
}
