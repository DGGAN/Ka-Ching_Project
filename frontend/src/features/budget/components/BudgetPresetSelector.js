/**
 * @file frontend/src/features/budget/components/BudgetPresetSelector.js
 * @layer Component (Presentational UI)
 * @description Renders the 3 allocation ratio cards (Balanced, Fast Saver, Student-Friendly) and the collapsible 1-line "Why?" recommendation box.
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
          <Text style={styles.plannerSub}>Based on RM {Number(baselineIncome || 0).toFixed(0)} income & spending history</Text>
        </View>

        <TouchableOpacity
          style={styles.infoPillBtn}
          onPress={() => {
            playUiSound("tab");
            if (onOpenHowItWorks) onOpenHowItWorks();
          }}
        >
          <Info size={12} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={styles.infoPillText}>How it works</Text>
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
                playUiSound("tab");
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

      <TouchableOpacity style={styles.whyRecommendBox} activeOpacity={0.8} onPress={onToggleWhyReasons}>
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
    infoPillBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    infoPillText: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.text,
    },
    presetCardsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    presetMiniCard: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingVertical: 10,
      paddingHorizontal: 6,
      alignItems: "center",
    },
    presetMiniCardActive: {
      backgroundColor: COLORS.primary,
    },
    suggestedCrownBadge: {
      backgroundColor: "#FEF08A",
      borderWidth: 1,
      borderColor: "#121212",
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 1,
      marginBottom: 4,
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
