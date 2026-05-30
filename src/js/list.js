import { getAuthHeaders } from './auth.js';
import { showSkeleton } from './ui.js';

const apiUrl = 'https://my-media-tracker-api.onrender.com/items';

let allItems = [];
let currentFilter = 'All';
let currentTagFilter = 'All';
let currentPage = 1;
const itemsPerPage = 15;

// Export state for other modules to use
export function getAllItems() { return allItems; }

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
        if (response.status === 401) {
            console.warn("Token expired or unauthorized. Forcing logout.");
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_username');
            location.reload();
            return;
        }

        allItems = await response.json();
        
        // Update other UI components if they exist
        if (typeof window.refreshCategoryDropdown === 'function') window.refreshCategoryDropdown(allItems);
        renderItems(allItems);
        if (typeof window.updateDashboard === 'function') window.updateDashboard(allItems);
        if (typeof window.updateCharts === 'function') window.updateCharts(allItems);
        updateTagFilters(allItems);
    } catch (error) {
        console.error("Load Error:", error);
        const container = document.getElementById('mediaListContainer');
        if (container) container.innerHTML = '<p class="text-center py-10 opacity-50">❌ ไม่สามารถดึงข้อมูลได้ โปรดลองใหม่อีกครั้ง</p>';
    }
}

// Render the items to HTML
export function renderItems(items) {
    const listContainer = document.getElementById('mediaListContainer');
    if (!listContainer) return;
    
    listContainer.innerHTML = ''; 
    if (typeof window.clearSelectedItems === 'function') window.clearSelectedItems();
    if (typeof window.updateMultiSelectUI === 'function') window.updateMultiSelectUI();

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
            sec.innerHTML = `<h3 class="category-header">${cat}</h3>`;
            const ul = document.createElement('ul');
            ul.className = 'category-list';
            
            groups[cat].forEach(item => {
                const li = document.createElement('li');
                li.className = "bg-itemLight dark:bg-itemDark mb-3 p-3 sm:p-[15px] rounded-xl flex items-start gap-3 sm:gap-4 transition-all duration-200 shadow-sm border border-transparent hover:border-accent hover:dark:border-accentDark";
                
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

export function setTagFilter(tag) {
    currentTagFilter = tag;
    renderItems(allItems);
    updateTagFilters(allItems);
}