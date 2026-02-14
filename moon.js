// Moon Phase Calculator
// Calculates lunar phase, illumination, and moonrise/moonset

function getMoonPhase(date) {
    // Known new moon: January 6, 2000 at 18:14 UTC
    const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
    const lunarCycle = 29.53058867; // days
    
    const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const currentCycleDay = daysSinceNewMoon % lunarCycle;
    const phase = currentCycleDay / lunarCycle;
    
    // Illumination percentage (0-100)
    const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
    
    // Phase name and emoji
    let phaseName, emoji;
    if (phase < 0.025 || phase >= 0.975) {
        phaseName = 'New Moon';
        emoji = '🌑';
    } else if (phase < 0.25) {
        phaseName = 'Waxing Crescent';
        emoji = '🌒';
    } else if (phase < 0.275) {
        phaseName = 'First Quarter';
        emoji = '🌓';
    } else if (phase < 0.5) {
        phaseName = 'Waxing Gibbous';
        emoji = '🌔';
    } else if (phase < 0.525) {
        phaseName = 'Full Moon';
        emoji = '🌕';
    } else if (phase < 0.75) {
        phaseName = 'Waning Gibbous';
        emoji = '🌖';
    } else if (phase < 0.775) {
        phaseName = 'Last Quarter';
        emoji = '🌗';
    } else {
        phaseName = 'Waning Crescent';
        emoji = '🌘';
    }
    
    // Days until next full moon
    let daysToFull;
    if (phase < 0.5) {
        daysToFull = Math.round((0.5 - phase) * lunarCycle);
    } else {
        daysToFull = Math.round((1.5 - phase) * lunarCycle);
    }
    
    // Days until next new moon
    let daysToNew;
    if (phase < 0.025) {
        daysToNew = 0;
    } else {
        daysToNew = Math.round((1 - phase) * lunarCycle);
    }
    
    return {
        phase: phase,
        phaseName: phaseName,
        emoji: emoji,
        illumination: illumination,
        cycleDay: Math.round(currentCycleDay),
        daysToFull: daysToFull,
        daysToNew: daysToNew
    };
}

// Simplified moonrise/moonset calculation
// Note: Accurate moonrise/moonset requires complex calculations
// This is an approximation based on the lunar cycle
function getMoonTimes(date, lat, lng) {
    const moon = getMoonPhase(date);
    const sunTimes = getSunTimes(date, lat, lng);
    
    if (!sunTimes.sunrise || !sunTimes.sunset) {
        return { moonrise: null, moonset: null };
    }
    
    // Rough approximation: Moon rises ~50 minutes later each day
    // At new moon: rises/sets with sun
    // At full moon: rises at sunset, sets at sunrise
    const phaseOffset = moon.phase * 24 * 60; // minutes offset based on phase
    
    const sunriseTime = sunTimes.sunrise.getTime();
    const sunsetTime = sunTimes.sunset.getTime();
    
    // Simple approximation
    const moonriseOffset = phaseOffset * 60 * 1000; // convert to ms
    let moonrise = new Date(sunriseTime + moonriseOffset);
    let moonset = new Date(moonrise.getTime() + 12.4 * 60 * 60 * 1000); // ~12.4 hours of moon visibility
    
    // Adjust if times go past midnight
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // If moonrise is tomorrow, show yesterday's moonrise
    if (moonrise > endOfDay) {
        moonrise = new Date(moonrise.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return {
        moonrise: moonrise,
        moonset: moonset,
        ...moon
    };
}

// Get upcoming lunar events
function getUpcomingLunarEvents(fromDate, count = 4) {
    const events = [];
    const lunarCycle = 29.53058867;
    const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
    
    const daysSinceNewMoon = (fromDate - knownNewMoon) / (1000 * 60 * 60 * 24);
    const currentCycle = Math.floor(daysSinceNewMoon / lunarCycle);
    
    for (let i = 0; i < count + 4; i++) {
        // New moon
        const newMoonDate = new Date(knownNewMoon.getTime() + (currentCycle + i) * lunarCycle * 24 * 60 * 60 * 1000);
        if (newMoonDate > fromDate) {
            events.push({ date: newMoonDate, type: 'New Moon', emoji: '🌑' });
        }
        
        // First quarter (7.38 days after new moon)
        const firstQuarter = new Date(newMoonDate.getTime() + 7.38 * 24 * 60 * 60 * 1000);
        if (firstQuarter > fromDate) {
            events.push({ date: firstQuarter, type: 'First Quarter', emoji: '🌓' });
        }
        
        // Full moon (14.77 days after new moon)
        const fullMoon = new Date(newMoonDate.getTime() + 14.77 * 24 * 60 * 60 * 1000);
        if (fullMoon > fromDate) {
            events.push({ date: fullMoon, type: 'Full Moon', emoji: '🌕' });
        }
        
        // Last quarter (22.15 days after new moon)
        const lastQuarter = new Date(newMoonDate.getTime() + 22.15 * 24 * 60 * 60 * 1000);
        if (lastQuarter > fromDate) {
            events.push({ date: lastQuarter, type: 'Last Quarter', emoji: '🌗' });
        }
    }
    
    // Sort by date and return requested count
    events.sort((a, b) => a.date - b.date);
    return events.slice(0, count);
}
