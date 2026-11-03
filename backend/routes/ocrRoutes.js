// Import express Router and OCR controller
const express = require("express");
const router = express.Router();
const ocrController = require("../controllers/ocrController");

// POST /api/ocr/scan - Scan single or batch receipts and return extracted fields
router.post("/scan", ocrController.scanReceipts);

module.exports = router;
