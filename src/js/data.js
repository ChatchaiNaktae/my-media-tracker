import { getAuthHeaders } from './auth.js';
import { showToast } from './ui.js';
import { API_BASE_URL } from './config.js';

const apiUrl = `${API_BASE_URL}/items`;

// Function to export current data to a JSON file
export function exportData() {
    const currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];
    
    if (currentItems.length === 0) {
        showToast("ไม่มีข้อมูลให้สำรองครับ", 'info');
        return;
    }

    const dataStr = JSON.stringify(currentItems, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;

    const date = new Date().toISOString().split('T')[0];
    a.download = `MediaTracker_Backup_${date}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to import data from a JSON file using Upsert logic
export async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedItems = JSON.parse(e.target.result);

            if (!Array.isArray(importedItems)) {
                throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
            }

            if (confirm(`พบข้อมูล ${importedItems.length} รายการ ต้องการนำเข้าหรือไม่?\n(ข้อมูลที่มี ID ซ้ำจะถูกอัปเดต ส่วนข้อมูลใหม่จะถูกเพิ่มเข้าไป)`)) {

                const label = event.target.parentElement;
                const originalText = label.innerHTML;
                label.innerHTML = "⏳ Loading...";
                label.style.pointerEvents = "none";

                const currentItems = typeof window.getAllItems === 'function' ? window.getAllItems() : [];

                for (const item of importedItems) {
                    const exists = currentItems.find(x => x.id === item.id);

                    if (exists) {
                        await fetch(`${apiUrl}/${item.id}`, {
                            method: 'PUT',
                            headers: getAuthHeaders(),
                            body: JSON.stringify(item)
                        });
                    } else {
                        await fetch(apiUrl, {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify(item)
                        });
                    }
                }

                label.innerHTML = originalText;
                label.style.pointerEvents = "auto";

                showToast("✅ นำเข้าข้อมูลเสร็จสิ้น!", 'success');
                if (typeof window.loadItems === 'function') window.loadItems(); 
            }
        } catch (error) {
            showToast("❌ ไฟล์ไม่ถูกต้อง หรือเกิดข้อผิดพลาดในการอ่านข้อมูล", 'error');
            console.error("Import Error:", error);
        }
    };

    reader.readAsText(file);
    event.target.value = '';
}

// Auto-fill System (Jikan API)
export async function fetchMediaData() {
    const title = document.getElementById('titleInput').value.trim();
    const btn = document.getElementById('autofillBtn');

    if (!title) {
        showToast("⚠️ โปรดระบุชื่อเรื่องที่ต้องการค้นหาก่อนครับ!", "error");
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
            
            // สั่งอัปเดตพรีวิวรูปภาพ (ดึงจาก script.js)
            if (typeof window.previewCoverImage === 'function') window.previewCoverImage();

            document.getElementById('totalCountInput').value = data.episodes || 0;

            if (data.type === 'TV' || data.type === 'Movie' || data.type === 'OVA') {
                document.getElementById('categoryInput').value = 'Anime';
            }

            const genres = data.genres.map(g => g.name).join(', ');
            document.getElementById('tagsInput').value = genres;

            if (typeof window.refreshCategoryDropdown === 'function' && typeof window.getAllItems === 'function') {
                window.refreshCategoryDropdown(window.getAllItems());
            }

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