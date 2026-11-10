/**
 * @file frontend/src/screens/TransactionsScreen.js
 * @layer Screen (Top-Level Page Skeleton — 100% Original Design & Validation)
 * @description Assembles the exact TransactionsScreen layout: Top Controls (SearchBar + FilterBar + TypeFilter), TransactionList, CategoryFilterModal, and EditTransactionModal (Modals 2–6).
 * @props {object} user - Logged-in user object
 * @exports default TransactionsScreen
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";
import FloatingToast from "../components/shared/FloatingToast";
import { useFloatingToast } from "../components/shared/useFloatingToast";
import { useTransactions } from "../features/transactions/hooks/useTransactions";
import TransactionSearchBar from "../features/transactions/components/TransactionSearchBar";
import TransactionFilterBar from "../features/transactions/components/TransactionFilterBar";
import TransactionTypeFilter from "../features/transactions/components/TransactionTypeFilter";
import TransactionList from "../features/transactions/components/TransactionList";
import CategoryFilterModal from "../features/transactions/components/CategoryFilterModal";
import EditTransactionModal from "../features/transactions/components/EditTransactionModal";

export default function TransactionsScreen({ user }) {
  const styles = getStyles();
  const { toast, slideAnim, showToast } = useFloatingToast();

  const {
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
  } = useTransactions(user, showToast);

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
        <TransactionSearchBar
          searchQuery={searchQuery}
          onChangeSearch={setSearchQuery}
          selectedCategories={selectedCategories}
          onOpenCategoryModal={() => setShowFilterCategoryModal(true)}
        />

        {/* 2. Unified Single Time & Month Filter Row */}
        <TransactionFilterBar dynamicMonthOptions={dynamicMonthOptions} timeFilter={timeFilter} onSelectTimeFilter={setTimeFilter} />

        {/* 3. Type Switcher (ALL / EXPENSE / INCOME) + Record Counter Row */}
        <TransactionTypeFilter
          selectedType={selectedType}
          onSelectType={setSelectedType}
          loadedCount={transactions.length}
          totalCount={totalRecordsCount}
          hasCustomFilters={hasCustomFilters}
          onResetFilters={handleResetFilters}
        />
      </View>

      {/* 4. Paginated Lazy-Loaded FlatList of Date-Grouped Sections */}
      <TransactionList
        loading={loading}
        loadingMore={loadingMore}
        sections={sections}
        onLoadMore={handleLoadMore}
        onPressItem={(tx) => setDetailTx(tx)}
      />

      {/* Modal 1: 2-Column Multi-Select Category Filter Popup */}
      <CategoryFilterModal
        visible={showFilterCategoryModal}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategoryFilter}
        onClearCategories={() => setSelectedCategories([])}
        onClose={() => setShowFilterCategoryModal(false)}
      />

      {/* Modals 2, 3, 4, 5 & 6: Detail, Edit, Calendar, Category Picker & Delete Confirm */}
      <EditTransactionModal
        detailTx={detailTx}
        onCloseDetail={() => setDetailTx(null)}
        onRequestDelete={(tx) => setDeleteTarget(tx)}
        onOpenEditModal={openEditModal}
        editingTx={editingTx}
        onCloseEdit={() => setEditingTx(null)}
        editMerchant={editMerchant}
        onChangeEditMerchant={setEditMerchant}
        editAmount={editAmount}
        onChangeEditAmount={setEditAmount}
        editCategory={editCategory}
        onChangeEditCategory={setEditCategory}
        editDate={editDate}
        onChangeEditDate={setEditDate}
        editDescription={editDescription}
        onChangeEditDescription={setEditDescription}
        showEditCalendar={showEditCalendar}
        onToggleEditCalendar={setShowEditCalendar}
        showEditCategoryModal={showEditCategoryModal}
        onToggleEditCategoryModal={setShowEditCategoryModal}
        isUpdating={isUpdating}
        onSaveEdit={handleSaveEdit}
        deleteTarget={deleteTarget}
        onCloseDeleteConfirm={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
        onConfirmDelete={confirmDeleteTransaction}
      />
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    topControlsContainer: {
      paddingHorizontal: 16,
      paddingTop: 10,
    },
  });
