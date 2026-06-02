import { getAuthHeaders } from './auth.js';
import { showToast } from './ui.js';
import { API_BASE_URL } from './config.js';
import { escapeHtml } from './utils.js';

const apiUrl = `${API_BASE_URL}/items`;

// ── Shared helper: add or update a category in the <select> + localStorage ──
function persistCategory(catName, emoji) {
    const select = document.getElementById('categoryInput');

    let exists = false;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.toLowerCase() === catName.toLowerCase()) {
            exists = true;
            select.selectedIndex = i;
            break;
        }
    }

    if (!exists) {
        const opt = document.createElement('option');
        opt.value = catName;
        opt.text = emoji + " " + catName;

        const addNewOptionIndex = select.options.length - 1;
        select.insertBefore(opt, select.options[addNewOptionIndex]);
        select.value = catName;
    }

    let savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');
    savedCustomCats[catName] = emoji;
    localStorage.setItem('customCategories', JSON.stringify(savedCustomCats));

    updateCustomDropdownUI(select);
    if (select.customDisplaySpan) {
        select.customDisplaySpan.textContent = select.options[select.selectedIndex].text;
    }
}

// ── Add / Edit Category Modal ────────────────────────────────────
let _modalEditMode = null; // null = add mode, string = old category name in edit mode

export function openAddCategoryModal() {
    _modalEditMode = null;
    document.getElementById('addCatModalTitle').innerHTML =
        '<i class="fa-solid fa-plus" aria-hidden="true"></i> เพิ่มหมวดหมู่ใหม่';
    document.getElementById('confirmAddCatBtn').textContent = 'เพิ่ม';
    document.getElementById('newCatName').value = '';
    document.getElementById('newCatEmoji').value = '';
    document.getElementById('addCategoryModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('newCatName').focus(), 100);
}

function openEditCategoryModal(oldName, oldEmoji) {
    _modalEditMode = oldName;
    document.getElementById('addCatModalTitle').innerHTML =
        '<i class="fa-solid fa-pen" aria-hidden="true"></i> แก้ไขหมวดหมู่';
    document.getElementById('confirmAddCatBtn').textContent = 'บันทึก';
    document.getElementById('newCatName').value = oldName;
    document.getElementById('newCatEmoji').value = oldEmoji;
    document.getElementById('addCategoryModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('newCatName').focus(), 100);
}

export function closeAddCategoryModal() {
    document.getElementById('addCategoryModal').classList.add('hidden');
    _modalEditMode = null;
}

export function confirmAddCategoryModal() {
    const nameVal = document.getElementById('newCatName').value.trim();
    const emojiVal = document.getElementById('newCatEmoji').value.trim() || '🏷️';

    if (!nameVal) {
        showToast('กรุณาใส่ชื่อหมวดหมู่', 'error');
        document.getElementById('newCatName').focus();
        return;
    }

    if (_modalEditMode !== null) {
        // ── Edit mode ──
        const oldName = _modalEditMode;
        const finalName = nameVal;
        const finalEmoji = emojiVal;

        if (finalName !== oldName || finalEmoji !== savedCustomCats[oldName]) {
            let savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');
            delete savedCustomCats[oldName];
            savedCustomCats[finalName] = finalEmoji;
            localStorage.setItem('customCategories', JSON.stringify(savedCustomCats));

            // Rename in <select>
            const select = document.getElementById('categoryInput');
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value === oldName) {
                    select.options[i].value = finalName;
                    select.options[i].text = finalEmoji + ' ' + finalName;
                    break;
                }
            }
            updateCustomDropdownUI(select);
            if (select.customDisplaySpan) {
                select.customDisplaySpan.textContent = select.options[select.selectedIndex].text;
            }

            // Update items in DB that used the old category name
            const currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];
            const itemsToUpdate = currentItems.filter(item => item.category === oldName);
            if (itemsToUpdate.length > 0) {
                window.showConfirmDialog('อัปเดตหมวดหมู่', 'พบข้อมูล ' + itemsToUpdate.length + ' รายการที่ใช้หมวดหมู่ "' + oldName + '"\nต้องการอัปเดตชื่อหมวดหมู่ในข้อมูลเหล่านั้นให้เป็น "' + finalName + '" ด้วยหรือไม่?', function () {
                    showToast("กำลังอัปเดตข้อมูล...", 'info');
                    (async function () {
                        for (var i = 0; i < itemsToUpdate.length; i++) {
                            itemsToUpdate[i].category = finalName;
                            await fetch(`${apiUrl}/${itemsToUpdate[i].id}`, {
                                method: 'PUT',
                                headers: getAuthHeaders(),
                                body: JSON.stringify(itemsToUpdate[i])
                            });
                        }
                        showToast("อัปเดตข้อมูลสำเร็จ!", 'success');
                        if (typeof window.loadItems === 'function') window.loadItems();
                    })();
                });
            }
            renderManageCategories();
        }
    } else {
        // ── Add mode ──
        persistCategory(nameVal, emojiVal);
    }

    closeAddCategoryModal();

    // Reset select if it was set to ADD_NEW placeholder
    const select = document.getElementById('categoryInput');
    if (select.value === 'MANAGE_CATEGORIES') {
        select.selectedIndex = 0;
    }
}

// Close modal on Escape key or clicking the backdrop
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAddCategoryModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeAddCategoryModal();
        }
    });
});

// ── Category Dropdown ──────────────────────────────────────────

export function refreshCategoryDropdown(items) {
    const select = document.getElementById('categoryInput');
    const uniqueCategories = new Set();

    items.forEach(item => {
        if (item.category) uniqueCategories.add(item.category);
    });

    let savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');

    if (Array.isArray(savedCustomCats)) {
        const tempObj = {};
        savedCustomCats.forEach(c => tempObj[c] = "🏷️");
        savedCustomCats = tempObj;
        localStorage.setItem('customCategories', JSON.stringify(savedCustomCats));
    }

    Object.keys(savedCustomCats).forEach(cat => uniqueCategories.add(cat));

    const defaultCats = ["Game", "Movie", "Anime", "Manga", "ADD_NEW", "MANAGE_CATEGORIES"];
    Array.from(select.options).forEach(opt => {
        if (!defaultCats.includes(opt.value)) {
            opt.remove();
        }
    });

    const addNewOption = Array.from(select.options).find(opt => opt.value === "ADD_NEW");
    uniqueCategories.forEach(cat => {
        if (!defaultCats.includes(cat)) {
            const opt = document.createElement('option');
            opt.value = cat;
            const emoji = savedCustomCats[cat] || "🏷️";
            opt.text = emoji + " " + cat;

            if (addNewOption) {
                select.insertBefore(opt, addNewOption);
            } else {
                select.appendChild(opt);
            }
        }
    });

    updateCustomDropdownUI(select);
}

export function updateCustomDropdownUI(select) {
    // Dropdown lists are portaled to <body> by dropdown.js.
    // Find the matching portaled list and rebuild it from the select's current options.
    var list = null;
    var allLists = document.querySelectorAll('.custom-select-list');
    for (var i = 0; i < allLists.length; i++) {
        if (allLists[i].getAttribute('data-select-id') === select.id) {
            list = allLists[i];
            break;
        }
    }
    // Fallback: if no data attribute match, use the first list (single-dropdown pages)
    if (!list && allLists.length > 0) list = allLists[0];

    var spanText = select.customDisplaySpan;

    if (!list) return;

    list.innerHTML = '';

    Array.from(select.options).forEach(function (option, index) {
        var item = document.createElement("div");
        item.className = "p-3 cursor-pointer hover:bg-accent hover:text-white dark:hover:bg-accentDark dark:hover:text-gray-900 transition-colors text-[0.95em] select-none";
        item.textContent = option.text;

        item.addEventListener("click", function (e) {
            e.stopPropagation();
            select.selectedIndex = index;
            if (spanText) spanText.textContent = option.text;
            list.classList.add("hidden");
            select.dispatchEvent(new Event("change"));
        });
        list.appendChild(item);
    });
}

export function handleCategoryChange(selectElement) {
    if (selectElement.value === "ADD_NEW") {
        addNewCategory();
    } else if (selectElement.value === "MANAGE_CATEGORIES") {
        openManageCategoryModal();
        selectElement.selectedIndex = 0;
        updateCustomDropdownUI(selectElement);
        if (selectElement.customDisplaySpan) {
            selectElement.customDisplaySpan.textContent = selectElement.options[0].text;
        }
    }
}

function addNewCategory() {
    openAddCategoryModal();
}

export function openManageCategoryModal() {
    renderManageCategories();
    document.getElementById('manageCategoryModal').classList.remove('hidden');
}

export function closeManageCategoryModal() {
    document.getElementById('manageCategoryModal').classList.add('hidden');
    if (typeof window.getAllItems === 'function') {
        refreshCategoryDropdown(window.getAllItems());
    }
}

function renderManageCategories() {
    const list = document.getElementById('customCategoryList');
    let savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');
    const catNames = Object.keys(savedCustomCats);

    if (catNames.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 dark:text-zinc-500 py-6 font-semibold">คุณยังไม่ได้สร้างหมวดหมู่ของตัวเองครับ</p>';
        return;
    }

    list.innerHTML = '';

    catNames.forEach(cat => {
        const emoji = escapeHtml(savedCustomCats[cat]);
        const safeCatHtml = escapeHtml(cat);

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700';

        // Display span — use textContent for auto-escaping
        const span = document.createElement('span');
        span.className = 'font-semibold text-gray-800 dark:text-gray-200';
        span.textContent = savedCustomCats[cat] + ' ' + cat;

        // Button container
        const btnDiv = document.createElement('div');
        btnDiv.className = 'flex gap-1.5';

        // Edit button — opens the custom modal instead of prompt()
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-lg hover:scale-105 transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-1';
        editBtn.title = 'แก้ไข';
        editBtn.setAttribute('aria-label', 'แก้ไข ' + safeCatHtml);
        editBtn.innerHTML = '<i class="fa-solid fa-pen text-xs" aria-hidden="true"></i>';
        editBtn.addEventListener('click', () => openEditCategoryModal(cat, savedCustomCats[cat]));

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg hover:scale-105 transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1';
        delBtn.title = 'ลบ';
        delBtn.setAttribute('aria-label', 'ลบ ' + safeCatHtml);
        delBtn.innerHTML = '<i class="fa-solid fa-trash-can text-xs" aria-hidden="true"></i>';
        delBtn.addEventListener('click', () => deleteCustomCategory(cat));

        btnDiv.appendChild(editBtn);
        btnDiv.appendChild(delBtn);
        row.appendChild(span);
        row.appendChild(btnDiv);
        list.appendChild(row);
    });
}

export function editCustomCategory(oldName) {
    // Legacy entry point — now delegates to the modal.
    // Called by window.editCustomCategory if referenced inline.
    let savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');
    openEditCategoryModal(oldName, savedCustomCats[oldName] || '🏷️');
}

export function deleteCustomCategory(catName) {
    window.showConfirmDialog('ลบหมวดหมู่', 'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "' + catName + '"?\n\n(หมวดหมู่นี้จะหายไปจากตัวเลือก แต่ข้อมูลเรื่องเก่าๆ ที่เคยใช้หมวดหมู่นี้จะยังคงอยู่)', function () {
        var savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');
        delete savedCustomCats[catName];
        localStorage.setItem('customCategories', JSON.stringify(savedCustomCats));

        // Remove from <select>
        const select = document.getElementById('categoryInput');
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === catName) {
                select.remove(i);
                break;
            }
        }
        updateCustomDropdownUI(select);
        if (select.customDisplaySpan) {
            select.customDisplaySpan.textContent = select.options[select.selectedIndex]?.text || '';
        }

        showToast(`ลบหมวดหมู่ "${escapeHtml(catName)}" เรียบร้อย`, 'success');
        renderManageCategories();
    });
}
