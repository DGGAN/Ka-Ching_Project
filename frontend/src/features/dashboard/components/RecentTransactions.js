/**
 * @file frontend/src/features/dashboard/components/RecentTransactions.js
 * @layer Component (Presentational UI — 100% Original Recent Transactions Design)
 * @description Renders the dynamic header ("RECENT TRANSACTIONS" vs "[MONTH] TRANSACTIONS"), See All pill button with ArrowRight, and top 5 transaction cards.
 * @props {object} activeMonth - Currently selected month object
 * @props {boolean} loading - Loading indicator state
 * @props {function} onPressSeeAll - Callback when See All button is tapped
 * @exports default RecentTransactions
 */

import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { getCategoryMeta } from "../../../utils/categoryConfig";
import WireBox from "../../../components/shared/WireBox";
import CategoryBadge from "../../../components/shared/CategoryBadge";

export default function RecentTransactions({ activeMonth, loading = false, onPressSeeAll }) {
  const styles = getStyles();

  return (
    <>
      <View style={styles.recentHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>
            {activeMonth.isCurrentMonth ? "RECENT TRANSACTIONS" : `${activeMonth.label.toUpperCase()} TRANSACTIONS`}
          </Text>
          <Text style={styles.sectionSubTitle}>
            {activeMonth.isCurrentMonth ? `Latest entries added in ${activeMonth.label}` : `Historical records from ${activeMonth.label}`}
          </Text>
        </View>

        <TouchableOpacity style={styles.seeAllPillBtn} onPress={onPressSeeAll} activeOpacity={0.75}>
          <Text style={styles.seeAllText}>See All</Text>
          <ArrowRight size={12} color={COLORS.text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : activeMonth.monthTxs.length === 0 ? (
        <WireBox style={{ alignItems: "center", paddingVertical: 22 }}>
          <Text style={styles.emptyListText}>No transactions recorded in {activeMonth.label}.</Text>
        </WireBox>
      ) : (
        activeMonth.monthTxs.slice(0, 5).map((tx, idx) => {
          const isIncome = tx.type === "INCOME";
          const cfg = getCategoryMeta(tx.category);
          const formattedDate = tx.date
            ? new Date(tx.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })
            : "Today";

          return (
            <WireBox key={tx._id || idx} style={styles.txItemCard}>
              <CategoryBadge category={tx.category} size={36} iconSize={17} />

              <View style={{ flex: 1 }}>
                <Text style={styles.txMerchant} numberOfLines={1}>
                  {tx.merchantName || tx.merchant || "General"}
                </Text>
                <Text style={styles.txCategory} numberOfLines={1}>
                  {cfg.name || cfg.label} • {formattedDate}
                </Text>
              </View>

              <Text style={[styles.txAmount, { color: isIncome ? "#16A34A" : "#E11D48" }]}>
                {isIncome ? "+" : "-"}RM {Number(tx.amount).toFixed(2)}
              </Text>
            </WireBox>
          );
        })
      )}
    </>
  );
}

const getStyles = () =>
  StyleSheet.create({
    sectionTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 1,
    },
    sectionSubTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    recentHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    seeAllPillBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    seeAllText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.text,
      fontWeight: "bold",
    },
    emptyListText: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.textMuted,
    },
    txItemCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
      gap: 12,
    },
    txMerchant: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
    },
    txCategory: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    txAmount: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
    },
  });
