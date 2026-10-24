// Event Planning Assistant Frontend Client
document.addEventListener('DOMContentLoaded', async () => {
    const healthBadge = document.getElementById('health-badge');
    try {
        const response = await fetch('/health');
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'ok') {
                healthBadge.textContent = 'API Status: Connected & Healthy';
                healthBadge.classList.add('ok');
            }
        } else {
            healthBadge.textContent = 'API Status: Error connecting';
        }
    } catch {
        healthBadge.textContent = 'API Status: Offline or server unavailable';
    }
});
