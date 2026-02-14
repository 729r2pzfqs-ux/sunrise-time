// Initialize everything after all scripts load

document.addEventListener('DOMContentLoaded', () => {
    detectLocation();
    setupCitySearch();
    
    // Update every minute
    setInterval(() => {
        if (currentLat && currentLng) {
            const sunTimes = getSunTimes(new Date(), currentLat, currentLng);
            updateSkyGradient(sunTimes, currentLng);
            updateDayProgress(sunTimes, currentLng);
            updatePrayerTimesUI(currentLat, currentLng);
        }
    }, 60000);
    
    // Prayer method change
    document.getElementById('prayerMethod')?.addEventListener('change', () => {
        if (currentLat && currentLng) {
            updatePrayerTimesUI(currentLat, currentLng);
        }
    });
    
    // Detect location button
    document.getElementById('detectLocation')?.addEventListener('click', detectLocation);
    
    // Popular city buttons
    document.querySelectorAll('.city-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lat = parseFloat(btn.dataset.lat);
            const lng = parseFloat(btn.dataset.lng);
            const name = btn.textContent.trim();
            document.getElementById('locationSearch').value = name;
            updateAll(lat, lng, name);
        });
    });
});
