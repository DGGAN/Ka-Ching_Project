/**
 * @file frontend/src/features/transactions/components/EditTransactionModal.js
 * @layer Component (Modal UI — 100% Original Modals 2, 3, 4, 5 & 6)
 * @description Renders Modal 2 (Transaction Detail), Modal 3 (Edit Transaction), Modal 4 (Standalone CalendarModal), Modal 5 (2-Col Edit Category), and Modal 6 (Delete Confirmation).
 * @exports default EditTransactionModal
 */

import React from "react";
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { X, Tag, Calendar, FileText, Trash2, Edit3, ChevronDown, Check, AlertTriangle } from "lucide-react-native";
import { COLORS, SHAPES, FONTS } from "../../../theme/colors";
import { EXPENSE_CATEGORY_KEYS, INCOME_CATEGORY_KEYS, getCategoryMeta } from "../../../utils/categoryConfig";
import { formatDateYMD } from "../../../utils/dateHelpers";
import { playUiSound } from "../../../utils/soundEffects";
import WireButton from "../../../components/shared/WireButton";
import CategoryBadge from "../../../components/shared/CategoryBadge";
import CalendarModal from "../../../components/shared/CalendarModal";

export default function EditTransactionModal({
  detailTx,
  onCloseDetail,
  onRequestDelete,
  onOpenEditModal,
  editingTx,
  onCloseEdit,
  editMerchant,
  onChangeEditMerchant,
  editAmount,
  onChangeEditAmount,
  editCategory,
  onChangeEditCategory,
  editDate,
  onChangeEditDate,
  editDescription,
  onChangeEditDescription,
  showEditCalendar,
  onToggleEditCalendar,
  showEditCategoryModal,
  onToggleEditCategoryModal,
  isUpdating = false,
  onSaveEdit,
  deleteTarget,
  onCloseDeleteConfirm,
  isDeleting = false,
  onConfirmDelete,
}) {
  const styles = getStyles();

  const editCategoryList = editingTx?.type === "INCOME" ? INCOME_CATEGORY_KEYS : EXPENSE_CATEGORY_KEYS;
  const activeEditCatConfig = getCategoryMeta(editCategory);

  return (
    <>
      {/* Modal 2: Transaction Detail Inspection Modal */}
      <Modal
        visible={!!detailTx}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          playUiSound("pop");
          if (onCloseDetail) onCloseDetail();
        }}
      >
        <View style={styles.modalOverlay}>
          {detailTx && (
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>TRANSACTION DETAILS</Text>
                <TouchableOpacity
                  onPress={() => {
                    playUiSound("pop");
                    if (onCloseDetail) onCloseDetail();
                  }}
                >
                  <X size={18} color={COLORS.text} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailHeroBox}>
                <CategoryBadge category={detailTx.category} size={48} iconSize={24} />
                <Text style={styles.detailMerchantTitle}>{detailTx.merchantName || detailTx.merchant || "General"}</Text>
                <Text
                  style={[
                    styles.detailBigAmount,
                    {
                      color: detailTx.type === "INCOME" ? "#16A34A" : "#E11D48",
                    },
                  ]}
                >
                  {detailTx.type === "INCOME" ? "+" : "-"}RM {Number(detailTx.amount).toFixed(2)}
                </Text>
              </View>

              <View style={styles.detailMetaBox}>
                <View style={styles.detailMetaRow}>
                  <View style={styles.detailMetaLabelGroup}>
                    <Tag size={13} color={COLORS.textMuted} />
                    <Text style={styles.detailMetaLabel}>Category</Text>
                  </View>
                  <Text style={styles.detailMetaValue}>{getCategoryMeta(detailTx.category).name || getCategoryMeta(detailTx.category).label}</Text>
                </View>

                <View style={styles.detailMetaRow}>
                  <View style={styles.detailMetaLabelGroup}>
                    <Calendar size={13} color={COLORS.textMuted} />
                    <Text style={styles.detailMetaLabel}>Date</Text>
                  </View>
                  <Text style={styles.detailMetaValue}>
                    {detailTx.date
                      ? new Date(detailTx.date).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </Text>
                </View>

                <View style={styles.detailMetaRow}>
                  <View style={styles.detailMetaLabelGroup}>
                    <FileText size={13} color={COLORS.textMuted} />
                    <Text style={styles.detailMetaLabel}>Notes / Remarks</Text>
                  </View>
                  <Text style={styles.detailMetaValue}>{detailTx.description || "No additional notes"}</Text>
                </View>
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.detailDeleteBtn}
                  onPress={() => {
                    playUiSound("pop");
                    if (onRequestDelete) onRequestDelete(detailTx);
                  }}
                >
                  <Trash2 size={14} color={COLORS.danger} strokeWidth={2.2} />
                  <Text style={styles.detailDeleteBtnText}>DELETE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailEditBtn}
                  onPress={() => {
                    playUiSound("pop");
                    if (onOpenEditModal) onOpenEditModal(detailTx);
                  }}
                >
                  <Edit3 size={14} color={COLORS.primaryText} strokeWidth={2.2} />
                  <Text style={styles.detailEditBtnText}>EDIT RECORD</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal 3: Edit Transaction Modal */}
      <Modal
        visible={!!editingTx}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          playUiSound("pop");
          if (onCloseEdit) onCloseEdit();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>EDIT TRANSACTION</Text>
              <TouchableOpacity
                onPress={() => {
                  playUiSound("pop");
                  if (onCloseEdit) onCloseEdit();
                }}
              >
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>MERCHANT / TITLE</Text>
              <TextInput
                style={styles.modalInput}
                value={editMerchant}
                onChangeText={onChangeEditMerchant}
                placeholder="e.g. FamilyMart"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.modalLabel}>AMOUNT (RM)</Text>
              <TextInput
                style={styles.modalInput}
                value={editAmount}
                onChangeText={onChangeEditAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
              />

              {/* Date Field Trigger -> Opens Standalone Popup CalendarModal */}
              <Text style={styles.modalLabel}>TRANSACTION DATE</Text>
              <TouchableOpacity
                style={styles.modalCategoryBtn}
                onPress={() => {
                  playUiSound("pop");
                  if (onToggleEditCalendar) onToggleEditCalendar(true);
                }}
              >
                <Calendar size={16} color={COLORS.primary} strokeWidth={2.2} />
                <Text style={[styles.modalCategoryBtnText, { flex: 1 }]}>{formatDateYMD(editDate)}</Text>
                <ChevronDown size={15} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.modalLabel}>CATEGORY</Text>
              <TouchableOpacity
                style={styles.modalCategoryBtn}
                onPress={() => {
                  playUiSound("pop");
                  if (onToggleEditCategoryModal) onToggleEditCategoryModal(true);
                }}
              >
                <CategoryBadge category={editCategory} size={28} iconSize={14} />
                <Text style={[styles.modalCategoryBtnText, { flex: 1 }]}>{activeEditCatConfig.name || activeEditCatConfig.label}</Text>
                <ChevronDown size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.modalLabel}>NOTES / DESCRIPTION</Text>
              <TextInput
                style={styles.modalInput}
                value={editDescription}
                onChangeText={onChangeEditDescription}
                placeholder="Optional remarks"
                placeholderTextColor={COLORS.textMuted}
              />
            </ScrollView>

            <View style={[styles.modalActionsRow, { marginTop: 10 }]}>
              <WireButton
                label="CANCEL"
                variant="outline"
                onPress={() => {
                  playUiSound("pop");
                  if (onCloseEdit) onCloseEdit();
                }}
                style={{ flex: 1 }}
              />
              {isUpdating ? (
                <View style={{ flex: 1, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : (
                <WireButton label="SAVE CHANGES" onPress={onSaveEdit} style={{ flex: 1 }} />
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 4: Standalone Popup CalendarModal for Editing Transaction Date */}
      <CalendarModal
        visible={showEditCalendar}
        selectedDate={editDate}
        onSelectDate={(pickedDate) => {
          playUiSound("pop");
          if (onChangeEditDate) onChangeEditDate(pickedDate);
        }}
        onClose={() => {
          playUiSound("pop");
          if (onToggleEditCalendar) onToggleEditCalendar(false);
        }}
      />

      {/* Modal 5: 2-Column Category Selection Modal inside Edit Mode */}
      <Modal
        visible={showEditCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          playUiSound("pop");
          if (onToggleEditCategoryModal) onToggleEditCategoryModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT NEW CATEGORY</Text>
              <TouchableOpacity
                onPress={() => {
                  playUiSound("pop");
                  if (onToggleEditCategoryModal) onToggleEditCategoryModal(false);
                }}
              >
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              <View style={styles.catTwoColGrid}>
                {editCategoryList.map((catKey) => {
                  const cfg = getCategoryMeta(catKey);
                  const isSelected = editCategory === catKey;
                  return (
                    <TouchableOpacity
                      key={catKey}
                      style={[styles.catGridCell, isSelected && styles.catOptionItemActive]}
                      onPress={() => {
                        playUiSound("pop");
                        if (onChangeEditCategory) onChangeEditCategory(catKey);
                        if (onToggleEditCategoryModal) onToggleEditCategoryModal(false);
                      }}
                    >
                      <CategoryBadge category={catKey} size={24} iconSize={12} />
                      <Text style={[styles.catGridLabel, isSelected && { fontWeight: "bold" }]} numberOfLines={2}>
                        {cfg.name || cfg.label}
                      </Text>
                      {isSelected && <Check size={13} color={COLORS.primary} strokeWidth={2.8} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 6: Delete Confirmation Modal */}
      <Modal
        visible={!!deleteTarget}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          playUiSound("pop");
          if (onCloseDeleteConfirm) onCloseDeleteConfirm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.deleteIconHeader}>
              <View style={styles.dangerCircle}>
                <AlertTriangle size={22} color={COLORS.danger} strokeWidth={2.5} />
              </View>
              <Text style={styles.deleteConfirmTitle}>DELETE TRANSACTION?</Text>
              <Text style={styles.deleteConfirmSub}>
                Are you sure you want to permanently remove{" "}
                <Text style={{ fontWeight: "bold", color: COLORS.text }}>"{deleteTarget?.merchantName || "this record"}"</Text> (RM{" "}
                {Number(deleteTarget?.amount || 0).toFixed(2)})?
              </Text>
            </View>

            <View style={styles.modalActionsRow}>
              <WireButton
                label="CANCEL"
                variant="outline"
                onPress={() => {
                  playUiSound("pop");
                  if (onCloseDeleteConfirm) onCloseDeleteConfirm();
                }}
                style={{ flex: 1 }}
              />
              {isDeleting ? (
                <View style={{ flex: 1, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={COLORS.danger} />
                </View>
              ) : (
                <TouchableOpacity style={styles.confirmDeleteBtn} onPress={onConfirmDelete}>
                  <Trash2 size={14} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.confirmDeleteBtnText}>YES, DELETE</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const getStyles = () =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 365,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.cardRadius,
      backgroundColor: COLORS.card,
      padding: 16,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      paddingBottom: 10,
      marginBottom: 12,
    },
    modalTitle: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      letterSpacing: 1,
    },
    detailHeroBox: {
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: COLORS.borderMuted,
      marginBottom: 12,
    },
    detailMerchantTitle: {
      fontFamily: FONTS.mono,
      fontSize: 15,
      fontWeight: "bold",
      color: COLORS.text,
      marginTop: 8,
    },
    detailBigAmount: {
      fontFamily: FONTS.mono,
      fontSize: 22,
      fontWeight: "bold",
      marginTop: 4,
    },
    detailMetaBox: {
      gap: 10,
      marginBottom: 16,
    },
    detailMetaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    detailMetaLabelGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    detailMetaLabel: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.textMuted,
    },
    detailMetaValue: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
      maxWidth: "58%",
      textAlign: "right",
    },
    detailDeleteBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: COLORS.danger,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.dangerBg,
      paddingVertical: 11,
    },
    detailDeleteBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.danger,
    },
    detailEditBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      backgroundColor: COLORS.primary,
      paddingVertical: 11,
    },
    detailEditBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.primaryText,
    },
    modalLabel: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 4,
    },
    modalInput: {
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontFamily: FONTS.mono,
      fontSize: 12,
      color: COLORS.text,
      marginBottom: 10,
    },
    modalCategoryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.inputBg,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 10,
    },
    modalCategoryBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: COLORS.text,
    },
    modalActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    catTwoColGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 6,
    },
    catGridCell: {
      width: "48.5%",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 8,
      borderRadius: SHAPES.inputRadius,
      borderWidth: 1.2,
      borderColor: COLORS.borderMuted,
      backgroundColor: COLORS.inputBg,
    },
    catGridLabel: {
      flex: 1,
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.text,
      lineHeight: 11,
    },
    catOptionItemActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.secondary,
    },
    deleteIconHeader: {
      alignItems: "center",
      marginBottom: 16,
    },
    dangerCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: COLORS.dangerBg,
      borderWidth: 1.5,
      borderColor: COLORS.danger,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    deleteConfirmTitle: {
      fontFamily: FONTS.mono,
      fontSize: 13,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 6,
    },
    deleteConfirmSub: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.textMuted,
      textAlign: "center",
      lineHeight: 15,
    },
    confirmDeleteBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: COLORS.danger,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.buttonRadius,
      paddingVertical: 12,
    },
    confirmDeleteBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 11,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
  });
