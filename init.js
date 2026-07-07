// Initialize everything after all scripts load

document.addEventListener('DOMContentLoaded', () => {
    // Deep link: /?q=<city> (advertised by the SearchAction structured data)
    const query = new URLSearchParams(window.location.search).get('q');
    const localMatches = query ? searchCities(query) : [];
    if (localMatches.length > 0) {
        const city = localMatches[0];
        document.getElementById('locationSearch').value = city.display;
        updateAll(city.lat, city.lng, city.display);
    } else if (query) {
        document.getElementById('locationSearch').value = query;
        updateAll(40.7128, -74.0060, 'New York, USA');
        searchCity(query);
    } else {
        // Default to New York instead of requesting geolocation on page load
        // User can click the location button to detect their location
        document.getElementById('locationSearch').value = 'New York, USA';
        updateAll(40.7128, -74.0060, 'New York, USA');
    }
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
