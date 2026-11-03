// Import React hooks, native UI components, Expo ImagePicker, and Lucide icons
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, ActivityIndicator, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Calendar as CalendarIcon,
  ChevronDown,
  Check,
  FileText,
} from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireBox, WireInput, WireButton, FloatingToast, useFloatingToast, CalendarModal } from "../components/WireUI";
import { CATEGORY_CONFIG, EXPENSE_CATEGORY_KEYS, CategoryBadge } from "../utils/categoryIcons";

// Screen 5: OCR Receipt Scanner & Verification Queue (Camera & Batch Gallery Upload)
export default function OCRScannerScreen({ user, initialMode = "ocr_batch", onTransactionsSaved }) {
  const [scannedItems, setScannedItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // Active item index for Category Popup Modal and Calendar Modal
  const [activeItemIndexForCat, setActiveItemIndexForCat] = useState(null);
  const [activeItemIndexForDate, setActiveItemIndexForDate] = useState(null);

  const { toast, slideAnim, showToast } = useFloatingToast();

  // Automatically trigger camera or gallery picker when entering Screen 5
  useEffect(() => {
    if (initialMode === "camera") {
      handleTakePhoto();
    } else if (initialMode === "ocr_batch") {
      handlePickFromGallery();
    }
  }, [initialMode]);

  // 1. Capture a single receipt photo using the device camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showToast("error", "Camera permission is required to snap receipt photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  // 2. Pick one or multiple receipt screenshots from the photo gallery
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast("error", "Gallery permission is required to upload receipts.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  // 3. Send selected images to backend POST /api/ocr/scan
  const processImagesWithOCR = async (assets) => {
    try {
      setScanning(true);
      const payloadImages = assets.map((asset) => ({
        uri: asset.uri,
        base64: asset.base64 || "",
      }));

      const response = await apiClient.post("/ocr/scan", {
        images: payloadImages,
      });

      const extractedList = (response.data?.data || []).map((item, idx) => ({
        id: `${Date.now()}_${idx}`,
        merchantName: item.merchantName || "Unknown Merchant",
        amount: item.amount > 0 ? String(item.amount.toFixed(2)) : "",
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

  // 4. Verify & Save all scanned receipts into MongoDB as VERIFIED OCR transactions
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
        await apiClient.post("/transactions", {
          userId: user.id,
          amount: Number(parseFloat(item.amount).toFixed(2)),
          type: "EXPENSE",
          category: item.category,
          merchantName: item.merchantName.trim(),
          description: "Scanned via Receipt OCR",
          date: item.date.toISOString(),
          source: "OCR",
          status: "VERIFIED",
          confidenceScore: item.confidenceScore || 0.85,
        });
      }

      showToast("success", `Saved ${scannedItems.length} verified receipt(s) to your history!`);
      setTimeout(() => {
        onTransactionsSaved();
      }, 500);
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to save scanned receipts.");
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Action Bar: Camera & Gallery Batch Upload */}
        <WireBox style={styles.scannerHeaderCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.aiBadge}>
              <Sparkles size={13} color={COLORS.primaryText} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>RECEIPT SCANNER</Text>
              <Text style={styles.headerSub}>Snap a photo or upload screenshots — we will extract the merchant, date, and total automatically</Text>
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.scanBtnPrimary} onPress={handleTakePhoto} disabled={scanning}>
              <Camera size={15} color={COLORS.primaryText} strokeWidth={2.3} />
              <Text style={styles.scanBtnPrimaryText}>SNAP PHOTO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.scanBtnSecondary} onPress={handlePickFromGallery} disabled={scanning}>
              <ImageIcon size={15} color={COLORS.text} strokeWidth={2.3} />
              <Text style={styles.scanBtnSecondaryText}>GALLERY BATCH</Text>
            </TouchableOpacity>
          </View>
        </WireBox>

        {/* Loading Spinner during OCR Extraction */}
        {scanning && (
          <WireBox style={styles.scanningLoaderCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.scanningTitle}>Scanning Receipt...</Text>
            <Text style={styles.scanningSub}>Reading merchant name, date, and RM total amount</Text>
          </WireBox>
        )}

        {/* Verification Queue List */}
        <View style={styles.queueHeaderRow}>
          <Text style={styles.queueTitle}>VERIFICATION QUEUE ({scannedItems.length})</Text>
          <Text style={styles.queueSub}>Review & edit before saving</Text>
        </View>

        {scannedItems.length === 0 && !scanning ? (
          <WireBox style={styles.emptyQueueCard}>
            <Camera size={26} color={COLORS.textMuted} strokeWidth={1.8} />
            <Text style={styles.emptyQueueTitle}>No Receipts Scanned Yet</Text>
            <Text style={styles.emptyQueueSub}>
              Tap "SNAP PHOTO" or "GALLERY BATCH" above to scan a receipt and verify its extracted details here.
            </Text>
          </WireBox>
        ) : (
          scannedItems.map((item, idx) => {
            const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.OTHER_EXPENSE;
            const pctConfidence = Math.round((item.confidenceScore || 0.85) * 100);
            const isHighConfidence = pctConfidence >= 85;

            return (
              <WireBox key={item.id} style={styles.receiptVerifyCard}>
                {/* Top Status & Confidence Badge Row */}
                <View style={styles.verifyCardTopRow}>
                  <View style={[styles.confidencePill, { backgroundColor: isHighConfidence ? "#DCFCE7" : "#FEF3C7" }]}>
                    {isHighConfidence ? (
                      <CheckCircle2 size={12} color="#15803D" strokeWidth={2.5} />
                    ) : (
                      <AlertTriangle size={12} color="#D97706" strokeWidth={2.5} />
                    )}
                    <Text style={[styles.confidencePillText, { color: isHighConfidence ? "#15803D" : "#D97706" }]}>
                      {pctConfidence}% READ CLARITY {isHighConfidence ? "— CLEAR" : "— PLEASE DOUBLE CHECK"}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeScannedItem(idx)}>
                    <Trash2 size={14} color={COLORS.danger} strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>

                {/* Receipt Thumbnail + Raw OCR Snippet */}
                <View style={styles.previewRow}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.receiptThumb} />
                  ) : (
                    <View style={styles.receiptPlaceholderThumb}>
                      <FileText size={20} color={COLORS.textMuted} />
                    </View>
                  )}
                  <View style={styles.rawTextSnippetBox}>
                    <Text style={styles.rawSnippetLabel}>DETECTED TEXT ON RECEIPT:</Text>
                    <Text style={styles.rawSnippetText} numberOfLines={4}>
                      {item.rawText || `${item.merchantName}\nTOTAL: RM ${item.amount}`}
                    </Text>
                  </View>
                </View>

                {/* Editable Extracted Fields */}
                <WireInput label="Merchant Name" value={item.merchantName} onChangeText={(val) => updateScannedItemField(idx, "merchantName", val)} />

                <WireInput
                  label="Total Amount (RM)"
                  keyboardType="decimal-pad"
                  value={item.amount}
                  onChangeText={(val) => updateScannedItemField(idx, "amount", val)}
                />

                {/* Category & Date Row */}
                <View style={styles.catAndDateRow}>
                  <TouchableOpacity style={styles.halfSelectorBtn} onPress={() => setActiveItemIndexForCat(idx)}>
                    <CategoryBadge category={item.category} size={26} iconSize={13} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.halfSelectorLabel}>CATEGORY</Text>
                      <Text style={styles.halfSelectorVal} numberOfLines={1}>
                        {cfg.label}
                      </Text>
                    </View>
                    <ChevronDown size={13} color={COLORS.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.halfSelectorBtn} onPress={() => setActiveItemIndexForDate(idx)}>
                    <CalendarIcon size={16} color={COLORS.primary} strokeWidth={2.2} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.halfSelectorLabel}>RECEIPT DATE</Text>
                      <Text style={styles.halfSelectorVal} numberOfLines={1}>
                        {item.date.toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    <ChevronDown size={13} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </WireBox>
            );
          })
        )}

        {/* Confirm & Save All Verified Receipts Button */}
        {scannedItems.length > 0 && (
          <WireButton
            label={savingAll ? "SAVING VERIFIED RECEIPTS..." : `VERIFY & SAVE ALL (${scannedItems.length})`}
            variant="filled"
            onPress={handleVerifyAndSaveAll}
            style={{ marginTop: 6 }}
          />
        )}

        {/* Category Selection Modal for Active Scanned Item */}
        <Modal visible={activeItemIndexForCat !== null} transparent={true} animationType="fade" onRequestClose={() => setActiveItemIndexForCat(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.popupCard}>
              <Text style={styles.popupTitle}>CHANGE RECEIPT CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {EXPENSE_CATEGORY_KEYS.map((catKey) => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const currentItem = activeItemIndexForCat !== null ? scannedItems[activeItemIndexForCat] : null;
                  const isSelected = currentItem?.category === catKey;

                  return (
                    <TouchableOpacity
                      key={catKey}
                      style={[styles.catCard, isSelected && styles.catCardSelected]}
                      onPress={() => {
                        if (activeItemIndexForCat !== null) {
                          updateScannedItemField(activeItemIndexForCat, "category", catKey);
                        }
                        setActiveItemIndexForCat(null);
                      }}
                    >
                      <CategoryBadge category={catKey} size={28} iconSize={14} />
                      <Text style={styles.catCardTitle} numberOfLines={1}>
                        {cfg.label}
                      </Text>
                      {isSelected && <Check size={12} color={COLORS.primary} strokeWidth={3} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <WireButton label="CLOSE" variant="outline" onPress={() => setActiveItemIndexForCat(null)} style={{ marginTop: 12 }} />
            </View>
          </View>
        </Modal>

        {/* Shared Calendar Modal for Active Scanned Item */}
        <CalendarModal
          visible={activeItemIndexForDate !== null}
          selectedDate={
            activeItemIndexForDate !== null && scannedItems[activeItemIndexForDate] ? scannedItems[activeItemIndexForDate].date : new Date()
          }
          onSelectDate={(pickedDate) => {
            if (activeItemIndexForDate !== null) {
              updateScannedItemField(activeItemIndexForDate, "date", pickedDate);
            }
          }}
          onClose={() => setActiveItemIndexForDate(null)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  scannerHeaderCard: {
    padding: 14,
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  aiBadge: {
    width: 30,
    height: 30,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: 0.8,
  },
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 13,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  scanBtnPrimary: {
    flex: 1,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.buttonRadius,
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  scanBtnPrimaryText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.primaryText,
  },
  scanBtnSecondary: {
    flex: 1,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.buttonRadius,
    backgroundColor: COLORS.secondary,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  scanBtnSecondaryText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
  },
  scanningLoaderCard: {
    padding: 20,
    alignItems: "center",
    marginBottom: 14,
  },
  scanningTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
  },
  scanningSub: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  queueHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  queueTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: 0.8,
  },
  queueSub: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  emptyQueueCard: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyQueueTitle: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
  },
  emptyQueueSub: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 15,
  },
  receiptVerifyCard: {
    padding: 14,
    marginBottom: 12,
  },
  verifyCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  confidencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confidencePillText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    fontWeight: "bold",
  },
  removeBtn: {
    padding: 5,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.dangerBg,
  },
  previewRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    padding: 8,
    borderWidth: 1.5,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.secondary,
  },
  receiptThumb: {
    width: 56,
    height: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  receiptPlaceholderThumb: {
    width: 56,
    height: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  rawTextSnippetBox: {
    flex: 1,
    justifyContent: "center",
  },
  rawSnippetLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.textMuted,
    marginBottom: 3,
  },
  rawSnippetText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.text,
    lineHeight: 13,
  },
  catAndDateRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  halfSelectorBtn: {
    flex: 1,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  halfSelectorLabel: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.textMuted,
  },
  halfSelectorVal: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  popupCard: {
    width: "100%",
    maxWidth: 350,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.cardRadius,
    backgroundColor: COLORS.card,
    padding: 16,
  },
  popupTitle: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  catCard: {
    width: "48.5%",
    borderWidth: 1.5,
    borderColor: COLORS.borderMuted,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.card,
    padding: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  catCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
  },
  catCardTitle: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
});
