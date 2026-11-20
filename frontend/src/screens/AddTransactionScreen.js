/**
 * @file frontend/src/screens/AddTransactionScreen.js
 * @layer Screen (Top-Level Page Skeleton — Manual Add Transaction)
 * @description Assembles AmountHeroCard, EXPENSE/INCOME toggle, category selector, merchant/date/description inputs, CategoryPickerModal, and CalendarModal using useAddTransactionForm.
 * @exports default AddTransactionScreen
 */

import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../theme/colors";
import { playUiSound } from "../utils/soundEffects";
import WireInput from "../components/shared/WireInput";
import WireButton from "../components/shared/WireButton";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";
import CalendarModal from "../components/shared/CalendarModal";
import CategoryBadge from "../components/shared/CategoryBadge";

import { useAddTransactionForm } from "../features/addTransaction/hooks/useAddTransactionForm";
import AmountHeroCard from "../features/addTransaction/components/AmountHeroCard";
import CategoryPickerModal from "../features/addTransaction/components/CategoryPickerModal";

export default function AddTransactionScreen({ user, onTransactionSaved }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();

  const {
    type,
    amount,
    amountHintError,
    category,
    setCategory,
    merchant,
    setMerchant,
    description,
    setDescription,
    saving,
    showCategoryPopup,
    setShowCategoryPopup,
    selectedDate,
    setSelectedDate,
    showCalendarModal,
    setShowCalendarModal,
    activeCategoryKeys,
    currentCategoryConfig,
    handleSwitchType,
    handleAmountChange,
    handleSaveTransaction,
  } = useAddTransactionForm(user, onTransactionSaved, showToast);

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Top Large Amount Input Hero Card */}
        <AmountHeroCard amount={amount} amountHintError={amountHintError} onChangeAmount={handleAmountChange} />

        {/* 2. Transaction Type Toggle: EXPENSE / INCOME */}
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

        {/* 3. Category Selector Trigger */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <TouchableOpacity
            style={styles.selectorBtn}
            activeOpacity={0.8}
            onPress={() => {
              playUiSound("pop");
              setShowCategoryPopup(true);
            }}
          >
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

        {/* 4. Merchant or Payee Name Input */}
        <WireInput
          label="Merchant / Payee"
          placeholder={type === "EXPENSE" ? "e.g. Starbucks Ampang, Grab, Tesco" : "e.g. Monthly Salary, Parents"}
          value={merchant}
          onChangeText={setMerchant}
        />

        {/* 5. Interactive Date Picker Trigger */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>DATE</Text>
          <TouchableOpacity
            style={styles.selectorBtn}
            activeOpacity={0.8}
            onPress={() => {
              playUiSound("pop");
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

        {/* 6. Optional Description Input */}
        <WireInput label="Description (Optional)" placeholder="Add a note..." value={description} onChangeText={setDescription} />

        {/* 7. Save Transaction Submit Button */}
        <WireButton label={saving ? "SAVING..." : "SAVE TRANSACTION"} onPress={handleSaveTransaction} variant="filled" style={{ marginTop: 8 }} />

        {/* Modal 1: 2-Column Category Picker Modal */}
        <CategoryPickerModal
          visible={showCategoryPopup}
          type={type}
          activeCategoryKeys={activeCategoryKeys}
          selectedCategory={category}
          onSelectCategory={setCategory}
          onClose={() => setShowCategoryPopup(false)}
        />

        {/* Modal 2: Shared Reusable Calendar Modal */}
        <CalendarModal
          visible={showCalendarModal}
          selectedDate={selectedDate}
          onSelectDate={(picked) => {
            playUiSound("pop");
            setSelectedDate(picked);
          }}
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
  });
