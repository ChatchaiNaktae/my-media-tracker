// --- Custom Dropdown with Portal Rendering ---
// Dropdown menus are appended to <body> and positioned using getBoundingClientRect()
// so they escape any overflow: hidden/scroll containers (e.g., modals).

document.addEventListener("DOMContentLoaded", () => {
    const selects = document.querySelectorAll("select");

    selects.forEach(select => {
        select.style.display = 'none';

        const wrapper = document.createElement("div");
        wrapper.className = "relative w-full flex-1 min-w-0";
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);

        // ── Trigger display ──
        const display = document.createElement("div");
        display.className = select.className.replace('appearance-none', '') + " cursor-pointer flex justify-between items-center select-none";
        display.tabIndex = 0;

        const spanText = document.createElement("span");
        spanText.className = "truncate pr-2 flex-1 min-w-0";
        spanText.textContent = select.options[select.selectedIndex]?.text || '';
        select.customDisplaySpan = spanText;

        const icon = document.createElement("div");
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-70 flex-shrink-0"><polyline points="6 9 12 15 18 9"></polyline></svg>';

        display.appendChild(spanText);
        display.appendChild(icon);
        wrapper.appendChild(display);

        // ── Dropdown list (portal to <body>) ──
        const list = document.createElement("div");
        list.className = "absolute z-[5100] bg-containerLight dark:bg-containerDark border border-gray-200 dark:border-zinc-800 rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.15)] hidden overflow-hidden transition-all duration-200 max-h-[250px] overflow-y-auto custom-scrollbar";
        list.style.position = "absolute";
        list.setAttribute("data-select-id", select.id);
        document.body.appendChild(list);

        // Build option items
        function buildListItems() {
            list.innerHTML = '';
            Array.from(select.options).forEach((option, index) => {
                const item = document.createElement("div");
                item.className = "p-3 cursor-pointer hover:bg-accent hover:text-white dark:hover:bg-accentDark dark:hover:text-gray-900 transition-colors text-[0.95em] select-none";
                item.textContent = option.text;

                item.addEventListener("click", (e) => {
                    e.stopPropagation();
                    select.selectedIndex = index;
                    spanText.textContent = option.text;
                    closeDropdown();
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].value.toLowerCase() === option.value.toLowerCase()) {
                            select.selectedIndex = i;
                            break;
                        }
                    }
                    select.dispatchEvent(new Event("change"));
                });
                list.appendChild(item);
            });
        }
        buildListItems();

        // ── Positioning logic ──
        function positionList() {
            const rect = display.getBoundingClientRect();
            list.style.top = (rect.bottom + window.scrollY) + "px";
            list.style.left = (rect.left + window.scrollX) + "px";
            list.style.width = rect.width + "px";
        }

        // ── Open / Close ──
        let isOpen = false;
        let repositionHandler = null;
        let modalScrollCloseHandler = null;

        function openDropdown() {
            if (isOpen) return;
            isOpen = true;

            // Close any other open dropdowns
            document.querySelectorAll(".custom-select-list").forEach(l => {
                if (l !== list) l.classList.add("hidden");
            });

            // Rebuild options in case the <select> was dynamically updated
            buildListItems();

            positionList();
            list.classList.remove("hidden");

            // Reposition on scroll and resize while open
            repositionHandler = function () {
                if (isOpen && !list.classList.contains("hidden")) {
                    positionList();
                }
            };

            // Close dropdown when scrolling inside a modal to prevent detachment
            modalScrollCloseHandler = function (e) {
                if (!isOpen || list.classList.contains("hidden")) return;
                var modal = document.getElementById('itemModal');
                if (modal && !modal.classList.contains('hidden') && modal.contains(e.target)) {
                    closeDropdown();
                }
            };

            window.addEventListener("scroll", repositionHandler, true);
            window.addEventListener("resize", repositionHandler);
            // Use_capture=true so we catch scroll events from nested containers (modal body)
            window.addEventListener("scroll", modalScrollCloseHandler, true);
        }

        function closeDropdown() {
            if (!isOpen) return;
            isOpen = false;
            list.classList.add("hidden");

            // Cleanup listeners
            if (repositionHandler) {
                window.removeEventListener("scroll", repositionHandler, true);
                window.removeEventListener("resize", repositionHandler);
                repositionHandler = null;
            }
            if (modalScrollCloseHandler) {
                window.removeEventListener("scroll", modalScrollCloseHandler, true);
                modalScrollCloseHandler = null;
            }
        }

        display.addEventListener("click", (e) => {
            e.stopPropagation();
            if (isOpen) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        list.classList.add("custom-select-list");

        // Global click closes all dropdowns
        document.addEventListener("click", () => {
            closeDropdown();
        });
    });

    // ── Sync display text when select is programmatically changed ──
    window.addEventListener("load", () => {
        const updateUI = () => {
            document.querySelectorAll("select").forEach(select => {
                if (select.customDisplaySpan) {
                    select.customDisplaySpan.textContent = select.options[select.selectedIndex]?.text || '';
                }
            });
        };

        if (typeof window.startEditItem === "function") {
            const originalStart = window.startEditItem;
            window.startEditItem = function(id) {
                originalStart(id);
                updateUI();
            };
        }

        if (typeof window.cancelEdit === "function") {
            const originalCancel = window.cancelEdit;
            window.cancelEdit = function() {
                originalCancel();
                updateUI();
            };
        }
    });
});
