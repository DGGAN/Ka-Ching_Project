// Import axios for Google Cloud Vision REST API requests
const axios = require("axios");

// Comprehensive Malaysian & International merchant/item keyword rules
const CATEGORY_RULES = [
  {
    category: "FOOD_AND_BEVERAGE",
    merchantKeywords: [
      "WESTERN FOOD",
      "WIN WIN",
      "CAFFE",
      "CAFE",
      "COFFEE",
      "STARBUCKS",
      "CHAGEE",
      "TEALIVE",
      "ZUS COFFEE",
      "ZUS",
      "KFC",
      "MCDONALD",
      "MCD",
      "BURGER KING",
      "DOMINO",
      "PIZZA HUT",
      "TEXAS CHICKEN",
      "NANDO",
      "BHC",
      "BONCHON",
      "FAMILYMART",
      "CU MART",
      "MIXUE",
      "LLAOLAO",
      "GONG CHA",
      "KOI",
      "SECRET RECIPE",
      "OLDTOWN",
      "ORIENTAL KOPI",
      "HOCK KEE",
      "PAPPARICH",
      "MYKORI",
      "INSIDE SCOOP",
      "BASKIN",
      "KENNY ROGERS",
      "SUBWAY",
      "SUSHI KING",
      "EMPIRE SUSHI",
      "NIPPON SUSHI",
      "SUKIYA",
      "HAIDILAO",
      "PAK MAT",
      "PELITA",
      "KAYU",
      "RESTORAN",
      "RESTAURANT",
      "BISTRO",
      "BAKERY",
      "PATISSERIE",
      "LACHER",
      "FOODPANDA",
      "GRABFOOD",
      "JAYA GROCER",
      "VILLAGE GROCER",
      "LOTUS",
      "AEON BIG",
      "GIANT",
      "MYDIN",
      "99 SPEEDMART",
      "KK SUPER MART",
      "7-ELEVEN",
      "7 ELEVEN",
      "NSK",
      "ECONSAVE",
      "MERCATO",
      "B.I.G",
    ],
    itemKeywords: [
      "CARBONARA",
      "UDON",
      "CHICKEN CHOP",
      "GRILLED",
      "LEMON TEA",
      "BREAKFAST",
      "SOUR PLUM",
      "ACQUA",
      "FRUTTA",
      "CROISS",
      "CROISSANT",
      "LATTE",
      "ESPRESSO",
      "AMERICANO",
      "MOCHA",
      "MATCHA",
      "MILK TEA",
      "NASI",
      "MEE",
      "AYAM",
      "BURGER",
      "FRIES",
      "PIZZA",
      "PASTA",
      "ROTI",
      "TEH",
      "KOPI",
      "MILO",
      "BREAD",
      "CAKE",
      "TART",
      "DINE IN",
      "TAKEAWAY",
      "TABLE NO",
      "COVER:",
    ],
  },
  {
    category: "SHOPPING",
    merchantKeywords: [
      "LOUIS VUITTON",
      "VUITTON",
      "GUCCI",
      "CHANEL",
      "HERMES",
      "PRADA",
      "DIOR",
      "YSL",
      "SAINT LAURENT",
      "BALENCIAGA",
      "BURBERRY",
      "COACH",
      "MICHAEL KORS",
      "KATE SPADE",
      "TORY BURCH",
      "LONGCHAMP",
      "SWAROVSKI",
      "PANDORA",
      "ROLEX",
      "LUXURY GOODS",
      "OUTLET",
      "NIKE",
      "ADIDAS",
      "PUMA",
      "NEW BALANCE",
      "FOOT LOCKER",
      "JD SPORTS",
      "DECATHLON",
      "UNIQLO",
      "ZARA",
      "H&M",
      "PADINI",
      "BRANDS OUTLET",
      "COTTON ON",
      "HLA",
      "MUJI",
      "IKEA",
      "MR DIY",
      "MR.DIY",
      "MR DOLLAR",
      "MR TOY",
      "DAISO",
      "ECO SHOP",
      "MINISO",
      "POP MART",
      "WATSONS",
      "SEPHORA",
      "INNISFREE",
      "SASA",
      "BATH & BODY",
      "VICTORIA SECRET",
      "SHOPEE",
      "LAZADA",
      "TIKTOK SHOP",
      "ZALORA",
      "TAOBAO",
      "HARVEY NORMAN",
      "SENQ",
      "SENHENG",
      "MACHINES",
      "SWITCH",
      "TMT",
      "ALL IT",
      "LOW YAT",
      "PARKSON",
      "SOGO",
      "ISETAN",
      "AEON",
    ],
    itemKeywords: [
      "NEVERF",
      "NEVERFULL",
      "SPEEDY",
      "ALMA",
      "MONOGRAM",
      "HANDBAG",
      "LEATHER",
      "WALLET",
      "SHIRT",
      "PANTS",
      "JEANS",
      "DRESS",
      "SHOE",
      "SNEAKER",
      "JACKET",
      "BAG",
      "COSMETIC",
      "SKINCARE",
      "SHAMPOO",
      "LOTION",
      "PERFUME",
      "CLIENT ADVISOR",
    ],
  },
  {
    category: "TRANSPORT",
    merchantKeywords: [
      "PETRONAS",
      "SHELL",
      "CALTEX",
      "BHPETROL",
      "PETRON",
      "GRAB",
      "AIRASIA RIDE",
      "INDRIVE",
      "MAXIM",
      "RAPIDKL",
      "PRASARANA",
      "KTMB",
      "ERL",
      "KLIA EKSPRES",
      "PLUS HIGHWAY",
      "LITRAK",
      "SMART TUNNEL",
      "PARKSON PARKING",
      "METRO PARKING",
      "SONIC PARK",
      "SETEL",
      "BEAM",
      "LUMA",
    ],
    itemKeywords: [
      "PRIMAX 95",
      "PRIMAX 97",
      "V-POWER",
      "FUEL SAVE 95",
      "BLAZE 95",
      "DIESEL",
      "UNLEADED",
      "PUMP NO",
      "LITRE",
      "PARKING FEE",
      "TOLL",
      "E-HAILING",
    ],
  },
  {
    category: "BILLS_AND_UTILITIES",
    merchantKeywords: [
      "TENAGA NASIONAL",
      "TNB",
      "AIR SELANGOR",
      "SYABAS",
      "INDAH WATER",
      "IWK",
      "TELEKOM MALAYSIA",
      "TM UNIFI",
      "UNIFI",
      "MAXIS",
      "HOTLINK",
      "CELCOM",
      "DIGI",
      "CELCOMDIGI",
      "U MOBILE",
      "YES 5G",
      "TIME DOTCOM",
      "ASTRO",
      "COWAY",
      "CUCKOO",
      "SK MAGIC",
    ],
    itemKeywords: ["ELECTRICITY BILL", "WATER BILL", "BROADBAND", "POSTPAID", "PREPAID", "UTILITY BILL", "SEWERAGE", "BILLING PERIOD"],
  },
  {
    category: "HEALTH_AND_WELLNESS",
    merchantKeywords: [
      "GUARDIAN",
      "CARING PHARMACY",
      "BIG PHARMACY",
      "AA PHARMACY",
      "ALPRO",
      "HEALTH LANE",
      "MULTICARE",
      "WATSONS PHARMACY",
      "KLINIK",
      "CLINIC",
      "HOSPITAL",
      "SUNWAY MEDICAL",
      "GLENEAGLES",
      "PANTAI HOSPITAL",
      "KPJ",
      "COLUMBIA ASIA",
      "DENTAL",
      "OPTICAL",
      "MOG",
      "FOCUS POINT",
      "CELEBRITY FITNESS",
      "ANYTIME FITNESS",
      "CHII FITNESS",
      "GOFIT",
    ],
    itemKeywords: [
      "CONSULTATION",
      "MEDICATION",
      "DISPENSING",
      "PARACETAMOL",
      "VITAMIN",
      "SUPPLEMENT",
      "ANTIBIOTIC",
      "TABLET",
      "CAPSULE",
      "SYRUP",
      "MEDICAL",
    ],
  },
  {
    category: "LEISURE_AND_ENTERTAINMENT",
    merchantKeywords: [
      "GSC",
      "GOLDEN SCREEN",
      "TGV",
      "MBO",
      "2D CINEMA",
      "NETFLIX",
      "SPOTIFY",
      "YOUTUBE PREMIUM",
      "APPLE.COM/BILL",
      "STEAM",
      "PLAYSTATION",
      "RIOT GAMES",
      "VALORANT",
      "GENTING",
      "SKYLINE LUGE",
      "AQUARIA",
      "SUNWAY LAGOON",
      "DISNEYLAND",
      "RED BOX",
      "LOUD SPEAKER",
      "KARAOKE",
      "WANGSA BOWL",
      "ARCADE",
      "MOLLY FANTASY",
      "TIMEZONE",
    ],
    itemKeywords: ["MOVIE TICKET", "HALL", "SEAT NO", "ADMISSION", "THEME PARK", "GAME PASS", "SUBSCRIPTION", "BOWLING", "KARAOKE"],
  },
  {
    category: "EDUCATION",
    merchantKeywords: [
      "SUNWAY UNIVERSITY",
      "SUNWAY COLLEGE",
      "TAYLOR UNIVERSITY",
      "MONASH",
      "APU",
      "INTI",
      "UTAR",
      "TAR UMT",
      "UM",
      "POPULAR BOOK",
      "POPULAR",
      "MPH BOOKSTORES",
      "KINOKUNIYA",
      "TSUTAYA",
      "BOOKXCESS",
      "COURSERA",
      "UDEMY",
    ],
    itemKeywords: ["TUITION FEE", "SEMESTER", "EXAM FEE", "TEXTBOOK", "STATIONERY", "NOTEBOOK", "CALCULATOR", "COURSE FEE"],
  },
];

const MONTH_NAME_MAP = {
  JAN: 0,
  JANUARY: 0,
  FEB: 1,
  FEBRUARY: 1,
  MAR: 2,
  MARCH: 2,
  APR: 3,
  APRIL: 3,
  MAY: 4,
  JUN: 5,
  JUNE: 5,
  JUL: 6,
  JULY: 6,
  AUG: 7,
  AUGUST: 7,
  SEP: 8,
  SEPT: 8,
  SEPTEMBER: 8,
  OCT: 9,
  OCTOBER: 9,
  NOV: 10,
  NOVEMBER: 10,
  DEC: 11,
  DECEMBER: 11,
};

// Normalize wide-spaced logos (e.g., "G U C C I" -> "GUCCI", "W I N" -> "WIN")
const collapseSpacedLetters = (line = "") => {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length >= 4 && tokens.every((t) => t.length === 1 && /[A-Za-z]/.test(t))) {
    return tokens.join("");
  }
  return line;
};

// 1. Parse Malaysian, US, and European Receipt Dates (Supports years 2000 - 2027)
const extractReceiptDate = (rawText = "") => {
  const now = new Date();

  const buildSafeDate = (yearNum, monthIndex, dayNum) => {
    let y = parseInt(yearNum, 10);
    if (y < 100) y += 2000;
    const m = parseInt(monthIndex, 10);
    const d = parseInt(dayNum, 10);

    if (y < 2000 || y > now.getFullYear() + 1) return null;
    if (m < 0 || m > 11) return null;
    if (d < 1 || d > 31) return null;

    const candidate = new Date(y, m, d, 12, 0, 0);
    if (isNaN(candidate.getTime()) || candidate.getMonth() !== m) return null;
    return candidate;
  };

  // Pattern A: DD MMM YYYY or DD-MMM-YY (e.g., "26 Oct 2026", "26-OCT-26")
  const alphaDateRegex = /\b(\d{1,2})[\s\/\-.,]*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*[\s\/\-.,]*(20\d{2}|\d{2})\b/gi;
  for (const match of rawText.matchAll(alphaDateRegex)) {
    const day = match[1];
    const monthKey = match[2].toUpperCase().slice(0, 3);
    const year = match[3];
    if (MONTH_NAME_MAP[monthKey] !== undefined) {
      const dt = buildSafeDate(year, MONTH_NAME_MAP[monthKey], day);
      if (dt) return { date: dt, dateConfidence: 0.98 };
    }
  }

  // Pattern B: MMM DD, YYYY (e.g., "Oct 26, 2026")
  const usAlphaRegex = /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*[\s.,\-]+(\d{1,2})[\s,\/\-]+(20\d{2}|\d{2})\b/gi;
  for (const match of rawText.matchAll(usAlphaRegex)) {
    const monthKey = match[1].toUpperCase().slice(0, 3);
    const day = match[2];
    const year = match[3];
    if (MONTH_NAME_MAP[monthKey] !== undefined) {
      const dt = buildSafeDate(year, MONTH_NAME_MAP[monthKey], day);
      if (dt) return { date: dt, dateConfidence: 0.96 };
    }
  }

  // Pattern C: YYYY-MM-DD or YYYY/MM/DD (ISO style, e.g., "2026-10-26")
  const isoDateRegex = /\b(20\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/g;
  for (const match of rawText.matchAll(isoDateRegex)) {
    const dt = buildSafeDate(match[1], parseInt(match[2], 10) - 1, match[3]);
    if (dt) return { date: dt, dateConfidence: 0.95 };
  }

  // Pattern D: DD/MM/YYYY, MM/DD/YY, or DD-MM-YY (e.g., "07/10/2026", "11/28/20", "25-09-16")
  const numericDateRegex = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2}|\d{2})\b/g;
  for (const match of rawText.matchAll(numericDateRegex)) {
    const firstNum = parseInt(match[1], 10);
    const secondNum = parseInt(match[2], 10);
    const yearStr = match[3];

    // Default to DD/MM/YYYY (Malaysia & Europe); automatically swap to MM/DD/YYYY if secondNum > 12 (e.g. 11/28/20)
    let day = firstNum;
    let monthIdx = secondNum - 1;
    if (secondNum > 12 && firstNum <= 12) {
      day = secondNum;
      monthIdx = firstNum - 1;
    }

    const dt = buildSafeDate(yearStr, monthIdx, day);
    const conf = firstNum > 12 || secondNum > 12 ? 0.96 : 0.9;
    if (dt) return { date: dt, dateConfidence: conf };
  }

  return { date: now, dateConfidence: 0.45 };
};

// 2. Extract Clean Merchant Name (Handles multi-word headers, spaced logos, and ignores payment methods)
const extractMerchantName = (rawLines = []) => {
  const lines = rawLines.map((l) => collapseSpacedLetters(l));
  const topLines = lines.slice(0, 8);
  const topSectionUpper = topLines.join("\n").toUpperCase();

  // Never allow payment methods at the bottom of a receipt to be mistaken for the merchant name
  const paymentMethodBlacklist =
    /\b(TOUCH\s*'?\s*N\s*GO|DUITNOW|GRABPAY|BOOST|SHOPEEPAY|MAYBANK\s*QR|VISA|MASTERCARD|AMEX|DEBIT\s*CARD|CREDIT\s*CARD|CONTANTI|CASH\s*TENDERED)\b/i;

  // Step A: Check if a known brand or food/retail keyword appears in the top 6 lines
  for (const rule of CATEGORY_RULES) {
    for (const brand of rule.merchantKeywords) {
      if (brand.length >= 4 && topSectionUpper.includes(brand)) {
        const matchedLineIdx = topLines.findIndex((l) => l.toUpperCase().includes(brand));
        if (matchedLineIdx !== -1 && !paymentMethodBlacklist.test(topLines[matchedLineIdx])) {
          let combinedHeader = topLines[matchedLineIdx];
          // If the very next line is a sub-brand like "CAFFE'" or "PANDAN INDAH SDN BHD", combine or clean it
          if (matchedLineIdx + 1 < topLines.length) {
            const nextLine = topLines[matchedLineIdx + 1];
            if (/^(CAFFE'?|CAFE|BISTRO|RESTAURANT|OUTLET|COFFEE)$/i.test(nextLine.trim())) {
              combinedHeader = `${combinedHeader} ${nextLine.trim()}`;
            }
          }

          const cleaned = combinedHeader
            .replace(/\(\d{4,12}-[A-Z0-9]+\)/gi, "")
            .replace(/\b(SDN\.?\s*BHD\.?|BERHAD|PLT|S\.?R\.?L\.?|INC\.?|LLC)\b/gi, "")
            .replace(/[^a-zA-Z0-9\s&'().-]/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();

          if (cleaned.length >= 2) {
            return { merchantName: cleaned, merchantConfidence: 0.97 };
          }
        }
      }
    }
  }

  // Step B: Clean top-line heuristic extraction
  const noiseRegex =
    /^(TAX\s*INVOICE|INVOICE|OFFICIAL\s*RECEIPT|RECEIPT|CASH\s*SALE|BILL|WELCOME\s*TO|THANK\s*YOU|COM\s*REG|GST\s*ID|SST\s*NO|SST\s*ID|REG\s*NO|COMPANY\s*NO|CO\.\s*NO|PARTITA\s*IVA|SEDE\s*LEGALE|VIA\s+|TEL|PHONE|FAX|HOTLINE|DATE|TIME|STORE:|REGISTER|TICKET:|CASHIER|CLIENT:|STAFF|SERVER|TABLE|PAX|ORDER\s*NO|CHECK\s*CODE|QUEUE|POS|TERMINAL|LOT\s+[A-Z0-9]|NO\.\s*\d|LEVEL\s*\d|\d+\s+SHARON\s+ROAD|JALAN\s|PERSIARAN\s|TAMAN\s|BANDAR\s|CHARLOTTE|SELANGOR|KUALA\s*LUMPUR|UNITED\s*STATES|MALAYSIA|WWW\.|HTTP)/i;

  for (let idx = 0; idx < Math.min(lines.length, 6); idx++) {
    const rawLine = lines[idx];
    if (paymentMethodBlacklist.test(rawLine)) continue;

    const cleanedLine = rawLine
      .replace(/\(?\bCOM\s*REG\s*:?\s*[0-9A-Z-]+\)?/gi, "")
      .replace(/\(\d{4,12}-[A-Z0-9]+\)/gi, "")
      .replace(/\b\d{10,14}\b/g, "")
      .trim();

    if (cleanedLine.length < 3) continue;
    if (noiseRegex.test(cleanedLine)) continue;

    const alphaCount = (cleanedLine.match(/[a-zA-Z]/g) || []).length;
    if (alphaCount < 3 || alphaCount / cleanedLine.length < 0.45) continue;
    if (/\b\d{5}\s+[A-Za-z]+/.test(cleanedLine)) continue;

    const finalMerchant = cleanedLine
      .replace(/\b(SDN\.?\s*BHD\.?|BERHAD|PLT|S\.?R\.?L\.?)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (finalMerchant.length >= 2) {
      const lineConf = Math.max(0.76, 0.92 - idx * 0.03);
      return { merchantName: finalMerchant, merchantConfidence: lineConf };
    }
  }

  return {
    merchantName: lines[0] ? lines[0].slice(0, 40) : "Unknown Merchant",
    merchantConfidence: 0.55,
  };
};

// 3. Parse Price Numbers (Supports US/MY "1,608.75", Standard "91.15", and European "11,70")
const parsePricesFromLine = (lineStr = "") => {
  const results = [];
  // Match numbers like 1,608.75 or 91.15 or European 11,70
  const priceRegex = /(?:RM|MYR|USD|EUR|EURO|\$|€)?\s*(\d{1,3}(?:,\d{3})+\.\d{2}|\d{1,6}\.\d{2}|\d{1,5},\d{2})\b/gi;

  for (const match of lineStr.matchAll(priceRegex)) {
    const rawNum = match[1];
    let normalized = rawNum;

    if (/^\d{1,3}(?:,\d{3})+\.\d{2}$/.test(rawNum)) {
      // Thousands separator comma with dot decimal: "1,608.75" -> "1608.75"
      normalized = rawNum.replace(/,/g, "");
    } else if (/^\d{1,5},\d{2}$/.test(rawNum)) {
      // European decimal comma: "11,70" -> "11.70"
      normalized = rawNum.replace(",", ".");
    }

    const val = parseFloat(normalized);
    if (!isNaN(val) && val > 0 && val < 250000) {
      results.push(val);
    }
  }
  return results;
};

// 4. Extract Total Amount (Supports N.Total, TOTALE EURO, Grand Total, and ignores CONTANTI / RESTO / Tax)
const extractTotalAmount = (lines = []) => {
  // Ignore Cash Tendered (CONTANTI), Change (RESTO / CHANGE), Subtotal, Tax, Rounding, and Payment echoes
  const ignoreLineRegex =
    /\b(SUB\s*TOTAL|SUBTOTAL|CHANGE|TENDERED|CASH\s*RECEIVED|CONTANTI|RESTO|ROUNDING|DISCOUNT|SAVINGS|SALES\s*TAX|SERVICE\s*TAX|TAX\s*SUMMARY|SST|GST|VAT|IVA|POINTS|TOUCH\s*'?\s*N\s*GO)\b/i;

  // Match Total labels in English, Malaysian POS ("N.Total", "Nett Total"), and European ("TOTALE", "TOTALE EURO")
  const strongTotalRegex =
    /(?:^|[\s.])(GRAND\s*TOTAL|NETT?\s*TOTAL|N\s*\.\s*TOTAL|TOTAL\s*AMOUNT|AMOUNT\s*DUE|TOTAL\s*PAYABLE|TOTAL\s*SALES|TOTALE\s*EURO|TOTALE|TOTAL\s*RM|TOTAL)(?:$|[\s:RM€$0-9])/i;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (ignoreLineRegex.test(line)) continue;

    if (strongTotalRegex.test(line) && !/\b(TOTAL\s*QTY|TOTAL\s*ITEM|TOTAL\s*DISCOUNT|TOTAL\s*SAVING|TOTAL\s*TAX)\b/i.test(line)) {
      const sameLineNums = parsePricesFromLine(line);
      if (sameLineNums.length > 0) {
        return {
          amount: sameLineNums[sameLineNums.length - 1],
          amountConfidence: 0.97,
        };
      }

      // In multi-column receipts, Google Vision often places the numeric amount on the next 1-2 lines
      for (let offset = 1; offset <= 2 && i + offset < lines.length; offset++) {
        const nextLine = lines[i + offset];
        if (ignoreLineRegex.test(nextLine)) continue;
        const nextLineNums = parsePricesFromLine(nextLine);
        if (nextLineNums.length > 0) {
          return {
            amount: nextLineNums[0],
            amountConfidence: offset === 1 ? 0.91 : 0.85,
          };
        }
      }
    }
  }

  // Fallback: Pick the largest valid amount from non-ignored lines (excluding cash tendered)
  const candidateAmounts = [];
  for (const line of lines) {
    if (ignoreLineRegex.test(line)) continue;
    const nums = parsePricesFromLine(line);
    candidateAmounts.push(...nums);
  }

  if (candidateAmounts.length > 0) {
    return { amount: Math.max(...candidateAmounts), amountConfidence: 0.72 };
  }

  return { amount: 0, amountConfidence: 0.35 };
};

// 5. Weighted Category Inference (Combines Merchant Name + Top Header + Item Lines)
const inferCategoryWeighted = (merchantName = "", rawLines = []) => {
  const lines = rawLines.map((l) => collapseSpacedLetters(l));
  const upperMerchant = merchantName.toUpperCase();
  const upperHeader = lines.slice(0, 6).join(" ").toUpperCase();
  const upperBody = lines.join(" ").toUpperCase();

  let bestCategory = "OTHER_EXPENSE";
  let highestScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;

    for (const mKw of rule.merchantKeywords) {
      if (upperMerchant.includes(mKw)) {
        score += 12;
      } else if (upperHeader.includes(mKw)) {
        score += 7;
      } else if (upperBody.includes(mKw)) {
        score += 2;
      }
    }

    for (const iKw of rule.itemKeywords) {
      if (upperBody.includes(iKw)) {
        score += 4;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestCategory = rule.category;
    }
  }

  const catConfidence = highestScore >= 10 ? 0.96 : highestScore >= 4 ? 0.86 : highestScore > 0 ? 0.75 : 0.55;
  return { category: bestCategory, catConfidence };
};

// 6. Extract Real Optical Confidence from Google Cloud Vision's fullTextAnnotation response
const extractGoogleVisionOpticalConfidence = (fullTextAnnotation) => {
  const pages = fullTextAnnotation?.pages || [];
  if (pages.length === 0) return null;

  if (typeof pages[0].confidence === "number" && pages[0].confidence > 0) {
    return pages[0].confidence;
  }

  let sumConf = 0;
  let count = 0;
  for (const page of pages) {
    for (const block of page.blocks || []) {
      if (typeof block.confidence === "number" && block.confidence > 0) {
        sumConf += block.confidence;
        count += 1;
      }
      for (const para of block.paragraphs || []) {
        if (typeof para.confidence === "number" && para.confidence > 0) {
          sumConf += para.confidence;
          count += 1;
        }
      }
    }
  }

  return count > 0 ? sumConf / count : null;
};

// Master Receipt Parser
const parseReceiptText = (rawText = "", visionOpticalConfidence = null) => {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const { merchantName, merchantConfidence } = extractMerchantName(lines);
  const { amount, amountConfidence } = extractTotalAmount(lines);
  const { date, dateConfidence } = extractReceiptDate(rawText);
  const { category, catConfidence } = inferCategoryWeighted(merchantName, lines);

  const opticalScore = visionOpticalConfidence !== null ? visionOpticalConfidence : 0.86;
  const compositeConfidence = opticalScore * 0.4 + amountConfidence * 0.3 + dateConfidence * 0.15 + ((merchantConfidence + catConfidence) / 2) * 0.15;

  const clampedConfidence = Math.min(0.99, Math.max(0.4, Number(compositeConfidence.toFixed(2))));

  return {
    merchantName,
    amount: Number(amount.toFixed(2)),
    category,
    date: date.toISOString(),
    confidenceScore: clampedConfidence,
    rawText,
  };
};

// POST /api/ocr/scan - Strict Live Google Cloud Vision API Only
exports.scanReceipts = async (req, res) => {
  try {
    const { images = [] } = req.body;
    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return res.status(503).json({
        message: "OCR service is currently unavailable (Google Vision API key is not configured).",
      });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        message: "No receipt images were provided for scanning.",
      });
    }

    const results = [];

    for (let i = 0; i < images.length; i++) {
      const imgObj = images[i] || {};
      const cleanBase64 = (imgObj.base64 || "").replace(/^data:image\/\w+;base64,/, "");

      if (cleanBase64.length < 50) {
        return res.status(400).json({
          message: `Receipt #${i + 1} image data could not be read. Please try selecting the photo again.`,
        });
      }

      const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey.trim()}`;
      let visionRes;

      try {
        visionRes = await axios.post(visionUrl, {
          requests: [
            {
              image: { content: cleanBase64 },
              features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        });
      } catch (apiErr) {
        const googleErrDetail = apiErr.response?.data?.error?.message || apiErr.message || "Google Vision API request failed.";
        return res.status(503).json({
          message: `OCR service is currently unavailable: ${googleErrDetail}`,
        });
      }

      const responseItem = visionRes.data?.responses?.[0];
      if (responseItem?.error) {
        return res.status(503).json({
          message: `OCR service error: ${responseItem.error.message || "Unable to process image."}`,
        });
      }

      const fullTextAnnotation = responseItem?.fullTextAnnotation;
      const fullText = fullTextAnnotation?.text || responseItem?.textAnnotations?.[0]?.description || "";

      if (!fullText || fullText.trim().length < 3) {
        return res.status(422).json({
          message: `No readable receipt text was detected in photo #${i + 1}. Please ensure the receipt is clear and well-lit.`,
        });
      }

      const visionOpticalConfidence = extractGoogleVisionOpticalConfidence(fullTextAnnotation);
      const parsed = parseReceiptText(fullText, visionOpticalConfidence);

      results.push({
        ...parsed,
        imageUri: imgObj.uri || null,
      });
    }

    return res.status(200).json({
      message: `Successfully extracted ${results.length} receipt(s).`,
      mode: "GOOGLE_VISION_API",
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      message: "OCR service is currently unavailable. Please try again later or enter manually.",
      error: error.message,
    });
  }
};
