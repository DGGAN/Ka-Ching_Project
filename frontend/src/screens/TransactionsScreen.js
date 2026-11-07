// Import React hooks, native UI components, and Lucide vector icons
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, Modal, StyleSheet } from "react-native";
import { Search, Trash2, Edit3, X, ChevronRight, ChevronDown, AlertTriangle, Calendar, Tag, FileText, Check, Filter } from "lucide-react-native";
import apiClient from "../api/client";
import { COLORS, SHAPES, FONTS } from "../theme/theme";
import {
  WireBox,
  WireButton,
  FloatingToast,
  useFloatingToast,
  CalendarModal,
  formatDateYMD,
  getSixMonthWindow,
  playUiSound,
} from "../components/WireUI";
import { CATEGORY_CONFIG, EXPENSE_CATEGORY_KEYS, INCOME_CATEGORY_KEYS, CategoryBadge } from "../utils/categoryIcons";

const PAGE_LIMIT = 15;

// Helper to get current YYYY-MM key so screen defaults to Current Month on open
const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// Transaction History Screen (Merged Current-First Filter Bar + 2-Column Multi-Category Modal)
export default function TransactionsScreen({ user }) {
  const styles = getStyles();
  const currentMonthKey = getCurrentMonthKey();

  // 1. State management for paginated transactions, filters, and modals
  const [transactions, setTransactions] = useState([]);
  const [allDatesForWindow, setAllDatesForWindow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);

  // Unified filter states: timeFilter defaults to currentMonthKey (e.g. "2026-11")
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [timeFilter, setTimeFilter] = useState(currentMonthKey);

  // Modal visibility states
  const [showFilterCategoryModal, setShowFilterCategoryModal] = useState(false);
  const [detailTx, setDetailTx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal states
  const [editingTx, setEditingTx] = useState(null);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("FOOD_AND_BEVERAGE");
  const [editDate, setEditDate] = useState(new Date());
  const [editDescription, setEditDescription] = useState("");
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditCalendar, setShowEditCalendar] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { toast, slideAnim, showToast } = useFloatingToast();

  // 2. Fetch lightweight transaction dates once on mount to compute the smart 6-month window
  useEffect(() => {
    const loadMonthWindow = async () => {
      try {
        const res = await apiClient.get(`/transactions/${user.id}`);
        if (res.data?.data) {
          setAllDatesForWindow(res.data.data);
        }
      } catch (e) {
        console.log("Month window check error:", e.message);
      }
    };
    loadMonthWindow();
  }, []);

  // 3. Re-fetch Page 1 whenever any filter or search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactionsPage(1, true);
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedType, selectedCategories, timeFilter, searchQuery]);

  // 4. Fetch paginated transactions from GET /api/transactions/:userId
  const fetchTransactionsPage = async (pageToLoad = 1, isReset = false) => {
    try {
      if (isReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const categoryParam = selectedCategories.length === 0 ? "ALL" : selectedCategories.join(",");
      const isMonthKey = /^\d{4}-\d{2}$/.test(timeFilter);

      const response = await apiClient.get(`/transactions/${user.id}`, {
        params: {
          page: pageToLoad,
          limit: PAGE_LIMIT,
          type: selectedType,
          category: categoryParam,
          search: searchQuery,
          period: isMonthKey ? "ALL" : timeFilter,
          monthKey: isMonthKey ? timeFilter : undefined,
        },
      });

      const fetchedItems = response.data?.data || [];
      const moreAvailable = Boolean(response.data?.hasMore);
      const totalCount = response.data?.totalCount ?? fetchedItems.length;

      // Client-side multi-category safeguard
      const filteredClientItems =
        selectedCategories.length > 0 ? fetchedItems.filter((tx) => selectedCategories.includes(tx.category)) : fetchedItems;

      if (isReset) {
        setTransactions(filteredClientItems);
      } else {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((i) => i._id));
          const uniqueNew = filteredClientItems.filter((i) => !existingIds.has(i._id));
          return [...prev, ...uniqueNew];
        });
      }

      setCurrentPage(pageToLoad);
      setHasMorePages(moreAvailable);
      setTotalRecordsCount(totalCount);
    } catch (error) {
      showToast("error", "Could not load transactions.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 5. Load next page when user scrolls to the bottom of FlatList
  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMorePages) {
      fetchTransactionsPage(currentPage + 1, false);
    }
  };

  // Toggle a category inside the multi-select filter array
  const toggleCategoryFilter = (catKey) => {
    playUiSound("pop");
    setSelectedCategories((prev) => {
      if (prev.includes(catKey)) {
        return prev.filter((k) => k !== catKey);
      }
      return [...prev, catKey];
    });
  };

  // Reverse the smart 6-month window so Current Month is always first on the left!
  const dynamicMonthOptions = [...getSixMonthWindow(allDatesForWindow)].reverse();

  // 6. Group loaded transactions by calendar date for clean section headers
  const groupedSections = () => {
    const groups = {};
    transactions.forEach((tx) => {
      const dateStr = tx.date
        ? new Date(tx.date).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Recent";
      if (!groups[dateStr]) {
        groups[dateStr] = { dateStr, items: [], dayTotal: 0 };
      }
      groups[dateStr].items.push(tx);
      const amt = Number(tx.amount) || 0;
      groups[dateStr].dayTotal += tx.type === "INCOME" ? amt : -amt;
    });
    return Object.values(groups);
  };

  const sections = groupedSections();

  // 7. Delete Transaction handler
  const confirmDeleteTransaction = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await apiClient.delete(`/transactions/${deleteTarget._id}`);
      setTransactions((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setTotalRecordsCount((prev) => Math.max(0, prev - 1));
      setAllDatesForWindow((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
      setDetailTx(null);
      playUiSound("pop");
      showToast("success", "Transaction deleted.");
    } catch (error) {
      showToast("error", "Failed to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 8. Open Edit Modal and populate current values
  const openEditModal = (tx) => {
    playUiSound("pop");
    setDetailTx(null);
    setEditingTx(tx);
    setEditMerchant(tx.merchantName || tx.merchant || "");
    setEditAmount(String(tx.amount || ""));
    setEditCategory(tx.category || (tx.type === "INCOME" ? "SALARY" : "FOOD_AND_BEVERAGE"));
    const parsedDate = tx.date ? new Date(tx.date) : new Date();
    setEditDate(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
    setEditDescription(tx.description || "");
    setShowEditCalendar(false);
  };

  // 9. Save Updated Transaction (PUT /api/transactions/:id)
  const handleSaveEdit = async () => {
    if (!editingTx) return;

    const cleanMerchant = editMerchant.trim();
    if (!cleanMerchant) {
      showToast("error", "Merchant or title cannot be empty.");
      return;
    }

    const numericAmount = parseFloat(editAmount);
    if (!editAmount || isNaN(numericAmount) || numericAmount <= 0) {
      showToast("error", "Amount must be greater than RM 0.00.");
      return;
    }

    try {
      setIsUpdating(true);
      const isoDate = editDate instanceof Date && !isNaN(editDate.getTime()) ? editDate.toISOString() : new Date().toISOString();

      const res = await apiClient.put(`/transactions/${editingTx._id}`, {
        merchantName: cleanMerchant,
        amount: Number(numericAmount.toFixed(2)),
        category: editCategory,
        date: isoDate,
        description: editDescription.trim() || null,
      });

      const updatedDoc = res.data?.data || {
        ...editingTx,
        merchantName: cleanMerchant,
        amount: Number(numericAmount.toFixed(2)),
        category: editCategory,
        date: isoDate,
        description: editDescription.trim() || null,
      };

      setTransactions((prev) => prev.map((item) => (item._id === editingTx._id ? updatedDoc : item)));
      setEditingTx(null);
      playUiSound("success");
      showToast("success", "Transaction updated!");
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to update transaction.");
    } finally {
      setIsUpdating(false);
    }
  };

  const editCategoryList = editingTx?.type === "INCOME" ? INCOME_CATEGORY_KEYS : EXPENSE_CATEGORY_KEYS;
  const activeEditCatConfig = CATEGORY_CONFIG[editCategory] || CATEGORY_CONFIG.OTHER_EXPENSE;

  // Format top category button label
  const getCategoryTriggerLabel = () => {
    if (selectedCategories.length === 0) return "Category";
    if (selectedCategories.length === 1) {
      return CATEGORY_CONFIG[selectedCategories[0]]?.label || selectedCategories[0];
    }
    return `${selectedCategories.length} Selected`;
  };

  const hasCustomFilters = selectedType !== "ALL" || selectedCategories.length > 0 || timeFilter !== currentMonthKey || searchQuery !== "";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        position: "relative",
      }}
    >
      <FloatingToast toast={toast} slideAnim={slideAnim} />

      <View style={styles.topControlsContainer}>
        {/* 1. Search Input + Multi-Category Filter Button Row */}
        <View style={styles.searchAndCatRow}>
          <View style={styles.searchBar}>
            <Search size={15} color={COLORS.textMuted} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search merchant or notes..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={15} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.catDropdownBtn, selectedCategories.length > 0 && styles.catDropdownBtnActive]}
            onPress={() => {
              playUiSound("pop");
              setShowFilterCategoryModal(true);
            }}
          >
            <Filter size={13} color={selectedCategories.length > 0 ? COLORS.primaryText : COLORS.text} strokeWidth={2.2} />
            <Text style={[styles.catDropdownBtnText, selectedCategories.length > 0 && { color: COLORS.primaryText }]} numberOfLines={1}>
              {getCategoryTriggerLabel()}
            </Text>
            <ChevronDown size={13} color={selectedCategories.length > 0 ? COLORS.primaryText : COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* 2. Unified Single Time & Month Filter Row (Current Month First -> Past Months -> Quick Ranges) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {dynamicMonthOptions.map((m) => {
            const isSelected = timeFilter === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => {
                  playUiSound("pop");
                  setTimeFilter(m.key);
                }}
                style={[styles.periodChip, isSelected && styles.periodChipActive]}
              >
                <Text style={[styles.periodChipText, isSelected && styles.periodChipTextActive]}>{m.isCurrent ? `• ${m.label}` : m.label}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.verticalDivider} />

          {[
            { key: "ALL", label: "All Time" },
            { key: "TODAY", label: "Today" },
            { key: "THIS_WEEK", label: "This Week" },
          ].map((tf) => {
            const isSelected = timeFilter === tf.key;
            return (
              <TouchableOpacity
                key={tf.key}
                onPress={() => {
                  playUiSound("pop");
                  setTimeFilter(tf.key);
                }}
                style={[styles.periodChip, isSelected && styles.periodChipActive]}
              >
                <Text style={[styles.periodChipText, isSelected && styles.periodChipTextActive]}>{tf.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 3. Type Switcher (ALL / EXPENSE / INCOME) + Record Counter Row */}
        <View style={styles.typeAndCountBar}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {["ALL", "EXPENSE", "INCOME"].map((typeKey) => {
              const active = selectedType === typeKey;
              return (
                <TouchableOpacity
                  key={typeKey}
                  onPress={() => {
                    playUiSound("pop");
                    setSelectedType(typeKey);
                  }}
                  style={[styles.typeTab, active && styles.typeTabActive]}
                >
                  <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{typeKey}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.resultsCountText}>
              {transactions.length}/{totalRecordsCount}
            </Text>
            {hasCustomFilters && (
              <TouchableOpacity
                onPress={() => {
                  playUiSound("pop");
                  setSelectedType("ALL");
                  setSelectedCategories([]);
                  setTimeFilter(currentMonthKey);
                  setSearchQuery("");
                }}
              >
                <Text style={styles.resetFilterText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 4. Paginated Lazy-Loaded FlatList of Date-Grouped Sections */}
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 30 }} />
      ) : sections.length === 0 ? (
        <View style={{ paddingHorizontal: 16 }}>
          <WireBox style={{ alignItems: "center", paddingVertical: 28 }}>
            <Text style={styles.emptyTitle}>No Matching Transactions</Text>
            <Text style={styles.emptySub}>No records found for this filter. Tap "All Time" or "Reset" above to view all records.</Text>
          </WireBox>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(section) => section.dateStr}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item: group }) => (
            <View style={styles.dateGroupSection}>
              <View style={styles.dateHeaderRow}>
                <Text style={styles.dateHeaderText}>{group.dateStr}</Text>
                <Text
                  style={[
                    styles.dateTotalText,
                    {
                      color: group.dayTotal >= 0 ? "#15803D" : COLORS.textMuted,
                    },
                  ]}
                >
                  {group.dayTotal >= 0 ? "+" : "-"}RM {Math.abs(group.dayTotal).toFixed(2)}
                </Text>
              </View>

              {group.items.map((tx) => {
                const isIncome = tx.type === "INCOME";
                const cfg = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.OTHER_EXPENSE;

                return (
                  <TouchableOpacity key={tx._id} activeOpacity={0.75} onPress={() => setDetailTx(tx)}>
                    <WireBox style={styles.txRowCard}>
                      <CategoryBadge category={tx.category} size={38} iconSize={18} />

                      <View style={{ flex: 1 }}>
                        <View style={styles.merchantLine}>
                          <Text style={styles.txMerchant} numberOfLines={1}>
                            {tx.merchantName || tx.merchant || "General"}
                          </Text>
                          {tx.source === "OCR" && (
                            <View style={styles.ocrTag}>
                              <Text style={styles.ocrTagText}>OCR</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.txMeta} numberOfLines={1}>
                          {cfg.label}
                          {tx.description ? ` • ${tx.description}` : ""}
                        </Text>
                      </View>

                      <View style={styles.rightActionCol}>
                        <Text style={[styles.txAmount, { color: isIncome ? "#16A34A" : "#E11D48" }]}>
                          {isIncome ? "+" : "-"}RM {Number(tx.amount).toFixed(2)}
                        </Text>
                        <ChevronRight size={14} color={COLORS.textMuted} />
                      </View>
                    </WireBox>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 14, alignItems: "center" }}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingMoreText}>Loading more records...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Modal 1: 2-Column Multi-Select Category Filter Popup (Grouped by EXPENSE & INCOME) */}
      <Modal visible={showFilterCategoryModal} transparent={true} animationType="fade" onRequestClose={() => setShowFilterCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>FILTER BY CATEGORY</Text>
                <Text style={styles.modalSubHint}>Tap to select one or multiple categories</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilterCategoryModal(false)}>
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 390 }} showsVerticalScrollIndicator={false}>
              {/* All Categories Reset Banner */}
              <TouchableOpacity
                style={[styles.allCatFullBtn, selectedCategories.length === 0 && styles.catOptionItemActive]}
                onPress={() => {
                  playUiSound("pop");
                  setSelectedCategories([]);
                }}
              >
                <Text style={[styles.catOptionLabel, { flex: 1 }, selectedCategories.length === 0 && { fontWeight: "bold" }]}>
                  ALL CATEGORIES (SHOW ALL)
                </Text>
                {selectedCategories.length === 0 && <Check size={15} color={COLORS.primary} strokeWidth={2.5} />}
              </TouchableOpacity>

              {/* Section 1: EXPENSE CATEGORIES (2-Column Grid) */}
              <View style={styles.catGroupHeaderRow}>
                <Text style={styles.catGroupHeaderText}>EXPENSES (10)</Text>
                <View style={styles.catGroupTypeBadgeExpense}>
                  <Text style={styles.catGroupTypeBadgeTextExpense}>EXPENSE</Text>
                </View>
              </View>

              <View style={styles.catTwoColGrid}>
                {EXPENSE_CATEGORY_KEYS.map((catKey) => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const isSelected = selectedCategories.includes(catKey);
                  return (
                    <TouchableOpacity
                      key={catKey}
                      style={[styles.catGridCell, isSelected && styles.catOptionItemActive]}
                      onPress={() => toggleCategoryFilter(catKey)}
                    >
                      <CategoryBadge category={catKey} size={24} iconSize={12} />
                      <Text style={[styles.catGridLabel, isSelected && { fontWeight: "bold" }]} numberOfLines={2}>
                        {cfg.label}
                      </Text>
                      {isSelected && <Check size={13} color={COLORS.primary} strokeWidth={2.8} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Spacer & Dashed Divider between EXPENSE and INCOME */}
              <View style={styles.catGroupDivider} />

              {/* Section 2: INCOME CATEGORIES (2-Column Grid) */}
              <View style={styles.catGroupHeaderRow}>
                <Text style={styles.catGroupHeaderText}>INCOME (6)</Text>
                <View style={styles.catGroupTypeBadgeIncome}>
                  <Text style={styles.catGroupTypeBadgeTextIncome}>INCOME</Text>
                </View>
              </View>

              <View style={styles.catTwoColGrid}>
                {INCOME_CATEGORY_KEYS.map((catKey) => {
                  const cfg = CATEGORY_CONFIG[catKey];
                  const isSelected = selectedCategories.includes(catKey);
                  return (
                    <TouchableOpacity
                      key={catKey}
                      style={[styles.catGridCell, isSelected && styles.catOptionItemActive]}
                      onPress={() => toggleCategoryFilter(catKey)}
                    >
                      <CategoryBadge category={catKey} size={24} iconSize={12} />
                      <Text style={[styles.catGridLabel, isSelected && { fontWeight: "bold" }]} numberOfLines={2}>
                        {cfg.label}
                      </Text>
                      {isSelected && <Check size={13} color={COLORS.primary} strokeWidth={2.8} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Bottom Modal Action Buttons */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <WireButton
                label="CLEAR"
                variant="outline"
                onPress={() => {
                  playUiSound("pop");
                  setSelectedCategories([]);
                }}
                style={{ flex: 1 }}
              />
              <WireButton
                label={selectedCategories.length > 0 ? `APPLY (${selectedCategories.length})` : "DONE"}
                onPress={() => setShowFilterCategoryModal(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Transaction Detail Inspection Modal */}
      <Modal visible={!!detailTx} transparent={true} animationType="fade" onRequestClose={() => setDetailTx(null)}>
        <View style={styles.modalOverlay}>
          {detailTx && (
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>TRANSACTION DETAILS</Text>
                <TouchableOpacity onPress={() => setDetailTx(null)}>
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
                  <Text style={styles.detailMetaValue}>{(CATEGORY_CONFIG[detailTx.category] || CATEGORY_CONFIG.OTHER_EXPENSE).label}</Text>
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
                <TouchableOpacity style={styles.detailDeleteBtn} onPress={() => setDeleteTarget(detailTx)}>
                  <Trash2 size={14} color={COLORS.danger} strokeWidth={2.2} />
                  <Text style={styles.detailDeleteBtnText}>DELETE</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.detailEditBtn} onPress={() => openEditModal(detailTx)}>
                  <Edit3 size={14} color={COLORS.primaryText} strokeWidth={2.2} />
                  <Text style={styles.detailEditBtnText}>EDIT RECORD</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Modal 3: Edit Transaction Modal */}
      <Modal visible={!!editingTx} transparent={true} animationType="fade" onRequestClose={() => setEditingTx(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>EDIT TRANSACTION</Text>
              <TouchableOpacity onPress={() => setEditingTx(null)}>
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>MERCHANT / TITLE</Text>
              <TextInput
                style={styles.modalInput}
                value={editMerchant}
                onChangeText={setEditMerchant}
                placeholder="e.g. FamilyMart"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.modalLabel}>AMOUNT (RM)</Text>
              <TextInput
                style={styles.modalInput}
                value={editAmount}
                onChangeText={setEditAmount}
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
                  setShowEditCalendar(true);
                }}
              >
                <Calendar size={16} color={COLORS.primary} strokeWidth={2.2} />
                <Text style={[styles.modalCategoryBtnText, { flex: 1 }]}>{formatDateYMD(editDate)}</Text>
                <ChevronDown size={15} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.modalLabel}>CATEGORY</Text>
              <TouchableOpacity style={styles.modalCategoryBtn} onPress={() => setShowEditCategoryModal(true)}>
                <CategoryBadge category={editCategory} size={28} iconSize={14} />
                <Text style={[styles.modalCategoryBtnText, { flex: 1 }]}>{activeEditCatConfig.label}</Text>
                <ChevronDown size={16} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.modalLabel}>NOTES / DESCRIPTION</Text>
              <TextInput
                style={styles.modalInput}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Optional remarks"
                placeholderTextColor={COLORS.textMuted}
              />
            </ScrollView>

            <View style={[styles.modalActionsRow, { marginTop: 10 }]}>
              <WireButton label="CANCEL" variant="outline" onPress={() => setEditingTx(null)} style={{ flex: 1 }} />
              {isUpdating ? (
                <View style={{ flex: 1, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : (
                <WireButton label="SAVE CHANGES" onPress={handleSaveEdit} style={{ flex: 1 }} />
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 4: Standalone Popup CalendarModal for Editing Transaction Date */}
      <CalendarModal
        visible={showEditCalendar}
        selectedDate={editDate}
        onSelectDate={(pickedDate) => setEditDate(pickedDate)}
        onClose={() => setShowEditCalendar(false)}
      />

      {/* Modal 5: 2-Column Category Selection Modal inside Edit Mode */}
      <Modal visible={showEditCategoryModal} transparent={true} animationType="fade" onRequestClose={() => setShowEditCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT NEW CATEGORY</Text>
              <TouchableOpacity onPress={() => setShowEditCategoryModal(false)}>
                <X size={18} color={COLORS.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              <View style={styles.catTwoColGrid}>
                {editCategoryList.map((catKey) => {
                  const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.OTHER_EXPENSE;
                  const isSelected = editCategory === catKey;
                  return (
                    <TouchableOpacity
                      key={catKey}
                      style={[styles.catGridCell, isSelected && styles.catOptionItemActive]}
                      onPress={() => {
                        setEditCategory(catKey);
                        setShowEditCategoryModal(false);
                      }}
                    >
                      <CategoryBadge category={catKey} size={24} iconSize={12} />
                      <Text style={[styles.catGridLabel, isSelected && { fontWeight: "bold" }]} numberOfLines={2}>
                        {cfg.label}
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
      <Modal visible={!!deleteTarget} transparent={true} animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
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
              <WireButton label="CANCEL" variant="outline" onPress={() => setDeleteTarget(null)} style={{ flex: 1 }} />
              {isDeleting ? (
                <View style={{ flex: 1, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={COLORS.danger} />
                </View>
              ) : (
                <TouchableOpacity style={styles.confirmDeleteBtn} onPress={confirmDeleteTransaction}>
                  <Trash2 size={14} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.confirmDeleteBtnText}>YES, DELETE</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    topControlsContainer: {
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    searchAndCatRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 10,
      paddingVertical: 7,
      gap: 6,
    },
    searchInput: {
      flex: 1,
      fontFamily: FONTS.mono,
      fontSize: 11,
      color: COLORS.text,
      paddingVertical: 0,
    },
    catDropdownBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: SHAPES.borderWidth,
      borderColor: COLORS.border,
      borderRadius: SHAPES.inputRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 10,
      paddingVertical: 9,
      maxWidth: 135,
    },
    catDropdownBtnActive: {
      backgroundColor: COLORS.primary,
    },
    catDropdownBtnText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.text,
    },
    filterScroll: {
      marginBottom: 8,
    },
    periodChip: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.card,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginRight: 6,
    },
    periodChipActive: {
      backgroundColor: COLORS.primary,
    },
    periodChipText: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    periodChipTextActive: {
      color: COLORS.primaryText,
    },
    typeAndCountBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    typeTab: {
      borderWidth: 1.5,
      borderColor: COLORS.border,
      borderRadius: SHAPES.chipRadius,
      backgroundColor: COLORS.secondary,
      paddingHorizontal: 9,
      paddingVertical: 4,
      marginRight: 5,
    },
    typeTabActive: {
      backgroundColor: COLORS.text,
    },
    typeTabText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.text,
    },
    typeTabTextActive: {
      color: COLORS.card,
    },
    verticalDivider: {
      width: 1.5,
      backgroundColor: COLORS.borderMuted,
      marginHorizontal: 4,
      marginVertical: 2,
    },
    resultsCountText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      color: COLORS.textMuted,
    },
    resetFilterText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.danger,
      textDecorationLine: "underline",
    },
    listContentContainer: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    dateGroupSection: {
      marginBottom: 12,
    },
    dateHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
      paddingHorizontal: 4,
    },
    dateHeaderText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
      color: COLORS.textMuted,
    },
    dateTotalText: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      fontWeight: "bold",
    },
    txRowCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
      gap: 10,
    },
    merchantLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    txMerchant: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
      color: COLORS.text,
      flexShrink: 1,
    },
    ocrTag: {
      backgroundColor: COLORS.secondary,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    ocrTagText: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: COLORS.primary,
    },
    txMeta: {
      fontFamily: FONTS.mono,
      fontSize: 9.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    rightActionCol: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    txAmount: {
      fontFamily: FONTS.mono,
      fontSize: 12,
      fontWeight: "bold",
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
    modalSubHint: {
      fontFamily: FONTS.mono,
      fontSize: 8.5,
      color: COLORS.textMuted,
      marginTop: 2,
    },
    allCatFullBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: SHAPES.inputRadius,
      borderWidth: 1.5,
      borderColor: COLORS.borderMuted,
      backgroundColor: COLORS.inputBg,
      marginBottom: 6,
    },
    catGroupHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
      marginBottom: 6,
      paddingHorizontal: 2,
    },
    catGroupHeaderText: {
      fontFamily: FONTS.mono,
      fontSize: 9,
      fontWeight: "bold",
      color: COLORS.textMuted,
      letterSpacing: 0.6,
    },
    catGroupTypeBadgeExpense: {
      backgroundColor: "#FFE4E6",
      borderWidth: 1,
      borderColor: "#E11D48",
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    catGroupTypeBadgeTextExpense: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: "#E11D48",
    },
    catGroupTypeBadgeIncome: {
      backgroundColor: "#DCFCE7",
      borderWidth: 1,
      borderColor: "#15803D",
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    catGroupTypeBadgeTextIncome: {
      fontFamily: FONTS.mono,
      fontSize: 7.5,
      fontWeight: "bold",
      color: "#15803D",
    },
    catGroupDivider: {
      borderBottomWidth: 1.5,
      borderColor: COLORS.borderMuted,
      borderStyle: "dashed",
      marginVertical: 8,
    },
    // 2-Column Grid Styles for Categories (2 per row)
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
    catOptionLabel: {
      fontFamily: FONTS.mono,
      fontSize: 10,
      color: COLORS.text,
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
