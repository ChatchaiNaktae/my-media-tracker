import { getAuthHeaders } from './auth.js';
import { showToast, closeItemModal, openItemModal } from './ui.js';
import { saveAction } from './history.js';
import { API_BASE_URL } from './config.js';

const apiUrl = `${API_BASE_URL}/items`;

let isEditing = false;

export async function quickProgress(id, current, total) {
    if (total > 0 && current >= total) return;
    
    const currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];
    const oldItem = currentItems.find(x => x.id === id);
    const newItem = { ...oldItem, current_progress: current + 1 };

    await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ current_progress: current + 1 })
    });
    
    saveAction({ type: 'edit', oldItem: oldItem, newItem: newItem }); 
    if (typeof window.loadItems === 'function') window.loadItems();
}

function clearFieldErrors() {
    document.querySelectorAll('.input-error').forEach(function (el) {
        el.classList.remove('input-error');
    });
    document.querySelectorAll('.field-error-msg').forEach(function (el) {
        el.remove();
    });
}

function showFieldError(inputEl, message) {
    inputEl.classList.add('input-error');
    var msg = document.createElement('p');
    msg.className = 'field-error-msg text-xs text-red-500 dark:text-red-400 mt-1';
    msg.textContent = message;
    inputEl.parentNode.appendChild(msg);
}

export async function handleFormSubmit() {
    var titleInput = document.getElementById('titleInput');
    var title = titleInput.value.trim();

    clearFieldErrors();

    var firstError = false;

    if (!title) {
        titleInput.classList.add('input-error', 'animate-shake');
        titleInput.placeholder = "กรุณาใส่ชื่อเรื่องก่อนบันทึก!";
        setTimeout(function () { titleInput.classList.remove('animate-shake'); }, 400);
        if (!firstError) { titleInput.focus(); firstError = true; }
    }

    var linkVal = document.getElementById('linkInput').value.trim();
    if (linkVal && !/^https?:\/\//i.test(linkVal)) {
        showFieldError(document.getElementById('linkInput'), 'ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://');
        if (!firstError) { document.getElementById('linkInput').focus(); firstError = true; }
    }

    var coverVal = document.getElementById('coverInput').value.trim();
    if (coverVal && !/^https?:\/\//i.test(coverVal)) {
        showFieldError(document.getElementById('coverInput'), 'ลิงก์รูปภาพต้องขึ้นต้นด้วย http:// หรือ https://');
        if (!firstError) { document.getElementById('coverInput').focus(); firstError = true; }
    }

    var currentProgress = parseInt(document.getElementById('currentProgressInput').value, 10);
    var totalCount = parseInt(document.getElementById('totalCountInput').value, 10);
    if (document.getElementById('currentProgressInput').value !== '' && (isNaN(currentProgress) || currentProgress < 0)) {
        showFieldError(document.getElementById('currentProgressInput'), 'ต้องเป็นตัวเลข 0 ขึ้นไป');
        if (!firstError) { document.getElementById('currentProgressInput').focus(); firstError = true; }
    }
    if (document.getElementById('totalCountInput').value !== '' && (isNaN(totalCount) || totalCount < 0)) {
        showFieldError(document.getElementById('totalCountInput'), 'ต้องเป็นตัวเลข 0 ขึ้นไป');
        if (!firstError) { document.getElementById('totalCountInput').focus(); firstError = true; }
    }
    if (!firstError && !isNaN(currentProgress) && !isNaN(totalCount) && totalCount > 0 && currentProgress > totalCount) {
        showFieldError(document.getElementById('currentProgressInput'), 'ตอนที่ดูถึงต้องไม่เกินตอนทั้งหมด');
        document.getElementById('currentProgressInput').focus();
        firstError = true;
    }

    if (firstError) return;

    var currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];
    var isDuplicate = currentItems.some(function (item) {
        return item.title.toLowerCase() === title.toLowerCase() &&
            (!isEditing || item.id !== parseInt(document.getElementById('editId').value, 10));
    });

    if (isDuplicate) {
        showToast('ชื่อเรื่อง "' + title + '" มีอยู่ในลิสต์เรียบร้อยแล้วครับ!', 'warning');
        titleInput.focus();
        return;
    }

    var data = {
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
        const oldItem = currentItems.find(x => x.id == id);
        data.id = parseInt(id);
        await fetch(`${apiUrl}/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
        saveAction({ type: 'edit', oldItem: oldItem, newItem: data });
    } else {
        const response = await fetch(apiUrl, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
        const resData = await response.json();
        data.id = resData.id;
        saveAction({ type: 'add', item: data }); 
    }
    
    cancelEdit(); 
    if (typeof window.loadItems === 'function') window.loadItems();
    closeItemModal();
}

export function startEditItem(id) {
    const currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];
    const i = currentItems.find(x => x.id === id);
    
    document.getElementById('titleInput').value = i.title;
    document.getElementById('linkInput').value = i.link || ''; 
    document.getElementById('coverInput').value = i.cover_image || '';
    
    if (typeof window.previewCoverImage === 'function') window.previewCoverImage();
    
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

    openItemModal();
}

export function cancelEdit() {
    isEditing = false;
    document.getElementById('editId').value = '';
    document.querySelectorAll('input, textarea').forEach(x => x.value = '');
    if (typeof window.previewCoverImage === 'function') window.previewCoverImage();
    document.getElementById('submitBtn').textContent = "Add to List (เพิ่มรายการ)";
    document.getElementById('cancelBtn').classList.add('hidden');

    // Collapse advanced fields section
    var advancedSection = document.getElementById('advancedFieldsSection');
    var toggleBtn = document.getElementById('toggleAdvancedFields');
    var chevron = toggleBtn ? toggleBtn.querySelector('.fa-chevron-down') : null;
    if (advancedSection) advancedSection.classList.add('hidden');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    if (chevron) chevron.style.transform = '';
}

export async function deleteItem(id) {
    window.showConfirmDialog('ลบรายการ', 'ลบรายการนี้ใช่ไหม?\n(สามารถกู้คืนได้ด้วย Undo)', async function () {
        const currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];
        const deletedItem = currentItems.find(x => x.id === id);

        await fetch(`${apiUrl}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        saveAction({ type: 'delete', item: deletedItem });
        if (typeof window.loadItems === 'function') window.loadItems();
    });
}