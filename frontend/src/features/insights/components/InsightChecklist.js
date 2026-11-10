/**
 * @file frontend/src/features/insights/components/InsightChecklist.js
 * @layer Component (Presentational UI — Section 4: Persistent Money-Saving To-Do List)
 * @description Renders the MONEY-SAVING TO-DO LIST card with COMMITTED MONTHLY SAVINGS progress banner, interactive checkboxes, Open Budget Tab Now shortcut, and celebration box.
 * @exports default InsightChecklist
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Award, CheckSquare, Square, ArrowRight } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import WireBox from "../../../components/shared/WireBox";
import { computeChecklistSavings } from "../utils/insightsUtils";

export default function InsightChecklist({ checklistItems = [], checkedIds = {}, currentMonthLabel = "", onToggleItem, onNavigateToBudget }) {
  const styles = getStyles();

  const { completedCount, allCompleted, committedSavingsRM, totalPossibleSavingsRM } = computeChecklistSavings(checklistItems, checkedIds);

  return (
    <WireBox style={styles.sectionCard}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardHeaderTitle}>MONEY-SAVING TO-DO LIST</Text>
          <Text style={styles.cardHeaderSub}>Check off goals you commit to — your progress is saved automatically</Text>
        </View>
        <View
          style={[
            styles.checklistCountBadge,
            allCompleted && {
              backgroundColor: "#DCFCE7",
              borderColor: "#15803D",
            },
          ]}
        >
          <Text style={[styles.checklistCountText, allCompleted && { color: "#15803D" }]}>
            {completedCount}/{checklistItems.length} DONE
          </Text>
        </View>
      </View>

      {/* Live Potential Savings Summary Banner */}
      {totalPossibleSavingsRM > 0 && (
        <View style={styles.savingsImpactBanner}>
          <View style={styles.savingsBannerTop}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Award size={14} color="#15803D" strokeWidth={2.5} />
              <Text style={styles.savingsBannerLabel}>COMMITTED MONTHLY SAVINGS:</Text>
            </View>
            <Text style={styles.savingsBannerValue}>
              RM {committedSavingsRM.toFixed(0)} / RM {totalPossibleSavingsRM.toFixed(0)}
            </Text>
          </View>
          <View style={styles.savingsProgressTrack}>
            <View
              style={[
                styles.savingsProgressFill,
                {
                  width: `${Math.min(100, (committedSavingsRM / totalPossibleSavingsRM) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      <View style={{ padding: 12, gap: 8 }}>
        {checklistItems.map((item) => {
          const isChecked = Boolean(checkedIds[item.id]);
          const isBudgetSetupTask = item.id === "chk_set_budget";

          return (
            <View key={item.id}>
              <TouchableOpacity
                style={[styles.checkItemRow, isChecked && styles.checkItemRowDone]}
                activeOpacity={0.75}
                onPress={() => onToggleItem(item)}
              >
                {isChecked ? (
                  <CheckSquare size={18} color="#15803D" strokeWidth={2.5} />
                ) : (
                  <Square size={18} color={COLORS.textMuted} strokeWidth={2} />
                )}

                <Text style={[styles.checkItemText, isChecked && styles.checkItemTextDone]}>{item.text}</Text>

                <View
                  style={[
                    styles.impactBadge,
                    isChecked && {
                      backgroundColor: "#DCFCE7",
                      borderColor: "#15803D",
                    },
                  ]}
                >
                  <Text style={[styles.impactBadgeText, isChecked && { color: "#15803D" }]}>{item.impact}</Text>
                </View>
              </TouchableOpacity>

              {/* Optional quick shortcut button if the user hasn't set a budget yet */}
              {isBudgetSetupTask && !isChecked && onNavigateToBudget && (
                <TouchableOpacity style={styles.quickActionShortcut} onPress={onNavigateToBudget}>
                  <Text style={styles.quickActionText}>Open Budget Tab Now</Text>
                  <ArrowRight size={11} color={COLORS.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {allCompleted && (
          <View style={styles.allDoneCelebrationBox}>
            <Text style={styles.allDoneCelebrationText}>
              All habits committed for {currentMonthLabel}! Sticking to these goals will help keep your spending well under control.
            </Text>
          </View>
        )}
      </View>
    </WireBox>
  );
}

const getStyles = () =>
  StyleSheet.create({
    sectionCard: {
      marginBottom: 14,
      padding: 0,
      overflow: "hidden",
    },
    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
    },
    cardHeaderTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 0.8,
    },
    cardHeaderSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    checklistCountBadge: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginLeft: 8,
    },
    checklistCountText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    savingsImpactBanner: {
      marginHorizontal: 12,
      marginTop: 10,
      padding: 10,
      borderWidth: 1.5,
      borderColor: "#15803D",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: "#F0FDF4",
    },
    savingsBannerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    savingsBannerLabel: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: "#15803D",
    },
    savingsBannerValue: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: "#15803D",
    },
    savingsProgressTrack: {
      width: "100%",
      height: 6,
      backgroundColor: "#BBF7D0",
      borderRadius: 3,
      overflow: "hidden",
    },
    savingsProgressFill: {
      height: "100%",
      backgroundColor: "#15803D",
    },
    checkItemRow: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 11,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    checkItemRowDone: {
      backgroundColor: "#F0FDF4",
      borderColor: "#15803D",
      opacity: 0.9,
    },
    checkItemText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.text,
      flex: 1,
      lineHeight: 14,
    },
    checkItemTextDone: {
      textDecorationLine: "line-through",
      color: COLORS.textMuted,
    },
    impactBadge: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    impactBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.text,
    },
    quickActionShortcut: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-end",
      gap: 4,
      marginTop: 4,
      paddingHorizontal: 6,
    },
    quickActionText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.primary,
      textDecorationLine: "underline",
    },
    allDoneCelebrationBox: {
      marginTop: 4,
      padding: 9,
      borderWidth: 1,
      borderColor: "#15803D",
      borderStyle: "dashed",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: "#F0FDF4",
    },
    allDoneCelebrationText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: "#15803D",
      textAlign: "center",
      lineHeight: 14,
    },
  });
