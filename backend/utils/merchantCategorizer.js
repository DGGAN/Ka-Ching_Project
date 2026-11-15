/**
 * @file backend/utils/merchantCategorizer.js
 * @layer Shared Backend AI & Rule Utility (4-Tier Hybrid Merchant & Category Classification Engine)
 * @description Unifies category classification and notification parsing for both OCR Receipt Scanning (ocrController.js) and Smart Notification Auto-Capture (transactionController.js).
 * @exports classifyTransactionCategory, analyzeReceiptWithGeminiAI, parsePaymentNotificationText
 */

const axios = require("axios");
const Transaction = require("../models/Transaction");
const logger = require("./logger");

// ============================================================================
// TIER 2: MALAYSIAN BRAND & ROOT-WORD DICTIONARY (Instant 0ms Match)
// ============================================================================
const MERCHANT_BRAND_RULES = [
  {
    category: "GROCERIES",
    keywords: [
      "99 speedmart",
      "speedmart",
      "jaya grocer",
      "village grocer",
      "lotus's",
      "lotus’s",
      "lotus cheras",
      "lotus ",
      "lotuss",
      "tesco",
      "aeon big",
      "aeon maxvalu",
      "mydin",
      "giant",
      "econsave",
      "kk super mart",
      "kk mart",
      "bens independent",
      "b.i.g",
      "mercato",
      "cold storage",
      "nsk",
      "st rosak",
      "hero market",
      "tf value",
      "billion",
      "checkers",
      "matahari",
      "pasaraya",
      "pasar mini",
      "mini market",
      "minimart",
      "hypermarket",
      "supermarket",
      "grocer",
      "fresh mart",
      "segar",
      "runcit",
      "kedai runcit",
    ],
  },
  {
    category: "FOOD_AND_BEVERAGE",
    keywords: [
      "western food",
      "oh yeah kopitiam",
      "kopitiam",
      "oriental kopi",
      "familymart",
      "family mart",
      "cu mart",
      "7-eleven",
      "7 eleven",
      "mynews",
      "emart24",
      "zus coffee",
      "zus ",
      "starbucks",
      "chagee",
      "tealive",
      "mixue",
      "gigi coffee",
      "kenangan coffee",
      "kopi kenangan",
      "richiamo",
      "hwc coffee",
      "bask bear",
      "gong cha",
      "tiger sugar",
      "xing fu tang",
      "koi the",
      "inside scoop",
      "llaollao",
      "boost juice",
      "yogurt",
      "mcdonald",
      "mcd ",
      "kfc",
      "burger king",
      "texas chicken",
      "marrybrown",
      "a&w",
      "subway",
      "pizza hut",
      "domino",
      "nando",
      "4fingers",
      "kyochon",
      "suki-ya",
      "sukiya",
      "haidilao",
      "beauty in the pot",
      "sushi mentai",
      "sushi king",
      "sushi zanmai",
      "empire sushi",
      "nippon sushi",
      "genki sushi",
      "rakuzen",
      "myburgerlab",
      "kbg ",
      "secret recipe",
      "oldtown",
      "old town",
      "pappa rich",
      "papparich",
      "madam kwan",
      "bungkus kaw kaw",
      "ali, muthu & ah hock",
      "pelita",
      "kayu nasi kandar",
      "q bistro",
      "ali maju",
      "lavender bakery",
      "rt pastry",
      "breadtalk",
      "rotiboy",
      "kenny hills",
      "din tai fung",
      "dragon-i",
      "canton-i",
      "grabfood",
      "foodpanda",
      "shopeefood",
      "restoran",
      "restaurant",
      "kedai kopi",
      "cafe",
      "kafe",
      "coffee",
      "roastery",
      "bakery",
      "bakehouse",
      "patisserie",
      "bistro",
      "kitchen",
      "dapur",
      "warung",
      "gerai",
      "nasi kandar",
      "nasi lemak",
      "mamak",
      "food court",
      "medan selera",
      "hawker",
      "ramen",
      "hotpot",
      "steamboat",
      "bbq",
      "grill",
      "diner",
      "eatery",
      "canteen",
      "kantin",
      "dim sum",
    ],
  },
  {
    category: "SHOPPING",
    keywords: [
      "louis vuitton",
      "vuitton",
      "gucci",
      "chanel",
      "prada",
      "hermes",
      "christian dior",
      "dior ",
      "balenciaga",
      "bottega",
      "ysl",
      "saint laurent",
      "burberry",
      "celine",
      "fendi",
      "loewe",
      "versace",
      "armani",
      "valentino",
      "givenchy",
      "cartier",
      "tiffany & co",
      "rolex",
      "omega ",
      "tag heuer",
      "seiko",
      "swatch",
      "casio",
      "pandora",
      "swarovski",
      "lovisa",
      "poh kong",
      "wah chan",
      "habib",
      "tomei",
      "coach",
      "kate spade",
      "michael kors",
      "tory burch",
      "longchamp",
      "charles & keith",
      "charles and keith",
      "pedro",
      "aldo",
      "bonia",
      "sembonia",
      "carlo rino",
      "christy ng",
      "shopee",
      "lazada",
      "tiktok shop",
      "taobao",
      "zalora",
      "shein",
      "uniqlo",
      "padini",
      "brands outlet",
      "h&m",
      "zara",
      "mango",
      "pull&bear",
      "bershka",
      "cotton on",
      "factorie",
      "typo",
      "hla ",
      "giordano",
      "bossini",
      "levi's",
      "levis",
      "calvin klein",
      "tommy hilfiger",
      "lacoste",
      "ralph lauren",
      "superdry",
      "nike",
      "adidas",
      "puma",
      "new balance",
      "skechers",
      "asics",
      "under armour",
      "vans",
      "converse",
      "crocs",
      "jd sports",
      "foot locker",
      "royal sporting",
      "sports direct",
      "decathlon",
      "sephora",
      "innisfree",
      "laneige",
      "sasa",
      "bath & body",
      "the body shop",
      "kiehl's",
      "loccitane",
      "mac cosmetics",
      "daiso",
      "eco-shop",
      "ecoshop",
      "ninso",
      "kaison",
      "miniso",
      "muji",
      "noko",
      "machines",
      "switch ",
      "apple store",
      "samsung",
      "xiaomi",
      "huawei",
      "oppo",
      "vivo",
      "sony",
      "dyson",
      "harvey norman",
      "senheng",
      "senq",
      "tmt ",
      "thunder match",
      "all it hypermarket",
      "viewnet",
      "low yat",
      "parkson",
      "isetan",
      "sogo",
      "aeon style",
      "departmental",
      "boutique",
      "butik",
      "apparel",
      "fashion",
      "jewellery",
      "jewelry",
      "emas",
      "handbag",
      "footwear",
    ],
  },
  {
    category: "TRANSPORT",
    keywords: [
      "petronas",
      "setel",
      "shell",
      "petron",
      "caltex",
      "bhp",
      "bhpetrol",
      "grab ride",
      "grabcar",
      "airasia ride",
      "indrive",
      "maxim",
      "lalamove",
      "myrapid",
      "rapidkl",
      "prasarana",
      "ktmb",
      "klia ekspres",
      "plus highway",
      "plus toll",
      "rfid",
      "touch 'n go toll",
      "tng toll",
      "smarttag",
      "kesas",
      "ldp ",
      "sprint highway",
      "mex highway",
      "duke highway",
      "parking",
      "parkmax",
      "jcparking",
      "metro parking",
      "lim tayar",
      "car wash",
      "workshop",
      "bengkel",
      "tayar",
    ],
  },
  {
    category: "BILLS_AND_UTILITIES",
    keywords: [
      "tenaga nasional",
      "tnb",
      "air selangor",
      "syabas",
      "indah water",
      "iwk",
      "unifi",
      "telekom malaysia",
      "time dotcom",
      "time fibre",
      "maxis",
      "hotlink",
      "celcom",
      "celcomdigi",
      "digi ",
      "u mobile",
      "umobile",
      "yes 5g",
      "astro",
      "cuckoo",
      "coway",
      "dobi",
      "laundry",
      "laundromat",
    ],
  },
  {
    category: "HOUSING",
    keywords: [
      "condo",
      "residence",
      "hostel",
      "rental",
      "sewa",
      "management corp",
      "jmb ",
      "maintenance fee",
      "ikea",
      "mr diy",
      "mr. diy",
      "mr.d.i.y",
      "ssf home",
      "courts",
      "hardware",
      "perabot",
    ],
  },
  {
    category: "HEALTH_AND_WELLNESS",
    keywords: [
      "watsons",
      "guardian",
      "caring pharmacy",
      "big pharmacy",
      "aa pharmacy",
      "alpro pharmacy",
      "health lane",
      "multicare",
      "farmasi",
      "pharmacy",
      "klinik",
      "clinic",
      "poliklinik",
      "hospital",
      "medical",
      "dental",
      "pergigian",
      "optical",
      "optometry",
      "kedai ubat",
      "anytime fitness",
      "celebrity fitness",
      "fitness",
      "gym",
      "yoga",
      "pilates",
      "barber",
      "hair salon",
      "salun",
      "spa ",
    ],
  },
  {
    category: "EDUCATION",
    keywords: [
      "popular bookstore",
      "popular ",
      "kinokuniya",
      "mph bookstores",
      "bookxcess",
      "tsutaya",
      "kedai buku",
      "bookstore",
      "stationery",
      "alat tulis",
      "photostat",
      "printing",
      "percetakan",
      "sunway university",
      "sunway college",
      "monash",
      "taylor's",
      "inti ",
      "apu ",
      "uitm",
      "um ",
      "tuition",
      "tuisyen",
      "udemy",
      "coursera",
    ],
  },
  {
    category: "LEISURE_AND_ENTERTAINMENT",
    keywords: [
      "gsc ",
      "golden screen",
      "tgv ",
      "mmcineplexes",
      "mbo ",
      "cinema",
      "pawagam",
      "netflix",
      "spotify",
      "youtube premium",
      "disney+",
      "apple.com/bill",
      "playstation",
      "steam",
      "codashop",
      "loud speaker",
      "red box",
      "karaoke",
      "bowling",
      "billiards",
      "snooker",
      "cyber cafe",
      "net cafe",
      "genting",
      "sunway lagoon",
      "escape park",
      "aquaria",
      "zoo negara",
      "agoda",
      "booking.com",
      "airbnb",
      "klook",
      "hotel",
      "resort",
    ],
  },
];

// ============================================================================
// TIER 3: RECEIPT FULL-TEXT ITEM & CONTEXT SCORING (For obscure Sdn Bhd names)
// ============================================================================
const RECEIPT_CONTEXT_SIGNALS = [
  {
    category: "SHOPPING",
    terms: [
      "client advisor",
      "store number",
      "sku:",
      "style:",
      "size:",
      "colour:",
      "color:",
      "apparel",
      "garment",
      "leather",
      "canvas",
      "monogram",
      "eau de parfum",
      "fragrance",
      "sneakers",
      "handbag",
      "cosmetic",
      "skincare",
      "warranty",
      "serial no",
      "exchange policy",
      "return policy",
    ],
  },
  {
    category: "FOOD_AND_BEVERAGE",
    terms: [
      "dine in",
      "dine-in",
      "take away",
      "takeaway",
      "bungkus",
      "table no",
      "pax:",
      "cover:",
      "waiter",
      "service charge",
      "service tax",
      "srv chg",
      "nasi lemak",
      "nasi goreng",
      "mee goreng",
      "bihun",
      "kuey teow",
      "ayam",
      "chicken chop",
      "carbonara",
      "roti bakar",
      "roti canai",
      "tomyam",
      "sambal",
      "teh tarik",
      "teh ais",
      "lemon tea",
      "kopi o",
      "milo",
      "latte",
      "americano",
      "espresso",
      "cappuccino",
      "matcha",
      "milk tea",
      "croissant",
      "pastry",
      "burger",
      "fries",
      "ramen",
      "sushi",
      "udon",
      "kurang manis",
    ],
  },
  {
    category: "GROCERIES",
    terms: [
      "sayur",
      "bawang",
      "kentang",
      "telur gred",
      "beras",
      "minyak masak",
      "tepung",
      "detergent",
      "shampoo",
      "toothpaste",
      "plastic bag",
      "weighing",
      "fresh milk",
      "frozen",
    ],
  },
  {
    category: "TRANSPORT",
    terms: [
      "ron95",
      "ron97",
      "diesel",
      "pump no",
      "litre",
      "liter",
      "petrol",
      "plaza tol",
      "parking fee",
      "grace period",
      "plate no",
      "engine oil",
      "alignment",
    ],
  },
  {
    category: "HEALTH_AND_WELLNESS",
    terms: [
      "consultation",
      "medication",
      "dispensing",
      "prescription",
      "tablet",
      "capsule",
      "ointment",
      "paracetamol",
      "antibiotic",
      "vitamin",
      "scaling",
    ],
  },
  {
    category: "BILLS_AND_UTILITIES",
    terms: ["kwh", "meter reading", "tariff", "bil elektrik", "bil air", "broadband", "postpaid", "prepaid", "reload", "topup"],
  },
  {
    category: "EDUCATION",
    terms: ["isbn", "hardcover", "paperback", "notebook", "ballpoint", "highlighter", "a4 paper", "binding", "lamination", "semester", "tuition fee"],
  },
];

// Helper: Match merchant name or text against Tier 2 dictionary & Tier 3 context signals
function classifyByLocalDictionaryAndContext(merchantName = "", rawText = "", txType = "EXPENSE") {
  const combinedLower = `${merchantName} \n ${rawText}`.toLowerCase();
  const merchantLower = String(merchantName || "").toLowerCase();

  if (txType === "INCOME") {
    if (/salary|payroll|gaji|stipend|wages/i.test(combinedLower)) {
      return { category: "SALARY", matchedTier: "TIER_2_DICTIONARY" };
    }
    if (/allowance|elaun|pocket money|parents|ayah|ibu|mama|papa/i.test(combinedLower)) {
      return { category: "ALLOWANCE", matchedTier: "TIER_2_DICTIONARY" };
    }
    if (/dividend|asnb|tabung haji|go\+|stashaway|wahed|fd |interest|return/i.test(combinedLower)) {
      return { category: "INVESTMENT_RETURN", matchedTier: "TIER_2_DICTIONARY" };
    }
    if (/freelance|commission|client|project|upwork|fiverr|part-time|part time/i.test(combinedLower)) {
      return { category: "FREELANCE", matchedTier: "TIER_2_DICTIONARY" };
    }
    if (/angpow|angpao|duit raya|gift|present|reward|cashback|refund/i.test(combinedLower)) {
      return { category: "GIFT", matchedTier: "TIER_2_DICTIONARY" };
    }
    return { category: "OTHER_INCOME", matchedTier: "DEFAULT_FALLBACK" };
  }

  // Pass 1 (Tier 2A): Check merchantName directly against Brand & Root-Word rules
  for (const rule of MERCHANT_BRAND_RULES) {
    for (const kw of rule.keywords) {
      if (merchantLower.includes(kw)) {
        logger.debug("CATEGORIZER", `Tier 2A (Merchant Brand Dict) matched keyword "${kw}" -> ${rule.category}`);
        return { category: rule.category, matchedTier: "TIER_2_DICTIONARY" };
      }
    }
  }

  // Pass 2 (Tier 2B): Check full text against Brand & Root-Word rules
  for (const rule of MERCHANT_BRAND_RULES) {
    for (const kw of rule.keywords) {
      if (combinedLower.includes(kw)) {
        logger.debug("CATEGORIZER", `Tier 2B (Full-Text Brand Dict) matched keyword "${kw}" -> ${rule.category}`);
        return { category: rule.category, matchedTier: "TIER_2_DICTIONARY" };
      }
    }
  }

  // Pass 3 (Tier 3): Score full receipt text using item lines & industry context signals
  let bestCategory = null;
  let bestScore = 0;

  for (const signalGroup of RECEIPT_CONTEXT_SIGNALS) {
    let score = 0;
    for (const term of signalGroup.terms) {
      if (combinedLower.includes(term)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = signalGroup.category;
    }
  }

  if (bestCategory && bestScore >= 1) {
    logger.debug("CATEGORIZER", `Tier 3 (Context Scoring) matched with score=${bestScore} -> ${bestCategory}`);
    return { category: bestCategory, matchedTier: "TIER_3_CONTEXT_SCORING" };
  }

  return { category: "OTHER_EXPENSE", matchedTier: "DEFAULT_FALLBACK" };
}

// ============================================================================
// TIER 1: USER PERSONAL HISTORY MEMORY (Learns from user's past transactions)
// ============================================================================
async function lookupUserHistoricalCategory(userId, merchantName, txType = "EXPENSE") {
  if (!userId || !merchantName || merchantName.length < 3) return null;
  const cleanName = merchantName.trim();
  if (/unknown|scanned receipt|general|manual review/i.test(cleanName)) {
    return null;
  }

  try {
    const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pastTx = await Transaction.findOne({
      userId,
      type: txType,
      merchantName: { $regex: new RegExp(escaped, "i") },
      category: { $nin: ["OTHER_EXPENSE", "OTHER_INCOME"] },
    })
      .sort({ date: -1 })
      .lean();

    if (pastTx && pastTx.category) {
      logger.debug("CATEGORIZER", `Tier 1 (User History Memory) matched "${cleanName}" -> ${pastTx.category}`);
      return pastTx.category;
    }
  } catch (err) {
    logger.warn("CATEGORIZER", "Tier 1 history lookup skipped", err.message);
  }
  return null;
}

// ============================================================================
// TIER 4: GEMINI FLASH AI SEMANTIC CLASSIFIER (Optional LLM Fallback)
// ============================================================================
async function analyzeReceiptWithGeminiAI(rawText = "", fallbackMerchant = "", txType = "EXPENSE") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !rawText || rawText.trim().length < 5) {
    return null;
  }

  const allowedCategories = txType === "INCOME" ? Transaction.INCOME_CATEGORIES : Transaction.EXPENSE_CATEGORIES;

  const prompt = `You are a financial receipt & payment notification analyzer for the Ka-Ching! expense tracker.
Given the following text from a receipt or card payment slip, extract:
1. "merchantName": The ACTUAL store or merchant name (IMPORTANT: Do NOT return card acquirers or bank headers like "Boost", "CIMB BANK", "Maybank", "Public Bank", "GHL", or "PayDee"; extract the store name below the bank header, e.g. "OH YEAH KOPITIAM CHERAS" or "LOTUS'S CHERAS").
2. "amount": Numeric total amount paid (number only, or null if not found).
3. "category": Must be EXACTLY ONE of these enum keys: ${JSON.stringify(allowedCategories)}.

Return ONLY valid JSON: {"merchantName": "...", "amount": 91.15, "category": "..."}

Receipt/Notification Text:
"""
${String(rawText).slice(0, 1800)}
"""`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      },
      { timeout: 4500 },
    );

    const textOut = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(textOut);

    if (parsed && allowedCategories.includes(parsed.category)) {
      logger.debug("CATEGORIZER", `Tier 4 (Gemini AI) classified "${parsed.merchantName}" -> ${parsed.category}`);
      return {
        merchantName: parsed.merchantName || fallbackMerchant || "Scanned Receipt",
        amount: typeof parsed.amount === "number" && parsed.amount > 0 ? Number(parsed.amount.toFixed(2)) : null,
        category: parsed.category,
        matchedTier: "TIER_4_GEMINI_AI",
      };
    }
  } catch (aiErr) {
    logger.warn("CATEGORIZER", "Tier 4 Gemini AI fallback skipped or failed", aiErr.message);
  }
  return null;
}

// ============================================================================
// MAIN EXPORT 1: Unified 4-Tier Category Classifier (Used by OCR & Auto-Capture)
// ============================================================================
async function classifyTransactionCategory({ userId = null, merchantName = "", rawText = "", type = "EXPENSE" }) {
  // Tier 2 & Tier 3 first if merchantName is a known brand in our dictionary
  const localMatch = classifyByLocalDictionaryAndContext(merchantName, rawText, type);

  if (localMatch.matchedTier === "TIER_2_DICTIONARY") {
    return {
      category: localMatch.category,
      matchedTier: localMatch.matchedTier,
      aiEnhancedMerchant: null,
      aiEnhancedAmount: null,
    };
  }

  // Tier 1: Check if this user has already categorized this merchant in past transactions
  const memoryCategory = await lookupUserHistoricalCategory(userId, merchantName, type);
  if (memoryCategory) {
    return {
      category: memoryCategory,
      matchedTier: "TIER_1_USER_MEMORY",
      aiEnhancedMerchant: null,
      aiEnhancedAmount: null,
    };
  }

  if (localMatch.category !== "OTHER_EXPENSE" && localMatch.category !== "OTHER_INCOME") {
    return {
      category: localMatch.category,
      matchedTier: localMatch.matchedTier,
      aiEnhancedMerchant: null,
      aiEnhancedAmount: null,
    };
  }

  // Tier 4: If local rules fell back to OTHER_EXPENSE (obscure shop name), ask Gemini AI
  const aiResult = await analyzeReceiptWithGeminiAI(`${merchantName}\n${rawText}`, merchantName, type);
  if (aiResult) {
    return {
      category: aiResult.category,
      matchedTier: aiResult.matchedTier,
      aiEnhancedMerchant: aiResult.merchantName,
      aiEnhancedAmount: aiResult.amount,
    };
  }

  return {
    category: localMatch.category,
    matchedTier: localMatch.matchedTier,
    aiEnhancedMerchant: null,
    aiEnhancedAmount: null,
  };
}

// ============================================================================
// MAIN EXPORT 2: Shared Notification Parser (Used by autoCaptureNotification)
// ============================================================================
async function parsePaymentNotificationText({ userId = null, title = "", text = "", packageName = "" }) {
  const combined = `${title} ${text}`.replace(/\s+/g, " ").trim();

  // 1. Extract RM / MYR amount
  const amountRegex = /(?:RM|MYR)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  const amountMatch = combined.match(amountRegex);
  if (!amountMatch) return null;

  const parsedAmount = parseFloat(amountMatch[1].replace(/,/g, ""));
  if (isNaN(parsedAmount) || parsedAmount <= 0) return null;

  // 2. Determine direction: INCOME vs EXPENSE
  const isIncome =
    /(?:received|credited|money in|transferred to you|duitnow received|refunded)/i.test(combined) &&
    !/(?:paid|sent to|payment to|deducted|transferred to\s+[A-Z])/i.test(combined);
  const txType = isIncome ? "INCOME" : "EXPENSE";

  // 3. Extract merchant or counterparty name
  let merchantName = "";
  const toFromPatterns = [
    /(?:paid|payment|sent|transferred)\s+(?:RM|MYR)?\s*[0-9.,]+\s+to\s+([A-Za-z0-9\s&'’.\-_()]+?)(?:\s+(?:via|using|on|at|ref|reference|successful|was successful)|[.!]|$)/i,
    /(?:to|at)\s+([A-Za-z0-9\s&'’.\-_()]{2,38}?)(?:\s+(?:via|using|on|was successful|successful|ref)|[.!]|$)/i,
    /(?:received|from)\s+(?:RM|MYR)?\s*[0-9.,]*\s*(?:from\s+)?([A-Za-z0-9\s&'’.\-_()]{2,38}?)(?:\s+(?:via|using|into|ref)|[.!]|$)/i,
  ];

  for (const pattern of toFromPatterns) {
    const m = text.match(pattern) || combined.match(pattern);
    if (m && m[1]) {
      const candidate = m[1].replace(/\b(using|via|touch 'n go|ewallet|tng|duitnow|qr|mae|grabpay)\b/gi, "").trim();
      if (candidate.length >= 2) {
        merchantName = candidate;
        break;
      }
    }
  }

  if (!merchantName) {
    if (/tng|touch 'n go/i.test(combined) || /tngdigital/i.test(packageName)) {
      merchantName = "TNG eWallet Payment";
    } else if (/grab/i.test(combined) || /grabtaxi/i.test(packageName)) {
      merchantName = "GrabPay Transaction";
    } else if (/maybank|mae/i.test(combined) || /maybank/i.test(packageName)) {
      merchantName = "MAE DuitNow Payment";
    } else {
      merchantName = title || "Auto-Captured Payment";
    }
  }

  // 4. Run Unified 4-Tier Category Classification
  const classification = await classifyTransactionCategory({
    userId,
    merchantName,
    rawText: combined,
    type: txType,
  });

  if (classification.aiEnhancedMerchant && /Payment|Transaction/i.test(merchantName)) {
    merchantName = classification.aiEnhancedMerchant;
  }

  const budgetType = txType === "EXPENSE" ? Transaction.BUDGET_TYPE_MAP?.[classification.category] || "WANTS" : "NONE";

  logger.debug(
    "NOTIFICATION_PARSER",
    `Parsed notification -> Merchant: "${merchantName}", Amount: RM ${Number(parsedAmount).toFixed(2)}, Type: ${txType}, Category: ${classification.category} (${classification.matchedTier})`,
  );

  return {
    amount: Number(parsedAmount.toFixed(2)),
    type: txType,
    merchantName: merchantName.slice(0, 60),
    category: classification.category,
    budgetType,
    matchedTier: classification.matchedTier,
    sourceApp:
      title || (packageName.includes("tng") ? "Touch 'n Go eWallet" : packageName.includes("maybank") ? "MAE by Maybank2u" : "Payment Notification"),
  };
}

module.exports = {
  classifyTransactionCategory,
  analyzeReceiptWithGeminiAI,
  parsePaymentNotificationText,
};
