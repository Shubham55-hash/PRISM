// Pattern matchers for extracting the exact intent of an input field.
// Maps a normalized field name (extracted from id, name, placeholder) to the PRISM data key.
// The matching logic gives priorities to strict matching and fuzzy keyword matching.

const FIELD_MAPPING_RULES = [
  { keys: ['fullName', 'name'], patterns: [/full.*name/i, /name/i, /fname/i] },
  { keys: ['email'], patterns: [/email/i, /e-mail/i, /mail/i] },
  { keys: ['phone'], patterns: [/phone/i, /mobile/i, /contact/i, /tel/i, /cell/i] },
  { keys: ['dateOfBirth'], patterns: [/dob/i, /birth/i, /born/i] },
  { keys: ['address'], patterns: [/address/i, /street/i, /location/i, /addr/i] },
  { keys: ['city'], patterns: [/city/i, /town/i, /locality/i] },
  { keys: ['state'], patterns: [/state/i, /province/i, /region/i] },
  { keys: ['pincode'], patterns: [/pin/i, /zip/i, /postal/i] },
  
  // Advanced OCR mappings
  { keys: ['aadhaarNumber'], patterns: [/aadhaar/i, /aadhar/i, /uidai/i, /national.*id/i] },
  { keys: ['panNumber'], patterns: [/pan/i, /tax.*id/i] },
  { keys: ['passportNumber'], patterns: [/passport/i] },
  { keys: ['bankAccountNumber'], patterns: [/account/i, /bank/i, /iban/i] },
  { keys: ['ifscCode'], patterns: [/ifsc/i, /routing/i, /sort.*code/i] },
  { keys: ['employer'], patterns: [/employer/i, /company/i, /organization/i, /workplace/i] },
  { keys: ['designation'], patterns: [/designation/i, /title/i, /role/i, /position/i] },
];

/**
 * Takes the raw node attributes (name, id, label) and attempts to resolve it against
 * the standardized PRISM identity fields.
 */
function normalizeFieldToPrismKey(node) {
  // Aggregate all potential descriptors
  const descriptors = [
    node.name || "",
    node.id || "",
    node.placeholder || "",
    node.getAttribute("aria-label") || ""
  ];

  // If a label element is attached to the id, use its text
  if (node.id) {
    const labelNodes = document.querySelectorAll(`label[for="${node.id}"]`);
    if (labelNodes && labelNodes.length > 0) {
      descriptors.push(labelNodes[0].innerText || labelNodes[0].textContent);
    }
  }

  // Sanitize down to a singular string for fast regex scanning
  const textSpace = descriptors.join(" ").toLowerCase();

  // Return the first match based on the heuristics
  for (const rule of FIELD_MAPPING_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(textSpace)) {
        // Return the first valid mapped key associated with this pattern
        return rule.keys[0]; 
      }
    }
  }

  return null;
}
