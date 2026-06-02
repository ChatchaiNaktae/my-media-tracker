/**
 * Reusable confirmation dialog modal.
 * Replaces native browser confirm() calls with a custom-styled modal
 * that matches the project's design system (dark/light theme).
 *
 * Usage:
 *   showConfirmDialog('Title', 'Message text', function () {
 *     // user confirmed
 *   }, function () {
 *     // user cancelled (optional)
 *   });
 */

export function showConfirmDialog(title, message, onConfirm, onCancel) {
    // Remove any existing dialog first
    var existing = document.getElementById('confirmDialogOverlay');
    if (existing) existing.remove();

    // ── Overlay ──
    var overlay = document.createElement('div');
    overlay.id = 'confirmDialogOverlay';
    overlay.className = 'fixed inset-0 z-[7000] flex items-center justify-center p-4 sm:p-6 bg-black/80 transition-opacity duration-200';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'confirmDialogTitle');

    // ── Dialog box ──
    var dialog = document.createElement('div');
    dialog.className = 'w-full max-w-[380px] bg-containerLight dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 shadow-2xl relative animate-[modalPop_.18s_ease] border border-gray-200 dark:border-zinc-800';

    // Title
    var titleEl = document.createElement('h3');
    titleEl.id = 'confirmDialogTitle';
    titleEl.className = 'text-lg font-bold mb-2 text-gray-800 dark:text-white';
    titleEl.textContent = title;

    // Message
    var msgEl = document.createElement('p');
    msgEl.className = 'text-sm text-gray-600 dark:text-gray-300 mb-5 whitespace-pre-line';
    msgEl.textContent = message;

    // Button row
    var btnRow = document.createElement('div');
    btnRow.className = 'flex gap-3';

    // Cancel button
    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'flex-1 py-3 rounded-xl bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-white font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:focus-visible:ring-accentDark min-h-[48px]';
    cancelBtn.textContent = 'ยกเลิก';

    // Confirm button (danger style)
    var confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'flex-1 py-3 rounded-xl bg-[#dc3545] hover:bg-opacity-90 text-white font-semibold transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc3545] focus-visible:ring-offset-2 min-h-[48px]';
    confirmBtn.textContent = 'ยืนยัน';

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    dialog.appendChild(titleEl);
    dialog.appendChild(msgEl);
    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // ── Lock body scroll ──
    document.body.classList.add('overflow-hidden');

    // ── Focus the confirm button ──
    setTimeout(function () { confirmBtn.focus(); }, 50);

    // ── Cleanup helper ──
    function close(confirmed) {
        overlay.remove();
        document.body.classList.remove('overflow-hidden');
        document.removeEventListener('keydown', keyHandler);
        if (confirmed && typeof onConfirm === 'function') {
            onConfirm();
        } else if (!confirmed && typeof onCancel === 'function') {
            onCancel();
        }
    }

    // ── Key handler ──
    function keyHandler(e) {
        if (e.key === 'Escape') {
            e.stopPropagation();
            close(false);
        }
    }
    document.addEventListener('keydown', keyHandler);

    // ── Event handlers ──
    cancelBtn.addEventListener('click', function () { close(false); });
    confirmBtn.addEventListener('click', function () { close(true); });

    // Click outside to cancel
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close(false);
    });
}
