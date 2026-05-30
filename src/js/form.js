import { getAuthHeaders } from './auth.js';
import { showToast, closeItemModal, openItemModal } from './ui.js';
import { saveAction } from './history.js';

const apiUrl = '/items';

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

export async function handleFormSubmit() {
    const titleInput = document.getElementById('titleInput');
    const title = titleInput.value.trim();

    if(!title) {
        titleInput.classList.add('input-error', 'animate-shake'); 
        titleInput.placeholder = "⚠️ กรุณาใส่ชื่อเรื่องก่อนบันทึก!";
        setTimeout(() => titleInput.classList.remove('animate-shake'), 400);
        return;
    }

    const currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];
    const isDuplicate = currentItems.some(item =>
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
}

export async function deleteItem(id) {
    if(confirm("ลบรายการนี้ใช่ไหม? ข้อมูลจะไม่สามารถกู้คืนได้")) { 
        const currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];
        const deletedItem = currentItems.find(x => x.id === id);
        
        await fetch(`${apiUrl}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        saveAction({ type: 'delete', item: deletedItem });
        if (typeof window.loadItems === 'function') window.loadItems(); 
    }
}