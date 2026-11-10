/**
 * @file frontend/src/screens/OCRScannerScreen.js
 * @layer Screen (Top-Level Page Skeleton — 100% Original Commit a357cef Design)
 * @description Assembles the exact original OCR Receipt Scanner & Verification Queue layout.
 * @props {object} user - Logged-in user object
 * @props {string} [initialMode="ocr_batch"] - Auto-launch mode ("camera" | "ocr_batch")
 * @props {function} onTransactionsSaved - Callback invoked after verified receipts are saved
 * @exports default OCRScannerScreen
 */

import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";
import { useReceiptScanner } from "../features/ocr/hooks/useReceiptScanner";
import ReceiptCaptureControls from "../features/ocr/components/ReceiptCaptureControls";
import CameraPreview from "../features/ocr/components/CameraPreview";
import ScannedTransactionList from "../features/ocr/components/ScannedTransactionList";
import ReceiptReviewForm from "../features/ocr/components/ReceiptReviewForm";

export default function OCRScannerScreen({ user, initialMode = "ocr_batch", onTransactionsSaved }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();

  const {
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
  } = useReceiptScanner(user, initialMode, showToast, onTransactionsSaved);

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Action Bar: Camera & Gallery Batch Upload */}
        <ReceiptCaptureControls scanning={scanning} onTakePhoto={handleTakePhoto} onPickFromGallery={handlePickFromGallery} />

        {/* Loading Spinner during OCR Extraction */}
        <CameraPreview scanning={scanning} isEmpty={false} />

        {/* Verification Queue List + Save All Button */}
        <ScannedTransactionList
          scannedItems={scannedItems}
          scanning={scanning}
          savingAll={savingAll}
          onUpdateField={updateScannedItemField}
          onRemove={removeScannedItem}
          onOpenCategoryModal={(idx) => setActiveItemIndexForCat(idx)}
          onOpenDateModal={(idx) => setActiveItemIndexForDate(idx)}
          onVerifyAndSaveAll={handleVerifyAndSaveAll}
        />

        {/* Category Selection Modal & Shared Calendar Modal */}
        <ReceiptReviewForm
          scannedItems={scannedItems}
          activeItemIndexForCat={activeItemIndexForCat}
          onCloseCatModal={() => setActiveItemIndexForCat(null)}
          activeItemIndexForDate={activeItemIndexForDate}
          onCloseDateModal={() => setActiveItemIndexForDate(null)}
          onUpdateField={updateScannedItemField}
        />
      </ScrollView>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 36,
    },
  });
