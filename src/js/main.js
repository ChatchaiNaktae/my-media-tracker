import { openItemModal, closeItemModal, showToast, scrollToTop, showSkeleton } from './ui.js';
import { handleLogin, handleLogout, handleRegister, toggleAuthView, togglePassword, checkAuth, getAuthHeaders } from './auth.js';
import { updateDashboard, updateCharts, getMediaChart } from './dashboard.js';
import { saveAction, updateUndoRedoUI, triggerUndo, triggerRedo } from './history.js';
import { handleCategoryChange, closeManageCategoryModal, editCustomCategory, deleteCustomCategory, refreshCategoryDropdown, openAddCategoryModal, closeAddCategoryModal, confirmAddCategoryModal } from './category.js';
import { exportData, importData, fetchMediaData } from './data.js';
import { clearSelectedItems, updateMultiSelectUI, handleCheckboxChange, toggleSelectAll, deleteSelectedItems } from './multiselect.js';
import { quickProgress, handleFormSubmit, startEditItem, cancelEdit, deleteItem } from './form.js';
import { getAllItems, loadItems, renderItems, loadMoreItems, setFilter, handleSearch, handleSort, updateTagFilters, setTagFilter } from './list.js';

window.getAllItems = getAllItems;

// Theme
import { toggleTheme, initTheme } from './theme.js';
initTheme(getMediaChart, updateCharts);
document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

// UI
window.openItemModal = openItemModal;
window.closeItemModal = closeItemModal;
window.showToast = showToast; 
window.scrollToTop = scrollToTop;
window.showSkeleton = showSkeleton;

// Auth
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.handleRegister = handleRegister;
window.toggleAuthView = toggleAuthView;
window.togglePassword = togglePassword;
window.checkAuth = checkAuth;
window.getAuthHeaders = getAuthHeaders;

// Dashboard
window.updateDashboard = updateDashboard;
window.updateCharts = updateCharts;

// Dashboard & History
window.saveAction = saveAction;
window.updateUndoRedoUI = updateUndoRedoUI;
window.triggerUndo = triggerUndo;
window.triggerRedo = triggerRedo;

// Category
window.handleCategoryChange = handleCategoryChange;
window.closeManageCategoryModal = closeManageCategoryModal;
window.editCustomCategory = editCustomCategory;
window.deleteCustomCategory = deleteCustomCategory;
window.refreshCategoryDropdown = refreshCategoryDropdown;
window.openAddCategoryModal = openAddCategoryModal;
window.closeAddCategoryModal = closeAddCategoryModal;
window.confirmAddCategoryModal = confirmAddCategoryModal;

// Import Data & Export Data
window.exportData = exportData;
window.importData = importData;
window.fetchMediaData = fetchMediaData;

// Multi-Select
window.clearSelectedItems = clearSelectedItems;
window.updateMultiSelectUI = updateMultiSelectUI;
window.handleCheckboxChange = handleCheckboxChange;
window.toggleSelectAll = toggleSelectAll;
window.deleteSelectedItems = deleteSelectedItems;

// Form
window.quickProgress = quickProgress;
window.handleFormSubmit = handleFormSubmit;
window.startEditItem = startEditItem;
window.cancelEdit = cancelEdit;
window.deleteItem = deleteItem;

// List
window.loadItems = loadItems;
window.renderItems = renderItems;
window.loadMoreItems = loadMoreItems;
window.setFilter = setFilter;
window.handleSearch = handleSearch;
window.handleSort = handleSort;
window.updateTagFilters = updateTagFilters;
window.setTagFilter = setTagFilter;