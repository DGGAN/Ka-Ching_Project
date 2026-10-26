// Import React state hooks, native UI components, Modal, and Lucide icon utilities
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from "react-native";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireInput, WireButton, FloatingToast, useFloatingToast } from "../components/WireUI";
import { CATEGORY_CONFIG, EXPENSE_CATEGORY_KEYS, INCOME_CATEGORY_KEYS, CategoryBadge } from "../utils/categoryIcons";

// Add Transaction Screen (Integrates global FloatingToast, strict amount validation, icon popup & calendar)
export default function AddTransactionScreen({ user, onTransactionSaved }) {
  // Core state variables for transaction form inputs
  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [amountHintError, setAmountHintError] = useState("");
  const [category, setCategory] = useState("FOOD_AND_BEVERAGE");
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  //  // State to control visibility of Category Icon Popup Modal and Interactive Calendar Modal
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  //  // Invoke globally reusable top floating animated toast hook
  const { toast, slideAnim, showToast } = useFloatingToast();

  // Toggle transaction type (EXPENSE or INCOME) and reset to default category
  const handleSwitchType = (newType) => {
    setType(newType);
    setCategory(newType === "EXPENSE" ? "FOOD_AND_BEVERAGE" : "SALARY");
    setAmountHintError("");
  };

  // Strictly validate and sanitize amount input: block non-digits, multiple dots, and >2 decimals
  const handleAmountChange = (rawText) => {
    // Check if input contains invalid characters other than digits and decimal point
    if (/[^0-9.]/.test(rawText)) {
      setAmountHintError("Only numbers and a decimal point are allowed.");
      showToast("error", "Amount: Only numbers and a decimal point are allowed.");
      return;
    }

    // Check if more than one decimal point was entered
    const parts = rawText.split(".");
    if (parts.length > 2) {
      setAmountHintError("Only one decimal point is allowed.");
      showToast("error", "Amount: Only one decimal point is allowed.");
      return;
    }

    // Limit decimal places to a maximum of 2 digits (cents/sen)
    if (parts.length === 2 && parts[1].length > 2) {
      setAmountHintError("Maximum 2 decimal places allowed (e.g. 15.90).");
      showToast("error", "Amount: Maximum 2 decimal places allowed.");
      return;
    }

    setAmountHintError("");
    setAmount(rawText);
  };

  // Generate days grid array for the currently viewed month in the Calendar Modal
  const getDaysInMonthGrid = (year, month) => {
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const grid = [];

    // Fill empty placeholder slots before the 1st day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null);
    }

    // Fill actual day numbers of the month
    for (let d = 1; d <= totalDays; d++) {
      grid.push(d);
    }
    return grid;
  };

  // Switch to previous or next month inside the Calendar Modal
  const changeCalendarMonth = (offset) => {
    const nextMonth = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + offset, 1);
    setCalendarViewDate(nextMonth);
  };

  // Select a specific day from the calendar grid and close modal
  const handleSelectDay = (dayNumber) => {
    if (!dayNumber) return;
    const picked = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), dayNumber, 12, 0, 0);
    setSelectedDate(picked);
    setShowCalendarModal(false);
  };

  // Quick select Today or Yesterday
  const handleQuickDate = (daysAgo) => {
    const target = new Date();
    target.setDate(target.getDate() - daysAgo);
    setSelectedDate(target);
    setCalendarViewDate(target);
    setShowCalendarModal(false);
  };

  // Validate all required fields and submit transaction aligned
  const handleSaveTransaction = async () => {
    setAmountHintError("");

    // Validation 1: Check if amount is empty or not a valid number
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount)) {
      showToast("error", "Please enter a valid numeric amount.");
      return;
    }

    // Validation 2: Check if amount is strictly greater than RM 0.00
    if (parsedAmount <= 0) {
      showToast("error", "Transaction amount must be greater than RM 0.00.");
      return;
    }

    // Validation 3: Check if amount exceeds maximum reasonable single-transaction limit
    if (parsedAmount > 1000000) {
      showToast("error", "Amount cannot exceed RM 1,000,000.00 per transaction.");
      return;
    }

    // Validation 4: Check if merchantName field is empty
    if (!merchant.trim()) {
      showToast("error", "Please enter a Merchant or Payee name.");
      return;
    }

    try {
      setSaving(true);

      // Send payload strictly aligned with Table 4.2 field specifications to backend
      await apiClient.post("/transactions", {
        userId: user.id,
        amount: Number(parsedAmount.toFixed(2)),
        type,
        category,
        merchantName: merchant.trim(),
        description: description.trim() ? description.trim() : null,
        date: selectedDate.toISOString(),
        source: "MANUAL",
        status: "VERIFIED",
        confidenceScore: 1.0,
      });

      // Show green success floating toast and navigate back to Dashboard to refresh charts
      showToast("success", "Transaction saved successfully!");
      setTimeout(() => {
        onTransactionSaved();
      }, 450);
    } catch (error) {
      const backendMsg = error.response?.data?.message || "Failed to save transaction. Please try again.";
      showToast("error", backendMsg);
    } finally {
      setSaving(false);
    }
  };

  const activeCategoryKeys = type === "EXPENSE" ? EXPENSE_CATEGORY_KEYS : INCOME_CATEGORY_KEYS;
  const currentCategoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER_EXPENSE;
  const viewYear = calendarViewDate.getFullYear();
  const viewMonth = calendarViewDate.getMonth();
  const daysGrid = getDaysInMonthGrid(viewYear, viewMonth);
  const monthTitle = calendarViewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <View style={{ flex: 1, position: "relative" }}>
      {/* Global top FloatingToast banner (visible regardless of scroll position) */}
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Large Amount Input Hero Card (Matches Screen 4 RM 0.00 hero card) */}
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

        {/* Category Selector Trigger (Opens Icon Popup List Modal aligned with page 61 spec) */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <TouchableOpacity style={styles.selectorBtn} activeOpacity={0.8} onPress={() => setShowCategoryPopup(true)}>
            <View style={styles.selectorLeft}>
              <CategoryBadge category={category} size={36} iconSize={18} />
              <View>
                <Text style={styles.selectorTitle}>{currentCategoryConfig.label}</Text>
                <Text style={styles.selectorCode}>{category}</Text>
              </View>
            </View>
            <View style={styles.changeTagBox}>
              <Text style={styles.changeTagText}>CHANGE</Text>
              <ChevronDown size={14} color={COLORS.text} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Merchant or Payee Name Input (maps to merchantName in Table 4.2) */}
        <WireInput
          label="Merchant / Payee"
          placeholder={type === "EXPENSE" ? "e.g. Starbucks Ampang, Grab, Tesco" : "e.g. Monthly Salary, Parents"}
          value={merchant}
          onChangeText={setMerchant}
        />

        {/* Interactive Date Picker Trigger (Opens Calendar Modal on press) */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>DATE</Text>
          <TouchableOpacity
            style={styles.selectorBtn}
            activeOpacity={0.8}
            onPress={() => {
              setCalendarViewDate(selectedDate);
              setShowCalendarModal(true);
            }}
          >
            <View>
              <Text style={styles.selectorTitle}>
                {selectedDate.toLocaleDateString("en-GB", {
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

        {/* Optional Description Input (maps to description in Table 4.2) */}
        <WireInput label="Description (Optional)" placeholder="Add a note..." value={description} onChangeText={setDescription} />

        {/* Save Transaction Submit Button */}
        <WireButton label={saving ? "SAVING..." : "SAVE TRANSACTION"} onPress={handleSaveTransaction} variant="filled" style={{ marginTop: 8 }} />

        {/* =================================== */}
        {/* Category Icon Popup List Modal */}
        {/* =================================== */}
        <Modal visible={showCategoryPopup} transparent={true} animationType="fade" onRequestClose={() => setShowCategoryPopup(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.popupCard}>
              <View style={styles.popupHeader}>
                <Text style={styles.popupTitle}>SELECT {type} CATEGORY</Text>
                <Text style={styles.popupSubtitle}>Fixed categories help the AI engine track spending patterns</Text>
              </View>

              <View style={styles.categoryGrid}>
                {activeCategoryKeys.map((catKey) => {
                  const cfg = CATEGORY_CONFIG[catKey];
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
                          {cfg.label}
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

        {/* =================================== */}
        {/* Interactive Calendar Picker Modal */}
        {/* =================================== */}
        <Modal visible={showCalendarModal} transparent={true} animationType="fade" onRequestClose={() => setShowCalendarModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.popupCard}>
              <View style={styles.quickDateRow}>
                <TouchableOpacity style={styles.quickDateChip} onPress={() => handleQuickDate(0)}>
                  <Text style={styles.quickDateText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickDateChip} onPress={() => handleQuickDate(1)}>
                  <Text style={styles.quickDateText}>Yesterday</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.calHeaderRow}>
                <TouchableOpacity onPress={() => changeCalendarMonth(-1)} style={styles.calNavBtn}>
                  <ChevronLeft size={18} color={COLORS.text} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.calMonthTitle}>{monthTitle}</Text>
                <TouchableOpacity onPress={() => changeCalendarMonth(1)} style={styles.calNavBtn}>
                  <ChevronRight size={18} color={COLORS.text} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekHeaderRow}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => (
                  <Text key={w} style={styles.weekHeaderText}>
                    {w}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGridContainer}>
                {daysGrid.map((dayNum, idx) => {
                  const isChosen =
                    dayNum && selectedDate.getDate() === dayNum && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear;

                  return (
                    <TouchableOpacity
                      key={idx}
                      disabled={!dayNum}
                      style={[styles.dayCell, isChosen && styles.dayCellSelected]}
                      onPress={() => handleSelectDay(dayNum)}
                    >
                      <Text style={[styles.dayCellText, isChosen && styles.dayCellTextSelected]}>{dayNum || ""}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <WireButton label="CLOSE CALENDAR" variant="outline" onPress={() => setShowCalendarModal(false)} style={{ marginTop: 12 }} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

// Stylesheet: Fully bound to COLORS, SHAPES, and FONTS for high-contrast multi-theme support
const styles = StyleSheet.create({
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
  quickDateRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  quickDateChip: {
    flex: 1,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.secondary,
    paddingVertical: 6,
    alignItems: "center",
  },
  quickDateText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
  },
  calHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
  },
  calNavBtn: {
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.inputBg,
  },
  calMonthTitle: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.text,
  },
  weekHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 6,
  },
  weekHeaderText: {
    width: "14.2%",
    textAlign: "center",
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.textMuted,
  },
  daysGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.2%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SHAPES.chipRadius,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  dayCellText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.text,
  },
  dayCellTextSelected: {
    color: COLORS.primaryText,
    fontWeight: "bold",
  },
});
