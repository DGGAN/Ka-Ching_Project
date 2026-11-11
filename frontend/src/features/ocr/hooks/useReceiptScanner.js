/**
 * @file frontend/src/features/ocr/hooks/useReceiptScanner.js
 * @layer Hook (State, Auto-Trigger Camera/Gallery & Verification Queue — 100% Original Logic)
 * @description Uses scanReceiptImagesApi and saveVerifiedReceiptApi from ocrService.js, and replaces deprecated ImagePicker.MediaTypeOptions with mediaTypes: ["images"].
 * @exports useReceiptScanner
 */

import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { scanReceiptImagesApi, saveVerifiedReceiptApi } from "../services/ocrService";

export function useReceiptScanner(user, initialMode = "ocr_batch", showToast, onTransactionsSaved) {
  const [scannedItems, setScannedItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // Active item index for Category Popup Modal and Calendar Modal
  const [activeItemIndexForCat, setActiveItemIndexForCat] = useState(null);
  const [activeItemIndexForDate, setActiveItemIndexForDate] = useState(null);

  // Automatically trigger camera or gallery picker when entering Screen 5
  useEffect(() => {
    if (initialMode === "camera" || initialMode === "ocr_single") {
      handleTakePhoto();
    } else if (initialMode === "ocr_batch") {
      handlePickFromGallery();
    }
  }, [initialMode]);

  // 1. Capture a single receipt photo using the device camera (mediaTypes: ["images"])
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showToast("error", "Camera permission is required to snap receipt photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImagesWithOCR(result.assets);
      }
    } catch (error) {
      showToast("error", "Could not open camera. Try uploading from gallery.");
    }
  };

  // 2. Pick one or multiple receipt screenshots from the photo gallery (mediaTypes: ["images"])
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast("error", "Gallery permission is required to upload receipts.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImagesWithOCR(result.assets);
      }
    } catch (error) {
      showToast("error", "Could not open photo gallery.");
    }
  };

  // 3. Send selected images to backend POST /api/ocr/scan via scanReceiptImagesApi
  const processImagesWithOCR = async (assets) => {
    try {
      setScanning(true);
      const payloadImages = assets.map((asset) => ({
        uri: asset.uri,
        base64: asset.base64 || "",
      }));

      const rawList = await scanReceiptImagesApi(payloadImages);

      const extractedList = rawList.map((item, idx) => ({
        id: `${Date.now()}_${idx}`,
        merchantName: item.merchantName || "Unknown Merchant",
        amount: item.amount > 0 ? String(Number(item.amount).toFixed(2)) : "",
        category: item.category || "OTHER_EXPENSE",
        date: item.date ? new Date(item.date) : new Date(),
        confidenceScore: item.confidenceScore || 0.85,
        rawText: item.rawText || "",
        imageUri: item.imageUri || assets[idx]?.uri || null,
      }));

      setScannedItems((prev) => [...extractedList, ...prev]);
      showToast("success", `Scanned ${extractedList.length} receipt(s)! Please verify details below.`);
    } catch (error) {
      const serverErrorMsg = error.response?.data?.message || "OCR service is currently unavailable. Please try again or enter manually.";
      showToast("error", serverErrorMsg);
    } finally {
      setScanning(false);
    }
  };

  // Update a field inside a specific scanned receipt card
  const updateScannedItemField = (index, field, value) => {
    setScannedItems((prev) => {
      const copy = [...prev];
      if (field === "amount") {
        if (/[^0-9.]/.test(value)) return prev;
        const parts = value.split(".");
        if (parts.length > 2) return prev;
        if (parts.length === 2 && parts[1].length > 2) return prev;
      }
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeScannedItem = (index) => {
    setScannedItems((prev) => prev.filter((_, i) => i !== index));
    showToast("success", "Removed receipt from queue.");
  };

  // 4. Verify & Save all scanned receipts into MongoDB via saveVerifiedReceiptApi
  const handleVerifyAndSaveAll = async () => {
    if (scannedItems.length === 0) {
      showToast("error", "No scanned receipts to save.");
      return;
    }

    for (let i = 0; i < scannedItems.length; i++) {
      const item = scannedItems[i];
      const parsedAmt = parseFloat(item.amount);
      if (!item.merchantName.trim()) {
        showToast("error", `Receipt #${i + 1}: Merchant name cannot be empty.`);
        return;
      }
      if (isNaN(parsedAmt) || parsedAmt <= 0) {
        showToast("error", `Receipt #${i + 1}: Please enter a valid amount > RM 0.`);
        return;
      }
    }

    try {
      setSavingAll(true);

      for (const item of scannedItems) {
        const itemDateObj = item.date instanceof Date && !isNaN(item.date.getTime()) ? item.date : new Date(item.date);

        await saveVerifiedReceiptApi({
          userId: user.id,
          amount: Number(parseFloat(item.amount).toFixed(2)),
          type: "EXPENSE",
          category: item.category,
          merchantName: item.merchantName.trim(),
          description: "Scanned via Receipt OCR",
          date: itemDateObj.toISOString(),
          source: "OCR",
          status: "VERIFIED",
          confidenceScore: item.confidenceScore || 0.85,
        });
      }

      showToast("success", `Saved ${scannedItems.length} verified receipt(s) to your history!`);
      setTimeout(() => {
        if (typeof onTransactionsSaved === "function") {
          onTransactionsSaved();
        }
      }, 500);
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to save scanned receipts.");
    } finally {
      setSavingAll(false);
    }
  };

  return {
    scannedItems,
    scanning,
    savingAll,
    activeItemIndexForCat,
    setActiveItemIndexForCat,
    activeItemIndexForDate,
    setActiveItemIndexForDate,
    handleTakePhoto,
    handlePickFromGallery,
    updateScannedItemField,
    removeScannedItem,
    handleVerifyAndSaveAll,
  };
}
