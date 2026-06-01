import { getAuthHeaders } from './auth.js';
import { showSkeleton } from './ui.js';
import { API_BASE_URL } from './config.js';
import { escapeHtml, sanitizeUrl } from './utils.js';

const apiUrl = `${API_BASE_URL}/items`;

let allItems = [];
let currentFilter = 'All';
let currentTagFilter = 'All';
let currentPage = 1;
const itemsPerPage = 15;

// Export state for other modules to use
export function getAllItems() { return allItems; }

// Timestamp formatter: DD/MM/YYYY HH:MM:SS
export function formatTimestamp(isoString) {
    if (!isoString) return 'Unknown';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Unknown';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Smart Search Acronym
export function getAcronym(title) {
    if (!title) return "";
    const matches = title.match(/(?:^|\s)(\S)/g);
    if (matches) {
        return matches.map(char => char.trim().toLowerCase()).join('');
    }
    return "";
}

// Load data from backend
export async function loadItems() {
    showSkeleton();

    try {
        const response = await fetch(apiUrl, { headers: getAuthHeaders() });
        if (response.status === 401 || response.status === 422) {
            console.warn("Token expired, invalid, or unauthorized. Forcing logout.");
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_username');
            location.reload();
            return;
        }

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error("Invalid response format: expected an array.");
        }

        allItems = data;

        // Update other UI components if they exist
        if (typeof window.refreshCategoryDropdown === 'function') window.refreshCategoryDropdown(allItems);
        renderItems(allItems);
        if (typeof window.updateDashboard === 'function') window.updateDashboard(allItems);
        if (typeof window.updateCharts === 'function') window.updateCharts(allItems);
        updateTagFilters(allItems);
    } catch (error) {
        console.error("Load Error:", error);
        const container = document.getElementById('mediaListContainer');
        if (container) container.innerHTML = `
            <div class="text-center py-16 px-6">
                <i class="fa-solid fa-triangle-exclamation text-5xl mb-4 text-amber-500" aria-hidden="true"></i>
                <h3 class="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">ไม่สามารถโหลดข้อมูลได้</h3>
                <p class="opacity-60 mb-6 text-sm">กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต แล้วลองใหม่อีกครั้ง</p>
                <button onclick="loadItems()" class="px-6 py-3 bg-accent dark:bg-accentDark text-white font-bold rounded-xl shadow-md hover:scale-105 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accentDark focus-visible:ring-offset-2">
                    <i class="fa-solid fa-rotate-right" aria-hidden="true"></i> ลองใหม่
                </button>
            </div>
        `;
    }
}

// Render the items to HTML
export function renderItems(items) {
    const listContainer = document.getElementById('mediaListContainer');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    if (typeof window.clearSelectedItems === 'function') window.clearSelectedItems();
    if (typeof window.updateMultiSelectUI === 'function') window.updateMultiSelectUI();

    if (items.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-16 px-6">
                <i class="fa-solid fa-layer-group text-5xl mb-4 text-accent dark:text-accentDark" aria-hidden="true"></i>
                <h3 class="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">ยังไม่มีรายการ</h3>
                <p class="opacity-60 mb-6 text-sm">เริ่มต้นเพิ่มอนิเมะ เกม หรือหนังที่คุณชอบได้เลย!</p>
                <button onclick="openItemModal()" class="px-6 py-3 bg-accent dark:bg-accentDark text-white font-bold rounded-xl shadow-md hover:scale-105 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accentDark focus-visible:ring-offset-2">
                    <i class="fa-solid fa-plus" aria-hidden="true"></i> เพิ่มรายการแรก
                </button>
            </div>
        `;
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
        return;
    }

    let filtered = items.filter(i => {
        let matchesStatus;
        if (currentFilter === 'All') matchesStatus = true;
        else if (currentFilter === 'Progress') matchesStatus = (i.total_count > 0);
        else matchesStatus = (i.status === currentFilter);

        const searchInput = document.getElementById('searchInput');
        const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const itemAcronym = getAcronym(i.title);
        const itemTags = i.tags ? i.tags.toLowerCase() : "";
        const matchesSearch = i.title.toLowerCase().includes(term) || itemAcronym.includes(term) || itemTags.includes(term);

        const itemTagList = i.tags ? i.tags.split(',').map(t => t.trim()) : [];
        const matchesTag = (currentTagFilter === 'All') || itemTagList.includes(currentTagFilter);

        return matchesStatus && matchesSearch && matchesTag;
    });

    const sortInput = document.getElementById('sortInput');
    const sortType = sortInput ? sortInput.value : 'newest';

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

    dynamicCategories.forEach(cat => {
        if (groups[cat]) {
            const sec = document.createElement('div');
            sec.innerHTML = `<h3 class="category-header">${escapeHtml(cat)}</h3>`;
            const ul = document.createElement('ul');
            ul.className = 'category-list';

            groups[cat].forEach(item => {
                const li = document.createElement('li');
                li.className = "bg-itemLight dark:bg-itemDark mb-3 p-3 sm:p-[15px] rounded-2xl flex items-start gap-3 sm:gap-4 transition-all duration-200 shadow-sm border border-transparent hover:border-accent hover:dark:border-accentDark hover:scale-[1.01] hover:shadow-lg";

                const percent = item.total_count > 0 ? (item.current_progress / item.total_count) * 100 : 0;

                // Sanitize URL — blocks javascript: protocol
                const safeLink = sanitizeUrl(item.link);
                let linkHtml = safeLink
                    ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="item-link" title="Open Link" aria-label="Open link for ${escapeHtml(item.title)}"><i class="fa-solid fa-link" aria-hidden="true"></i></a>`
                    : '';

                let tagsHtml = '';
                if (item.tags) {
                    const tagArray = item.tags.split(',').map(t => t.trim()).filter(t => t);
                    const safeCover = sanitizeUrl(item.cover_image);
                    tagsHtml = `<div class="flex flex-wrap gap-1 mt-1.5 mb-2">
                        ${tagArray.map(tag => `<span class="bg-accent/10 dark:bg-accentDark/10 text-accent dark:text-accentDark text-[0.75em] px-2 py-0.5 rounded-md font-semibold border border-accent/20 dark:border-accentDark/20 truncate max-w-full">${escapeHtml(tag)}</span>`).join('')}
                    </div>`;
                }

                // Sanitize cover image URL — blocks javascript: protocol
                const safeCover = sanitizeUrl(item.cover_image);
                let coverHtml = safeCover
                    ? `<img src="${safeCover}" class="w-[65px] h-[90px] sm:w-[85px] sm:h-[120px] object-cover rounded-lg shadow-md shrink-0 border border-gray-200 dark:border-zinc-700" alt="${escapeHtml(item.title)} cover" loading="lazy">`
                    : `<div class="w-[65px] h-[90px] sm:w-[85px] sm:h-[120px] bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center shrink-0 text-3xl border border-dashed border-gray-300 dark:border-zinc-700" aria-hidden="true"><i class="fa-solid fa-image text-gray-400 dark:text-zinc-600"></i></div>`;

                let displayTotal = item.total_count > 0 ? item.total_count : "? (Ongoing)";

                li.innerHTML = `
                    <input type="checkbox" data-id="${item.id}" onchange="handleCheckboxChange(this, ${item.id})" class="item-checkbox mt-1 sm:mt-0 w-5 h-5 sm:w-6 sm:h-6 shrink-0 cursor-pointer accent-accent dark:accent-accentDark rounded-md focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accentDark focus-visible:ring-offset-1" aria-label="Select ${escapeHtml(item.title)}">
                    ${coverHtml}
                    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
                        <div class="flex justify-between items-start gap-2 w-full min-w-0">
                            <div class="flex-1 min-w-0 overflow-hidden">
                                <div class="font-semibold text-[1rem] sm:text-[1.1em] leading-tight break-words whitespace-normal">
                                    ${escapeHtml(item.title)}
                                    <span class="text-yellow-400 text-xs sm:text-sm whitespace-nowrap inline-block ml-1" aria-label="${item.rating} star${item.rating !== 1 ? 's' : ''}">${Array(item.rating).fill('<i class="fa-solid fa-star" aria-hidden="true"></i>').join('')}</span>
                                    ${linkHtml}
                                </div>
                                ${tagsHtml}
                            </div>

                            <div class="flex flex-col sm:flex-row gap-1.5 shrink-0">
                                <button class="btn-icon btn-edit text-xs sm:text-sm p-1.5 sm:p-[6px_10px] min-w-[44px] min-h-[44px]" onclick="startEditItem(${item.id})" aria-label="Edit ${escapeHtml(item.title)}"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
                                <button class="btn-icon btn-delete text-xs sm:text-sm p-1.5 sm:p-[6px_10px] min-w-[44px] min-h-[44px]" onclick="deleteItem(${item.id})" aria-label="Delete ${escapeHtml(item.title)}"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>
                            </div>
                        </div>

                        <div class="progress-text mt-1 sm:mt-2 text-[0.85em] sm:text-[0.95em] whitespace-normal">
                            Progress: ${item.current_progress} / ${displayTotal}
                            ${item.status !== 'Completed' ? `<button class="btn-plus shadow-sm hover:scale-110 shrink-0 inline-flex" onclick="quickProgress(${item.id}, ${item.current_progress}, ${item.total_count})">+</button>` : ''}
                        </div>

                        ${item.total_count > 0 ? `<div class="progress-container w-full mt-1.5 sm:mt-2"><div class="progress-bar" style="width: ${percent}%"></div></div>` : ''}

                        ${item.review ? `<span class="item-review text-sm">" ${escapeHtml(item.review)} "</span>` : ''}

                        <div class="text-[0.7em] opacity-50 mt-1.5 sm:mt-2 flex items-center gap-1 whitespace-normal">
                            <i class="fa-solid fa-clock" aria-hidden="true"></i> Last updated: ${formatTimestamp(item.updated_at || item.created_at)}
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

// Pagination, Search, and Filters
export function loadMoreItems() {
    currentPage++;
    renderItems(allItems);
}

export function setFilter(event, f) {
    if (event) event.preventDefault();
    currentFilter = f;
    currentTagFilter = 'All';
    currentPage = 1;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if(event && event.target) event.target.classList.add('active');
    renderItems(allItems);
}

let searchTimeout;
export function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        renderItems(allItems);
    }, 300);
}

export function handleSort() {
    currentPage = 1;
    renderItems(allItems);
}

export function updateTagFilters(items) {
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

    // Build tag filter buttons using DOM to avoid XSS via innerHTML
    container.innerHTML = '';

    const allBtn = document.createElement('button');
    const allActive = currentTagFilter === 'All';
    allBtn.type = 'button';
    allBtn.className = 'px-3 py-1.5 rounded-lg text-[0.8em] font-bold transition-all border ' + (allActive ? 'bg-accent text-white border-accent' : 'bg-black/5 dark:bg-white/5 border-gray-200 dark:border-zinc-700 opacity-60');
    allBtn.textContent = '# ทั้งหมด';
    allBtn.addEventListener('click', () => setTagFilter('All'));
    container.appendChild(allBtn);

    sortedTags.forEach(tag => {
        const isActive = currentTagFilter === tag;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'px-2.5 py-1 rounded-full text-[0.75em] font-medium transition-all border ' + (isActive ? 'bg-accent text-white border-accent' : 'bg-black/5 dark:bg-white/5 border-gray-200 dark:border-zinc-700 opacity-70 hover:opacity-100');
        btn.textContent = '# ' + tag;
        btn.addEventListener('click', () => setTagFilter(tag));
        container.appendChild(btn);
    });
}

export function setTagFilter(tag) {
    currentTagFilter = tag;
    renderItems(allItems);
    updateTagFilters(allItems);
}
