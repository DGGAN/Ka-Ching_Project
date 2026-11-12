/**
 * @file frontend/src/features/transactions/hooks/useTransactions.js
 * @layer Hook (Transactions State, Filtering, Edit & Delete with "edit" & "delete" Sounds)
 * @description Manages paginated transactions, multi-category filter, standalone edit calendar, and plays "edit" on update and "delete" on removal.
 * @exports useTransactions
 */

import { useState, useEffect } from "react";
import { playUiSound } from "../../../utils/soundEffects";
import { fetchTransactions, updateTransaction, deleteTransaction } from "../services/transactionService";
import { getCurrentMonthKey, buildGroupedSections, getCategoryTriggerLabel } from "../utils/transactionUtils";
import { getSixMonthWindow } from "../../../utils/dateHelpers";

const PAGE_LIMIT = 15;

export function useTransactions(user, showToast) {
  const currentMonthKey = getCurrentMonthKey();

  const [transactions, setTransactions] = useState([]);
  const [allDatesForWindow, setAllDatesForWindow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [timeFilter, setTimeFilter] = useState(currentMonthKey);

  const [showFilterCategoryModal, setShowFilterCategoryModal] = useState(false);
  const [detailTx, setDetailTx] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingTx, setEditingTx] = useState(null);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("FOOD_AND_BEVERAGE");
  const [editDate, setEditDate] = useState(new Date());
  const [editDescription, setEditDescription] = useState("");
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditCalendar, setShowEditCalendar] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadMonthWindow = async () => {
      try {
        const res = await fetchTransactions(user.id, {});
        if (res?.data) {
          setAllDatesForWindow(res.data);
        }
      } catch (e) {
        console.log("Month window check error:", e.message);
      }
    };
    if (user?.id) {
      loadMonthWindow();
    }
  }, [user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactionsPage(1, true);
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedType, selectedCategories, timeFilter, searchQuery]);

  const fetchTransactionsPage = async (pageToLoad = 1, isReset = false) => {
    try {
      if (isReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const categoryParam = selectedCategories.length === 0 ? "ALL" : selectedCategories.join(",");
      const isMonthKey = /^\d{4}-\d{2}$/.test(timeFilter);

      const resData = await fetchTransactions(user.id, {
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

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMorePages) {
      fetchTransactionsPage(currentPage + 1, false);
    }
  };

  const toggleCategoryFilter = (catKey) => {
    playUiSound("pop");
    setSelectedCategories((prev) => {
      if (prev.includes(catKey)) {
        return prev.filter((k) => k !== catKey);
      }
      return [...prev, catKey];
    });
  };

  const dynamicMonthOptions = [...getSixMonthWindow(allDatesForWindow)].reverse();
  const sections = buildGroupedSections(transactions);

  // 7. Delete Transaction handler -> Plays #8 "delete" (Blackhole Suck) sound
  const confirmDeleteTransaction = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteTransaction(deleteTarget._id);
      setTransactions((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setTotalRecordsCount((prev) => Math.max(0, prev - 1));
      setAllDatesForWindow((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
      setDetailTx(null);
      playUiSound("delete");
      showToast("success", "Transaction deleted.");
    } catch (error) {
      showToast("error", "Failed to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

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

  // 9. Save Updated Transaction -> Plays #7 "edit" (Arcade Reload) sound
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

      const updatedFromServer = await updateTransaction(editingTx._id, {
        merchantName: cleanMerchant,
        amount: Number(numericAmount.toFixed(2)),
        category: editCategory,
        date: isoDate,
        description: editDescription.trim() || null,
      });

      const updatedDoc = updatedFromServer || {
        ...editingTx,
        merchantName: cleanMerchant,
        amount: Number(numericAmount.toFixed(2)),
        category: editCategory,
        date: isoDate,
        description: editDescription.trim() || null,
      };

      setTransactions((prev) => prev.map((item) => (item._id === editingTx._id ? updatedDoc : item)));
      setEditingTx(null);
      playUiSound("edit");
      showToast("success", "Transaction updated!");
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to update transaction.");
    } finally {
      setIsUpdating(false);
    }
  };

  const categoryTriggerLabel = getCategoryTriggerLabel(selectedCategories);
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
    categoryTriggerLabel,
    hasCustomFilters,
    handleLoadMore,
    toggleCategoryFilter,
    confirmDeleteTransaction,
    openEditModal,
    handleSaveEdit,
  };
}
