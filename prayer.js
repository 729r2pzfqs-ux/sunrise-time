// Islamic Prayer Times Calculator
// Based on Islamic Society of North America (ISNA) method

const PRAYER_METHODS = {
    ISNA: { fajr: 15, isha: 15, name: 'Islamic Society of North America' },
    MWL: { fajr: 18, isha: 17, name: 'Muslim World League' },
    EGYPT: { fajr: 19.5, isha: 17.5, name: 'Egyptian General Authority' },
    MAKKAH: { fajr: 18.5, isha: 90, name: 'Umm al-Qura, Makkah' }, // isha is 90 mins after maghrib
    KARACHI: { fajr: 18, isha: 18, name: 'University of Islamic Sciences, Karachi' },
};

let currentMethod = 'ISNA';

function getPrayerTimes(date, lat, lng, method = 'ISNA') {
    const sunTimes = getSunTimes(date, lat, lng);
    const params = PRAYER_METHODS[method];
    
    if (!sunTimes.sunrise || !sunTimes.sunset) {
        return null;
    }
    
    const jd = getJulianDate(date);
    const t = getJulianCentury(jd);
    const eot = getEquationOfTime(t);
    const decl = getSunDeclination(t);
    
    // Helper to calculate time for a given angle
    function getTimeForAngle(angle, isRising) {
        const ha = getHourAngle(lat, decl, 90 + angle);
        if (ha === null) return null;
        
        const noonOffset = 720 - lng * 4 - eot;
        const offset = isRising ? -ha * 4 : ha * 4;
        
        const time = new Date(date);
        time.setUTCHours(0, 0, 0, 0);
        time.setUTCMinutes(noonOffset + offset);
        return time;
    }
    
    // Fajr - before sunrise at specified angle
    const fajr = getTimeForAngle(params.fajr, true);
    
    // Sunrise
    const sunrise = sunTimes.sunrise;
    
    // Dhuhr - just after solar noon (add 1 min for safety)
    const dhuhr = new Date(sunTimes.solarNoon.getTime() + 60000);
    
    // Asr - shadow length calculation (Shafi'i: shadow = object + shadow at noon)
    const asrAngle = toDeg(Math.atan(1 + Math.tan(toRad(Math.abs(lat - decl)))));
    const asr = getTimeForAngle(90 - asrAngle, false);
    
    // Maghrib - at sunset
    const maghrib = sunTimes.sunset;
    
    // Isha - after sunset at specified angle (or minutes for Makkah method)
    let isha;
    if (method === 'MAKKAH') {
        isha = new Date(maghrib.getTime() + params.isha * 60000);
    } else {
        isha = getTimeForAngle(params.isha, false);
    }
    
    return {
        fajr,
        sunrise,
        dhuhr,
        asr,
        maghrib,
        isha,
        method: params.name
    };
}

function formatPrayerTime(date) {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

function getNextPrayer(prayerTimes) {
    const now = new Date();
    const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    for (const prayer of prayers) {
        if (prayerTimes[prayer] && prayerTimes[prayer] > now) {
            return {
                name: prayer,
                time: prayerTimes[prayer],
                remaining: prayerTimes[prayer] - now
            };
        }
    }
    
    // All prayers passed, next is tomorrow's Fajr
    return {
        name: 'fajr',
        time: null,
        remaining: null,
        tomorrow: true
    };
}

function formatTimeRemaining(ms) {
    if (!ms) return '';
    const hours = Math.floor(ms / 1000 / 60 / 60);
    const mins = Math.floor((ms / 1000 / 60) % 60);
    if (hours > 0) {
        return `${hours}h ${mins}m remaining`;
    }
    return `${mins}m remaining`;
}
