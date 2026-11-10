/**
 * @file frontend/src/features/insights/components/InsightSummaryCard.js
 * @layer Component (Presentational UI — Section 1: AI Month-End Forecast Hero Card)
 * @description Renders the exact SMART SPENDING FORECAST Hero Card with Refresh button, Estimated Month-End Total, and 3 metric boxes.
 * @exports default InsightSummaryCard
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Sparkles, RefreshCw } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";

export default function InsightSummaryCard({
  currentMonthLabel = "",
  predictedMonthEnd = 0,
  thisMonthExpense = 0,
  dailyBurnRate = 0,
  monthlyLimit = 0,
  isOverProjected = false,
  projectedVariance = 0,
  onRefresh,
}) {
  const styles = getStyles();

  return (
    <View style={styles.forecastHeroCard}>
      <View style={styles.heroTopRow}>
        <View style={styles.aiTagBadge}>
          <Sparkles size={11} color="#111111" strokeWidth={2.5} />
          <Text style={styles.aiTagText}>SMART SPENDING FORECAST</Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
          <RefreshCw size={12} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.refreshBtnText}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.heroSubLabel}>ESTIMATED TOTAL BY END OF {currentMonthLabel.toUpperCase()}</Text>
      <Text style={styles.heroPredictedAmount}>
        RM{" "}
        {predictedMonthEnd.toLocaleString("en-MY", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>

      <View style={styles.heroMetricsRow}>
        <View style={styles.heroMetricBox}>
          <Text style={styles.heroMetricLabel}>SPENT SO FAR</Text>
          <Text style={styles.heroMetricVal}>RM {thisMonthExpense.toFixed(0)}</Text>
        </View>

        <View style={styles.heroMetricBox}>
          <Text style={styles.heroMetricLabel}>DAILY AVG</Text>
          <Text style={styles.heroMetricVal}>RM {dailyBurnRate.toFixed(1)}/day</Text>
        </View>

        <View style={[styles.heroMetricBox, isOverProjected ? styles.heroMetricDanger : styles.heroMetricSafe]}>
          <Text style={styles.heroMetricLabel}>BUDGET CHECK</Text>
          <Text
            style={[
              styles.heroMetricVal,
              {
                color: monthlyLimit === 0 ? "#FFFFFF" : isOverProjected ? "#FECDD3" : "#A7F3D0",
              },
            ]}
          >
            {monthlyLimit === 0
              ? "Not Set"
              : isOverProjected
                ? `+RM ${projectedVariance.toFixed(0)} Over`
                : `RM ${Math.abs(projectedVariance).toFixed(0)} Safe`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    forecastHeroCard: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.primary,
      padding: 16,
      marginBottom: 14,
      shadowColor: COLORS.text,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 0,
      elevation: 4,
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    aiTagBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#FEF08A",
      borderWidth: 1.5,
      borderColor: "#111111",
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    aiTagText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: "#111111",
      letterSpacing: 0.5,
    },
    refreshBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.25)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.45)",
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    refreshBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    heroSubLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.primaryText,
      opacity: 0.85,
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    heroPredictedAmount: {
      fontFamily: FONTS.mono,
      fontSize: 28,
      fontWeight: "bold",
      color: COLORS.primaryText,
      marginBottom: 14,
    },
    heroMetricsRow: {
      flexDirection: "row",
      gap: 8,
    },
    heroMetricBox: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.35)",
      borderRadius: SHAPES.inputRadius,
      backgroundColor: "rgba(0,0,0,0.22)",
      padding: 8,
    },
    heroMetricDanger: {
      borderColor: "#FDA4AF",
      backgroundColor: "rgba(136, 19, 55, 0.38)",
    },
    heroMetricSafe: {
      borderColor: "#6EE7B7",
      backgroundColor: "rgba(6, 78, 59, 0.35)",
    },
    heroMetricLabel: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      color: COLORS.primaryText,
      opacity: 0.85,
      marginBottom: 3,
    },
    heroMetricVal: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.primaryText,
    },
  });
