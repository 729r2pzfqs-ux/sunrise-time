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
    
    // Solar noon in minutes from UTC midnight
    const noonMinutes = 720 - lng * 4 - eot;
    
    // Create solar noon date
    const solarNoon = new Date(date);
    solarNoon.setUTCHours(0, 0, 0, 0);
    solarNoon.setUTCMinutes(noonMinutes);
    
    // Helper to get time from hour angle
    function timeFromHourAngle(ha, beforeNoon) {
        const offsetMs = ha * 4 * 60 * 1000; // ha degrees to milliseconds
        return new Date(solarNoon.getTime() + (beforeNoon ? -offsetMs : offsetMs));
    }
    
    // Fajr - sun 15-19° below horizon (before sunrise)
    const fajrHA = getHourAngle(lat, decl, 90 + params.fajr);
    const fajr = fajrHA ? timeFromHourAngle(fajrHA, true) : null;
    
    // Sunrise - from sunTimes (already calculated)
    const sunrise = sunTimes.sunrise;
    
    // Dhuhr - just after solar noon
    const dhuhr = new Date(solarNoon.getTime() + 60000);
    
    // Asr - when shadow = object + shadow at noon (Shafi'i method)
    // Shadow factor = 1 + tan(|latitude - declination|)
    // Sun altitude at Asr = arctan(1 / shadow_factor)
    const shadowFactor = 1 + Math.tan(toRad(Math.abs(lat - decl)));
    const asrAltitude = toDeg(Math.atan(1 / shadowFactor));
    const asrZenith = 90 - asrAltitude;
    const asrHA = getHourAngle(lat, decl, asrZenith);
    const asr = asrHA ? timeFromHourAngle(asrHA, false) : null;
    
    // Maghrib - at sunset
    const maghrib = sunTimes.sunset;
    
    // Isha - sun 15-18° below horizon (after sunset)
    let isha;
    if (method === 'MAKKAH') {
        // Makkah method: 90 minutes after Maghrib
        isha = new Date(maghrib.getTime() + params.isha * 60000);
    } else {
        const ishaHA = getHourAngle(lat, decl, 90 + params.isha);
        isha = ishaHA ? timeFromHourAngle(ishaHA, false) : null;
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

// Format prayer time in location's timezone (using longitude)
// Respects global use12HourFormat preference (tap to toggle)
function formatPrayerTime(date, lng) {
    if (!date) return '--:--';
    
    // Use provided lng or global currentLng
    const longitude = lng !== undefined ? lng : (currentLng || 0);
    
    // Calculate timezone offset based on longitude (15° = 1 hour)
    const tzOffsetHours = Math.round(longitude / 15);
    
    // Get UTC hours and minutes
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    
    // Apply timezone offset
    let localHours = utcHours + tzOffsetHours;
    if (localHours < 0) localHours += 24;
    if (localHours >= 24) localHours -= 24;
    
    // Check global preference (defined in app.js)
    if (typeof use12HourFormat !== 'undefined' && use12HourFormat) {
        // Format as 12-hour with am/pm (compact)
        const period = localHours >= 12 ? 'pm' : 'am';
        const hours12 = localHours % 12 || 12;
        return `${hours12}:${String(utcMinutes).padStart(2, '0')}${period}`;
    } else {
        // Format as 24-hour
        return `${String(localHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
    }
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
