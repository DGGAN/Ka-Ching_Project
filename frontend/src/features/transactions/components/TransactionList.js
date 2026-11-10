/**
 * @file frontend/src/features/transactions/components/TransactionList.js
 * @layer Component (Presentational UI — 100% Original Design)
 * @description Renders the Paginated Lazy-Loaded FlatList of Date-Grouped Sections or Empty State box.
 * @exports default TransactionList
 */

import React from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS, FONTS } from "../../../theme/colors";
import WireBox from "../../../components/shared/WireBox";
import TransactionGroup from "./TransactionGroup";

export default function TransactionList({ loading = false, loadingMore = false, sections = [], onLoadMore, onPressItem }) {
  const styles = getStyles();

  if (loading) {
    return <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 30 }} />;
  }

  if (sections.length === 0) {
    return (
      <View style={{ paddingHorizontal: 16 }}>
        <WireBox style={{ alignItems: "center", paddingVertical: 28 }}>
          <Text style={styles.emptyTitle}>No Matching Transactions</Text>
          <Text style={styles.emptySub}>No records found for this filter. Tap "All Time" or "Reset" above to view all records.</Text>
        </WireBox>
      </View>
    );
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={(section) => section.dateStr}
      contentContainerStyle={styles.listContentContainer}
      showsVerticalScrollIndicator={false}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      renderItem={({ item: group }) => <TransactionGroup group={group} onPressItem={onPressItem} />}
      ListFooterComponent={
        loadingMore ? (
          <View style={{ paddingVertical: 14, alignItems: "center" }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingMoreText}>Loading more records...</Text>
          </View>
        ) : null
      }
    />
  );
}

const getStyles = () =>
  StyleSheet.create({
    listContentContainer: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    loadingMoreText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
      marginTop: 4,
    },
    emptyTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 4,
    },
    emptySub: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.textMuted,
      textAlign: "center",
    },
  });
