// Test moon calculations
function getMoonPhase(date) {
    const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
    const lunarCycle = 29.53058867;
    
    const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const currentCycleDay = daysSinceNewMoon % lunarCycle;
    const phase = currentCycleDay / lunarCycle;
    
    const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
    
    let phaseName, emoji;
    if (phase < 0.025 || phase >= 0.975) {
        phaseName = 'New Moon'; emoji = '🌑';
    } else if (phase < 0.25) {
        phaseName = 'Waxing Crescent'; emoji = '🌒';
    } else if (phase < 0.275) {
        phaseName = 'First Quarter'; emoji = '🌓';
    } else if (phase < 0.5) {
        phaseName = 'Waxing Gibbous'; emoji = '🌔';
    } else if (phase < 0.525) {
        phaseName = 'Full Moon'; emoji = '🌕';
    } else if (phase < 0.75) {
        phaseName = 'Waning Gibbous'; emoji = '🌖';
    } else if (phase < 0.775) {
        phaseName = 'Last Quarter'; emoji = '🌗';
    } else {
        phaseName = 'Waning Crescent'; emoji = '🌘';
    }
    
    return { phase, phaseName, emoji, illumination, cycleDay: Math.round(currentCycleDay) };
}

function getUpcomingLunarEvents(fromDate, count = 4) {
    const events = [];
    const lunarCycle = 29.53058867;
    const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
    
    const daysSinceNewMoon = (fromDate - knownNewMoon) / (1000 * 60 * 60 * 24);
    const currentCycle = Math.floor(daysSinceNewMoon / lunarCycle);
    
    for (let i = 0; i < count + 4; i++) {
        const newMoonDate = new Date(knownNewMoon.getTime() + (currentCycle + i) * lunarCycle * 24 * 60 * 60 * 1000);
        if (newMoonDate > fromDate) {
            events.push({ date: newMoonDate, type: 'New Moon', emoji: '🌑' });
        }
        const fullMoon = new Date(newMoonDate.getTime() + 14.77 * 24 * 60 * 60 * 1000);
        if (fullMoon > fromDate) {
            events.push({ date: fullMoon, type: 'Full Moon', emoji: '🌕' });
        }
    }
    
    events.sort((a, b) => a.date - b.date);
    return events.slice(0, count);
}

const today = new Date('2026-02-14');
const moon = getMoonPhase(today);
console.log('Moon phase:', moon);

const events = getUpcomingLunarEvents(today, 4);
console.log('Upcoming events:');
events.forEach(e => console.log(e.type, e.date.toLocaleDateString()));
