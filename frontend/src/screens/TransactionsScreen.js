// Import React hooks, native UI components including virtualized FlatList, and Lucide icons
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { Search, X, Pencil, Trash2, AlertTriangle, Check, ChevronDown, Filter, Calendar as CalendarIcon } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import { WireBox, WireInput, WireButton, WireChip, FloatingToast, useFloatingToast, CalendarPicker } from "../components/WireUI";
import { CATEGORY_CONFIG, EXPENSE_CATEGORY_KEYS, INCOME_CATEGORY_KEYS, CategoryBadge } from "../utils/categoryIcons";

// Number of records fetched per page for Lazy Loading
const PAGE_SIZE = 15;

// Helper function: Format ISO date into grouped headers ("Today — 27 Oct", "Yesterday — 26 Oct", etc.)
const formatDateGroupHeader = (isoDateString) => {
  const txDate = new Date(isoDateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const shortDate = txDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const fullDate = txDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  if (isSameDay(txDate, today)) return `Today — ${shortDate}`;
  if (isSameDay(txDate, yesterday)) return `Yesterday — ${shortDate}`;
  return fullDate;
};

// Helper function: Generate quick month filter options for the past 6 months
const getRecentMonthFilters = () => {
  const list = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    list.push({ id: `MONTH_${key}`, monthKey: key, label });
  }
  return list;
};

const RECENT_MONTHS = getRecentMonthFilters();

// Transaction History Screen (Supports FlatList lazy loading, multi-filters, edit with shared CalendarPicker & delete)
export default function TransactionsScreen({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Multi-dimensional filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("ALL");
  const [activeTimeFilter, setActiveTimeFilter] = useState("ALL");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("ALL");
  const [showCategoryFilterModal, setShowCategoryFilterModal] = useState(false);

  // Edit Transaction Modal states
  const [editingTx, setEditingTx] = useState(null);
  const [editType, setEditType] = useState("EXPENSE");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("FOOD_AND_BEVERAGE");
  const [editMerchant, setEditMerchant] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState(new Date());
  const [showEditCalendar, setShowEditCalendar] = useState(false);
  const [showEditCategoryList, setShowEditCategoryList] = useState(false);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Confirmation Modal states
  const [deletingTx, setDeletingTx] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Global floating toast hook
  const { toast, slideAnim, showToast } = useFloatingToast();

  useEffect(() => {
    fetchTransactionsPage(1, true);
  }, [activeType, activeTimeFilter, activeCategoryFilter, searchQuery]);

  const fetchTransactionsPage = async (targetPage = 1, replace = false) => {
    try {
      if (replace) {
        setLoadingInitial(true);
      } else {
        setLoadingMore(true);
      }

      let periodParam = "ALL";
      let monthKeyParam = "";
      if (activeTimeFilter.startsWith("MONTH_")) {
        monthKeyParam = activeTimeFilter.replace("MONTH_", "");
      } else {
        periodParam = activeTimeFilter;
      }

      const response = await apiClient.get(`/transactions/${user.id}`, {
        params: {
          page: targetPage,
          limit: PAGE_SIZE,
          type: activeType,
          category: activeCategoryFilter,
          search: searchQuery,
          period: periodParam,
          monthKey: monthKeyParam,
        },
      });

      const fetchedItems = response.data?.data || [];
      const moreAvailable = Boolean(response.data?.hasMore);
      const totalMatched = response.data?.totalCount ?? fetchedItems.length;

      setTransactions((prev) => (replace ? fetchedItems : [...prev, ...fetchedItems]));
      setPage(targetPage);
      setHasMore(moreAvailable);
      setTotalCount(totalMatched);
    } catch (error) {
      console.log("Failed to load paginated transactions:", error.message);
    } finally {
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingInitial && !loadingMore && hasMore) {
      fetchTransactionsPage(page + 1, false);
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setActiveType("ALL");
    setActiveTimeFilter("ALL");
    setActiveCategoryFilter("ALL");
  };

  // Open Edit Modal and pre-populate all fields including the transaction's existing date
  const handleOpenEditModal = (tx) => {
    const existingDate = tx.date ? new Date(tx.date) : new Date();
    setEditingTx(tx);
    setEditType(tx.type);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category);
    setEditMerchant(tx.merchantName || tx.merchant || "");
    setEditDescription(tx.description || "");
    setEditDate(existingDate);
    setShowEditCalendar(false);
    setShowEditCategoryList(false);
    setEditError("");
  };

  const handleEditAmountChange = (rawText) => {
    setEditError("");
    if (/[^0-9.]/.test(rawText)) return;
    const parts = rawText.split(".");
    if (parts.length > 2) return;
    if (parts.length === 2 && parts[1].length > 2) return;
    setEditAmount(rawText);
  };

  // Submit updated transaction (including updated date) to backend PUT /api/transactions/:id
  const handleSaveEdit = async () => {
    setEditError("");
    const parsedAmt = parseFloat(editAmount);

    if (!editAmount || isNaN(parsedAmt) || parsedAmt <= 0) {
      setEditError("Please enter a valid amount greater than RM 0.00.");
      return;
    }
    if (!editMerchant.trim()) {
      setEditError("Merchant / Payee name cannot be empty.");
      return;
    }

    try {
      setSavingEdit(true);
      await apiClient.put(`/transactions/${editingTx._id}`, {
        amount: Number(parsedAmt.toFixed(2)),
        type: editType,
        category: editCategory,
        merchantName: editMerchant.trim(),
        description: editDescription.trim() ? editDescription.trim() : null,
        date: editDate.toISOString(),
      });

      setEditingTx(null);
      showToast("success", "Transaction updated successfully!");
      fetchTransactionsPage(1, true);
    } catch (error) {
      setEditError(error.response?.data?.message || "Failed to update transaction.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    try {
      setDeletingLoading(true);
      await apiClient.delete(`/transactions/${deletingTx._id}`);
      setDeletingTx(null);
      showToast("success", "Transaction deleted.");
      fetchTransactionsPage(1, true);
    } catch (error) {
      console.log("Failed to delete transaction:", error.message);
      showToast("error", "Failed to delete transaction.");
    } finally {
      setDeletingLoading(false);
    }
  };

  const renderTransactionItem = ({ item: tx, index }) => {
    const currentHeader = formatDateGroupHeader(tx.date);
    const prevHeader = index > 0 ? formatDateGroupHeader(transactions[index - 1].date) : null;
    const showDateHeader = index === 0 || currentHeader !== prevHeader;

    const isIncome = tx.type === "INCOME";
    const cfg = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.OTHER_EXPENSE;

    return (
      <View style={styles.itemWrapper}>
        {showDateHeader && (
          <View style={styles.dateHeaderRow}>
            <CalendarIcon size={11} color={COLORS.textMuted} strokeWidth={2.2} />
            <Text style={styles.dateHeaderText}>{currentHeader}</Text>
          </View>
        )}

        <WireBox style={styles.txCardRow}>
          <CategoryBadge category={tx.category} size={36} iconSize={17} />

          <View style={styles.txInfoCol}>
            <Text style={styles.txMerchantText} numberOfLines={1}>
              {tx.merchantName || tx.merchant || "General"}
            </Text>
            <Text style={styles.txCategoryText} numberOfLines={1}>
              {cfg.label}
              {tx.description ? ` • ${tx.description}` : ""}
            </Text>
          </View>

          <Text style={[styles.txAmountText, { color: isIncome ? "#16A34A" : "#E11D48" }]}>
            {isIncome ? "+" : "-"}RM {Number(tx.amount).toFixed(2)}
          </Text>

          <View style={styles.actionBtnsGroup}>
            <TouchableOpacity style={styles.iconActionBtn} onPress={() => handleOpenEditModal(tx)} activeOpacity={0.7}>
              <Pencil size={13} color={COLORS.text} strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.iconActionBtn, styles.deleteActionBtn]} onPress={() => setDeletingTx(tx)} activeOpacity={0.7}>
              <Trash2 size={13} color={COLORS.danger} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </WireBox>
      </View>
    );
  };

  const allCategoryKeys = [...EXPENSE_CATEGORY_KEYS, ...INCOME_CATEGORY_KEYS];
  const editCategoryKeys = editType === "EXPENSE" ? EXPENSE_CATEGORY_KEYS : INCOME_CATEGORY_KEYS;
  const currentEditCatConfig = CATEGORY_CONFIG[editCategory] || CATEGORY_CONFIG.OTHER_EXPENSE;
  const isAnyFilterActive = searchQuery !== "" || activeType !== "ALL" || activeTimeFilter !== "ALL" || activeCategoryFilter !== "ALL";

  return (
    <View style={styles.screenWrapper}>
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      {/* Top Multi-Dimensional Filter Control Panel */}
      <View style={styles.topControlsSection}>
        <View style={styles.searchAndCatRow}>
          <View style={styles.searchBarBox}>
            <Search size={15} color={COLORS.textMuted} strokeWidth={2.5} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search merchant or note..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 2 }}>
                <X size={15} color={COLORS.textMuted} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.catFilterBtn, activeCategoryFilter !== "ALL" && styles.catFilterBtnActive]}
            onPress={() => setShowCategoryFilterModal(true)}
          >
            <Filter size={14} color={activeCategoryFilter !== "ALL" ? COLORS.primaryText : COLORS.text} strokeWidth={2.3} />
            <Text style={[styles.catFilterBtnText, activeCategoryFilter !== "ALL" && { color: COLORS.primaryText }]} numberOfLines={1}>
              {activeCategoryFilter === "ALL" ? "Category" : CATEGORY_CONFIG[activeCategoryFilter]?.label || "Filtered"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeFilterScroll}>
          {[
            { id: "ALL", label: "All Time" },
            { id: "TODAY", label: "Today" },
            { id: "THIS_WEEK", label: "Last 7 Days" },
            ...RECENT_MONTHS,
            { id: "THIS_YEAR", label: "This Year" },
          ].map((tItem) => {
            const isSelected = activeTimeFilter === tItem.id;
            return (
              <TouchableOpacity
                key={tItem.id}
                style={[styles.timeChip, isSelected && styles.timeChipActive]}
                onPress={() => setActiveTimeFilter(tItem.id)}
              >
                <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>{tItem.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.filterChipsRow}>
          <View style={{ flexDirection: "row" }}>
            {["ALL", "EXPENSE", "INCOME"].map((filterKey) => (
              <WireChip key={filterKey} label={filterKey} active={activeType === filterKey} onPress={() => setActiveType(filterKey)} />
            ))}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isAnyFilterActive && (
              <TouchableOpacity onPress={handleClearAllFilters}>
                <Text style={styles.resetFiltersLink}>Reset</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.recordCountText}>
              Showing {transactions.length} of {totalCount}
            </Text>
          </View>
        </View>
      </View>

      {/* Virtualized FlatList */}
      {loadingInitial ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listScrollContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <WireBox style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Matching Transactions</Text>
              <Text style={styles.emptySubtitle}>
                {isAnyFilterActive
                  ? 'No records match your current filters. Tap "Reset" above to view all records.'
                  : 'You have not recorded any transactions yet. Tap "+" below to add your first entry.'}
              </Text>
            </WireBox>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoaderBox}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.footerLoaderText}>Loading more records...</Text>
              </View>
            ) : hasMore ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
                <Text style={styles.loadMoreBtnText}>
                  LOAD MORE ({transactions.length} / {totalCount})
                </Text>
              </TouchableOpacity>
            ) : transactions.length > 0 ? (
              <Text style={styles.endOfListText}>— End of transaction history ({totalCount} total) —</Text>
            ) : null
          }
        />
      )}

      {/* Modal 1: Category Filter Modal */}
      <Modal visible={showCategoryFilterModal} transparent={true} animationType="fade" onRequestClose={() => setShowCategoryFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>FILTER BY CATEGORY</Text>
              <TouchableOpacity onPress={() => setShowCategoryFilterModal(false)}>
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.allCatOptionBtn, activeCategoryFilter === "ALL" && styles.editCatOptionSelected]}
              onPress={() => {
                setActiveCategoryFilter("ALL");
                setShowCategoryFilterModal(false);
              }}
            >
              <Text style={styles.allCatOptionText}>All Categories (Show Everything)</Text>
              {activeCategoryFilter === "ALL" && <Check size={14} color={COLORS.primary} strokeWidth={3} />}
            </TouchableOpacity>

            <View style={styles.editCatGrid}>
              {allCategoryKeys.map((catKey) => {
                const cfg = CATEGORY_CONFIG[catKey];
                const isSelected = activeCategoryFilter === catKey;
                return (
                  <TouchableOpacity
                    key={catKey}
                    style={[styles.editCatOption, isSelected && styles.editCatOptionSelected]}
                    onPress={() => {
                      setActiveCategoryFilter(catKey);
                      setShowCategoryFilterModal(false);
                    }}
                  >
                    <CategoryBadge category={catKey} size={26} iconSize={13} />
                    <Text style={styles.editCatOptionText} numberOfLines={1}>
                      {cfg.label}
                    </Text>
                    {isSelected && <Check size={12} color={COLORS.primary} strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Edit Transaction Modal (Uses shared CalendarPicker from WireUI.js) */}
      <Modal visible={!!editingTx} transparent={true} animationType="fade" onRequestClose={() => setEditingTx(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "90%" }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>EDIT TRANSACTION</Text>
              <TouchableOpacity onPress={() => setEditingTx(null)}>
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {editError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{editError}</Text>
                </View>
              ) : null}

              <View style={styles.editTypeRow}>
                <TouchableOpacity
                  style={[styles.editTypeBtn, editType === "EXPENSE" && styles.editTypeBtnActive]}
                  onPress={() => {
                    setEditType("EXPENSE");
                    setEditCategory("FOOD_AND_BEVERAGE");
                    setShowEditCategoryList(false);
                  }}
                >
                  <Text style={[styles.editTypeBtnText, editType === "EXPENSE" && styles.editTypeBtnTextActive]}>EXPENSE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editTypeBtn, editType === "INCOME" && styles.editTypeBtnActive]}
                  onPress={() => {
                    setEditType("INCOME");
                    setEditCategory("SALARY");
                    setShowEditCategoryList(false);
                  }}
                >
                  <Text style={[styles.editTypeBtnText, editType === "INCOME" && styles.editTypeBtnTextActive]}>INCOME</Text>
                </TouchableOpacity>
              </View>

              <WireInput label="Amount (RM)" placeholder="0.00" keyboardType="decimal-pad" value={editAmount} onChangeText={handleEditAmountChange} />

              {/* Category Selector */}
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <TouchableOpacity
                  style={styles.editCategoryTrigger}
                  onPress={() => {
                    setShowEditCategoryList(!showEditCategoryList);
                    setShowEditCalendar(false);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <CategoryBadge category={editCategory} size={30} iconSize={15} />
                    <Text style={styles.editCategoryTriggerText}>{currentEditCatConfig.label}</Text>
                  </View>
                  <ChevronDown size={15} color={COLORS.textMuted} strokeWidth={2.5} />
                </TouchableOpacity>

                {showEditCategoryList && (
                  <View style={styles.editCatGrid}>
                    {editCategoryKeys.map((catKey) => {
                      const cfg = CATEGORY_CONFIG[catKey];
                      const isSelected = editCategory === catKey;
                      return (
                        <TouchableOpacity
                          key={catKey}
                          style={[styles.editCatOption, isSelected && styles.editCatOptionSelected]}
                          onPress={() => {
                            setEditCategory(catKey);
                            setShowEditCategoryList(false);
                          }}
                        >
                          <CategoryBadge category={catKey} size={26} iconSize={13} />
                          <Text style={styles.editCatOptionText} numberOfLines={1}>
                            {cfg.label}
                          </Text>
                          {isSelected && <Check size={12} color={COLORS.primary} strokeWidth={3} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Date Selector using shared CalendarPicker from WireUI.js */}
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.fieldLabel}>DATE</Text>
                <TouchableOpacity
                  style={styles.editCategoryTrigger}
                  onPress={() => {
                    setShowEditCalendar(!showEditCalendar);
                    setShowEditCategoryList(false);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={styles.editCalIconBox}>
                      <CalendarIcon size={15} color={COLORS.primary} strokeWidth={2.2} />
                    </View>
                    <View>
                      <Text style={styles.editCategoryTriggerText}>
                        {editDate.toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                      <Text style={styles.editDateHintText}>{showEditCalendar ? "Tap a day below to change" : "Tap to open calendar"}</Text>
                    </View>
                  </View>
                  <ChevronDown size={15} color={COLORS.textMuted} strokeWidth={2.5} />
                </TouchableOpacity>

                {showEditCalendar && (
                  <CalendarPicker
                    selectedDate={editDate}
                    onSelectDate={(picked) => {
                      setEditDate(picked);
                      setShowEditCalendar(false);
                    }}
                    style={styles.inlineCalendarBox}
                  />
                )}
              </View>

              <WireInput label="Merchant / Payee" placeholder="e.g. Starbucks" value={editMerchant} onChangeText={setEditMerchant} />

              <WireInput label="Description (Optional)" placeholder="Add a note..." value={editDescription} onChangeText={setEditDescription} />
            </ScrollView>

            <View style={styles.modalFooterBtns}>
              <View style={{ flex: 1 }}>
                <WireButton label="CANCEL" variant="outline" onPress={() => setEditingTx(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <WireButton label={savingEdit ? "SAVING..." : "SAVE CHANGES"} variant="filled" onPress={handleSaveEdit} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Delete Confirmation Modal */}
      <Modal visible={!!deletingTx} transparent={true} animationType="fade" onRequestClose={() => setDeletingTx(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.deleteWarningHeader}>
              <View style={styles.warningIconBox}>
                <AlertTriangle size={20} color={COLORS.danger} strokeWidth={2.5} />
              </View>
              <Text style={styles.modalTitle}>DELETE TRANSACTION?</Text>
            </View>

            {deletingTx && (
              <Text style={styles.deleteConfirmText}>
                Are you sure you want to permanently delete{" "}
                <Text style={{ fontWeight: "bold", color: COLORS.text }}>
                  {deletingTx.merchantName || deletingTx.merchant} (RM {Number(deletingTx.amount).toFixed(2)})
                </Text>
                ? This action will also update your balance and spending forecast.
              </Text>
            )}

            <View style={styles.modalFooterBtns}>
              <View style={{ flex: 1 }}>
                <WireButton label="CANCEL" variant="outline" onPress={() => setDeletingTx(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity style={styles.confirmDeleteBtn} onPress={handleConfirmDelete} disabled={deletingLoading}>
                  <Text style={styles.confirmDeleteBtnText}>{deletingLoading ? "DELETING..." : "DELETE"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: "relative",
  },
  topControlsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.borderMuted,
  },
  searchAndCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  searchBarBox: {
    flex: 1,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.text,
    padding: 0,
  },
  catFilterBtn: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: 125,
  },
  catFilterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  catFilterBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
  },
  timeFilterScroll: {
    paddingBottom: 8,
    gap: 6,
  },
  timeChip: {
    borderWidth: 1.5,
    borderColor: COLORS.borderMuted,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  timeChipActive: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.secondary,
  },
  timeChipText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  timeChipTextActive: {
    color: COLORS.text,
    fontWeight: "bold",
  },
  filterChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resetFiltersLink: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.danger,
    textDecorationLine: "underline",
  },
  recordCountText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  listScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  itemWrapper: {
    marginBottom: 8,
  },
  dateHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderBottomWidth: 1.5,
    borderColor: COLORS.borderMuted,
    borderStyle: "dashed",
    paddingBottom: 4,
    marginTop: 6,
    marginBottom: 6,
  },
  dateHeaderText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  txCardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  txInfoCol: {
    flex: 1,
  },
  txMerchantText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
  },
  txCategoryText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  txAmountText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    marginRight: 2,
  },
  actionBtnsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteActionBtn: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerBg,
  },
  footerLoaderBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  footerLoaderText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  loadMoreBtn: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.buttonRadius,
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  loadMoreBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: 1,
  },
  endOfListText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  emptyCard: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 12,
  },
  emptyTitle: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.cardRadius,
    backgroundColor: COLORS.card,
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
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.text,
    letterSpacing: 1,
  },
  allCatOptionBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  allCatOptionText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.text,
  },
  errorBanner: {
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.dangerBg,
    padding: 8,
    marginBottom: 10,
  },
  errorBannerText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.danger,
  },
  editTypeRow: {
    flexDirection: "row",
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.buttonRadius,
    overflow: "hidden",
    marginBottom: 12,
  },
  editTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: COLORS.card,
  },
  editTypeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  editTypeBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.textMuted,
  },
  editTypeBtnTextActive: {
    color: COLORS.primaryText,
  },
  fieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
    letterSpacing: 1,
  },
  editCategoryTrigger: {
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editCategoryTriggerText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.text,
  },
  editDateHintText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  editCalIconBox: {
    width: 30,
    height: 30,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineCalendarBox: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SHAPES.inputRadius,
    backgroundColor: COLORS.card,
    padding: 10,
  },
  editCatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 6,
  },
  editCatOption: {
    width: "48.5%",
    borderWidth: 1.5,
    borderColor: COLORS.borderMuted,
    borderRadius: SHAPES.chipRadius,
    backgroundColor: COLORS.card,
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editCatOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
  },
  editCatOptionText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
  modalFooterBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  deleteWarningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  warningIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteConfirmText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  confirmDeleteBtn: {
    width: "100%",
    borderWidth: SHAPES.borderWidth,
    borderColor: COLORS.border,
    borderRadius: SHAPES.buttonRadius,
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDeleteBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
});
