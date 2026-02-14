// Test prayer times for London
function toRad(deg) { return deg * Math.PI / 180; }
function toDeg(rad) { return rad * 180 / Math.PI; }

function getJulianDate(date) { return date.getTime() / 86400000 + 2440587.5; }
function getJulianCentury(jd) { return (jd - 2451545) / 36525; }
function getSunMeanLongitude(t) { return (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360; }
function getSunMeanAnomaly(t) { return 357.52911 + t * (35999.05029 - 0.0001537 * t); }
function getEccentricityEarthOrbit(t) { return 0.016708634 - t * (0.000042037 + 0.0000001267 * t); }
function getSunEqOfCenter(t) {
    const m = toRad(getSunMeanAnomaly(t));
    return Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * m) * (0.019993 - 0.000101 * t) + Math.sin(3 * m) * 0.000289;
}
function getObliquityCorrection(t) {
    const e0 = 23 + (26 + (21.448 - t * (46.8150 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    return e0 + 0.00256 * Math.cos(toRad(125.04 - 1934.136 * t));
}
function getSunDeclination(t) {
    const e = toRad(getObliquityCorrection(t));
    const lambda = toRad((getSunMeanLongitude(t) + getSunEqOfCenter(t)) - 0.00569 - 0.00478 * Math.sin(toRad(125.04 - 1934.136 * t)));
    return toDeg(Math.asin(Math.sin(e) * Math.sin(lambda)));
}
function getEquationOfTime(t) {
    const epsilon = toRad(getObliquityCorrection(t));
    const l0 = toRad(getSunMeanLongitude(t));
    const e = getEccentricityEarthOrbit(t);
    const m = toRad(getSunMeanAnomaly(t));
    let y = Math.tan(epsilon / 2); y *= y;
    const eot = y * Math.sin(2 * l0) - 2 * e * Math.sin(m) + 4 * e * y * Math.sin(m) * Math.cos(2 * l0) - 0.5 * y * y * Math.sin(4 * l0) - 1.25 * e * e * Math.sin(2 * m);
    return toDeg(eot) * 4;
}
function getHourAngle(lat, decl, angle) {
    const cosHA = (Math.cos(toRad(angle)) / (Math.cos(toRad(lat)) * Math.cos(toRad(decl)))) - Math.tan(toRad(lat)) * Math.tan(toRad(decl));
    if (cosHA > 1 || cosHA < -1) return null;
    return toDeg(Math.acos(cosHA));
}

// London Feb 14, 2026
const date = new Date('2026-02-14T12:00:00Z');
const lat = 51.5074, lng = -0.1278;
const jd = getJulianDate(date);
const t = getJulianCentury(jd);
const eot = getEquationOfTime(t);
const decl = getSunDeclination(t);
const noonMinutes = 720 - lng * 4 - eot;

console.log('Declination:', decl.toFixed(2) + '°');
console.log('Solar noon (UTC minutes):', noonMinutes.toFixed(0));

// Fajr (15° below horizon)
const fajrHA = getHourAngle(lat, decl, 90 + 15);
const fajrMinutes = noonMinutes - fajrHA * 4;
console.log('Fajr UTC:', Math.floor(fajrMinutes/60) + ':' + String(Math.round(fajrMinutes % 60)).padStart(2,'0'));

// Sunrise (90.833°)
const sunriseHA = getHourAngle(lat, decl, 90.833);
const sunriseMinutes = noonMinutes - sunriseHA * 4;
console.log('Sunrise UTC:', Math.floor(sunriseMinutes/60) + ':' + String(Math.round(sunriseMinutes % 60)).padStart(2,'0'));

// Dhuhr
console.log('Dhuhr UTC:', Math.floor(noonMinutes/60) + ':' + String(Math.round(noonMinutes % 60)).padStart(2,'0'));

// Asr (shadow = 1 + tan(|lat-decl|))
const shadowFactor = 1 + Math.tan(toRad(Math.abs(lat - decl)));
const asrAltitude = toDeg(Math.atan(1 / shadowFactor));
const asrZenith = 90 - asrAltitude;
const asrHA = getHourAngle(lat, decl, asrZenith);
const asrMinutes = noonMinutes + asrHA * 4;
console.log('Asr altitude:', asrAltitude.toFixed(1) + '°, zenith:', asrZenith.toFixed(1) + '°');
console.log('Asr UTC:', Math.floor(asrMinutes/60) + ':' + String(Math.round(asrMinutes % 60)).padStart(2,'0'));

// Maghrib (sunset)
const maghribMinutes = noonMinutes + sunriseHA * 4;
console.log('Maghrib UTC:', Math.floor(maghribMinutes/60) + ':' + String(Math.round(maghribMinutes % 60)).padStart(2,'0'));

// Isha (15° below horizon)
const ishaHA = getHourAngle(lat, decl, 90 + 15);
const ishaMinutes = noonMinutes + ishaHA * 4;
console.log('Isha UTC:', Math.floor(ishaMinutes/60) + ':' + String(Math.round(ishaMinutes % 60)).padStart(2,'0'));

console.log('\n--- London local (UTC+0) ---');
console.log('These should match what the site shows');
