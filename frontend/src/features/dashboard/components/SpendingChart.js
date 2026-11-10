/**
 * @file frontend/src/features/dashboard/components/SpendingChart.js
 * @layer Component (Presentational UI — 100% Original Stacked Bar + Trend Line & 2-Column Grid)
 * @description Renders the exact 154px 3-layer Stacked Monthly Bar + SVG Trend Line Chart and 48.5% 2-Column Category Grid.
 * @props {object} activeMonth - Currently selected month object
 * @props {number|null} momDiffPct - Month-over-Month % difference
 * @props {number} chartBoxWidth - Measured width of the plotBox
 * @props {function} onLayoutPlotBox - Callback to set chartBoxWidth
 * @props {object} chartGeometry - Precomputed coordinates from computeChartGeometry()
 * @props {function} onSelectMonthKey - Callback when user taps a month bar
 * @exports default SpendingChart
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Line, Polygon, Polyline, Circle } from "react-native-svg";
import { TrendingDown, TrendingUp } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import WireBox from "../../../components/shared/WireBox";

export default function SpendingChart({ activeMonth, momDiffPct, chartBoxWidth, onLayoutPlotBox, chartGeometry, onSelectMonthKey }) {
  const styles = getStyles();
  const { CHART_HEIGHT, TOP_PAD, BOTTOM_PAD, USABLE_BAR_MAX_H, BAR_WIDTH, colWidth, chartNodes, polylinePoints, areaPolygonPoints } = chartGeometry;

  return (
    <WireBox style={styles.chartCard}>
      <View style={styles.cardHeaderLine}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>SPENDING BREAKDOWN</Text>
          <Text style={styles.sectionSubTitle}>Tap any month bar to inspect its categories</Text>
        </View>

        <View style={styles.headerBadgesRight}>
          {momDiffPct !== null && (
            <View
              style={[
                styles.momBadge,
                {
                  backgroundColor: momDiffPct <= 0 ? "#DCFCE7" : "#FFE4E6",
                  borderColor: momDiffPct <= 0 ? "#15803D" : "#E11D48",
                },
              ]}
            >
              {momDiffPct <= 0 ? (
                <TrendingDown size={11} color="#15803D" strokeWidth={2.5} />
              ) : (
                <TrendingUp size={11} color="#E11D48" strokeWidth={2.5} />
              )}
              <Text style={[styles.momBadgeText, { color: momDiffPct <= 0 ? "#15803D" : "#E11D48" }]}>
                {momDiffPct > 0 ? `+${momDiffPct}%` : `${momDiffPct}%`}
              </Text>
            </View>
          )}

          <View style={styles.activeMonthBadge}>
            <Text style={styles.activeMonthBadgeText}>{activeMonth.isCurrentMonth ? `${activeMonth.shortMonth} (Current)` : activeMonth.label}</Text>
          </View>
        </View>
      </View>

      {/* Interactive Stacked Bar + Trend Line Plot Box */}
      <View style={[styles.plotBox, { height: CHART_HEIGHT }]} onLayout={(e) => onLayoutPlotBox(e.nativeEvent.layout.width)}>
        {chartBoxWidth > 0 && (
          <>
            {/* Layer 1: Background Dashed Grid Lines & Baseline */}
            <Svg width={chartBoxWidth} height={CHART_HEIGHT} style={StyleSheet.absoluteFill}>
              <Line x1="12" y1={TOP_PAD} x2={chartBoxWidth - 12} y2={TOP_PAD} stroke={COLORS.borderMuted} strokeWidth="1" strokeDasharray="4,4" />
              <Line
                x1="12"
                y1={TOP_PAD + USABLE_BAR_MAX_H / 2}
                x2={chartBoxWidth - 12}
                y2={TOP_PAD + USABLE_BAR_MAX_H / 2}
                stroke={COLORS.borderMuted}
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <Line
                x1="12"
                y1={CHART_HEIGHT - BOTTOM_PAD}
                x2={chartBoxWidth - 12}
                y2={CHART_HEIGHT - BOTTOM_PAD}
                stroke={COLORS.borderMuted}
                strokeWidth="1.5"
              />

              {chartNodes.length > 1 && <Polygon points={areaPolygonPoints} fill={COLORS.text} fillOpacity="0.10" />}
            </Svg>

            {/* Layer 2: Interactive Stacked Category Bars per Month */}
            <View style={[styles.barsOverlayRow, { height: CHART_HEIGHT }]}>
              {chartNodes.map((node) => {
                const isSelected = node.key === activeMonth.key;
                return (
                  <TouchableOpacity
                    key={node.key}
                    style={[styles.barColumnTouch, { width: colWidth }]}
                    activeOpacity={0.8}
                    onPress={() => onSelectMonthKey(node.key)}
                  >
                    <Text style={[styles.barTopAmountText, isSelected && styles.barTopAmountTextSelected, { top: Math.max(4, node.topY - 18) }]}>
                      RM {Math.round(node.expense)}
                    </Text>

                    {node.barHeight > 0 && (
                      <View
                        style={[
                          styles.stackedBarContainer,
                          {
                            width: BAR_WIDTH,
                            height: node.barHeight,
                            bottom: BOTTOM_PAD,
                            borderWidth: isSelected ? 2 : 1,
                            borderColor: "#121212",
                            opacity: isSelected ? 1 : 0.72,
                          },
                        ]}
                      >
                        {node.categories.map((catSeg) => (
                          <View
                            key={catSeg.category}
                            style={{
                              flex: catSeg.amount,
                              backgroundColor: catSeg.iconColor,
                              width: "100%",
                            }}
                          />
                        ))}
                      </View>
                    )}

                    {/* Month Pill Label under Baseline: Shows "Nov (Current)" for current month */}
                    <View style={[styles.xAxisMonthPill, isSelected && styles.xAxisMonthPillSelected]}>
                      <Text style={[styles.xAxisMonthText, isSelected && styles.xAxisMonthTextSelected]}>
                        {node.isCurrentMonth ? `${node.shortMonth} (Current)` : node.shortMonth}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Layer 3: Foreground Connecting Trend Line & Node Circles */}
            <Svg width={chartBoxWidth} height={CHART_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
              {chartNodes.length > 1 && <Polyline points={polylinePoints} fill="none" stroke="#121212" strokeWidth="2.2" />}
              {chartNodes.map((node) => {
                const isSelected = node.key === activeMonth.key;
                return (
                  <Circle
                    key={node.key}
                    cx={node.centerX}
                    cy={node.topY}
                    r={isSelected ? 5.5 : 4.5}
                    fill={isSelected ? "#121212" : "#FFFFFF"}
                    stroke="#121212"
                    strokeWidth="2"
                  />
                );
              })}
            </Svg>
          </>
        )}
      </View>

      {/* 2-Column Category Breakdown Grid for Selected Month */}
      {activeMonth.categories.length === 0 ? (
        <Text style={styles.emptyChartText}>No expenses recorded in {activeMonth.label}.</Text>
      ) : (
        <View style={styles.categoryGrid}>
          {activeMonth.categories.map((catItem) => {
            const IconComp = catItem.IconComponent;
            return (
              <View
                key={catItem.category}
                style={[
                  styles.catMiniCard,
                  {
                    backgroundColor: catItem.bgColor,
                    borderColor: catItem.iconColor,
                  },
                ]}
              >
                <View style={styles.catMiniTopRow}>
                  <View style={styles.catMiniTitleRow}>
                    {IconComp && <IconComp size={13} color={catItem.iconColor} strokeWidth={2.4} />}
                    <Text style={styles.catMiniLabel} numberOfLines={1}>
                      {catItem.label}
                    </Text>
                  </View>
                  <Text style={[styles.catMiniPct, { color: catItem.iconColor }]}>{catItem.pct}%</Text>
                </View>

                <Text style={[styles.catMiniAmount, { color: catItem.iconColor }]}>RM {catItem.amount.toFixed(2)}</Text>

                <View style={styles.catMiniBarTrack}>
                  <View
                    style={[
                      styles.catMiniBarFill,
                      {
                        width: `${Math.min(100, Math.max(8, catItem.rawPct))}%`,
                        backgroundColor: catItem.iconColor,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </WireBox>
  );
}

const getStyles = () =>
  StyleSheet.create({
    chartCard: {
      marginBottom: 16,
      padding: 14,
    },
    cardHeaderLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: SHAPES.borderWidth,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 12,
      gap: 8,
    },
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
    headerBadgesRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    momBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      borderWidth: 1.2,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    momBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
    },
    activeMonthBadge: {
      borderWidth: 1.2,
      borderColor: COLORS.border,
      borderRadius: 6,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    activeMonthBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    plotBox: {
      width: "100%",
      borderWidth: 1.8,
      borderColor: "#121212",
      borderRadius: 8,
      backgroundColor: COLORS.secondary,
      marginBottom: 14,
      position: "relative",
      overflow: "hidden",
    },
    barsOverlayRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      width: "100%",
    },
    barColumnTouch: {
      height: "100%",
      alignItems: "center",
      justifyContent: "flex-end",
      position: "relative",
    },
    barTopAmountText: {
      position: "absolute",
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
    },
    barTopAmountTextSelected: {
      fontWeight: "bold",
      color: "#121212",
    },
    stackedBarContainer: {
      position: "absolute",
      borderRadius: 2,
      overflow: "hidden",
      flexDirection: "column",
    },
    xAxisMonthPill: {
      height: 19,
      paddingHorizontal: 6,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 5,
    },
    xAxisMonthPillSelected: {
      backgroundColor: "#121212",
    },
    xAxisMonthText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
    },
    xAxisMonthTextSelected: {
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    emptyChartText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.textMuted,
      textAlign: "center",
      paddingVertical: 12,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 8,
    },
    catMiniCard: {
      width: "48.5%",
      borderWidth: 1.2,
      borderRadius: 8,
      padding: 10,
    },
    catMiniTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    catMiniTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flex: 1,
    },
    catMiniLabel: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: "#121212",
      flex: 1,
    },
    catMiniPct: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
    },
    catMiniAmount: {
      fontFamily: FONTS.mono,
      fontSize: 13,
      fontWeight: "bold",
      marginBottom: 7,
    },
    catMiniBarTrack: {
      width: "100%",
      height: 5,
      borderRadius: 3,
      backgroundColor: "rgba(0,0,0,0.08)",
      overflow: "hidden",
    },
    catMiniBarFill: {
      height: "100%",
      borderRadius: 3,
    },
  });
