/**
 * @file frontend/src/features/insights/components/SpendingPatternCard.js
 * @layer Component (Presentational UI — Section 3: Spending Habits & Smart Tips)
 * @description Renders the unified YOUR SPENDING HABITS card with Flame header and ALERT / HABIT / INFO items.
 * @exports default SpendingPatternCard
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Flame, AlertTriangle, TrendingUp, Info } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import WireBox from "../../../components/shared/WireBox";

export default function SpendingPatternCard({ insightsList = [] }) {
  const styles = getStyles();

  return (
    <WireBox style={styles.sectionCard}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Flame size={15} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={styles.cardHeaderTitle}>YOUR SPENDING HABITS</Text>
        </View>
        <Text style={styles.cardHeaderSub}>Personalized from your records</Text>
      </View>

      <View style={{ padding: 12, gap: 10 }}>
        {insightsList.map((insight) => {
          const isAlert = insight.severity === "ALERT";
          const isHabit = insight.severity === "HABIT";
          const badgeBg = isAlert ? "#FFE4E6" : isHabit ? "#FEF3C7" : "#DCFCE7";
          const badgeColor = isAlert ? "#E11D48" : isHabit ? "#D97706" : "#15803D";

          return (
            <View
              key={insight.id}
              style={[
                styles.insightItemCard,
                isAlert && {
                  borderColor: COLORS.danger,
                  backgroundColor: "#FFF5F5",
                },
              ]}
            >
              <View style={styles.insightTopRow}>
                <View style={styles.insightTitleLeft}>
                  {isAlert ? (
                    <AlertTriangle size={14} color="#E11D48" strokeWidth={2.5} />
                  ) : isHabit ? (
                    <TrendingUp size={14} color="#D97706" strokeWidth={2.5} />
                  ) : (
                    <Info size={14} color="#15803D" strokeWidth={2.5} />
                  )}
                  <Text style={styles.insightTitleText}>{insight.title}</Text>
                </View>

                <View style={[styles.severityPill, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.severityPillText, { color: badgeColor }]}>{insight.severity}</Text>
                </View>
              </View>

              <Text style={styles.insightDescText}>{insight.description}</Text>
            </View>
          );
        })}
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
    insightItemCard: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 11,
    },
    insightTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    insightTitleLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    insightTitleText: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
      flex: 1,
    },
    severityPill: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    severityPillText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
    },
    insightDescText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      lineHeight: 15,
    },
  });
