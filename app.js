// SunriseTi.me - Accurate Sun Position Calculator
// Uses NOAA solar calculations for precise sunrise/sunset times

const i18n = {
    en: {
        sunrise: 'Sunrise',
        sunset: 'Sunset',
        dayLength: 'Day Length',
        solarNoon: 'Solar Noon',
        goldenHourAM: 'Golden Hour (AM)',
        goldenHourPM: 'Golden Hour (PM)',
        blueHourAM: 'Blue Hour (AM)',
        blueHourPM: 'Blue Hour (PM)',
        detecting: 'Detecting location...',
        dayProgress: 'Day Progress',
        civilDawn: 'Civil Dawn',
        civilDusk: 'Civil Dusk',
        nauticalDawn: 'Nautical Dawn',
        nauticalDusk: 'Nautical Dusk',
        today: 'Today',
        searchPlaceholder: 'Enter city name...',
        popular: 'Popular:',
        longerThan: 'longer than yesterday',
        shorterThan: 'shorter than yesterday',
        sameAs: 'same as yesterday'
    }
};

let currentLang = 'en';
let currentLat = null;
let currentLng = null;

// ============== SUN CALCULATIONS ==============
// Based on NOAA Solar Calculator algorithms

function toRad(deg) { return deg * Math.PI / 180; }
function toDeg(rad) { return rad * 180 / Math.PI; }

function getJulianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
}

function getJulianCentury(jd) {
    return (jd - 2451545) / 36525;
}

function getSunMeanLongitude(t) {
    return (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360;
}

function getSunMeanAnomaly(t) {
    return 357.52911 + t * (35999.05029 - 0.0001537 * t);
}

function getEccentricityEarthOrbit(t) {
    return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
}

function getSunEqOfCenter(t) {
    const m = toRad(getSunMeanAnomaly(t));
    return Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
           Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
           Math.sin(3 * m) * 0.000289;
}

function getSunTrueLongitude(t) {
    return getSunMeanLongitude(t) + getSunEqOfCenter(t);
}

function getSunApparentLongitude(t) {
    const o = getSunTrueLongitude(t);
    const omega = 125.04 - 1934.136 * t;
    return o - 0.00569 - 0.00478 * Math.sin(toRad(omega));
}

function getMeanObliquityOfEcliptic(t) {
    const seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * 0.001813));
    return 23 + (26 + seconds / 60) / 60;
}

function getObliquityCorrection(t) {
    const e0 = getMeanObliquityOfEcliptic(t);
    const omega = 125.04 - 1934.136 * t;
    return e0 + 0.00256 * Math.cos(toRad(omega));
}

function getSunDeclination(t) {
    const e = toRad(getObliquityCorrection(t));
    const lambda = toRad(getSunApparentLongitude(t));
    return toDeg(Math.asin(Math.sin(e) * Math.sin(lambda)));
}

function getEquationOfTime(t) {
    const epsilon = toRad(getObliquityCorrection(t));
    const l0 = toRad(getSunMeanLongitude(t));
    const e = getEccentricityEarthOrbit(t);
    const m = toRad(getSunMeanAnomaly(t));
    
    let y = Math.tan(epsilon / 2);
    y *= y;
    
    const eot = y * Math.sin(2 * l0) - 2 * e * Math.sin(m) +
                4 * e * y * Math.sin(m) * Math.cos(2 * l0) -
                0.5 * y * y * Math.sin(4 * l0) -
                1.25 * e * e * Math.sin(2 * m);
    
    return toDeg(eot) * 4; // in minutes
}

function getHourAngle(lat, decl, angle) {
    const latRad = toRad(lat);
    const declRad = toRad(decl);
    const angleRad = toRad(angle);
    
    const cosHA = (Math.cos(angleRad) / (Math.cos(latRad) * Math.cos(declRad))) -
                  Math.tan(latRad) * Math.tan(declRad);
    
    if (cosHA > 1) return null; // Sun never rises
    if (cosHA < -1) return null; // Sun never sets (midnight sun)
    
    return toDeg(Math.acos(cosHA));
}

function getSunTimes(date, lat, lng) {
    const jd = getJulianDate(date);
    const t = getJulianCentury(jd);
    const eot = getEquationOfTime(t);
    const decl = getSunDeclination(t);
    
    // Solar noon
    const noonOffset = 720 - lng * 4 - eot; // in minutes from midnight UTC
    const solarNoon = new Date(date);
    solarNoon.setUTCHours(0, 0, 0, 0);
    solarNoon.setUTCMinutes(noonOffset);
    
    const results = {
        solarNoon: solarNoon,
        declination: decl
    };
    
    // Calculate various sun events
    const events = {
        sunrise: 90.833,      // Official sunrise (accounting for refraction)
        sunset: 90.833,
        civilDawn: 96,        // Civil twilight
        civilDusk: 96,
        nauticalDawn: 102,    // Nautical twilight
        nauticalDusk: 102,
        goldenHourEnd: 84,    // Golden hour (~6° above horizon)
        goldenHourStart: 84,
        blueHourStart: 94,    // Blue hour (4° below to 6° below)
        blueHourEnd: 94
    };
    
    for (const [name, angle] of Object.entries(events)) {
        const ha = getHourAngle(lat, decl, angle);
        if (ha === null) {
            results[name] = null;
            continue;
        }
        
        const isRise = name.includes('Dawn') || name.includes('sunrise') || name.includes('End') || name === 'goldenHourEnd';
        const offsetMinutes = isRise ? -ha * 4 : ha * 4;
        
        // Use milliseconds to avoid timezone mixing
        const eventTime = new Date(solarNoon.getTime() + offsetMinutes * 60 * 1000);
        results[name] = eventTime;
    }
    
    // Fix golden hour - it's the hour after sunrise and before sunset
    if (results.sunrise) {
        results.goldenHourMorningStart = results.sunrise;
        results.goldenHourMorningEnd = new Date(results.sunrise.getTime() + 60 * 60 * 1000);
    }
    if (results.sunset) {
        results.goldenHourEveningStart = new Date(results.sunset.getTime() - 60 * 60 * 1000);
        results.goldenHourEveningEnd = results.sunset;
    }
    
    return results;
}

// Format time in the location's timezone (approximated by longitude)
// Uses global currentLng if no lng parameter provided
function formatTime(date, lng) {
    if (!date) return '--:--';
    
    // Use provided lng or global currentLng
    const longitude = lng !== undefined ? lng : (currentLng || 0);
    
    // Calculate timezone offset based on longitude (15° = 1 hour)
    // This gives approximate local solar time
    const tzOffsetHours = Math.round(longitude / 15);
    
    // Get UTC hours and minutes
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    
    // Apply timezone offset
    let localHours = utcHours + tzOffsetHours;
    if (localHours < 0) localHours += 24;
    if (localHours >= 24) localHours -= 24;
    
    return String(localHours).padStart(2, '0') + ':' + String(utcMinutes).padStart(2, '0');
}

function formatTime12(date, lng) {
    if (!date) return '--:--';
    const time24 = formatTime(date, lng);
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// ============== UI UPDATES ==============

function setOpacity(element, opacity) {
    if (element) element.style.opacity = opacity;
}

function updateSkyGradient(sunTimes, lng) {
    const body = document.getElementById('body');
    const stars = document.getElementById('stars');
    const clouds = document.getElementById('clouds');
    const sunRays = document.getElementById('sunRays');
    const sunMoon = document.getElementById('sunMoonEmoji');
    const heroSun = document.getElementById('heroSun');
    
    body.classList.remove('sky-dawn', 'sky-day', 'sky-golden', 'sky-dusk', 'sky-night');
    
    if (!sunTimes.sunrise || !sunTimes.sunset) {
        body.classList.add('sky-day');
        return;
    }
    
    // Use UTC timestamps for accurate comparison
    const nowMs = Date.now();
    const sunriseMs = sunTimes.sunrise.getTime();
    const sunsetMs = sunTimes.sunset.getTime();
    
    // Define time periods (in milliseconds)
    const oneHour = 60 * 60 * 1000;
    const halfHour = 30 * 60 * 1000;
    
    const dawnMs = sunriseMs - halfHour;
    const duskEndMs = sunsetMs + halfHour;
    const morningGoldenEndMs = sunriseMs + oneHour;
    const eveningGoldenStartMs = sunsetMs - oneHour;
    
    console.log('Sky debug (UTC):', {
        now: new Date(nowMs).toISOString(),
        sunrise: sunTimes.sunrise.toISOString(),
        sunset: sunTimes.sunset.toISOString()
    });
    
    // Determine sky state
    const isNight = nowMs < dawnMs || nowMs > duskEndMs;
    const isDawn = nowMs >= dawnMs && nowMs < sunriseMs;
    const isMorningGolden = nowMs >= sunriseMs && nowMs < morningGoldenEndMs;
    const isDay = nowMs >= morningGoldenEndMs && nowMs < eveningGoldenStartMs;
    const isEveningGolden = nowMs >= eveningGoldenStartMs && nowMs < sunsetMs;
    const isDusk = nowMs >= sunsetMs && nowMs <= duskEndMs;
    
    console.log('Sky state:', { isNight, isDawn, isMorningGolden, isDay, isEveningGolden, isDusk });
    
    if (isNight) {
        console.log('Setting NIGHT mode');
        body.classList.add('sky-night');
        setOpacity(stars, '1');
        setOpacity(clouds, '0');
        setOpacity(sunRays, '0');
        if (sunMoon) sunMoon.textContent = '🌙';
        if (heroSun) {
            heroSun.className = 'w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 float mx-auto relative z-10 transition-all duration-500';
            heroSun.style.boxShadow = '0 0 40px rgba(200, 200, 220, 0.4)';
        }
    } else if (isDawn) {
        body.classList.add('sky-dawn');
        setOpacity(stars, '0.3');
        setOpacity(clouds, '0.2');
        setOpacity(sunRays, '0.3');
        if (sunMoon) sunMoon.textContent = '🌅';
    } else if (isMorningGolden) {
        body.classList.add('sky-golden');
        setOpacity(stars, '0');
        setOpacity(clouds, '0.4');
        setOpacity(sunRays, '0.7');
        if (sunMoon) sunMoon.textContent = '🌤️';
    } else if (isDay) {
        body.classList.add('sky-day');
        setOpacity(stars, '0');
        setOpacity(clouds, '0.5');
        setOpacity(sunRays, '1');
        if (sunMoon) sunMoon.textContent = '☀️';
        if (heroSun) {
            heroSun.className = 'w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-500 sun-glow float mx-auto relative z-10 transition-all duration-500';
            heroSun.style.boxShadow = '';
        }
    } else if (isEveningGolden) {
        body.classList.add('sky-golden');
        setOpacity(stars, '0');
        setOpacity(clouds, '0.3');
        setOpacity(sunRays, '0.5');
        if (sunMoon) sunMoon.textContent = '🌇';
    } else if (isDusk) {
        body.classList.add('sky-dusk');
        setOpacity(stars, '0.5');
        setOpacity(clouds, '0.1');
        setOpacity(sunRays, '0.2');
        if (sunMoon) sunMoon.textContent = '🌆';
    } else {
        // Fallback to day
        body.classList.add('sky-day');
        setOpacity(stars, '0');
        setOpacity(clouds, '0.5');
        setOpacity(sunRays, '1');
        if (sunMoon) sunMoon.textContent = '☀️';
    }
}

function updateDayProgress(sunTimes, lng) {
    if (!sunTimes.sunrise || !sunTimes.sunset) return;
    
    // Use UTC timestamps for consistent comparison
    const nowMs = Date.now();
    const sunriseMs = sunTimes.sunrise.getTime();
    const sunsetMs = sunTimes.sunset.getTime();
    
    const dayLengthMs = sunsetMs - sunriseMs;
    const elapsedMs = nowMs - sunriseMs;
    
    console.log('Progress debug (UTC):', { 
        nowMs, sunriseMs, sunsetMs, 
        elapsedMs, dayLengthMs,
        nowUTC: new Date(nowMs).toISOString(),
        sunriseUTC: sunTimes.sunrise.toISOString(),
        sunsetUTC: sunTimes.sunset.toISOString()
    });
    
    let progress = 0;
    
    if (elapsedMs <= 0) {
        progress = 0;
    } else if (elapsedMs >= dayLengthMs) {
        progress = 100;
    } else {
        progress = (elapsedMs / dayLengthMs) * 100;
    }
    
    const progressBar = document.getElementById('dayProgressBar');
    const progressText = document.getElementById('dayProgressPercent');
    console.log('Setting progress:', Math.round(progress) + '%');
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${Math.round(progress)}%`;
}

function updateTimeline(sunTimes) {
    const timeline = document.getElementById('timeline');
    if (!timeline) return; // Timeline section might not exist
    const events = [];
    
    if (sunTimes.civilDawn) events.push({ time: sunTimes.civilDawn, name: 'Civil Dawn', icon: '🌑', desc: 'Sky begins to lighten' });
    if (sunTimes.sunrise) events.push({ time: sunTimes.sunrise, name: 'Sunrise', icon: '🌅', desc: 'Sun appears on horizon' });
    if (sunTimes.goldenHourMorningEnd) events.push({ time: sunTimes.goldenHourMorningEnd, name: 'Golden Hour Ends', icon: '📸', desc: 'Best morning light ends' });
    if (sunTimes.solarNoon) events.push({ time: sunTimes.solarNoon, name: 'Solar Noon', icon: '🔆', desc: 'Sun at highest point' });
    if (sunTimes.goldenHourEveningStart) events.push({ time: sunTimes.goldenHourEveningStart, name: 'Golden Hour Begins', icon: '🌄', desc: 'Best evening light starts' });
    if (sunTimes.sunset) events.push({ time: sunTimes.sunset, name: 'Sunset', icon: '🌇', desc: 'Sun disappears below horizon' });
    if (sunTimes.civilDusk) events.push({ time: sunTimes.civilDusk, name: 'Civil Dusk', icon: '🌃', desc: 'Sky becomes dark' });
    
    events.sort((a, b) => a.time - b.time);
    
    const now = new Date();
    timeline.innerHTML = events.map((event, i) => {
        const isPast = event.time < now;
        const isCurrent = i < events.length - 1 && event.time <= now && events[i + 1].time > now;
        
        return `
            <div class="timeline-item flex gap-4 ${isPast ? 'opacity-50' : ''} ${isCurrent ? 'opacity-100' : ''}">
                <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl flex-shrink-0 ${isCurrent ? 'ring-2 ring-yellow-400' : ''}">
                    ${event.icon}
                </div>
                <div class="flex-1 pb-4">
                    <div class="flex items-center justify-between">
                        <p class="font-semibold">${event.name}</p>
                        <p class="text-yellow-300 font-mono">${formatTime(event.time)}</p>
                    </div>
                    <p class="text-white/50 text-sm">${event.desc}</p>
                </div>
            </div>
        `;
    }).join('');
}

function update7DayForecast(lat, lng) {
    console.log('update7DayForecast called with:', { lat, lng });
    const forecast = document.getElementById('forecast');
    if (!forecast) { console.log('No forecast element found'); return; }
    console.log('Forecast element found');
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const sunTimes = getSunTimes(date, lat, lng);
        
        const dayLength = sunTimes.sunset && sunTimes.sunrise ? 
            (sunTimes.sunset - sunTimes.sunrise) / 1000 / 60 : 0;
        
        days.push({
            date: date,
            sunrise: sunTimes.sunrise,
            sunset: sunTimes.sunset,
            dayLength: dayLength
        });
    }
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    console.log('7-day forecast days:', days);
    
    forecast.innerHTML = days.map((day, i) => {
        const hours = Math.floor(day.dayLength / 60);
        const mins = Math.round(day.dayLength % 60);
        const isToday = i === 0;
        
        return `
            <div class="text-center p-3 rounded-xl forecast-card ${isToday ? 'today' : ''}">
                <p class="text-xs text-white/60 mb-1">${isToday ? 'Today' : dayNames[day.date.getDay()]}</p>
                <p class="text-xs font-medium mb-2">${day.date.getDate()}/${day.date.getMonth() + 1}</p>
                <div class="space-y-1">
                    <p class="forecast-sunrise text-sm">↑ ${formatTime(day.sunrise, lng)}</p>
                    <p class="forecast-sunset text-sm">↓ ${formatTime(day.sunset, lng)}</p>
                </div>
                <p class="text-xs text-white/40 mt-2">${hours}h ${mins}m</p>
            </div>
        `;
    }).join('');
}

function updateUI(lat, lng, locationName) {
    currentLat = lat;
    currentLng = lng;
    
    const today = new Date();
    const sunTimes = getSunTimes(today, lat, lng);
    
    // Update date
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Update main times
    const sunriseEl = document.getElementById('sunriseTime');
    const sunsetEl = document.getElementById('sunsetTime');
    if (sunriseEl) sunriseEl.textContent = formatTime(sunTimes.sunrise);
    if (sunsetEl) sunsetEl.textContent = formatTime(sunTimes.sunset);
    
    // Day length
    if (sunTimes.sunrise && sunTimes.sunset) {
        const dayLengthMs = sunTimes.sunset - sunTimes.sunrise;
        const hours = Math.floor(dayLengthMs / 1000 / 60 / 60);
        const mins = Math.round((dayLengthMs / 1000 / 60) % 60);
        const dayLengthEl = document.getElementById('dayLength');
        if (dayLengthEl) dayLengthEl.textContent = `${hours}h ${mins}m`;
    }
    
    // Solar noon
    const solarNoonEl = document.getElementById('solarNoon');
    if (solarNoonEl) solarNoonEl.textContent = formatTime(sunTimes.solarNoon);
    
    // Golden hours
    const goldenMorningEl = document.getElementById('goldenMorning');
    const goldenEveningEl = document.getElementById('goldenEvening');
    if (goldenMorningEl && sunTimes.goldenHourMorningStart && sunTimes.goldenHourMorningEnd) {
        goldenMorningEl.textContent = `${formatTime(sunTimes.goldenHourMorningStart)} - ${formatTime(sunTimes.goldenHourMorningEnd)}`;
    }
    if (goldenEveningEl && sunTimes.goldenHourEveningStart && sunTimes.goldenHourEveningEnd) {
        goldenEveningEl.textContent = `${formatTime(sunTimes.goldenHourEveningStart)} - ${formatTime(sunTimes.goldenHourEveningEnd)}`;
    }
    
    // Update sky gradient
    updateSkyGradient(sunTimes, lng);
    
    // Update day progress
    updateDayProgress(sunTimes, lng);
    
    // Update timeline
    updateTimeline(sunTimes);
    
    // Update 7-day forecast
    try { update7DayForecast(lat, lng); console.log('update7DayForecast done'); } catch(e) { console.error('update7DayForecast error:', e); }
}

// ============== GEOLOCATION ==============

async function getLocationName(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await response.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.county;
        const country = data.address.country;
        return city ? `${city}, ${country}` : country;
    } catch (e) {
        return null;
    }
}

async function detectLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const name = await getLocationName(lat, lng);
                const input = document.getElementById('locationSearch');
                if (input) input.value = name || '';
                updateAll(lat, lng, name);
            },
            (error) => {
                // Fallback to IP-based location or default
                console.log('Geolocation denied, using default');
                const input = document.getElementById('locationSearch');
                if (input) input.value = 'London, UK';
                updateAll(51.5074, -0.1278, 'London, UK');
            }
        );
    } else {
        updateAll(51.5074, -0.1278, 'London, UK');
    }
}

// ============== CITY SEARCH ==============

async function searchCity(query) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
        const data = await response.json();
        if (data.length > 0) {
            const result = data[0];
            updateUI(parseFloat(result.lat), parseFloat(result.lon), result.display_name.split(',').slice(0, 2).join(','));
        }
    } catch (e) {
        console.error('Search failed:', e);
    }
}

// ============== EVENT LISTENERS ==============

// ============== PRAYER TIMES UI ==============

function updatePrayerTimesUI(lat, lng) {
    const today = new Date();
    const method = document.getElementById('prayerMethod')?.value || 'ISNA';
    const prayerTimes = getPrayerTimes(today, lat, lng, method);
    
    if (!prayerTimes) return;
    
    const prayers = [
        { key: 'fajr', name: 'Fajr', icon: '🌙' },
        { key: 'sunrise', name: 'Sunrise', icon: '🌅' },
        { key: 'dhuhr', name: 'Dhuhr', icon: '☀️' },
        { key: 'asr', name: 'Asr', icon: '🌤️' },
        { key: 'maghrib', name: 'Maghrib', icon: '🌇' },
        { key: 'isha', name: 'Isha', icon: '🌙' }
    ];
    
    const now = new Date();
    const grid = document.getElementById('prayerTimesGrid');
    if (!grid) return;
    
    grid.innerHTML = prayers.map(prayer => {
        const time = prayerTimes[prayer.key];
        const isPassed = time && time < now;
        const isNext = !isPassed && prayers.findIndex(p => prayerTimes[p.key] && prayerTimes[p.key] > now) === prayers.indexOf(prayer);
        
        return `
            <div class="prayer-card glass-dark rounded-xl p-3 text-center ${isPassed ? 'passed' : ''} ${isNext ? 'next' : ''}">
                <div class="text-xl mb-1">${prayer.icon}</div>
                <p class="text-xs text-white/60 mb-1">${prayer.name}</p>
                <p class="font-semibold text-sm">${formatPrayerTime(time)}</p>
            </div>
        `;
    }).join('');
    
    // Next prayer info
    const next = getNextPrayer(prayerTimes);
    const nextInfo = document.getElementById('nextPrayerInfo');
    if (nextInfo && next.time) {
        nextInfo.textContent = `Next: ${next.name.charAt(0).toUpperCase() + next.name.slice(1)} in ${formatTimeRemaining(next.remaining)}`;
    }
}

// ============== MOON PHASE UI ==============

function updateMoonUI(lat, lng) {
    const today = new Date();
    const moon = getMoonPhase(today);
    const moonTimes = getMoonTimes(today, lat, lng);
    
    const moonVisual = document.getElementById('moonVisual');
    const moonPhaseName = document.getElementById('moonPhaseName');
    const moonIllumination = document.getElementById('moonIllumination');
    const nextFullMoon = document.getElementById('nextFullMoon');
    const nextNewMoon = document.getElementById('nextNewMoon');
    const moonrise = document.getElementById('moonrise');
    const moonset = document.getElementById('moonset');
    
    // Update moon visual SVG based on phase
    if (moonVisual) {
        const phase = moon.phase;
        // phase: 0 = new moon, 0.5 = full moon
        // Calculate shadow position and curve
        let shadowSvg = '';
        
        if (phase < 0.03 || phase > 0.97) {
            // New moon - fully dark
            shadowSvg = '<circle cx="50" cy="50" r="44" fill="#1a1a2e"/>';
        } else if (phase >= 0.47 && phase <= 0.53) {
            // Full moon - no shadow
            shadowSvg = '';
        } else if (phase < 0.5) {
            // Waxing (right side lit) - shadow on left
            const curveX = 50 - (phase * 2) * 90; // shadow curve
            shadowSvg = `<path d="M 50,6 A 44,44 0 0 0 50,94 Q ${curveX},50 50,6" fill="#1a1a2e"/>`;
        } else {
            // Waning (left side lit) - shadow on right
            const curveX = 50 + ((phase - 0.5) * 2) * 90;
            shadowSvg = `<path d="M 50,6 A 44,44 0 0 1 50,94 Q ${curveX},50 50,6" fill="#1a1a2e"/>`;
        }
        
        moonVisual.innerHTML = `
            <svg viewBox="0 0 100 100" class="w-full h-full">
                <defs>
                    <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#f5f5f5"/>
                        <stop offset="100%" stop-color="#d4d4d4"/>
                    </linearGradient>
                </defs>
                <!-- Moon base -->
                <circle cx="50" cy="50" r="44" fill="url(#moonGrad)"/>
                <!-- Craters -->
                <circle cx="35" cy="35" r="6" fill="#c4c4c4" opacity="0.4"/>
                <circle cx="60" cy="55" r="9" fill="#c4c4c4" opacity="0.3"/>
                <circle cx="45" cy="65" r="5" fill="#c4c4c4" opacity="0.35"/>
                <circle cx="68" cy="32" r="4" fill="#c4c4c4" opacity="0.25"/>
                <!-- Shadow -->
                ${shadowSvg}
            </svg>
        `;
    }
    
    if (moonPhaseName) moonPhaseName.textContent = moon.phaseName;
    if (moonIllumination) moonIllumination.textContent = `${moon.illumination}% illuminated`;
    
    // Upcoming events
    try {
        const events = getUpcomingLunarEvents(today, 4);
        console.log('Lunar events:', events);
        const fullMoonEvent = events.find(e => e.type === 'Full Moon');
        const newMoonEvent = events.find(e => e.type === 'New Moon');
        
        if (nextFullMoon && fullMoonEvent) {
            nextFullMoon.textContent = fullMoonEvent.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (nextFullMoon) {
            nextFullMoon.textContent = 'Calculating...';
        }
        if (nextNewMoon && newMoonEvent) {
            nextNewMoon.textContent = newMoonEvent.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    } catch(e) {
        console.error('Lunar events error:', e);
    }
    
    if (moonrise) moonrise.textContent = formatTime(moonTimes.moonrise);
    if (moonset) moonset.textContent = formatTime(moonTimes.moonset);
}

// ============== CITY SEARCH WITH AUTOCOMPLETE ==============

let searchTimeout = null;

function setupCitySearch() {
    const input = document.getElementById('locationSearch');
    const results = document.getElementById('autocompleteResults');
    
    if (!input || !results) return;
    
    // Popular cities to show on focus
    const popularCities = [
        { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
        { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
        { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
        { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
        { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
        { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
        { name: "Mecca", country: "Saudi Arabia", lat: 21.3891, lng: 39.8579 },
        { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
    ];
    
    function showResults(cities) {
        results.innerHTML = cities.map(city => `
            <div class="autocomplete-item px-4 py-2 cursor-pointer hover:bg-white/10" data-lat="${city.lat}" data-lng="${city.lng}" data-name="${city.name}, ${city.country}">
                <span class="text-yellow-300">📍</span> ${city.name}, ${city.country}
            </div>
        `).join('');
        results.classList.remove('hidden');
    }
    
    // On focus/click: select all, show popular cities
    function onInputActivate() {
        input.select(); // Select all text so user can type to replace
        showResults(popularCities);
    }
    input.addEventListener('focus', onInputActivate);
    input.addEventListener('click', onInputActivate); // For mobile
    
    // On input: search and filter
    input.addEventListener('input', (e) => {
        const query = e.target.value;
        
        clearTimeout(searchTimeout);
        
        if (query.length < 1) {
            showResults(popularCities);
            return;
        }
        
        searchTimeout = setTimeout(() => {
            // First search local cities database
            const localResults = searchCities(query);
            
            if (localResults.length > 0) {
                results.innerHTML = localResults.map(city => `
                    <div class="autocomplete-item px-4 py-2 cursor-pointer hover:bg-white/10" data-lat="${city.lat}" data-lng="${city.lng}" data-name="${city.display}">
                        <span class="text-yellow-300">📍</span> ${city.display}
                    </div>
                `).join('');
                results.classList.remove('hidden');
            } else if (query.length >= 2) {
                // Fall back to API search
                searchCityAPI(query);
            }
        }, 200);
    });
    
    // Handle click on result
    results.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
            const lat = parseFloat(item.dataset.lat);
            const lng = parseFloat(item.dataset.lng);
            const name = item.dataset.name;
            
            input.value = name;
            results.classList.add('hidden');
            updateAll(lat, lng, name);
        }
    });
    
    // Hide on blur (with delay for click to register)
    input.addEventListener('blur', () => {
        setTimeout(() => results.classList.add('hidden'), 200);
    });
    
    // Search on Enter
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            results.classList.add('hidden');
            searchCity(input.value);
        }
    });
}

async function searchCityAPI(query) {
    const results = document.getElementById('autocompleteResults');
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
        const data = await response.json();
        
        if (data.length > 0) {
            results.innerHTML = data.map(place => `
                <div class="autocomplete-item px-4 py-2 cursor-pointer" data-lat="${place.lat}" data-lng="${place.lon}" data-name="${place.display_name.split(',').slice(0,2).join(',')}">
                    <span class="text-yellow-300">📍</span> ${place.display_name.split(',').slice(0,3).join(',')}
                </div>
            `).join('');
            results.classList.remove('hidden');
        }
    } catch (e) {
        console.error('Search failed:', e);
    }
}

// ============== CURRENT TIME ==============

function updateCurrentTime() {
    const timeEl = document.getElementById('currentTime');
    if (!timeEl || currentLng === null) return;
    
    // Calculate local time based on longitude
    const now = new Date();
    const tzOffsetHours = Math.round(currentLng / 15);
    let localHours = now.getUTCHours() + tzOffsetHours;
    if (localHours < 0) localHours += 24;
    if (localHours >= 24) localHours -= 24;
    
    const h = String(localHours).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    
    timeEl.textContent = `${h}:${m}:${s}`;
}

// Start clock
setInterval(updateCurrentTime, 1000);

// ============== WEATHER ==============

async function fetchWeather(lat, lng) {
    const tempEl = document.getElementById('currentTemp');
    const weatherEl = document.getElementById('weatherIcon');
    
    console.log('fetchWeather called:', { lat, lng });
    if (!tempEl) { console.log('No tempEl found'); return; }
    
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`;
        console.log('Fetching weather:', url);
        const response = await fetch(url);
        const data = await response.json();
        console.log('Weather response:', data);
        
        if (data.current) {
            const temp = Math.round(data.current.temperature_2m);
            tempEl.textContent = `${temp}°C`;
            
            // Weather code to emoji
            const code = data.current.weather_code;
            let emoji = '☀️';
            if (code === 0) emoji = '☀️';
            else if (code <= 3) emoji = '⛅';
            else if (code <= 49) emoji = '🌫️';
            else if (code <= 69) emoji = '🌧️';
            else if (code <= 79) emoji = '🌨️';
            else if (code <= 99) emoji = '⛈️';
            
            if (weatherEl) weatherEl.textContent = emoji;
        }
    } catch (e) {
        console.error('Weather fetch failed:', e);
        tempEl.textContent = '--°C';
    }
}

// ============== MAIN UPDATE FUNCTION ==============

function updateAll(lat, lng, locationName) {
    console.log('updateAll called:', { lat, lng, locationName });
    try { updateUI(lat, lng, locationName); console.log('updateUI done'); } catch(e) { console.error('updateUI error:', e); }
    try { updatePrayerTimesUI(lat, lng); console.log('updatePrayerTimesUI done'); } catch(e) { console.error('updatePrayerTimesUI error:', e); }
    try { updateMoonUI(lat, lng); console.log('updateMoonUI done'); } catch(e) { console.error('updateMoonUI error:', e); }
    try { fetchWeather(lat, lng); console.log('fetchWeather called'); } catch(e) { console.error('fetchWeather error:', e); }
    try { updateCurrentTime(); console.log('updateCurrentTime done'); } catch(e) { console.error('updateCurrentTime error:', e); }
}

// Init is in init.js (loads last)
