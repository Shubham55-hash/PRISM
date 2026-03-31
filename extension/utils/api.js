// api.js - Network Handler for PRISM Autofill

/**
 * Fetches the user's PRISM identity data utilizing the exact 
 * secure Bearer token mapping requested by the extension design.
 */
export async function fetchAutofillData(token) {
  try {
    const res = await fetch("http://127.0.0.1:4000/api/autofill/fetch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    
    // We expect the backend to return { success: true, data: { ... } }
    const result = await res.json();
    return result;
  } catch (error) {
    console.error("[PRISM Autofill] API Error:", error);
    return { success: false, message: error.message };
  }
}
