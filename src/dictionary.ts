/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DictionaryEntry {
  id: string;
  sourcePattern: string; // The raw database/TDS column name (e.g., "agentname", "cust_id")
  targetName: string;    // The enterprise standard display name (e.g., "Agent Name", "Customer ID")
  description?: string;  // Optional description for metadata documentation
  category?: string;     // Group fields (e.g., "Customer", "Product", "Sales", "System")
}

export const DEFAULT_DICTIONARY: DictionaryEntry[] = [
  { id: "1", sourcePattern: "agentname", targetName: "Agent Name", category: "Agent", description: "Name of the assigned customer representative" },
  { id: "2", sourcePattern: "category", targetName: "Category", category: "Product", description: "Broad categorization of products" },
  { id: "3", sourcePattern: "product", targetName: "Product", category: "Product", description: "Individual product name" },
  { id: "4", sourcePattern: "productname", targetName: "Product Name", category: "Product", description: "Full descriptive name of the product" },
  { id: "5", sourcePattern: "cust_id", targetName: "Customer ID", category: "Customer", description: "Unique enterprise identifier for a customer" },
  { id: "6", sourcePattern: "customer_id", targetName: "Customer ID", category: "Customer", description: "Unique enterprise identifier for a customer" },
  { id: "7", sourcePattern: "customerid", targetName: "Customer ID", category: "Customer", description: "Unique enterprise identifier for a customer" },
  { id: "8", sourcePattern: "orderdate", targetName: "Order Date", category: "Sales", description: "The calendar date when the purchase order was placed" },
  { id: "9", sourcePattern: "order_date", targetName: "Order Date", category: "Sales", description: "The calendar date when the purchase order was placed" },
  { id: "10", sourcePattern: "shipdate", targetName: "Ship Date", category: "Sales", description: "The calendar date when the order was shipped" },
  { id: "11", sourcePattern: "ship_date", targetName: "Ship Date", category: "Sales", description: "The calendar date when the order was shipped" },
  { id: "12", sourcePattern: "sales_amount", targetName: "Sales Amount", category: "Sales", description: "Gross monetary value of sales in USD" },
  { id: "13", sourcePattern: "sales", targetName: "Sales", category: "Sales", description: "Gross monetary value of sales" },
  { id: "14", sourcePattern: "revenue", targetName: "Revenue", category: "Sales", description: "Net financial revenue generated" },
  { id: "15", sourcePattern: "profit", targetName: "Profit", category: "Sales", description: "Net income or earnings margin" },
  { id: "16", sourcePattern: "discount", targetName: "Discount", category: "Sales", description: "Reduction percentage or amount applied" },
  { id: "17", sourcePattern: "qty", targetName: "Quantity", category: "Sales", description: "Count of items purchased" },
  { id: "18", sourcePattern: "quantity", targetName: "Quantity", category: "Sales", description: "Count of items purchased" },
  { id: "19", sourcePattern: "store_id", targetName: "Store ID", category: "System", description: "Unique identifier for physical store location" },
  { id: "20", sourcePattern: "storeid", targetName: "Store ID", category: "System", description: "Unique identifier for physical store location" },
  { id: "21", sourcePattern: "postalcode", targetName: "Postal Code", category: "Customer", description: "Regional postal identifier or ZIP code" },
  { id: "22", sourcePattern: "zipcode", targetName: "Zip Code", category: "Customer", description: "US postal zip code" },
  { id: "23", sourcePattern: "segment", targetName: "Segment", category: "Customer", description: "Customer segment market group" },
  { id: "24", sourcePattern: "sub_category", targetName: "Sub-Category", category: "Product", description: "Sub-classification of products" },
  { id: "25", sourcePattern: "customer_name", targetName: "Customer Name", category: "Customer", description: "Full name of the customer" },
  { id: "26", sourcePattern: "isactive", targetName: "Is Active", category: "System", description: "Flag indicating if the record is currently active" },
  { id: "27", sourcePattern: "is_active", targetName: "Is Active", category: "System", description: "Flag indicating if the record is currently active" },
];

const LOCAL_STORAGE_KEY = "enterprise_data_dictionary";

export function getEnterpriseDictionary(): DictionaryEntry[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse local storage dictionary, using defaults", e);
  }
  return [...DEFAULT_DICTIONARY];
}

export function saveEnterpriseDictionary(entries: DictionaryEntry[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error("Failed to save dictionary to local storage", e);
  }
}

/**
 * Strips Tableau brackets: "[agentname]" -> "agentname"
 */
export function cleanFieldName(raw: string): string {
  if (!raw) return "";
  return raw.replace(/^\[/, "").replace(/\]$/, "").trim();
}

/**
 * High-utility smart naming suggestor
 * Converts raw column names to human-readable standardized names.
 */
export function suggestRename(rawFieldName: string, dictionaryEntries: DictionaryEntry[]): {
  suggestedName: string;
  matchedBy: "dictionary" | "heuristic" | "exact";
} {
  const clean = cleanFieldName(rawFieldName);
  if (!clean) return { suggestedName: "", matchedBy: "exact" };

  // 1. Look up in the enterprise dictionary (case-insensitive & whitespace/underscore ignored match)
  const canonicalClean = clean.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  const dictMatch = dictionaryEntries.find(entry => {
    const dictClean = entry.sourcePattern.toLowerCase().replace(/[^a-z0-9]/g, "");
    return dictClean === canonicalClean || entry.sourcePattern.toLowerCase() === clean.toLowerCase();
  });

  if (dictMatch) {
    return {
      suggestedName: dictMatch.targetName,
      matchedBy: "dictionary"
    };
  }

  // 2. Fall back to smart heuristic rule splitting
  let working = clean;

  // If it's pure capital letters with underscores (e.g., AGENT_NAME, SALES_AMOUNT)
  if (/^[A-Z0-9_]+$/.test(working)) {
    working = working.toLowerCase();
  }

  // Handle common delimiters first (snake_case, kebab-case, space-separated)
  if (working.includes("_") || working.includes("-") || working.includes(" ")) {
    const parts = working.split(/[_\-\s]+/);
    const titlized = parts
      .filter(p => p.length > 0)
      .map(p => capitalizeWord(p))
      .join(" ");
    return {
      suggestedName: titlized,
      matchedBy: "heuristic"
    };
  }

  // Handle camelCase transitions
  if (/[a-z][A-Z]/.test(working)) {
    const splitCamel = working.replace(/([a-z])([A-Z])/g, "$1 $2");
    const titlized = splitCamel
      .split(/\s+/)
      .map(p => capitalizeWord(p))
      .join(" ");
    return {
      suggestedName: titlized,
      matchedBy: "heuristic"
    };
  }

  // Handle runtogether lowercase fields with common suffix splitters
  let splitAttempt = working;
  const commonSuffixes = [
    { suffix: "name", replacement: " Name" },
    { suffix: "id", replacement: " ID" },
    { suffix: "date", replacement: " Date" },
    { suffix: "code", replacement: " Code" },
    { suffix: "qty", replacement: " Qty" },
    { suffix: "amount", replacement: " Amount" },
    { suffix: "rate", replacement: " Rate" },
    { suffix: "num", replacement: " Number" },
    { suffix: "number", replacement: " Number" },
    { suffix: "status", replacement: " Status" },
    { suffix: "type", replacement: " Type" },
    { suffix: "value", replacement: " Value" },
  ];

  const commonPrefixes = [
    { prefix: "is", replacement: "Is " },
    { prefix: "has", replacement: "Has " },
    { prefix: "get", replacement: "Get " },
  ];

  let suffixMatched = false;
  for (const item of commonSuffixes) {
    const low = working.toLowerCase();
    if (low.endsWith(item.suffix) && low !== item.suffix) {
      const idx = low.lastIndexOf(item.suffix);
      const prefixPart = working.substring(0, idx);
      splitAttempt = capitalizeWord(prefixPart) + item.replacement;
      suffixMatched = true;
      break;
    }
  }

  if (!suffixMatched) {
    for (const item of commonPrefixes) {
      const low = working.toLowerCase();
      if (low.startsWith(item.prefix) && low !== item.prefix) {
        const suffixPart = working.substring(item.prefix.length);
        splitAttempt = item.replacement + capitalizeWord(suffixPart);
        suffixMatched = true;
        break;
      }
    }
  }

  if (suffixMatched) {
    return {
      suggestedName: splitAttempt,
      matchedBy: "heuristic"
    };
  }

  // Final fallback: just Capitalize the runtogether string or whole word
  return {
    suggestedName: capitalizeWord(working),
    matchedBy: "heuristic"
  };
}

function capitalizeWord(word: string): string {
  if (!word) return "";
  const lower = word.toLowerCase();
  // Special capitalizations
  if (lower === "id") return "ID";
  if (lower === "usd") return "USD";
  if (lower === "eur") return "EUR";
  if (lower === "url") return "URL";
  if (lower === "sku") return "SKU";
  if (lower === "tds") return "TDS";
  if (lower === "api") return "API";
  
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}
