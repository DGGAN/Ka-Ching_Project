/**
 * @file backend/controllers/ocrController.js
 * @layer Backend Controller (Google Cloud Vision OCR + Unified 4-Tier Merchant Categorizer)
 * @description Extracts raw text from receipt images via Google Cloud Vision API, parses merchant/amount/date, and classifies categories using the shared 4-Tier merchantCategorizer engine.
 * @exports scanReceipts
 */

const axios = require("axios");
const { classifyTransactionCategory } = require("../utils/merchantCategorizer");
const logger = require("../utils/logger");

// Helper 1: Extract true merchant name while skipping Bank / Card Terminal / Acquirer headers (e.g. Boost, CIMB Bank, Maybank)
function extractMerchantFromText(lines = []) {
  // Patterns that represent card acquirers, banks, payment gateways, or generic receipt headers (NOT the actual store)
  const bankAndHeaderNoisePattern =
    /^(?:boost|oost|boost\s*tm|oost\s*tm|cimb|cimb\s*bank|maybank|maybank2u|public\s*bank|rhb|rhb\s*bank|hong\s*leong|ambank|uob|ocbc|hsbc|standard\s*chartered|bank\s*islam|bank\s*rakyat|bank\s*muamalat|alliance\s*bank|affin\s*bank|bsn|agrobank|ghl|e-ghl|ipay88|fiuu|rms|razer\s*merchant|revenue\s*monster|paydee|touch\s*'?n\s*go|tng\s*digital|grabpay|shopeepay|duitnow|visa|mastercard|unionpay|mydebit|american\s*express|amex|contactless|sale|customer\s*copy|merchant\s*copy|tax\s*invoice|invoice|receipt|resit|cash\s*bill|bill|welcome|thank\s*you|date\s*\/?\s*time|tid\s*:|mid\s*:|batch\s*no|appr\s*code|rrn\s*:|trace\s*#|aid\s*:|tvr\s*:|host\s*:)/i;

  // Address or metadata lines that should not be mistaken for the store name
  const addressOrCodePattern =
    /^(?:tel|phone|fax|gst|sst|reg\s*no|company\s*no|no\.?\s*\d|lot\s*[a-z0-9]|ground\s*floor|level\s*\d|tingkat|\d{1,5}[a-z]?\s*,?\s*jalan|jalan\s+|lorong\s+|persiaran\s+|taman\s+|bandar\s+|seksyen\s+|\d{5}\s+[a-z]|kuala\s*lumpur|selangor|johor|penang|perak|melaka|negeri\s*sembilan|pahang|kedah|kelantan|terengganu|sabah|sarawak|putrajaya|cyberjaya|malaysia|\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{1,2}:\d{2})/i;

  for (const rawLine of lines.slice(0, 12)) {
    // Strip trademark symbols and leading/trailing noise
    const cleanedLine = rawLine
      .replace(/[™®©*#]/g, " ")
      .replace(/[^a-zA-Z0-9\s&'’.\-()\/]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanedLine.length < 3) continue;
    if (/^\d+$/.test(cleanedLine)) continue;

    // Remove trailing "TM" if OCR read Boost™ as "Boost TM" or "oost TM"
    const withoutTm = cleanedLine.replace(/\s+TM$/i, "").trim();

    // Skip if the line is a bank/acquirer name, card terminal header, or address line
    if (bankAndHeaderNoisePattern.test(cleanedLine) || bankAndHeaderNoisePattern.test(withoutTm) || addressOrCodePattern.test(cleanedLine)) {
      continue;
    }

    // Strip SSM registration numbers like "(123456-X)" or "(202001012345)"
    const strippedMerchant = cleanedLine
      .replace(/\(\s*\d{4,12}\s*-?\s*[A-Za-z]?\s*\)/g, "")
      .replace(/\b\d{12}\b/g, "")
      .trim();

    if (strippedMerchant.length >= 3) {
      return strippedMerchant.slice(0, 55);
    }
  }

  return "Scanned Receipt";
}

// Helper 2: Normalize OCR misreads on faded thermal digits (e.g. "RM 85.9U" or "RM 85.9O" -> "85.90")
function normalizeFadedCurrencyText(text = "") {
  return String(text).replace(/(\d+\.\d)[OQoUuCc](\b|\s|$)/g, "$10$2");
}

// Helper 3: Extract payable total RM / currency amount from thermal receipts & card terminal slips
function extractTotalAmountFromText(fullText = "", lines = []) {
  const normalizedFullText = normalizeFadedCurrencyText(fullText);
  const normalizedLines = lines.map((l) => normalizeFadedCurrencyText(l));

  const totalKeywords =
    /(?:amt\s*:\s*rm|amt\s*:|grand\s*total|nett\s*total|total\s*amount|amount\s*due|total\s*payable|jumlah\s*besar|jumlah|total|nett|rounded|payment|paid)/i;
  const excludeKeywords =
    /(?:change|baki|cash\s*tendered|tendered|rounding|gst|sst|tax|service\s*charge|discount|diskaun|subtotal|sub-total|points|balance|version\s*:)/i;

  // Pass 1: Look for explicit "AMT: RM 49.30" or "RM 85.90" anywhere in the text
  const explicitRmMatches = normalizedFullText.match(/(?:AMT\s*:\s*RM|TOTAL\s*:\s*RM|RM|MYR)\s*([0-9]{1,5}(?:,[0-9]{3})*\.[0-9]{2})/gi) || [];

  if (explicitRmMatches.length > 0) {
    const candidates = explicitRmMatches.map((m) => parseFloat(m.replace(/[^0-9.]/g, ""))).filter((v) => !isNaN(v) && v > 0 && v < 100000);
    if (candidates.length > 0) {
      return Number(Math.max(...candidates).toFixed(2));
    }
  }

  // Pass 2: Look bottom-up for lines with TOTAL / AMT keywords
  for (let i = normalizedLines.length - 1; i >= 0; i--) {
    const line = normalizedLines[i];
    if (totalKeywords.test(line) && !excludeKeywords.test(line)) {
      const matches = line.match(/(?:RM|MYR|\$)?\s*([0-9]{1,5}(?:,[0-9]{3})*\.[0-9]{2})/gi);
      if (matches && matches.length > 0) {
        const lastNumStr = matches[matches.length - 1].replace(/[^0-9.]/g, "");
        const val = parseFloat(lastNumStr);
        if (!isNaN(val) && val > 0 && val < 100000) {
          return Number(val.toFixed(2));
        }
      }
    }
  }

  // Pass 3: Fallback to largest decimal number (excluding software version strings like "Version: 26.09.03")
  let bestAmount = 0;
  for (const line of normalizedLines) {
    if (/version|tid:|mid:|rrn:|aid:|tvr:/i.test(line)) continue;
    const lineDecimals = line.match(/\b([0-9]{1,5}(?:,[0-9]{3})*\.[0-9]{2})\b/g) || [];
    for (const numStr of lineDecimals) {
      const val = parseFloat(numStr.replace(/,/g, ""));
      if (!isNaN(val) && val > bestAmount && val < 50000) {
        bestAmount = val;
      }
    }
  }

  return bestAmount > 0 ? Number(bestAmount.toFixed(2)) : 0;
}

// Helper 4: Extract exact date from receipt text; fallback to today ONLY when no valid date is found on the receipt
function extractDateFromText(fullText = "") {
  const now = new Date();

  // Pattern A: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (even when attached to "DATE/TIME:05/11/2026")
  const dmyRegex = /(?:^|[^0-9])(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2}|\d{2})(?:[^0-9]|$)/g;
  let match;
  while ((match = dmyRegex.exec(fullText)) !== null) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;

    // Ignore version numbers like "26.09.03" where year would become 2003
    if (year < 2018 || year > now.getFullYear() + 1) continue;

    // Malaysian standard is DD/MM/YYYY; if p2 > 12, swap to MM/DD/YYYY
    const day = p2 <= 12 ? p1 : p2;
    const monthIndex = (p2 <= 12 ? p2 : p1) - 1;

    if (monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31) {
      const parsedDate = new Date(year, monthIndex, day, 12, 0, 0);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }
  }

  // Pattern B: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = fullText.match(/(?:^|[^0-9])(20\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:[^0-9]|$)/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const monthIndex = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    if (monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31) {
      const parsedDate = new Date(year, monthIndex, day, 12, 0, 0);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }
  }

  // Pattern C: DD Mon YYYY (e.g. "29 Oct 2026" or "05 Nov 2026")
  const textMonthMatch = fullText.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,.\-]+(20\d{2}|\d{2})\b/i);
  if (textMonthMatch) {
    const parsedDate = new Date(
      `${textMonthMatch[1]} ${textMonthMatch[2]} ${textMonthMatch[3].length === 2 ? "20" + textMonthMatch[3] : textMonthMatch[3]} 12:00:00`,
    );
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
  }

  // Fallback to today ONLY if the receipt has no recognizable date at all
  return now.toISOString();
}

exports.scanReceipts = async (req, res) => {
  try {
    const { userId, images, imageBase64 } = req.body;

    // Support both batch { images: [...] } and single { imageBase64: "..." }
    const imageList = Array.isArray(images) ? images : imageBase64 ? [{ base64: imageBase64, uri: null }] : [];

    if (imageList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one receipt image to scan.",
      });
    }

    const visionApiKey = process.env.GOOGLE_VISION_API_KEY;

    const extractedResults = [];

    for (let i = 0; i < imageList.length; i++) {
      const imgObj = imageList[i];
      const cleanBase64 = String(imgObj.base64 || "").replace(/^data:image\/\w+;base64,/, "");

      let rawText = "";
      let confidenceScore = 0.91;

      if (visionApiKey && cleanBase64) {
        try {
          const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`;
          const visionRes = await axios.post(
            visionUrl,
            {
              requests: [
                {
                  image: { content: cleanBase64 },
                  features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
                },
              ],
            },
            { timeout: 10000 },
          );

          const annotations = visionRes.data?.responses?.[0]?.textAnnotations || [];
          if (annotations.length > 0) {
            rawText = annotations[0].description || "";
            confidenceScore = 0.94;
          }
        } catch (visionErr) {
          logger.warn("OCR_VISION_API", "Google Vision API request notice", visionErr.message);
        }
      }

      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      // Verbose raw OCR lines only printed in development mode or when DEBUG_LOGS=true
      logger.debug("OCR_RAW_LINES", `Receipt #${i + 1} extracted lines:`, lines);

      let merchantName = extractMerchantFromText(lines);
      let amount = extractTotalAmountFromText(rawText, lines);
      const dateIso = extractDateFromText(rawText);

      // Run Unified 4-Tier Category Classifier (Brand Dict -> Memory -> Item Context -> Gemini AI)
      const classification = await classifyTransactionCategory({
        userId,
        merchantName,
        rawText,
        type: "EXPENSE",
      });

      if (
        classification.aiEnhancedMerchant &&
        (merchantName === "Scanned Receipt" ||
          /^(?:boost|oost|cimb|maybank|public bank|rhb|hong leong|visa|mastercard)/i.test(merchantName) ||
          /SDN BHD/i.test(merchantName))
      ) {
        merchantName = classification.aiEnhancedMerchant;
      }
      if ((!amount || amount <= 0) && classification.aiEnhancedAmount > 0) {
        amount = classification.aiEnhancedAmount;
      }

      // Concise summary log printed in both development and production
      logger.info(
        "OCR_SCAN",
        `Receipt #${i + 1} parsed -> Merchant: "${merchantName}", Amount: RM ${Number(amount || 0).toFixed(2)}, Date: ${dateIso.slice(0, 10)}, Category: ${classification.category} (${classification.matchedTier})`,
      );

      extractedResults.push({
        merchantName,
        amount,
        category: classification.category || "OTHER_EXPENSE",
        matchedTier: classification.matchedTier,
        date: dateIso,
        confidenceScore: rawText ? confidenceScore : 0.78,
        rawText: rawText || `${merchantName}\nTOTAL: RM ${amount.toFixed(2)}`,
        imageUri: imgObj.uri || null,
      });
    }

    return res.status(200).json({
      success: true,
      data: Array.isArray(images) ? extractedResults : extractedResults[0],
    });
  } catch (error) {
    logger.error("OCR_SCAN", "Failed to process receipt via OCR", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process receipt via OCR.",
      error: error.message,
    });
  }
};
