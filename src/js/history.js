import { getAuthHeaders } from './auth.js';

const apiUrl = '/api/items';

let undoStack = [];
let redoStack = [];

export function saveAction(action) {
    undoStack.push(action);
    if (undoStack.length > 30) undoStack.shift();
    redoStack = []; 
    updateUndoRedoUI();
}

export function updateUndoRedoUI() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (!undoBtn || !redoBtn) return;
    
    if(undoStack.length > 0) {
        undoBtn.disabled = false;
        undoBtn.classList.remove('opacity-30', 'cursor-not-allowed');
    } else {
        undoBtn.disabled = true;
        undoBtn.classList.add('opacity-30', 'cursor-not-allowed');
    }

    if(redoStack.length > 0) {
        redoBtn.disabled = false;
        redoBtn.classList.remove('opacity-30', 'cursor-not-allowed');
    } else {
        redoBtn.disabled = true;
        redoBtn.classList.add('opacity-30', 'cursor-not-allowed');
    }
}

export async function triggerUndo() {
    if (undoStack.length === 0) return;
    const action = undoStack.pop();
    redoStack.push(action); 
    updateUndoRedoUI();
    await revertAction(action, true);
    // สั่งโหลดข้อมูลใหม่หลังย้อนกลับเสร็จ
    if (typeof window.loadItems === 'function') window.loadItems();
}

export async function triggerRedo() {
    if (redoStack.length === 0) return;
    const action = redoStack.pop();
    undoStack.push(action); 
    updateUndoRedoUI();
    await revertAction(action, false);
    if (typeof window.loadItems === 'function') window.loadItems();
}

async function revertAction(action, isUndo) {
    if (action.type === 'add') {
        if (isUndo) {
            await fetch(`${apiUrl}/${action.item.id}`, { method: 'DELETE', headers: getAuthHeaders() });
        } else {
            await fetch(apiUrl, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(action.item) });
        }
    }
    else if (action.type === 'edit') {
        const payload = isUndo ? action.oldItem : action.newItem;
        await fetch(`${apiUrl}/${payload.id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
    }
    else if (action.type === 'delete') {
        if (isUndo) {
            await fetch(apiUrl, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(action.item) });
        } else {
            await fetch(`${apiUrl}/${action.item.id}`, { method: 'DELETE', headers: getAuthHeaders() });
        }
    }
    else if (action.type === 'batch_delete') {
        if (isUndo) {
            for (let item of action.items) {
                await fetch(apiUrl, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(item) });
            }
        } else {
            const ids = action.items.map(i => i.id);
            await fetch(`${apiUrl}/batch-delete`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ ids }) });
        }
    }
}