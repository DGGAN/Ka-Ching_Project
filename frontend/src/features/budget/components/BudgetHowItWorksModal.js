/**
 * @file frontend/src/features/budget/components/BudgetHowItWorksModal.js
 * @layer Component (Modal UI — 100% Original "HOW SMART BUDGETING WORKS" Modal)
 * @description Renders the exact 3-step explanation modal, preset definitions, and Good to know box.
 * @exports default BudgetHowItWorksModal
 */

import React from "react";
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { BUDGET_PRESETS } from "../utils/budgetRecommendations";
import WireButton from "../../../components/shared/WireButton";

export default function BudgetHowItWorksModal({ visible = false, onClose }) {
  const styles = getStyles();

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.modalTitle}>HOW SMART BUDGETING WORKS</Text>
              <Text style={styles.modalSubTitle}>YOUR FINANCIAL DATA, YOUR BUDGET</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 390 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalIntroText}>Ka-Ching! analyses your financial information to help you establish a suitable monthly budget.</Text>

            <View style={styles.stepItemBox}>
              <Text style={styles.stepTitle}>01. Analyse your financial activity</Text>
              <Text style={styles.stepBody}>
                Your previous transactions, monthly income and spending categories are analysed to understand your financial behaviour.
              </Text>
            </View>

            <View style={styles.stepItemBox}>
              <Text style={styles.stepTitle}>02. Recommend an allocation</Text>
              <Text style={styles.stepBody}>
                Based on your financial history, Ka-Ching! evaluates three predefined budget allocation options and suggests a suitable starting
                point.
              </Text>
            </View>

            <View style={styles.stepItemBox}>
              <Text style={styles.stepTitle}>03. Personalise your budget</Text>
              <Text style={styles.stepBody}>
                Select another allocation or customise your spending limit and savings goal according to your needs.
              </Text>
            </View>

            <Text style={styles.sectionDividerTitle}>UNDERSTANDING THE THREE ALLOCATIONS</Text>

            {BUDGET_PRESETS.map((p) => (
              <View key={p.id} style={styles.modalPresetBox}>
                <View style={styles.modalPresetTop}>
                  <Text style={styles.modalPresetName}>
                    {p.name} ({p.ratioLabel})
                  </Text>
                </View>
                <Text style={styles.modalPresetDesc}>{p.desc}</Text>
              </View>
            ))}

            <View style={styles.goodToKnowBox}>
              <Text style={styles.goodToKnowTitle}>Good to know</Text>
              <Text style={styles.goodToKnowBody}>
                The three ratios are budgeting starting points, not fixed financial rules. You can adjust your allocation at any time.
              </Text>
            </View>
          </ScrollView>

          <WireButton label="GOT IT" onPress={onClose} style={{ marginTop: 12 }} />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = () =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: COLORS.card,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      padding: 16,
    },
    modalHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 10,
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 11.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modalSubTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      fontWeight: "bold",
      color: COLORS.primary,
      marginTop: 2,
    },
    modalIntroText: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      lineHeight: 13,
      marginBottom: 10,
    },
    stepItemBox: {
      borderLeftWidth: 2,
      borderColor: COLORS.primary,
      paddingLeft: 8,
      marginBottom: 8,
    },
    stepTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
    stepBody: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
      marginTop: 2,
    },
    sectionDividerTitle: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 6,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    modalPresetBox: {
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      padding: 9,
      marginBottom: 8,
    },
    modalPresetTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    modalPresetName: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modalPresetDesc: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
    },
    goodToKnowBox: {
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.secondary,
      padding: 9,
      marginTop: 2,
    },
    goodToKnowTitle: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 2,
    },
    goodToKnowBody: {
      fontFamily: FONTS.mono,
      fontSize: 8,
      color: COLORS.textMuted,
      lineHeight: 12,
    },
  });
