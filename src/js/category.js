import { getAuthHeaders } from './auth.js';
import { showToast } from './ui.js';

const apiUrl = 'https://my-media-tracker-api.onrender.com/items';

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
    const wrapper = select.parentNode;
    const list = wrapper.querySelector('.custom-select-list');
    const spanText = select.customDisplaySpan;

    if (!list) return;

    list.innerHTML = ''; 

    Array.from(select.options).forEach((option, index) => {
        const item = document.createElement("div");
        item.className = "p-3 cursor-pointer hover:bg-accent hover:text-white dark:hover:bg-accentDark dark:hover:text-gray-900 transition-colors text-[0.95em] select-none";
        item.textContent = option.text;

        item.addEventListener("click", (e) => {
            e.stopPropagation();
            select.selectedIndex = index;
            spanText.textContent = option.text;
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
    const select = document.getElementById('categoryInput');
    const newCat = prompt("ตั้งชื่อหมวดหมู่ใหม่ (เช่น Series, Board Game):");

    if (newCat && newCat.trim() !== "") {
        const catName = newCat.trim();
        let exists = false;
        
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value.toLowerCase() === catName.toLowerCase()) {
                exists = true;
                select.selectedIndex = i;
                break;
            }
        }

        if (!exists) {
            let emoji = prompt(`ใส่อีโมจิสำหรับหมวดหมู่ "${catName}" (เช่น 🤖, 📖, 🎲)\n*ถ้าไม่ใส่ ระบบจะใช้ 🏷️ ให้แทน*`);
            emoji = (!emoji || emoji.trim() === "") ? "🏷️" : emoji.trim();

            const opt = document.createElement('option');
            opt.value = catName;
            opt.text = emoji + " " + catName; 

            const addNewOptionIndex = select.options.length - 1;
            select.insertBefore(opt, select.options[addNewOptionIndex]);
            select.value = catName;

            let savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');
            savedCustomCats[catName] = emoji; 
            localStorage.setItem('customCategories', JSON.stringify(savedCustomCats));
        }
    } else {
        select.selectedIndex = 0;
    }

    updateCustomDropdownUI(select);
    if (select.customDisplaySpan) {
        select.customDisplaySpan.textContent = select.options[select.selectedIndex].text;
    }
}

export function openManageCategoryModal() {
    renderManageCategories();
    document.getElementById('manageCategoryModal').classList.remove('hidden');
}

export function closeManageCategoryModal() {
    document.getElementById('manageCategoryModal').classList.add('hidden');
    // อัปเดต Dropdown หลังจากปิดหน้าต่าง
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

    list.innerHTML = catNames.map(cat => `
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
            <span class="font-semibold text-gray-800 dark:text-gray-200">${savedCustomCats[cat]} ${cat}</span>
            <div class="flex gap-1.5">
                <button onclick="editCustomCategory('${cat}')" class="w-8 h-8 flex items-center justify-center bg-yellow-400 text-gray-900 rounded-lg hover:scale-105 transition-transform shadow-sm" title="แก้ไข">✏️</button>
                <button onclick="deleteCustomCategory('${cat}')" class="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-lg hover:scale-105 transition-transform shadow-sm" title="ลบ">🗑️</button>
            </div>
        </div>
    `).join('');
}

export async function editCustomCategory(oldName) {
    let savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');
    let oldEmoji = savedCustomCats[oldName];

    const newName = prompt(`แก้ไขชื่อหมวดหมู่ "${oldName}":`, oldName);
    if (newName === null) return; 
    
    const finalName = (newName.trim() !== "") ? newName.trim() : oldName;
    const newEmoji = prompt(`แก้ไขอีโมจิสำหรับ "${finalName}":`, oldEmoji);
    if (newEmoji === null) return;
    
    const finalEmoji = (newEmoji.trim() !== "") ? newEmoji.trim() : "🏷️";
    if (finalName === oldName && finalEmoji === oldEmoji) return;

    delete savedCustomCats[oldName];
    savedCustomCats[finalName] = finalEmoji;
    localStorage.setItem('customCategories', JSON.stringify(savedCustomCats));

    const currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];
    const itemsToUpdate = currentItems.filter(item => item.category === oldName);
    
    if (itemsToUpdate.length > 0) {
        if (confirm(`พบข้อมูล ${itemsToUpdate.length} รายการที่ใช้หมวดหมู่ "${oldName}"\nต้องการอัปเดตชื่อหมวดหมู่ในข้อมูลเหล่านั้นให้เป็น "${finalName}" ด้วยหรือไม่?`)) {
            showToast("⏳ กำลังอัปเดตข้อมูล...", 'info');
            for (let item of itemsToUpdate) {
                item.category = finalName;
                await fetch(`${apiUrl}/${item.id}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(item)
                });
            }
            showToast("✅ อัปเดตข้อมูลสำเร็จ!", 'success');
            if (typeof window.loadItems === 'function') window.loadItems(); 
        }
    }
    renderManageCategories();
}

export function deleteCustomCategory(catName) {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${catName}"?\n\n(หมวดหมู่นี้จะหายไปจากตัวเลือก แต่ข้อมูลเรื่องเก่าๆ ที่เคยใช้หมวดหมู่นี้จะยังคงอยู่)`)) {
        let savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');
        delete savedCustomCats[catName];
        localStorage.setItem('customCategories', JSON.stringify(savedCustomCats));
        
        showToast(`✅ ลบหมวดหมู่ "${catName}" เรียบร้อย`, 'success');
        renderManageCategories();
    }
}