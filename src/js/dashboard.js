let mediaChart = null;

export function getMediaChart() {
    return mediaChart;
}

export function updateDashboard(items) {
    animateValue("totalCount", items.length);
    animateValue("finishedCount", items.filter(i => i.status === 'Completed').length);
    animateValue("todoCount", items.filter(i => i.status === 'Planned').length);
}

function animateValue(id, end) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let start = parseInt(obj.textContent.replace(/,/g, '')) || 0;
    if (start === end) return;
    if (obj.timer) clearInterval(obj.timer);
    let range = Math.abs(end - start);
    let stepTime = Math.max(Math.floor(1000 / range), 20);
    obj.timer = setInterval(() => {
        if (start < end) start++; else start--;
        obj.textContent = start;
        if (start === end) clearInterval(obj.timer);
    }, stepTime);
}

export function updateCharts(items) {
    const ctx = document.getElementById('mediaChart');
    if (!ctx) return;

    const counts = {};
    items.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    if (mediaChart) {
        mediaChart.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark-mode');
    const textColor = isDark ? '#ffffff' : '#333333';

    mediaChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#4a90e2', '#bb86fc', '#28a745', '#f0ad4e', '#dc3545', '#17a2b8'
                ],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: { family: 'Prompt', size: 12 },
                        padding: 20
                    }
                }
            }
        }
    });
}