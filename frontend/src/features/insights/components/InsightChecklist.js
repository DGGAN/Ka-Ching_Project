/**
 * @file frontend/src/features/insights/components/InsightChecklist.js
 * @layer Component (Presentational UI — Section 4: Persistent Money-Saving To-Do List)
 * @description Renders the MONEY-SAVING TO-DO LIST card with COMMITTED MONTHLY SAVINGS progress banner, interactive checkboxes with "check_one" / "check_all" / "pop" sounds, and a zero-dependency confetti burst when all goals are completed.
 * @exports default InsightChecklist
 */

import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, Platform, StyleSheet } from "react-native";
import { Award, CheckSquare, Square, ArrowRight } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import WireBox from "../../../components/shared/WireBox";
import { computeChecklistSavings } from "../utils/insightsUtils";

// Precomputed confetti ribbons for smooth 60fps burst animation (zero external dependencies)
const CONFETTI_PIECES = [
  { leftPct: "8%", dx: -24, dy: 170, rot: "210deg", color: "#F59E0B", w: 7, h: 12 },
  { leftPct: "15%", dx: 18, dy: 210, rot: "-180deg", color: "#10B981", w: 6, h: 10 },
  { leftPct: "22%", dx: -30, dy: 190, rot: "260deg", color: "#EC4899", w: 8, h: 6 },
  { leftPct: "29%", dx: 26, dy: 230, rot: "-240deg", color: "#3B82F6", w: 6, h: 11 },
  { leftPct: "36%", dx: -16, dy: 165, rot: "190deg", color: "#FBBF24", w: 7, h: 7 },
  { leftPct: "43%", dx: 22, dy: 245, rot: "-290deg", color: "#8B5CF6", w: 6, h: 12 },
  { leftPct: "50%", dx: -20, dy: 220, rot: "310deg", color: "#22C55E", w: 8, h: 6 },
  { leftPct: "57%", dx: 28, dy: 185, rot: "-220deg", color: "#F97316", w: 6, h: 11 },
  { leftPct: "64%", dx: -26, dy: 235, rot: "240deg", color: "#06B6D4", w: 7, h: 10 },
  { leftPct: "71%", dx: 19, dy: 195, rot: "-260deg", color: "#EF4444", w: 8, h: 6 },
  { leftPct: "78%", dx: -22, dy: 215, rot: "280deg", color: "#EAB308", w: 6, h: 12 },
  { leftPct: "85%", dx: 24, dy: 175, rot: "-200deg", color: "#14B8A6", w: 7, h: 7 },
  { leftPct: "91%", dx: -18, dy: 205, rot: "230deg", color: "#A855F7", w: 6, h: 11 },
  { leftPct: "12%", dx: 32, dy: 240, rot: "-310deg", color: "#34D399", w: 6, h: 10 },
  { leftPct: "26%", dx: -14, dy: 160, rot: "175deg", color: "#F43F5E", w: 7, h: 6 },
  { leftPct: "40%", dx: 30, dy: 200, rot: "-250deg", color: "#60A5FA", w: 6, h: 12 },
  { leftPct: "54%", dx: -28, dy: 250, rot: "295deg", color: "#FACC15", w: 8, h: 6 },
  { leftPct: "68%", dx: 16, dy: 170, rot: "-190deg", color: "#10B981", w: 7, h: 10 },
  { leftPct: "82%", dx: -32, dy: 225, rot: "270deg", color: "#FB7185", w: 6, h: 11 },
  { leftPct: "47%", dx: 12, dy: 180, rot: "-230deg", color: "#38BDF8", w: 7, h: 7 },
];

export default function InsightChecklist({ checklistItems = [], checkedIds = {}, currentMonthLabel = "", onToggleItem, onNavigateToBudget }) {
  const styles = getStyles();
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiProgress = useRef(new Animated.Value(0)).current;

  const { completedCount, allCompleted, committedSavingsRM, totalPossibleSavingsRM } = computeChecklistSavings(checklistItems, checkedIds);

  // Trigger a celebratory confetti ribbon burst across the checklist card
  const triggerConfettiBurst = () => {
    const useNative = Platform.OS !== "web";
    confettiProgress.setValue(0);
    setShowConfetti(true);

    Animated.timing(confettiProgress, {
      toValue: 1,
      duration: 1350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNative,
    }).start(({ finished }) => {
      if (finished) {
        setShowConfetti(false);
      }
    });
  };

  // Play "check_one", "check_all" (+ confetti), or "pop" on uncheck
  const handleTogglePress = (item) => {
    const wasChecked = Boolean(checkedIds[item.id]);

    if (wasChecked) {
      playUiSound("pop");
    } else {
      const nextCompletedCount = completedCount + 1;
      const willCompleteAll = checklistItems.length > 0 && nextCompletedCount >= checklistItems.length;
      if (willCompleteAll) {
        playUiSound("check_all");
        triggerConfettiBurst();
      } else {
        playUiSound("check_one");
      }
    }

    if (typeof onToggleItem === "function") {
      onToggleItem(item);
    }
  };

  return (
    <WireBox style={styles.sectionCard}>
      {/* Confetti Ribbon Overlay (Non-interactive, fires when user finishes all goals) */}
      {showConfetti && (
        <View style={styles.confettiOverlay} pointerEvents="none">
          {CONFETTI_PIECES.map((piece, idx) => {
            const translateY = confettiProgress.interpolate({
              inputRange: [0, 0.18, 1],
              outputRange: [-14, -26 - (idx % 4) * 8, piece.dy],
            });
            const translateX = confettiProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, piece.dx],
            });
            const rotate = confettiProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", piece.rot],
            });
            const opacity = confettiProgress.interpolate({
              inputRange: [0, 0.72, 1],
              outputRange: [1, 1, 0],
            });

            return (
              <Animated.View
                key={idx}
                style={[
                  styles.confettiPiece,
                  {
                    left: piece.leftPct,
                    width: piece.w,
                    height: piece.h,
                    backgroundColor: piece.color,
                    opacity,
                    transform: [{ translateY }, { translateX }, { rotate }],
                  },
                ]}
              />
            );
          })}
        </View>
      )}

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
                onPress={() => handleTogglePress(item)}
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
      position: "relative",
    },
    confettiOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 25,
      overflow: "hidden",
    },
    confettiPiece: {
      position: "absolute",
      top: 28,
      borderRadius: 2,
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
