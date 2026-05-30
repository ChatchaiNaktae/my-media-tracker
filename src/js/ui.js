export function openItemModal() {
    const modal = document.getElementById('itemModal');
    if (modal) modal.classList.remove('hidden');
}

export function closeItemModal() {
    const modal = document.getElementById('itemModal');
    if (modal) modal.classList.add('hidden');
}

// Skeleton Loading System
export function showSkeleton() {
    const listContainer = document.getElementById('mediaListContainer');
    if (!listContainer) return; 
    listContainer.innerHTML = ''; 

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
export function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = `
            fixed top-4 right-4
            flex flex-col gap-3
            z-[99999]
            pointer-events-none
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const config = {
        success: {
            bg: 'border-l-[#28a745]',
            icon: '✅',
            title: 'Success',
            textColor: 'text-[#28a745]'
        },
        error: {
            bg: 'border-l-[#dc3545]',
            icon: '❌',
            title: 'Error',
            textColor: 'text-[#dc3545]'
        },
        warning: {
            bg: 'border-l-[#f0ad4e]',
            icon: '⚠️',
            title: 'Warning',
            textColor: 'text-[#f0ad4e]'
        },
        info: {
            bg: 'border-l-[#17a2b8]',
            icon: 'ℹ️',
            title: 'Info',
            textColor: 'text-[#17a2b8]'
        }
    };

    const current = config[type] || config.success;
    toast.className = `
        toast-in
        pointer-events-auto
        bg-containerLight dark:bg-containerDark
        border-l-4 ${current.bg}
        p-4 rounded-xl
        shadow-2xl
        flex items-center gap-3
        min-w-[280px]
        max-w-[350px]
        border border-gray-200 dark:border-zinc-800
        backdrop-blur-xl
    `;

    toast.innerHTML = `
        <div class="text-xl shrink-0">${current.icon}</div>

        <div class="flex-1 min-w-0">
            <div class="font-bold text-[0.9em] ${current.textColor}">
                ${current.title}
            </div>

            <div class="text-[0.85em] opacity-90 break-words">
                ${message}
            </div>
        </div>

        <button
            onclick="this.parentElement.remove()"
            class="opacity-50 hover:opacity-100 text-lg transition"
        >
            ×
        </button>
    `;

    container.appendChild(toast)

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 500);
    }, 4000);
}

export function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}