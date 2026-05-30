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

// PWA Custom Install Prompt System
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) installBtn.classList.remove('hidden');
});

document.getElementById('installAppBtn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') window.showToast('ผู้ใช้กดติดตั้งแอปเรียบร้อย', 'success');
        else window.showToast('ผู้ใช้กดยกเลิกการติดตั้ง', 'error');
        deferredPrompt = null;
        document.getElementById('installAppBtn').classList.add('hidden');
    }
});

// Utility Functions
window.previewCoverImage = function() {
    const url = document.getElementById('coverInput').value.trim();
    const preview = document.getElementById('coverPreview');
    if (url) {
        preview.src = url;
        preview.classList.remove('hidden'); 
    } else {
        preview.src = '';
        preview.classList.add('hidden'); 
    }
}

document.getElementById('coverPreview').addEventListener('error', function() {
    this.src = '';
    this.classList.add('hidden');
});

function clearTitleError(element) {
    element.classList.remove('input-error');
    element.placeholder = "ชื่อเรื่อง (Title)";
}

window.onscroll = function() {
    const btn = document.getElementById('scrollToTopBtn');
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        btn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
        btn.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
    } else {
        btn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
        btn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    }
};

window.checkAuth();
if (typeof window.updateUndoRedoUI === 'function') window.updateUndoRedoUI();