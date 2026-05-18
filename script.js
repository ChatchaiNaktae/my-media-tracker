/* script.js - Updated with FULL Undo/Redo Memory Stack */

// const apiUrl = 'http://127.0.0.1:5000/items';
const apiUrl = 'https://my-media-tracker-api.onrender.com/items';
let allItems = [];
let currentFilter = 'All';
let currentTagFilter = 'All';
let isEditing = false;
let selectedItems = new Set();

let currentPage = 1;
const itemsPerPage = 15;

// 🔥 ระบบความจำสำหรับ Undo/Redo
let undoStack = [];
let redoStack = [];

let mediaChart = null;

function getMasterKey() {
    let key = localStorage.getItem('mt_master_key');
    if (!key) {
        key = prompt("🔒 ระบบรักษาความปลอดภัย: กรุณาใส่รหัส Master Key ผู้ดูแลระบบเพื่อยืนยันสิทธิ์ในการสมัครสมาชิก");
        if (key) {
            localStorage.setItem('mt_master_key', key);
        }
    }
    return key;
}

function saveAction(action) {
    undoStack.push(action);
    if (undoStack.length > 30) undoStack.shift(); // จำย้อนหลังได้สูงสุด 30 รายการล่าสุด
    redoStack = []; // ล้าง Redo ทิ้งเมื่อมีการกระทำใหม่
    updateUndoRedoUI();
}

function updateUndoRedoUI() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (!undoBtn || !redoBtn) return;
    
    // จัดการหน้าตาปุ่ม Undo
    if(undoStack.length > 0) {
        undoBtn.disabled = false;
        undoBtn.classList.remove('opacity-30', 'cursor-not-allowed');
    } else {
        undoBtn.disabled = true;
        undoBtn.classList.add('opacity-30', 'cursor-not-allowed');
    }

    // จัดการหน้าตาปุ่ม Redo
    if(redoStack.length > 0) {
        redoBtn.disabled = false;
        redoBtn.classList.remove('opacity-30', 'cursor-not-allowed');
    } else {
        redoBtn.disabled = true;
        redoBtn.classList.add('opacity-30', 'cursor-not-allowed');
    }
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

async function triggerUndo() {
    if (undoStack.length === 0) return;
    const action = undoStack.pop();
    redoStack.push(action); // ย้ายไปให้ Redo เตรียมจำ
    updateUndoRedoUI();
    await revertAction(action, true);
    loadItems();
}

async function triggerRedo() {
    if (redoStack.length === 0) return;
    const action = redoStack.pop();
    undoStack.push(action); // ย้ายกลับมาให้ Undo
    updateUndoRedoUI();
    await revertAction(action, false);
    loadItems();
}

async function revertAction(action, isUndo) {
    if (action.type === 'add') {
        if (isUndo) {
            await fetch(`${apiUrl}/${action.item.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
        } else {
            await fetch(apiUrl, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(action.item)
            });
        }
    }
    else if (action.type === 'edit') {
        const payload = isUndo ? action.oldItem : action.newItem;
        await fetch(`${apiUrl}/${payload.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
    }
    else if (action.type === 'delete') {
        if (isUndo) {
            await fetch(apiUrl, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(action.item)
            });
        } else {
            await fetch(`${apiUrl}/${action.item.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
        }
    }
    else if (action.type === 'batch_delete') {
        if (isUndo) {
            for (let item of action.items) {
                await fetch(apiUrl, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(item)
                });
            }
        } else {
            const ids = action.items.map(i => i.id);
            await fetch(`${apiUrl}/batch-delete`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ids })
            });
        }
    }
}
// -------------------------------------------------------------

// Heartbeat
// setInterval(() => { fetch('http://127.0.0.1:5000/heartbeat', { method: 'POST' }).catch(err => {}); }, 1000);

// Get acronym for Smart Search
function getAcronym(title) {
    if (!title) return "";
    const matches = title.match(/(?:^|\s)(\S)/g);
    if (matches) {
        return matches.map(char => char.trim().toLowerCase()).join('');
    }
    return "";
}

// Quick Add Progress
async function quickProgress(id, current, total) {
    if (total > 0 && current >= total) return;
    
    const oldItem = allItems.find(x => x.id === id);
    const newItem = { ...oldItem, current_progress: current + 1 };

    await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ current_progress: current + 1 })
    });
    
    saveAction({ type: 'edit', oldItem: oldItem, newItem: newItem }); // บันทึกความจำ
    loadItems();
}

// Load data from backend
async function loadItems() {
    showSkeleton();

    try {
        const response = await fetch(apiUrl, { headers: getAuthHeaders() });
        if (response.status === 401) {
            console.warn("Token expired or unauthorized. Forcing logout.");
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_username');
            location.reload();
            return;
        }

        allItems = await response.json();
        refreshCategoryDropdown(allItems);
        renderItems(allItems);
        updateDashboard(allItems);
        updateCharts(allItems);
        updateTagFilters(allItems);
    } catch (error) {
        console.error("Load Error:", error);
        document.getElementById('mediaListContainer').innerHTML = '<p class="text-center py-10 opacity-50">❌ ไม่สามารถดึงข้อมูลได้ โปรดลองใหม่อีกครั้ง</p>';
    }
}

function updateDashboard(items) {
    animateValue("totalCount", items.length);
    animateValue("finishedCount", items.filter(i => i.status === 'Completed').length);
    animateValue("todoCount", items.filter(i => i.status === 'Planned').length);
}

function animateValue(id, end) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let start = parseInt(obj.textContent.replace(/,/g, '')) || 0;
    if (start === end) return;
    if (obj.timer) clearInterval(obj.timer);
    let range = Math.abs(end - start);
    let stepTime = Math.max(Math.floor(1000 / range), 20);
    obj.timer = setInterval(() => {
        if (start < end) start++; else start--;
        obj.textContent = start;
        if (start === end) clearInterval(obj.timer);
    }, stepTime);
}

// ระบบจัดการ UI แบบเลือกหลายรายการ
function updateMultiSelectUI() {
    const controls = document.getElementById('multiSelectControls');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const selectCountText = document.getElementById('selectCountText');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    
    if (selectedItems.size > 0) {
        controls.classList.remove('hidden');
        selectCountText.textContent = `เลือกแล้ว ${selectedItems.size} รายการ`;
        deleteBtn.removeAttribute('disabled');
        const visibleItems = document.querySelectorAll('.item-checkbox');
        let allChecked = visibleItems.length > 0;
        visibleItems.forEach(cb => { if(!cb.checked) allChecked = false; });
        selectAllCheckbox.checked = allChecked;
    } else {
        controls.classList.add('hidden');
        selectAllCheckbox.checked = false;
        deleteBtn.setAttribute('disabled', 'disabled');
    }
}

function handleCheckboxChange(checkbox, id) {
    if (checkbox.checked) selectedItems.add(id);
    else selectedItems.delete(id);
    updateMultiSelectUI();
}

function toggleSelectAll(checkbox) {
    const visibleCheckboxes = document.querySelectorAll('.item-checkbox');
    if (checkbox.checked) {
        visibleCheckboxes.forEach(cb => {
            cb.checked = true;
            selectedItems.add(parseInt(cb.dataset.id));
        });
    } else {
        visibleCheckboxes.forEach(cb => {
            cb.checked = false;
            selectedItems.delete(parseInt(cb.dataset.id));
        });
    }
    updateMultiSelectUI();
}

async function deleteSelectedItems() {
    if (selectedItems.size === 0) return;
    if (confirm(`คุณต้องการลบ ${selectedItems.size} รายการที่เลือกใช่หรือไม่?\n(ลบแล้วกู้คืนไม่ได้นะ)`)) {
        const deletedItems = allItems.filter(x => selectedItems.has(x.id)); // จำของที่จะลบก่อน

        await fetch(`${apiUrl}/batch-delete`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ids: Array.from(selectedItems) })
        });
        
        saveAction({ type: 'batch_delete', items: deletedItems }); 
        selectedItems.clear();
        updateMultiSelectUI();
        loadItems();
    }
}

// Render the items to HTML
function renderItems(items) {
    const listContainer = document.getElementById('mediaListContainer');
    listContainer.innerHTML = ''; 
    selectedItems.clear(); 
    updateMultiSelectUI();

    let filtered = items.filter(i => {
        let matchesStatus;
        if (currentFilter === 'All') matchesStatus = true;
        else if (currentFilter === 'Progress') matchesStatus = (i.total_count > 0);
        else matchesStatus = (i.status === currentFilter);

        const term = document.getElementById('searchInput').value.toLowerCase().trim();
        const itemAcronym = getAcronym(i.title);
        const itemTags = i.tags ? i.tags.toLowerCase() : "";
        const matchesSearch = i.title.toLowerCase().includes(term) || itemAcronym.includes(term) || itemTags.includes(term);

        const itemTagList = i.tags ? i.tags.split(',').map(t => t.trim()) : [];
        const matchesTag = (currentTagFilter === 'All') || itemTagList.includes(currentTagFilter);

        return matchesStatus && matchesSearch && matchesTag;
    });

    const sortType = document.getElementById('sortInput').value;
    filtered.sort((a,b) => {
        if (sortType === 'best') return (b.rating || 0) - (a.rating || 0);
        if (sortType === 'az') return a.title.localeCompare(b.title);
        if (sortType === 'oldest') return a.id - b.id;
        return b.id - a.id;
    });

    const totalFiltered = filtered.length;
    const paginatedItems = filtered.slice(0, currentPage * itemsPerPage);

    const groups = {};
    paginatedItems.forEach(i => { if(!groups[i.category]) groups[i.category]=[]; groups[i.category].push(i); });
    const dynamicCategories = Object.keys(groups).sort();

    // Render all categories found in the data
    dynamicCategories.forEach(cat => {
        if (groups[cat]) {
            const sec = document.createElement('div');
            sec.innerHTML = `<h3 class="category-header">${cat}</h3>`;
            const ul = document.createElement('ul');
            ul.className = 'category-list';
            groups[cat].forEach(item => {
                const li = document.createElement('li');
                li.className = "bg-itemLight dark:bg-itemDark mb-3 p-3 sm:p-[15px] rounded-xl flex items-start gap-3 sm:gap-4 transition-all duration-200 shadow-sm border border-transparent hover:border-accent hover:dark:border-accentDark";
                
                // Calculate percentage only if total_count is greater than 0
                const percent = item.total_count > 0 ? (item.current_progress / item.total_count) * 100 : 0;
                let linkHtml = item.link ? `<a href="${item.link}" target="_blank" class="item-link" title="Open Link">🔗</a>` : '';

                let tagsHtml = '';
                if (item.tags) {
                    const tagArray = item.tags.split(',').map(t => t.trim()).filter(t => t);
                    tagsHtml = `<div class="flex flex-wrap gap-1 mt-1.5 mb-2">
                        ${tagArray.map(tag => `<span class="bg-accent/10 dark:bg-accentDark/10 text-accent dark:text-accentDark text-[0.75em] px-2 py-0.5 rounded-md font-semibold border border-accent/20 dark:border-accentDark/20 truncate max-w-full">${tag}</span>`).join('')}
                    </div>`;
                }

                let coverHtml = item.cover_image
                    ? `<img src="${item.cover_image}" class="w-[65px] h-[90px] sm:w-[85px] sm:h-[120px] object-cover rounded-lg shadow-md shrink-0 border border-gray-200 dark:border-zinc-700" alt="Cover">`
                    : `<div class="w-[65px] h-[90px] sm:w-[85px] sm:h-[120px] bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0 text-3xl border border-dashed border-gray-300 dark:border-zinc-700">📸</div>`;

                let displayTotal = item.total_count > 0 ? item.total_count : "? (Ongoing)";

                li.innerHTML = `
                    <input type="checkbox" data-id="${item.id}" onchange="handleCheckboxChange(this, ${item.id})" class="item-checkbox mt-1 sm:mt-0 w-5 h-5 sm:w-6 sm:h-6 shrink-0 cursor-pointer accent-accent dark:accent-accentDark rounded-md">
                    ${coverHtml}
                    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
                        <div class="flex justify-between items-start gap-2 w-full min-w-0">
                            <div class="flex-1 min-w-0 overflow-hidden">
                                <div class="font-semibold text-[1rem] sm:text-[1.1em] leading-tight break-words whitespace-normal">
                                    ${item.title} 
                                    <span class="text-yellow-400 text-xs sm:text-sm whitespace-nowrap inline-block ml-1">${'⭐'.repeat(item.rating)}</span>
                                    ${linkHtml}
                                </div>
                                ${tagsHtml}
                            </div>
                            
                            <div class="flex flex-col sm:flex-row gap-1.5 shrink-0">
                                <button class="btn-icon btn-edit text-xs sm:text-sm p-1.5 sm:p-[6px_10px]" onclick="startEditItem(${item.id})">✏️</button>
                                <button class="btn-icon btn-delete text-xs sm:text-sm p-1.5 sm:p-[6px_10px]" onclick="deleteItem(${item.id})">🗑️</button>
                            </div>
                        </div>
						
                        <div class="progress-text mt-1 sm:mt-2 text-[0.85em] sm:text-[0.95em] whitespace-normal">
                            Progress: ${item.current_progress} / ${displayTotal}
                            ${item.status !== 'Completed' ? `<button class="btn-plus shadow-sm hover:scale-110 shrink-0 inline-flex" onclick="quickProgress(${item.id}, ${item.current_progress}, ${item.total_count})">+</button>` : ''}
                        </div>
						
                        ${item.total_count > 0 ? `<div class="progress-container w-full mt-1.5 sm:mt-2"><div class="progress-bar" style="width: ${percent}%"></div></div>` : ''}
						
                        ${item.review ? `<span class="item-review text-sm">" ${item.review} "</span>` : ''}
                        
                        <div class="text-[0.7em] opacity-50 mt-1.5 sm:mt-2 flex items-center gap-1 whitespace-normal">
                            🕒 Last updated: ${item.updated_at || item.created_at || 'Unknown'}
                        </div>
                    </div>
                `;
                ul.appendChild(li);
            });
            sec.appendChild(ul);
            listContainer.appendChild(sec);
        }
    });

    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer) {
        if (currentPage * itemsPerPage < totalFiltered) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
    }
}

function loadMoreItems() {
    currentPage++;
    renderItems(allItems);
}

function setFilter(event, f) {
    if (event) event.preventDefault();
    currentFilter = f;
    currentTagFilter = 'All';
    currentPage = 1;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderItems(allItems);
}

// Handle Form Submission
async function handleFormSubmit() {
    const titleInput = document.getElementById('titleInput');
    const title = titleInput.value.trim();

    if(!title) {
        titleInput.classList.add('input-error', 'animate-shake'); // สั่งให้ขอบแดงและสั่น
        titleInput.placeholder = "⚠️ กรุณาใส่ชื่อเรื่องก่อนบันทึก!";
        setTimeout(() => titleInput.classList.remove('animate-shake'), 400);
        return;
    }

    const isDuplicate = allItems.some(item =>
        item.title.toLowerCase() === title.toLowerCase() &&
        (!isEditing || item.id !== parseInt(document.getElementById('editId').value))
    );

    if (isDuplicate) {
        showToast(`ชื่อเรื่อง "${title}" มีอยู่ในลิสต์เรียบร้อยแล้วครับ!`, 'warning');
        titleInput.focus();
        return;
    }
    
    const data = {
        title,
        category: document.getElementById('categoryInput').value,
        status: document.getElementById('statusInput').value,
        rating: parseInt(document.getElementById('ratingInput').value),
        link: document.getElementById('linkInput').value.trim(),
        cover_image: document.getElementById('coverInput').value.trim(),
        tags: document.getElementById('tagsInput').value.trim(),
        review: document.getElementById('reviewInput').value.trim(),
        current_progress: parseInt(document.getElementById('currentProgressInput').value) || 0,
        total_count: parseInt(document.getElementById('totalCountInput').value) || 0
    };
    
    const id = document.getElementById('editId').value;
    
    if (isEditing) {
        const oldItem = allItems.find(x => x.id == id);
        data.id = parseInt(id); // แปะ ID เข้าไปด้วยเพื่อความสมบูรณ์
        await fetch(`${apiUrl}/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
        saveAction({ type: 'edit', oldItem: oldItem, newItem: data }); // บันทึกความจำ
    } else {
        const response = await fetch(apiUrl, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
        const resData = await response.json();
        data.id = resData.id;
        saveAction({ type: 'add', item: data }); // บันทึกความจำ
    }
    
    cancelEdit(); 
    loadItems();
}

// Edit Item functionality
function startEditItem(id) {
    const i = allItems.find(x => x.id === id);
    document.getElementById('titleInput').value = i.title;
    document.getElementById('linkInput').value = i.link || ''; 
    document.getElementById('coverInput').value = i.cover_image || '';
    previewCoverImage();
    document.getElementById('tagsInput').value = i.tags || ''; 
    document.getElementById('currentProgressInput').value = i.current_progress;
    document.getElementById('totalCountInput').value = i.total_count;
    document.getElementById('categoryInput').value = i.category;
    document.getElementById('statusInput').value = i.status;
    document.getElementById('ratingInput').value = i.rating;
    document.getElementById('reviewInput').value = i.review || '';
    document.getElementById('editId').value = i.id;
    
    isEditing = true;
    document.getElementById('submitBtn').textContent = "Update (อัปเดตข้อมูล)";
    document.getElementById('cancelBtn').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    isEditing = false;
    document.getElementById('editId').value = '';
    document.querySelectorAll('input, textarea').forEach(x => x.value = '');
    previewCoverImage();
    document.getElementById('submitBtn').textContent = "Add to List (เพิ่มรายการ)";
    document.getElementById('cancelBtn').classList.add('hidden');
}

// Delete Item
async function deleteItem(id) {
    if(confirm("ลบรายการนี้ใช่ไหม? ข้อมูลจะไม่สามารถกู้คืนได้")) { 
        const deletedItem = allItems.find(x => x.id === id);
        await fetch(`${apiUrl}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        saveAction({ type: 'delete', item: deletedItem }); // บันทึกความจำ
        loadItems(); 
    }
}

let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout); // ถ้านิ้วยังพิมพ์อยู่ ให้ยกเลิกการค้นหารอบที่แล้วทิ้งไป
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        renderItems(allItems);
    }, 300);
}
function handleSort() { currentPage = 1; renderItems(allItems); }

// Theme Toggle System
function toggleTheme() {
    const htmlElement = document.documentElement;
    const isDark = htmlElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('themeIcon');
    icon.textContent = isDark ? '🌙' : '☀️';

    const btn = document.querySelector('.theme-toggle');
    btn.classList.add('rotate-anim');
    setTimeout(() => { btn.classList.remove('rotate-anim'); }, 500);
}

(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = document.getElementById('themeIcon');
    if (savedTheme === 'dark') { icon.textContent = '🌙'; } 
    else { icon.textContent = '☀️'; }
})();

// Function to handle adding a new category via prompt
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
            // 🌟 เพิ่ม Prompt หน้าต่างที่ 2 สำหรับขออีโมจิ
            let emoji = prompt(`ใส่อีโมจิสำหรับหมวดหมู่ "${catName}" (เช่น 🤖, 📖, 🎲)\n*ถ้าไม่ใส่ ระบบจะใช้ 🏷️ ให้แทน*`);

            // เช็คว่าถ้ากดยกเลิก หรือไม่พิมพ์อะไรเลย ให้ใช้ 🏷️
            if (!emoji || emoji.trim() === "") {
                emoji = "🏷️";
            } else {
                emoji = emoji.trim();
            }

            const opt = document.createElement('option');
            opt.value = catName;
            opt.text = emoji + " " + catName; // เอาอีโมจิมาต่อหน้าชื่อ

            const addNewOptionIndex = select.options.length - 1;
            select.insertBefore(opt, select.options[addNewOptionIndex]);
            select.value = catName;

            // 🌟 Save to LocalStorage แบบ Object (เก็บชื่อคู่กับอีโมจิ)
            let savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');

            // ตัวกันเหนียว: เผื่อระบบเดิมของคุณเซฟเป็น Array ไว้ ให้แปลงเป็น Object ก่อน ป้องกันบัค
            if (Array.isArray(savedCustomCats)) {
                const tempObj = {};
                savedCustomCats.forEach(c => tempObj[c] = "🏷️");
                savedCustomCats = tempObj;
            }

            savedCustomCats[catName] = emoji; // บันทึกข้อมูล เช่น {"Series": "🎞️"}
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

// Function to automatically add saved categories to the dropdown on page load
function refreshCategoryDropdown(items) {
    const select = document.getElementById('categoryInput');

    const uniqueCategories = new Set();
    items.forEach(item => {
        if (item.category) uniqueCategories.add(item.category);
    });

    // Load custom categories from LocalStorage
    let savedCustomCats = JSON.parse(localStorage.getItem('customCategories') || '{}');

    // ตัวกันเหนียว: เผื่อระบบเดิมเซฟเป็น Array ไว้
    if (Array.isArray(savedCustomCats)) {
        const tempObj = {};
        savedCustomCats.forEach(c => tempObj[c] = "🏷️");
        savedCustomCats = tempObj;
        localStorage.setItem('customCategories', JSON.stringify(savedCustomCats));
    }

    // เอาชื่อหมวดหมู่ที่เซฟไว้ มารวมกับข้อมูลจากฐานข้อมูล
    Object.keys(savedCustomCats).forEach(cat => uniqueCategories.add(cat));

    const addNewOption = Array.from(select.options).find(opt => opt.value === "ADD_NEW");

    uniqueCategories.forEach(cat => {
        let exists = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === cat) {
                exists = true;
                break;
            }
        }

        if (!exists) {
            const opt = document.createElement('option');
            opt.value = cat;

            // 🌟 ดึงอีโมจิจากที่เซฟไว้ ถ้าไม่เจอ (เช่น เป็นข้อมูลเก่าจาก DB) ให้ใช้ 🏷️
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

// Helper function to rebuild the custom UI created by dropdown.js
function updateCustomDropdownUI(select) {
    const wrapper = select.parentNode;
    const list = wrapper.querySelector('.custom-select-list');
    const spanText = select.customDisplaySpan;

    if (!list) return; // Exit if custom UI is not yet initialized

    list.innerHTML = ''; // Clear old list

    // Rebuild the custom list with the newly added options
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

function handleCategoryChange(selectElement) {
    if (selectElement.value === "ADD_NEW") {
        addNewCategory();
    }
}

// Function to export current data to a JSON file
function exportData() {
    if (allItems.length === 0) {
        showToast("ไม่มีข้อมูลให้สำรองครับ", 'info');
        return;
    }

    // 1. Convert data to JSON string format with indentation (2 spaces)
    const dataStr = JSON.stringify(allItems, null, 2);

    // 2. Create a Blob (file-like object) from the JSON string
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // 3. Create a temporary invisible link to trigger the download
    const a = document.createElement('a');
    a.href = url;

    // Set file name dynamically using the current date (e.g., 2026-05-15)
    const date = new Date().toISOString().split('T')[0];
    a.download = `MediaTracker_Backup_${date}.json`;

    // 4. Click the link programmatically and clean up memory
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to import data from a JSON file using Upsert logic
async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            // 1. Parse the uploaded JSON file
            const importedItems = JSON.parse(e.target.result);

            if (!Array.isArray(importedItems)) {
                throw new Error("รูปแบบไฟล์ไม่ถูกต้อง ต้องเป็น Array (Invalid JSON array format)");
            }

            if (confirm(`พบข้อมูล ${importedItems.length} รายการ ต้องการนำเข้าหรือไม่?\n(ข้อมูลที่มี ID ซ้ำจะถูกอัปเดต ส่วนข้อมูลใหม่จะถูกเพิ่มเข้าไป)`)) {

                // Show loading state on button to prevent multiple clicks
                const label = event.target.parentElement;
                const originalText = label.innerHTML;
                label.innerHTML = "⏳ Loading...";
                label.style.pointerEvents = "none"; // Disable clicks

                // 2. Loop through imported items and process them (Upsert logic)
                for (const item of importedItems) {
                    // Check if item already exists in our current data array
                    const exists = allItems.find(x => x.id === item.id);

                    if (exists) {
                        // If exists, Update it using PUT
                        await fetch(`${apiUrl}/${item.id}`, {
                            method: 'PUT',
                            headers: getAuthHeaders(),
                            body: JSON.stringify(item)
                        });
                    } else {
                        // If not exists, Add new using POST
                        await fetch(apiUrl, {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify(item)
                        });
                    }
                }

                // Restore button UI
                label.innerHTML = originalText;
                label.style.pointerEvents = "auto";

                showToast("✅ นำเข้าข้อมูลเสร็จสิ้น!", 'success');
                loadItems(); // Refresh the display
            }
        } catch (error) {
            showToast("❌ ไฟล์ไม่ถูกต้อง หรือเกิดข้อผิดพลาดในการอ่านข้อมูล", 'error');
            console.error("Import Error:", error);
        }
    };

    // Read the selected file as text
    reader.readAsText(file);

    // Reset file input so the exact same file can be selected again if needed
    event.target.value = '';
}

// Function to preview cover image before saving
function previewCoverImage() {
    const url = document.getElementById('coverInput').value.trim();
    const preview = document.getElementById('coverPreview');

    if (url) {
        preview.src = url;
        preview.classList.remove('hidden'); // แสดงรูป
    } else {
        preview.src = '';
        preview.classList.add('hidden'); // ซ่อนรูปถ้าไม่มีลิงก์
    }
}

// Error Handler: ถ้ารูปโหลดไม่ขึ้น (ลิงก์เสีย/ไม่ใช่รูปภาพ) ให้ซ่อนรูปทิ้งไป
document.getElementById('coverPreview').addEventListener('error', function() {
    this.src = '';
    this.classList.add('hidden');
});

// Function to clear error styling when user starts typing
function clearTitleError(element) {
    element.classList.remove('input-error');
    element.placeholder = "ชื่อเรื่อง (Title)";
}

window.onscroll = function() {
    const btn = document.getElementById('scrollToTopBtn');
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        // ถ้าเลื่อนลงมาเกิน 300px ให้โชว์ปุ่ม
        btn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
        btn.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
    } else {
        // ถ้าอยู่ใกล้ขอบบน ให้ซ่อนปุ่ม
        btn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
        btn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Data Visualization System
function updateCharts(items) {
    const ctx = document.getElementById('mediaChart');
    if (!ctx) return;

    const counts = {};
    items.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    if (mediaChart) {
        mediaChart.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark-mode');
    mediaChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#4a90e2', '#bb86fc', '#28a745', '#f0ad4e', '#dc3545', '#17a2b8'
                ],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#e0e0e0' : '#333',
                        font: { family: 'Prompt', size: 12 },
                        padding: 20
                    }
                }
            }
        }
    });
}

// Auto-fill System (Jikan API)
async function fetchMediaData() {
    const title = document.getElementById('titleInput').value.trim();
    const btn = document.getElementById('autofillBtn');

    if (!title) {
        showToast("⚠️ โปรดระบุชื่อเรื่องที่ต้องการค้นหาก่อนครับ!");
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ กำลังหา...";
    btn.disabled = true;

    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
        const result = await response.json();

        if (result.data && result.data.length > 0) {
            const data = result.data[0];
            document.getElementById('titleInput').value = data.title;

            document.getElementById('coverInput').value = data.images.jpg.large_image_url;
            previewCoverImage();

            document.getElementById('totalCountInput').value = data.episodes || 0;

            if (data.type === 'TV' || data.type === 'Movie' || data.type === 'OVA') {
                document.getElementById('categoryInput').value = 'Anime';
            }

            const genres = data.genres.map(g => g.name).join(', ');
            document.getElementById('tagsInput').value = genres;

            if (window.refreshCategoryDropdown) refreshCategoryDropdown(allItems);

            showToast(`✅ ดึงข้อมูลเรื่อง "${data.title}" สำเร็จ!`, 'success');
        } else {
            showToast("❌ ไม่พบข้อมูลเรื่องนี้ในฐานข้อมูลครับ", 'warning');
        }
    } catch (error) {
        console.error("Autofill Error:", error);
        showToast("❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับ API ครับ", 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Skeleton Loading System
function showSkeleton() {
    const listContainer = document.getElementById('mediaListContainer');
    listContainer.innerHTML = ''; // ล้างหน้าจอเดิม

    for (let i = 0; i < 5; i++) {
        const div = document.createElement('div');
        div.className = "bg-itemLight dark:bg-itemDark mb-3 p-[15px] rounded-xl flex items-center gap-4 border border-transparent";

        div.innerHTML = `
            <div class="w-[85px] h-[120px] skeleton shrink-0"></div>
            <div class="flex-1">
                <div class="h-6 w-3/4 skeleton mb-3"></div>
                <div class="h-4 w-1/2 skeleton mb-2"></div>
                <div class="h-4 w-full skeleton mb-2"></div>
                <div class="h-10 w-full skeleton mt-4"></div>
            </div>
        `;
        listContainer.appendChild(div);
    }
}

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');

    const config = {
        success: { bg: 'border-l-[#28a745]', icon: '✅', title: 'Success', textColor: 'text-[#28a745]' },
        error: { bg: 'border-l-[#dc3545]', icon: '❌', title: 'Error', textColor: 'text-[#dc3545]' },
        warning: { bg: 'border-l-[#f0ad4e]', icon: '⚠️', title: 'Warning', textColor: 'text-[#f0ad4e]' },
        info: { bg: 'border-l-[#17a2b8]', icon: 'ℹ️', title: 'Info', textColor: 'text-[#17a2b8]' }
    };

    const current = config[type] || config.success;

    toast.className = `toast-in pointer-events-auto bg-containerLight dark:bg-containerDark border-l-4 ${current.bg} p-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px] max-w-[350px] border border-gray-200 dark:border-zinc-800`;

    toast.innerHTML = `
        <div class="text-xl">${current.icon}</div>
        <div class="flex-1">
            <div class="font-bold text-[0.9em] ${current.textColor}">${current.title}</div>
            <div class="text-[0.85em] opacity-90">${message}</div>
        </div>
        <button onclick="this.parentElement.remove()" class="opacity-50 hover:opacity-100 text-lg">×</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Tag Filter System
function updateTagFilters(items) {
    const container = document.getElementById('tagFiltersContainer');
    if (!container) return;

    const allTags = new Set();
    items.forEach(item => {
        if (item.tags) {
            item.tags.split(',').forEach(t => {
                const tag = t.trim();
                if (tag) allTags.add(tag);
            });
        }
    });

    const sortedTags = Array.from(allTags).sort();
    let html = `
        <button onclick="setTagFilter('All')" class="px-3 py-1.5 rounded-lg text-[0.8em] font-bold transition-all border ${currentTagFilter === 'All' ? 'bg-accent text-white border-accent' : 'bg-black/5 dark:bg-white/5 border-gray-200 dark:border-zinc-700 opacity-60'}">
            # ทั้งหมด
        </button>
    `;

    sortedTags.forEach(tag => {
        const isActive = currentTagFilter === tag;
        html += `
            <button onclick="setTagFilter('${tag}')" class="px-2.5 py-1 rounded-full text-[0.75em] font-medium transition-all border ${isActive ? 'bg-accent text-white border-accent' : 'bg-black/5 dark:bg-white/5 border-gray-200 dark:border-zinc-700 opacity-70 hover:opacity-100'}">
                # ${tag}
            </button>
        `;
    });

    container.innerHTML = html;
}

function setTagFilter(tag) {
    currentTagFilter = tag;
    renderItems(allItems);
    updateTagFilters(allItems);
}

// Auth System
async function handleLogin() {
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;

    const response = await fetch(`${apiUrl.replace('/items', '')}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('current_username', username); // 🌟 บันทึกชื่อ User เก็บไว้โชว์
        location.reload();
    } else {
        showToast("Login Failed!", 'error');
    }
}

// Function to toggle password visibility with Font Awesome
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}

function handleLogout() {
    if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_username');
        location.reload();
    }
}

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    };
}

// Auth System
function checkAuth() {
    const token = localStorage.getItem('access_token');
    const modal = document.getElementById('loginModal');
    const userInfoPanel = document.getElementById('userInfoPanel');
    const usernameDisplay = document.getElementById('currentUsernameDisplay');

    if (!token) {
        modal.classList.remove('hidden');
        if (userInfoPanel) userInfoPanel.classList.add('hidden');
    } else {
        modal.classList.add('hidden');
        if (userInfoPanel) userInfoPanel.classList.remove('hidden');

        const savedName = localStorage.getItem('current_username') || "User";
        if (usernameDisplay) usernameDisplay.textContent = savedName;

        loadItems();
    }
}

function toggleAuthView(view) {
    const loginSec = document.getElementById('loginSection');
    const regSec = document.getElementById('registerSection');

    if (view === 'register') {
        loginSec.classList.add('hidden');
        regSec.classList.remove('hidden');
    } else {
        regSec.classList.add('hidden');
        loginSec.classList.remove('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('regUsernameInput').value.trim();
    const pass = document.getElementById('regPasswordInput').value;
    const confirmPass = document.getElementById('regConfirmPassword').value;
	
    if (!user || !pass || !confirmPass) {
        showToast("❌ กรุณากรอกข้อมูลให้ครบถ้วน!", 'error');
        return;
    }
	
    if (pass !== confirmPass) {
        showToast("❌ รหัสผ่านไม่ตรงกัน!", 'error');
        return;
    }
	
    const masterKey = getMasterKey();
    if (!masterKey) {
        showToast("❌ ยกเลิกการสมัคร: จำเป็นต้องใช้ Master Key", 'error');
        return;
    }
	
    const btn = document.getElementById('regBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังสมัคร...';
    btn.disabled = true;
	
    try {
        const response = await fetch(apiUrl.replace('/items', '/register'), {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-API-Key': masterKey // 🔑 แนบกุญแจไปกับ Headers เพื่อตรวจสอบ
            },
            body: JSON.stringify({ username: user, password: pass })
        });
		
        if (response.status === 401) {
            localStorage.removeItem('mt_master_key');
            showToast("❌ Master Key ไม่ถูกต้อง!", 'error');
            return;
        }
		
        if (response.ok) {
            showToast("✅ สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ", 'success');
            toggleAuthMode();
			
            document.getElementById('regUsernameInput').value = '';
            document.getElementById('regPasswordInput').value = '';
            document.getElementById('regConfirmPassword').value = '';
        } else {
            const res = await response.json();
            showToast(res.message || "❌ Registration Failed!", 'error');
        }
    } catch (error) {
        console.error(error);
        showToast("❌ Server error during registration.", 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// PWA Custom Install Prompt System
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
        installBtn.classList.remove('hidden');
    }
});

document.getElementById('installAppBtn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            showToast('ผู้ใช้กดติดตั้งแอปเรียบร้อย', 'success');
        } else {
            showToast('ผู้ใช้กดยกเลิกการติดตั้ง', 'error');
        }

        deferredPrompt = null;
        document.getElementById('installAppBtn').classList.add('hidden');
    }
});

// Initialize app
checkAuth();
updateUndoRedoUI();