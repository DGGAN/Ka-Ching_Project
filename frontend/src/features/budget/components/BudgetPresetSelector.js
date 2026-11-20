/**
 * @file frontend/src/features/budget/components/BudgetPresetSelector.js
 * @layer Component (Presentational UI)
 * @description Renders the 3 allocation ratio cards (Balanced, Fast Saver, Student-Friendly) and the collapsible 1-line "Why?" recommendation box with unified "pop" UI sounds.
 * @exports default BudgetPresetSelector
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Sparkles, Info, ChevronDown, ChevronUp } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { playUiSound } from "../../../utils/soundEffects";
import { BUDGET_PRESETS } from "../utils/budgetRecommendations";

export default function BudgetPresetSelector({
  baselineIncome = 3000,
  selectedPresetId = "50_30_20",
  onSelectPreset,
  aiRec,
  showWhyReasons = false,
  onToggleWhyReasons,
  onOpenHowItWorks,
}) {
  const styles = getStyles();
  const safeAiRec = aiRec || { presetId: "50_30_20", reasons: [] };
  const suggestedPresetObj = BUDGET_PRESETS.find((p) => p.id === safeAiRec.presetId) || BUDGET_PRESETS[0];

  return (
    <View>
      <View style={styles.plannerTopRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.plannerTitle}>CHOOSE ALLOCATION RATIO</Text>
            <View style={styles.aiTagPill}>
              <Text style={styles.aiTagPillText}>AI-ASSISTED</Text>
            </View>
          </View>
          <Text style={styles.plannerSub}>Based on RM {Number(baselineIncome || 0).toFixed(0)} income &amp; spending history</Text>
        </View>

        <TouchableOpacity
          style={styles.infoIconBtn}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="How smart budgeting works"
          onPress={() => {
            playUiSound("pop");
            if (onOpenHowItWorks) onOpenHowItWorks();
          }}
        >
          <Info size={14} color={COLORS.textMuted} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <View style={styles.presetCardsRow}>
        {BUDGET_PRESETS.map((p) => {
          const isSelected = p.id === selectedPresetId;
          const isSuggested = p.id === safeAiRec.presetId;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.presetMiniCard, isSelected && styles.presetMiniCardActive]}
              onPress={() => {
                playUiSound("pop");
                if (onSelectPreset) onSelectPreset(p.id);
              }}
              activeOpacity={0.8}
            >
              {isSuggested && (
                <View style={styles.suggestedCrownBadge}>
                  <Text style={styles.suggestedCrownText}>★ SUGGESTED</Text>
                </View>
              )}

              <Text style={[styles.presetRatioText, isSelected && { color: COLORS.primaryText }]}>{p.ratioLabel}</Text>
              <Text style={[styles.presetNameText, isSelected && { color: COLORS.primaryText }]} numberOfLines={1}>
                {p.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.whyRecommendBox}
        activeOpacity={0.8}
        onPress={() => {
          playUiSound("pop");
          if (onToggleWhyReasons) onToggleWhyReasons();
        }}
      >
        <View style={styles.whyHeaderRow}>
          <Sparkles size={12} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={styles.whyHeaderTitle} numberOfLines={1}>
            AI Suggests {suggestedPresetObj.name} ({suggestedPresetObj.ratioLabel}) — Why?
          </Text>
          {showWhyReasons ? <ChevronUp size={14} color={COLORS.textMuted} /> : <ChevronDown size={14} color={COLORS.textMuted} />}
        </View>

        {showWhyReasons && (
          <View style={{ marginTop: 6, gap: 3 }}>
            {(safeAiRec.reasons || []).map((r, i) => (
              <Text key={i} style={styles.whyBulletText}>
                • {r}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    plannerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
      gap: 8,
    },
    plannerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    aiTagPill: {
      backgroundColor: COLORS.secondary,
      borderWidth: 1,
      borderColor: COLORS.primary,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    aiTagPillText: {
      fontFamily: FONTS.mono,
      fontSize: 7,
      fontWeight: "bold",
      color: COLORS.primary,
    },
    plannerSub: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    infoIconBtn: {
      width: 26,
      height: 26,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: COLORS.borderMuted,
      backgroundColor: COLORS.card,
      alignItems: "center",
      justifyContent: "center",
    },
    presetCardsRow: {
      flexDirection: "row",
      gap: 8,
      paddingTop: 8,
      marginBottom: 10,
    },
    presetMiniCard: {
      flex: 1,
      minHeight: 58,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingVertical: 11,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    presetMiniCardActive: {
      backgroundColor: COLORS.primary,
    },
    suggestedCrownBadge: {
      position: "absolute",
      top: -9,
      backgroundColor: "#FEF08A",
      borderWidth: 1,
      borderColor: "#121212",
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    suggestedCrownText: {
      fontFamily: FONTS.mono,
      fontSize: 6.5,
      fontWeight: "bold",
      color: "#121212",
    },
    presetRatioText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    presetNameText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      marginTop: 3,
    },
    whyRecommendBox: {
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 10,
      marginBottom: 10,
    },
    whyHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    whyHeaderTitle: {
      flex: 1,
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    whyBulletText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
    },
  });
