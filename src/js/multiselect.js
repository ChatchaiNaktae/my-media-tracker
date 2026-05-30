import { getAuthHeaders } from './auth.js';
import { showToast } from './ui.js';
import { saveAction } from './history.js';
import { API_BASE_URL } from './config.js';

const apiUrl = `${API_BASE_URL}/items`;

let selectedItems = new Set();

export function clearSelectedItems() {
    selectedItems.clear();
}

export function updateMultiSelectUI() {
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
        if (selectAllCheckbox) selectAllCheckbox.checked = allChecked;
    } else {
        controls.classList.add('hidden');
        if (selectAllCheckbox) selectAllCheckbox.checked = false;
        deleteBtn.setAttribute('disabled', 'disabled');
    }
}

export function handleCheckboxChange(checkbox, id) {
    if (checkbox.checked) selectedItems.add(id);
    else selectedItems.delete(id);
    updateMultiSelectUI();
}

export function toggleSelectAll(checkbox) {
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

export async function deleteSelectedItems() {
    if (selectedItems.size === 0) return;
    if (confirm(`คุณต้องการลบ ${selectedItems.size} รายการที่เลือกใช่หรือไม่?\n(ลบแล้วกู้คืนไม่ได้นะ)`)) {
        const currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];
        const deletedItems = currentItems.filter(x => selectedItems.has(x.id)); 

        const btn = document.getElementById('deleteSelectedBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = "⏳ ลบข้อมูล...";
        btn.disabled = true;

        try {
            await fetch(`${apiUrl}/batch-delete`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ ids: Array.from(selectedItems) })
            });
            
            saveAction({ type: 'batch_delete', items: deletedItems }); 
            selectedItems.clear();
            updateMultiSelectUI();
            showToast("✅ ลบรายการที่เลือกสำเร็จ!", 'success');
            
            if (typeof window.loadItems === 'function') window.loadItems();
        } catch (error) {
            console.error("Batch Delete Error:", error);
            showToast("❌ เกิดข้อผิดพลาดในการลบข้อมูล", 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}