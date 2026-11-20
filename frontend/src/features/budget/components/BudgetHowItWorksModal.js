/**
 * @file frontend/src/features/budget/components/BudgetHowItWorksModal.js
 * @layer Component (Modal UI — Simplified "HOW SMART BUDGETING WORKS" Guide)
 * @description Renders a concise 3-step explanation, visual 3-color horizontal ratio bars (Needs / Wants / Savings), and KWSP (EPF) & AKPK attribution for the 50/30/20 base framework.
 * @exports default BudgetHowItWorksModal
 */

import React from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import { BUDGET_PRESETS } from "../utils/budgetRecommendations";
import WireButton from "../../../components/shared/WireButton";

// Derive 3 harmonious bucket bar colors directly from the active app theme
const getBucketThemeColors = () => ({
  needs: COLORS.needsBar || COLORS.primary,
  wants: COLORS.wantsBar || COLORS.textMuted,
  savings: COLORS.savingsBar || COLORS.success || "#3B7A57",
});

export default function BudgetHowItWorksModal({ visible = false, onClose }) {
  const styles = getStyles();
  const bucketColors = getBucketThemeColors();

  const handleClose = () => {
    playUiSound("pop");
    if (onClose) onClose();
  };

  return (
    <Modal visible={Boolean(visible)} transparent={true} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header Row */}
          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.modalTitle}>HOW SMART BUDGETING WORKS</Text>
              <Text style={styles.modalSubTitle}>YOUR FINANCIAL DATA, YOUR BUDGET</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {/* Concise 3-Step Summary */}
            <View style={styles.stepItemBox}>
              <Text style={styles.stepTitle}>01. Read your income &amp; spending</Text>
              <Text style={styles.stepBody}>Analyses your monthly income and past spending habits automatically.</Text>
            </View>

            <View style={styles.stepItemBox}>
              <Text style={styles.stepTitle}>02. Suggest a starting ratio</Text>
              <Text style={styles.stepBody}>Matches your habits to one of the 3 allocations below.</Text>
            </View>

            <View style={styles.stepItemBox}>
              <Text style={styles.stepTitle}>03. Adjust anytime</Text>
              <Text style={styles.stepBody}>Switch plans or set your own custom RM limit whenever you like.</Text>
            </View>

            <Text style={styles.sectionDividerTitle}>THE 3 ALLOCATION RATIOS</Text>

            {/* Theme-Harmonized Color Legend for Horizontal Ratio Bars */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: bucketColors.needs }]} />
                <Text style={styles.legendText}>Needs</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: bucketColors.wants }]} />
                <Text style={styles.legendText}>Wants</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: bucketColors.savings }]} />
                <Text style={styles.legendText}>Savings</Text>
              </View>
            </View>

            {/* 3 Preset Cards with Theme-Linked Horizontal 3-Segment Ratio Bars */}
            {BUDGET_PRESETS.map((p) => {
              const isStandard503020 = p.id === "50_30_20" || p.ratioLabel === "50/30/20";
              return (
                <View key={p.id} style={styles.modalPresetBox}>
                  <View style={styles.modalPresetTop}>
                    <Text style={styles.modalPresetName}>
                      {p.name} ({p.ratioLabel})
                    </Text>
                    <View style={[styles.originTag, isStandard503020 ? styles.originTagKwsp : styles.originTagAdapted]}>
                      <Text style={[styles.originTagText, isStandard503020 ? styles.originTagTextKwsp : styles.originTagTextAdapted]}>
                        {isStandard503020 ? "KWSP / AKPK BASE" : "ADAPTED"}
                      </Text>
                    </View>
                  </View>

                  {/* Visual Horizontal 3-Segment Ratio Bar */}
                  <View style={styles.ratioBarTrack}>
                    <View style={[styles.ratioBarSeg, { flex: p.needsPct, backgroundColor: bucketColors.needs }]} />
                    <View style={[styles.ratioBarSeg, { flex: p.wantsPct, backgroundColor: bucketColors.wants }]} />
                    <View style={[styles.ratioBarSeg, { flex: p.savingsPct, backgroundColor: bucketColors.savings }]} />
                  </View>

                  <Text style={styles.modalPresetDesc}>{p.desc}</Text>
                </View>
              );
            })}

            {/* Clear Breakdown of Needs, Wants Categories & Savings Formula */}
            <Text style={styles.sectionDividerTitle}>WHAT GOES INTO EACH BUCKET?</Text>

            <View style={styles.bucketGuideBox}>
              <View style={styles.bucketGuideItem}>
                <View style={styles.bucketGuideHeader}>
                  <View style={[styles.legendDot, { backgroundColor: bucketColors.needs }]} />
                  <Text style={styles.bucketGuideTitle}>Needs (Essential Living Costs)</Text>
                </View>
                <Text style={styles.bucketGuideText}>
                  Must-have daily &amp; monthly expenses: Food &amp; Beverage, Groceries, Transportation, Housing, Bills &amp; Utilities, Health &amp;
                  Wellness, Education.
                </Text>
              </View>

              <View style={styles.bucketGuideDivider} />

              <View style={styles.bucketGuideItem}>
                <View style={styles.bucketGuideHeader}>
                  <View style={[styles.legendDot, { backgroundColor: bucketColors.wants }]} />
                  <Text style={styles.bucketGuideTitle}>Wants (Flexible Lifestyle Spending)</Text>
                </View>
                <Text style={styles.bucketGuideText}>Optional treats &amp; leisure: Shopping, Leisure &amp; Entertainment, Other Expenses.</Text>
              </View>

              <View style={styles.bucketGuideDivider} />

              <View style={styles.bucketGuideItem}>
                <View style={styles.bucketGuideHeader}>
                  <View style={[styles.legendDot, { backgroundColor: bucketColors.wants }]} />
                  <Text style={styles.bucketGuideTitle}>Wants (Flexible Lifestyle Spending)</Text>
                </View>
                <Text style={styles.bucketGuideText}>
                  Optional treats &amp; leisure: Food &amp; Beverage (dining/cafes), Shopping, Leisure &amp; Entertainment, Other Expenses.
                </Text>
              </View>

              <View style={styles.bucketGuideDivider} />

              <View style={styles.bucketGuideItem}>
                <View style={styles.bucketGuideHeader}>
                  <View style={[styles.legendDot, { backgroundColor: bucketColors.savings }]} />
                  <Text style={styles.bucketGuideTitle}>Savings (How It's Calculated)</Text>
                </View>
                <Text style={styles.bucketGuideText}>
                  Projected Savings = Monthly Income − Total Expenses So Far.{"\n"}
                  (If no income is logged yet, your baseline income estimate is used.)
                </Text>
              </View>
            </View>

            {/* Attribution & Flexibility Note */}
            <View style={styles.goodToKnowBox}>
              <Text style={styles.goodToKnowTitle}>About these ratios</Text>
              <Text style={styles.goodToKnowBody}>
                50/30/20 is the standard budgeting guide promoted by KWSP (EPF) &amp; AKPK in Malaysia. The other two options are adapted from it to
                suit faster savers or students with tighter essential costs.
              </Text>
            </View>
          </ScrollView>

          <WireButton label="GOT IT" onPress={handleClose} style={{ marginTop: 12 }} />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = () =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      padding: 16,
    },
    modalHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 10,
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modalSubTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.primary,
      marginTop: 2,
    },
    stepItemBox: {
      borderLeftWidth: 2,
      borderColor: COLORS.primary,
      paddingLeft: 8,
      marginBottom: 8,
    },
    stepTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
    stepBody: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
      marginTop: 2,
    },
    sectionDividerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 6,
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    legendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 8,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    modalPresetBox: {
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 9,
      marginBottom: 8,
    },
    modalPresetTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
      gap: 6,
    },
    modalPresetName: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
      flex: 1,
    },
    originTag: {
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1.5,
    },
    originTagKwsp: {
      backgroundColor: COLORS.secondary,
      borderColor: COLORS.primary,
    },
    originTagAdapted: {
      backgroundColor: COLORS.card,
      borderColor: COLORS.borderMuted,
    },
    originTagText: {
      fontFamily: FONTS.mono,
      fontSize: 6.5,
      fontWeight: "bold",
    },
    originTagTextKwsp: {
      color: COLORS.primary,
    },
    originTagTextAdapted: {
      color: COLORS.textMuted,
    },
    ratioBarTrack: {
      width: "100%",
      height: 7,
      flexDirection: "row",
      borderRadius: 4,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 6,
      backgroundColor: COLORS.card,
    },
    ratioBarSeg: {
      height: "100%",
    },
    modalPresetDesc: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
    },
    bucketGuideBox: {
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 10,
      marginBottom: 8,
    },
    bucketGuideItem: {
      paddingVertical: 2,
    },
    bucketGuideHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 3,
    },
    bucketGuideTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    bucketGuideText: {
      fontFamily: FONTS.mono,
      fontSize: 7.8,
      color: COLORS.textMuted,
      lineHeight: 12.5,
    },
    bucketGuideDivider: {
      height: 1,
      borderTopWidth: 1,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      marginVertical: 7,
    },
    goodToKnowBox: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 9,
      marginTop: 2,
    },
    goodToKnowTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 2,
    },
    goodToKnowBody: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
    },
  });
