/**
 * @file frontend/src/screens/AddTransactionScreen.js
 * @layer Screen (Manual Add Transaction — 100% Original Commit a357cef Design & Strict Validation)
 * @description Preserves the exact Amount Hero Card, strict decimal/range validation, EXPENSE/INCOME toggle, 2-column category popup modal, and shared CalendarModal.
 * @props {object} user - Logged-in user object
 * @props {function} onTransactionSaved - Callback invoked after transaction is saved
 * @exports default AddTransactionScreen
 */

// Import React state hooks, native UI components, Modal, and Lucide icon utilities
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from "react-native";
import { Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react-native";
import apiClient from "../api/apiClient";
import { COLORS, SHAPES, FONTS } from "../theme/colors";
import { EXPENSE_CATEGORY_KEYS, INCOME_CATEGORY_KEYS, getCategoryMeta } from "../utils/categoryConfig";
import WireInput from "../components/shared/WireInput";
import WireButton from "../components/shared/WireButton";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";
import CalendarModal from "../components/shared/CalendarModal";
import CategoryBadge from "../components/shared/CategoryBadge";

// Manual Add Transaction Screen (Integrates global FloatingToast, shared CalendarModal & Category Popup)
export default function AddTransactionScreen({ user, onTransactionSaved }) {
  // Dynamically generate styles on every render so runtime theme switches apply immediately
  const styles = getStyles();

  // Core state variables for transaction form inputs
  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [amountHintError, setAmountHintError] = useState("");
  const [category, setCategory] = useState("FOOD_AND_BEVERAGE");
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // State to control visibility of Category Icon Popup Modal and Shared Calendar Modal
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Global top floating animated toast hook
  const { toast, slideAnim, showToast } = useFloatingToast();

  // Toggle transaction type (EXPENSE or INCOME) and reset to default category
  const handleSwitchType = (newType) => {
    setType(newType);
    setCategory(newType === "EXPENSE" ? "FOOD_AND_BEVERAGE" : "SALARY");
    setAmountHintError("");
  };

  // Strictly validate and sanitize amount input: block non-digits, multiple dots, and >2 decimals
  const handleAmountChange = (rawText) => {
    if (/[^0-9.]/.test(rawText)) {
      setAmountHintError("Only numbers and a decimal point are allowed.");
      showToast("error", "Amount: Only numbers and a decimal point are allowed.");
      return;
    }

    const parts = rawText.split(".");
    if (parts.length > 2) {
      setAmountHintError("Only one decimal point is allowed.");
      showToast("error", "Amount: Only one decimal point is allowed.");
      return;
    }

    if (parts.length === 2 && parts[1].length > 2) {
      setAmountHintError("Maximum 2 decimal places allowed (e.g. 15.90).");
      showToast("error", "Amount: Maximum 2 decimal places allowed.");
      return;
    }

    setAmountHintError("");
    setAmount(rawText);
  };

  // Validate all required fields and submit transaction to backend
  const handleSaveTransaction = async () => {
    setAmountHintError("");

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount)) {
      showToast("error", "Please enter a valid numeric amount.");
      return;
    }

    if (parsedAmount <= 0) {
      showToast("error", "Transaction amount must be greater than RM 0.00.");
      return;
    }

    if (parsedAmount > 1000000) {
      showToast("error", "Amount cannot exceed RM 1,000,000.00 per transaction.");
      return;
    }

    if (!merchant.trim()) {
      showToast("error", "Please enter a Merchant or Payee name.");
      return;
    }

    try {
      setSaving(true);

      await apiClient.post("/transactions", {
        userId: user.id,
        amount: Number(parsedAmount.toFixed(2)),
        type,
        category,
        merchantName: merchant.trim(),
        description: description.trim() ? description.trim() : null,
        date: selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate.toISOString() : new Date(selectedDate).toISOString(),
        source: "MANUAL",
        status: "VERIFIED",
        confidenceScore: 1.0,
      });

      showToast("success", "Transaction saved successfully!");
      setTimeout(() => {
        if (typeof onTransactionSaved === "function") {
          onTransactionSaved();
        }
      }, 450);
    } catch (error) {
      const backendMsg = error.response?.data?.message || "Failed to save transaction. Please try again.";
      showToast("error", backendMsg);
    } finally {
      setSaving(false);
    }
  };

  const activeCategoryKeys = type === "EXPENSE" ? EXPENSE_CATEGORY_KEYS : INCOME_CATEGORY_KEYS;
  const currentCategoryConfig = getCategoryMeta(category);
  const displayDateObj = selectedDate instanceof Date && !isNaN(selectedDate.getTime()) ? selectedDate : new Date(selectedDate);

  return (
    <View style={{ flex: 1, position: "relative" }}>
      {/* Global top FloatingToast banner */}
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Large Amount Input Hero Card */}
        <View style={[styles.amountHeroCard, amountHintError ? { borderColor: COLORS.danger } : null]}>
          <Text style={styles.amountCardLabel}>AMOUNT (RM)</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.currencyPrefix}>RM</Text>
            <TextInput
              style={styles.amountBigInput}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={handleAmountChange}
              maxLength={10}
            />
          </View>
          <View style={styles.amountCardFooter}>
            {amountHintError ? (
              <Text style={styles.amountErrorHint}>{amountHintError}</Text>
            ) : (
              <Text style={styles.amountFooterHint}>Tap digits above to enter amount (e.g. 15.90)</Text>
            )}
          </View>
        </View>

        {/* Transaction Type Toggle: EXPENSE / INCOME */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>TRANSACTION TYPE</Text>
          <View style={styles.typeToggleRow}>
            <TouchableOpacity style={[styles.typeBtn, type === "EXPENSE" && styles.typeBtnActive]} onPress={() => handleSwitchType("EXPENSE")}>
              <Text style={[styles.typeBtnText, type === "EXPENSE" && styles.typeBtnTextActive]}>EXPENSE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, type === "INCOME" && styles.typeBtnActive]} onPress={() => handleSwitchType("INCOME")}>
              <Text style={[styles.typeBtnText, type === "INCOME" && styles.typeBtnTextActive]}>INCOME</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Selector Trigger */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <TouchableOpacity style={styles.selectorBtn} activeOpacity={0.8} onPress={() => setShowCategoryPopup(true)}>
            <View style={styles.selectorLeft}>
              <CategoryBadge category={category} size={36} iconSize={18} />
              <View>
                <Text style={styles.selectorTitle}>{currentCategoryConfig.name || currentCategoryConfig.label}</Text>
                <Text style={styles.selectorCode}>Tap to choose category</Text>
              </View>
            </View>
            <View style={styles.changeTagBox}>
              <Text style={styles.changeTagText}>CHANGE</Text>
              <ChevronDown size={14} color={COLORS.text} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Merchant or Payee Name Input */}
        <WireInput
          label="Merchant / Payee"
          placeholder={type === "EXPENSE" ? "e.g. Starbucks Ampang, Grab, Tesco" : "e.g. Monthly Salary, Parents"}
          value={merchant}
          onChangeText={setMerchant}
        />

        {/* Interactive Date Picker Trigger */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>DATE</Text>
          <TouchableOpacity style={styles.selectorBtn} activeOpacity={0.8} onPress={() => setShowCalendarModal(true)}>
            <View>
              <Text style={styles.selectorTitle}>
                {displayDateObj.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
              <Text style={styles.selectorCode}>Tap to select date from calendar</Text>
            </View>
            <View style={styles.calendarIconWrapper}>
              <CalendarIcon size={16} color={COLORS.primary} strokeWidth={2.2} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Optional Description Input */}
        <WireInput label="Description (Optional)" placeholder="Add a note..." value={description} onChangeText={setDescription} />

        {/* Save Transaction Submit Button */}
        <WireButton label={saving ? "SAVING..." : "SAVE TRANSACTION"} onPress={handleSaveTransaction} variant="filled" style={{ marginTop: 8 }} />

        {/* Modal 1: Category Icon Popup List Modal */}
        <Modal visible={showCategoryPopup} transparent={true} animationType="fade" onRequestClose={() => setShowCategoryPopup(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.popupCard}>
              <View style={styles.popupHeader}>
                <Text style={styles.popupTitle}>SELECT {type} CATEGORY</Text>
                <Text style={styles.popupSubtitle}>Choose a category to organize your spending</Text>
              </View>

              <View style={styles.categoryGrid}>
                {activeCategoryKeys.map((catKey) => {
                  const cfg = getCategoryMeta(catKey);
                  const isSelected = category === catKey;
                  return (
                    <TouchableOpacity
                      key={catKey}
                      activeOpacity={0.8}
                      onPress={() => {
                        setCategory(catKey);
                        setShowCategoryPopup(false);
                      }}
                      style={[styles.catCard, isSelected && styles.catCardSelected]}
                    >
                      <CategoryBadge category={catKey} size={34} iconSize={17} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.catCardTitle, isSelected && { color: COLORS.primary }]} numberOfLines={1}>
                          {cfg.name || cfg.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Check size={10} color={COLORS.primaryText} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <WireButton label="CANCEL" variant="outline" onPress={() => setShowCategoryPopup(false)} style={{ marginTop: 12 }} />
            </View>
          </View>
        </Modal>

        {/* Modal 2: Shared Reusable Calendar Modal */}
        <CalendarModal
          visible={showCalendarModal}
          selectedDate={selectedDate}
          onSelectDate={(picked) => setSelectedDate(picked)}
          onClose={() => setShowCalendarModal(false)}
        />
      </ScrollView>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 36,
    },
    amountHeroCard: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 16,
      alignItems: "center",
      marginBottom: 16,
    },
    amountCardLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      letterSpacing: 1.5,
      marginBottom: 6,
    },
    amountInputRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
    },
    currencyPrefix: {
      fontFamily: FONTS.mono,
      fontSize: 20,
      fontWeight: "bold",
      color: COLORS.textMuted,
      marginRight: 6,
    },
    amountBigInput: {
      fontFamily: FONTS.mono,
      fontSize: 34,
      fontWeight: "bold",
      color: COLORS.text,
      minWidth: 120,
      textAlign: "center",
      padding: 0,
    },
    amountCardFooter: {
      width: "100%",
      borderTopWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingTop: 8,
      marginTop: 8,
      alignItems: "center",
    },
    amountFooterHint: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
    },
    amountErrorHint: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.danger,
    },
    fieldBlock: {
      marginBottom: 15,
    },
    fieldLabel: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.textMuted,
      marginBottom: 5,
      letterSpacing: 1,
    },
    typeToggleRow: {
      flexDirection: "row",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      overflow: "hidden",
    },
    typeBtn: {
      flex: 1,
      paddingVertical: 11,
      alignItems: "center",
      backgroundColor: COLORS.card,
    },
    typeBtnActive: {
      backgroundColor: COLORS.primary,
    },
    typeBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    typeBtnTextActive: {
      color: COLORS.primaryText,
    },
    selectorBtn: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectorLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    selectorTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
    },
    selectorCode: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    changeTagBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    changeTagText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
    calendarIconWrapper: {
      width: 34,
      height: 34,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
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
    popupHeader: {
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 12,
    },
    popupTitle: {
      fontFamily: FONTS.mono,
      fontSize: 13,
      fontWeight: "bold",
      color: COLORS.text,
    },
    popupSubtitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 8,
    },
    catCard: {
      width: "48.5%",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      padding: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    catCardSelected: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.secondary,
    },
    catCardTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
    },
    checkBadge: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
