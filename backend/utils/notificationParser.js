/**
 * @file backend/utils/notificationParser.js
 * @layer Backend Utility (Malaysian E-Wallet & Bank Notification Regex Parser)
 * @description Parses raw notification strings from Touch 'n Go eWallet, MAE Maybank2u, GrabPay, and DuitNow into structured transaction fields.
 * @exports parseMalaysianPaymentNotification, SUPPORTED_APPS
 */

const SUPPORTED_APPS = {
  "my.com.tngdigital.ewallet": "Touch 'n Go eWallet",
  "com.maybank2u.life": "MAE by Maybank2u",
  "com.grabtaxi.passenger": "GrabPay",
  "com.cimb.octomy": "CIMB OCTO",
  "ios.shortcuts.tng": "Touch 'n Go (iOS 27 Shortcut)",
};

// Keyword-to-Category dictionary strictly aligned with the 16 unified categories
const MERCHANT_CATEGORY_RULES = [
  {
    category: "FOOD_AND_BEVERAGE",
    keywords: [
      "familymart",
      "starbucks",
      "zus",
      "mcdonald",
      "kfc",
      "tealive",
      "bask bear",
      "coffee",
      "cafe",
      "mamak",
      "restoran",
      "nasi",
      "kopitiam",
      "sushi",
      "pizza",
      "secret recipe",
      "texas chicken",
      "marrybrown",
      "inside scoop",
      "llaollao",
      "boost juice",
      "richiamo",
      "gigi coffee",
      "chahagee",
      "chagee",
      "mixue",
      "foodpanda",
      "grabfood",
      "shopeefood",
      "baker",
      "kitchen",
      "bistro",
      "oldtown",
    ],
  },
  {
    category: "GROCERIES",
    keywords: [
      "99 speedmart",
      "speedmart",
      "jaya grocer",
      "village grocer",
      "lotus",
      "aeon",
      "mydin",
      "giant",
      "econsave",
      "kk super mart",
      "7-eleven",
      "7eleven",
      "cu mart",
      "emart",
      "nsks",
      "hero market",
      "supermarket",
      "mart",
    ],
  },
  {
    category: "TRANSPORT",
    keywords: [
      "petronas",
      "shell",
      "petron",
      "caltex",
      "bhp",
      "setel",
      "grab",
      "rapidkl",
      "prasarana",
      "lrt",
      "mrt",
      "ktm",
      "plus",
      "rfid",
      "smarttag",
      "toll",
      "parking",
      "dbkl",
      "mpsj",
      "mbpj",
      "beam",
      "airasia",
      "klia",
    ],
  },
  {
    category: "BILLS_AND_UTILITIES",
    keywords: [
      "tenaga",
      "tnb",
      "air selangor",
      "syabas",
      "indah water",
      "celcom",
      "digi",
      "maxis",
      "hotlink",
      "umobile",
      "unifi",
      "time dotcom",
      "astro",
      "yes 5g",
      "telekom",
      "ptptn",
    ],
  },
  {
    category: "SHOPPING",
    keywords: [
      "shopee",
      "lazada",
      "tiktok shop",
      "zalora",
      "uniqlo",
      "padini",
      "h&m",
      "cotton on",
      "mr diy",
      "mr.diy",
      "eco-shop",
      "ecoshop",
      "daiso",
      "muji",
      "ikea",
      "decathlon",
      "popular",
      "machines",
      "switch",
    ],
  },
  {
    category: "HEALTH_AND_WELLNESS",
    keywords: [
      "watsons",
      "guardian",
      "caring",
      "big pharmacy",
      "aa pharmacy",
      "alpro",
      "clinic",
      "klinik",
      "hospital",
      "dental",
      "farmasi",
      "gym",
      "anytime fitness",
      "celebrity fitness",
    ],
  },
  {
    category: "LEISURE_AND_ENTERTAINMENT",
    keywords: [
      "gsc",
      "tgv",
      "cinema",
      "netflix",
      "spotify",
      "youtube",
      "steam",
      "playstation",
      "genting",
      "karaoke",
      "loud speaker",
      "bowling",
      "icloud",
      "apple.com/bill",
    ],
  },
  {
    category: "EDUCATION",
    keywords: ["sunway", "taylor", "monash", "apu", "uitm", "um ", "utar", "tuition", "udemy", "coursera", "bookstore", "mph", "kinokuniya"],
  },
  {
    category: "HOUSING",
    keywords: ["rental", "sewa", "condo", "management corp", "jmb", "indah"],
  },
];

const inferCategoryFromMerchant = (merchantName = "", rawText = "", txType = "EXPENSE") => {
  const combined = `${merchantName} ${rawText}`.toLowerCase();

  if (txType === "INCOME") {
    if (combined.includes("salary") || combined.includes("gaji")) return "SALARY";
    if (combined.includes("allowance") || combined.includes("elaun")) return "ALLOWANCE";
    if (combined.includes("dividend") || combined.includes("go+") || combined.includes("asnb")) {
      return "INVESTMENT_RETURN";
    }
    return "OTHER_INCOME";
  }

  for (const rule of MERCHANT_CATEGORY_RULES) {
    if (rule.keywords.some((kw) => combined.includes(kw))) {
      return rule.category;
    }
  }
  return "OTHER_EXPENSE";
};

const parseMalaysianPaymentNotification = ({ title = "", text = "", packageName = "my.com.tngdigital.ewallet" }) => {
  const fullText = `${title} ${text}`.replace(/\s+/g, " ").trim();
  if (!fullText) return null;

  // 1. Extract RM Amount (Matches "RM 15.90", "RM15.90", "MYR 120.00", "RM 1,250.50")
  const amountMatch = fullText.match(/(?:RM|MYR)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
  if (!amountMatch) return null;

  const parsedAmount = parseFloat(amountMatch[1].replace(/,/g, ""));
  if (isNaN(parsedAmount) || parsedAmount <= 0) return null;

  // 2. Determine Transaction Type (EXPENSE vs INCOME)
  const lower = fullText.toLowerCase();
  const isIncome =
    lower.includes("received rm") ||
    lower.includes("received myr") ||
    lower.includes("credited") ||
    lower.includes("money in") ||
    lower.includes("reload successful");

  const txType = isIncome ? "INCOME" : "EXPENSE";

  // 3. Extract Merchant or Payee Name
  let merchantName = "";

  const merchantPatterns = [
    /(?:paid|payment of)\s+(?:RM|MYR)\s*[0-9,.]+\s+(?:to|at)\s+(.+?)(?:\s+using|\s+via|\s+was\s+successful|\s+on\s+\d|\s+ref|\.|$)/i,
    /(?:spent|transferred)\s+(?:RM|MYR)\s*[0-9,.]+\s+(?:to|at)\s+(.+?)(?:\s+using|\s+via|\s+on|\.|$)/i,
    /(?:to|at)\s+([A-Z0-9][A-Za-z0-9\s&'().-]{2,38}?)(?:\s+using|\s+via|\s+was\s+successful|\s+is\s+successful|\.|$)/i,
    /received\s+(?:RM|MYR)\s*[0-9,.]+\s+from\s+(.+?)(?:\s+via|\s+into|\.|$)/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      merchantName = match[1].trim().replace(/[.,;]+$/, "");
      break;
    }
  }

  const appLabel = SUPPORTED_APPS[packageName] || "Touch 'n Go eWallet";
  if (!merchantName) {
    merchantName = isIncome ? `${appLabel} Transfer` : `${appLabel} Payment`;
  }

  // 4. Infer unified 16-category enum key
  const category = inferCategoryFromMerchant(merchantName, fullText, txType);

  return {
    amount: Number(parsedAmount.toFixed(2)),
    type: txType,
    category,
    merchantName,
    appLabel,
    rawNotification: fullText,
  };
};

module.exports = {
  parseMalaysianPaymentNotification,
  SUPPORTED_APPS,
};
