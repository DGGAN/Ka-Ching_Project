/**
 * @file frontend/src/features/transactions/hooks/useTransactions.js
 * @layer Hook (State, Pagination, Filter & Modal Management — 100% Original Logic)
 * @description Manages all states and handlers from the original TransactionsScreen.js without altering any validation or behavior.
 * @exports useTransactions
 */

import { useState, useEffect, useMemo } from "react";
import { getSixMonthWindow } from "../../../utils/dateHelpers";
import { playUiSound } from "../../../utils/soundEffects";
import {
  fetchAllUserTransactionsForWindow,
  fetchTransactionsPageApi,
  updateTransactionApi,
  deleteTransactionApi,
} from "../services/transactionService";
import { PAGE_LIMIT, getCurrentMonthKey, buildGroupedSections } from "../utils/transactionUtils";

export function useTransactions(user, showToast) {
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

  // 2. Fetch lightweight transaction dates once on mount to compute the smart 6-month window
  useEffect(() => {
    const loadMonthWindow = async () => {
      if (!user?.id) return;
      try {
        const list = await fetchAllUserTransactionsForWindow(user.id);
        setAllDatesForWindow(list);
      } catch (e) {
        console.log("Month window check error:", e.message);
      }
    };
    loadMonthWindow();
  }, [user?.id]);

  // 3. Re-fetch Page 1 whenever any filter or search query changes
  useEffect(() => {
    if (!user?.id) return;
    const timer = setTimeout(() => {
      fetchTransactionsPage(1, true);
    }, 250);
    return () => clearTimeout(timer);
  }, [user?.id, selectedType, selectedCategories, timeFilter, searchQuery]);

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

      const resData = await fetchTransactionsPageApi(user.id, {
        page: pageToLoad,
        limit: PAGE_LIMIT,
        type: selectedType,
        category: categoryParam,
        search: searchQuery,
        period: isMonthKey ? "ALL" : timeFilter,
        monthKey: isMonthKey ? timeFilter : undefined,
      });

      const fetchedItems = resData?.data || [];
      const moreAvailable = Boolean(resData?.hasMore);
      const totalCount = resData?.totalCount ?? fetchedItems.length;

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
  const dynamicMonthOptions = useMemo(() => [...getSixMonthWindow(allDatesForWindow)].reverse(), [allDatesForWindow]);

  // 6. Group loaded transactions by calendar date for clean section headers
  const sections = useMemo(() => buildGroupedSections(transactions), [transactions]);

  // 7. Delete Transaction handler
  const confirmDeleteTransaction = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteTransactionApi(deleteTarget._id);
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

      const res = await updateTransactionApi(editingTx._id, {
        merchantName: cleanMerchant,
        amount: Number(numericAmount.toFixed(2)),
        category: editCategory,
        date: isoDate,
        description: editDescription.trim() || null,
      });

      const updatedDoc = res?.data || {
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

  const handleResetFilters = () => {
    playUiSound("pop");
    setSelectedType("ALL");
    setSelectedCategories([]);
    setTimeFilter(currentMonthKey);
    setSearchQuery("");
  };

  const hasCustomFilters = selectedType !== "ALL" || selectedCategories.length > 0 || timeFilter !== currentMonthKey || searchQuery !== "";

  return {
    currentMonthKey,
    transactions,
    loading,
    loadingMore,
    totalRecordsCount,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    selectedCategories,
    setSelectedCategories,
    timeFilter,
    setTimeFilter,
    showFilterCategoryModal,
    setShowFilterCategoryModal,
    detailTx,
    setDetailTx,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    editingTx,
    setEditingTx,
    editMerchant,
    setEditMerchant,
    editAmount,
    setEditAmount,
    editCategory,
    setEditCategory,
    editDate,
    setEditDate,
    editDescription,
    setEditDescription,
    showEditCategoryModal,
    setShowEditCategoryModal,
    showEditCalendar,
    setShowEditCalendar,
    isUpdating,
    dynamicMonthOptions,
    sections,
    hasCustomFilters,
    handleLoadMore,
    toggleCategoryFilter,
    confirmDeleteTransaction,
    openEditModal,
    handleSaveEdit,
    handleResetFilters,
  };
}
