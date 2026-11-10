/**
 * @file frontend/src/features/insights/components/SpendingForecastChart.js
 * @layer Component (Presentational UI — Section 2: Monthly Spending Trend Chart)
 * @description Renders the exact 125px SVG Monthly Spending Trend Chart with Polygon area fill, solid actual line, dashed #D97706 forecast line, and X-axis checkpoint amounts.
 * @exports default SpendingForecastChart
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polyline, Polygon, Circle, Line } from "react-native-svg";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import WireBox from "../../../components/shared/WireBox";
import { computeInsightsChartGeometry } from "../utils/insightsUtils";

export default function SpendingForecastChart({
  currentDay = 1,
  daysInMonth = 30,
  dailyBurnRate = 0,
  monthlyLimit = 0,
  predictedMonthEnd = 0,
  thisMonthExpense = 0,
  isOverProjected = false,
  chartCheckpoints = [],
  chartWidth = 0,
  onLayoutChart,
}) {
  const styles = getStyles();

  const {
    PLOT_HEIGHT,
    TOP_PAD,
    BOTTOM_PAD,
    usableHeight,
    plottedNodes,
    actualNodes,
    forecastSegmentNodes,
    actualPolylineStr,
    forecastPolylineStr,
    actualAreaStr,
    limitY,
  } = computeInsightsChartGeometry({
    chartCheckpoints,
    predictedMonthEnd,
    monthlyLimit,
    thisMonthExpense,
    chartWidth,
  });

  return (
    <WireBox style={styles.sectionCard}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.cardHeaderTitle}>MONTHLY SPENDING TREND</Text>
          <Text style={styles.cardHeaderSub}>
            Day {currentDay} of {daysInMonth} • Averaging RM {dailyBurnRate.toFixed(2)} per day
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isOverProjected ? "#FFE4E6" : "#DCFCE7" }]}>
          <Text style={[styles.statusBadgeText, { color: isOverProjected ? "#E11D48" : "#15803D" }]}>
            {monthlyLimit === 0 ? "TRACKING" : isOverProjected ? "OVER BUDGET RISK" : "ON TRACK"}
          </Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Spent So Far</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLineDashed, { borderColor: "#D97706" }]} />
            <Text style={styles.legendText}>Month-End Estimate</Text>
          </View>
          {monthlyLimit > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: COLORS.danger }]} />
              <Text style={styles.legendText}>Budget Limit (RM {monthlyLimit.toFixed(0)})</Text>
            </View>
          )}
        </View>

        <View style={[styles.plotContainer, { height: PLOT_HEIGHT }]} onLayout={(e) => onLayoutChart(e.nativeEvent.layout.width)}>
          {chartWidth > 0 && plottedNodes.length > 0 && (
            <Svg width={chartWidth} height={PLOT_HEIGHT}>
              <Line x1="0" y1={TOP_PAD} x2={chartWidth} y2={TOP_PAD} stroke={COLORS.borderMuted} strokeWidth="1" strokeDasharray="3,3" />
              <Line
                x1="0"
                y1={TOP_PAD + usableHeight / 2}
                x2={chartWidth}
                y2={TOP_PAD + usableHeight / 2}
                stroke={COLORS.borderMuted}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <Line
                x1="0"
                y1={PLOT_HEIGHT - BOTTOM_PAD}
                x2={chartWidth}
                y2={PLOT_HEIGHT - BOTTOM_PAD}
                stroke={COLORS.borderMuted}
                strokeWidth="1.5"
              />

              {limitY !== null && (
                <Line x1="0" y1={limitY} x2={chartWidth} y2={limitY} stroke={COLORS.danger} strokeWidth="1.8" strokeDasharray="5,4" />
              )}

              {actualNodes.length > 1 && <Polygon points={actualAreaStr} fill={COLORS.primary} fillOpacity="0.16" />}

              {actualNodes.length > 1 && (
                <Polyline
                  points={actualPolylineStr}
                  fill="none"
                  stroke={COLORS.primary}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {forecastSegmentNodes.length > 1 && (
                <Polyline
                  points={forecastPolylineStr}
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="2.8"
                  strokeDasharray="6,4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {plottedNodes.map((node, i) => (
                <Circle
                  key={i}
                  cx={node.x}
                  cy={node.y}
                  r={node.isFuture ? 5.5 : 4.5}
                  fill={node.isFuture ? "#FEF3C7" : COLORS.card}
                  stroke={node.isFuture ? "#D97706" : COLORS.primary}
                  strokeWidth={2.5}
                />
              ))}
            </Svg>
          )}
        </View>

        <View style={styles.xAxisRow}>
          {plottedNodes.map((node, i) => (
            <View key={i} style={styles.xAxisNodeCol}>
              <Text style={[styles.xAxisDayText, node.isFuture && { color: "#D97706", fontWeight: "bold" }]}>{node.label}</Text>
              <Text style={styles.xAxisAmtText}>RM {Math.round(node.val)}</Text>
            </View>
          ))}
        </View>
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
    statusBadge: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    statusBadgeText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
    },
    chartWrapper: {
      padding: 14,
    },
    legendRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 10,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    legendLine: {
      width: 14,
      height: 3,
      borderRadius: 2,
    },
    legendLineDashed: {
      width: 14,
      height: 0,
      borderTopWidth: 2.5,
      borderStyle: "dashed",
    },
    legendText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
    },
    plotContainer: {
      width: "100%",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      overflow: "hidden",
    },
    xAxisRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      paddingHorizontal: 2,
    },
    xAxisNodeCol: {
      alignItems: "center",
    },
    xAxisDayText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
    },
    xAxisAmtText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 1,
    },
  });
