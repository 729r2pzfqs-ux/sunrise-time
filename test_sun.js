// Test sun calculations
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
    
    return toDeg(eot) * 4;
}

function getHourAngle(lat, decl, angle) {
    const latRad = toRad(lat);
    const declRad = toRad(decl);
    const angleRad = toRad(angle);
    
    const cosHA = (Math.cos(angleRad) / (Math.cos(latRad) * Math.cos(declRad))) -
                  Math.tan(latRad) * Math.tan(declRad);
    
    if (cosHA > 1) return null;
    if (cosHA < -1) return null;
    
    return toDeg(Math.acos(cosHA));
}

// Test for London on Feb 14, 2026
const date = new Date('2026-02-14T12:00:00Z');
const lat = 51.5074; // London
const lng = -0.1278;

const jd = getJulianDate(date);
const t = getJulianCentury(jd);
const eot = getEquationOfTime(t);
const decl = getSunDeclination(t);

console.log('Date:', date.toISOString());
console.log('Julian Date:', jd);
console.log('Equation of Time:', eot, 'minutes');
console.log('Declination:', decl, 'degrees');

const noonOffset = 720 - lng * 4 - eot;
console.log('Noon offset from UTC midnight:', noonOffset, 'minutes =', noonOffset/60, 'hours');

const ha = getHourAngle(lat, decl, 90.833);
console.log('Hour angle:', ha, 'degrees =', ha * 4, 'minutes');

const sunriseOffset = noonOffset - ha * 4;
const sunsetOffset = noonOffset + ha * 4;

console.log('Sunrise UTC:', Math.floor(sunriseOffset/60) + ':' + Math.round(sunriseOffset % 60));
console.log('Sunset UTC:', Math.floor(sunsetOffset/60) + ':' + Math.round(sunsetOffset % 60));

// Create actual dates
const solarNoon = new Date(date);
solarNoon.setUTCHours(0, 0, 0, 0);
solarNoon.setUTCMinutes(noonOffset);

const sunrise = new Date(solarNoon.getTime() - ha * 4 * 60 * 1000);
const sunset = new Date(solarNoon.getTime() + ha * 4 * 60 * 1000);

console.log('\nSolar Noon UTC:', solarNoon.toISOString());
console.log('Sunrise UTC:', sunrise.toISOString());
console.log('Sunset UTC:', sunset.toISOString());
console.log('\nIn local display:');
console.log('Sunrise:', sunrise.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', hour12: false}));
console.log('Sunset:', sunset.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', hour12: false}));
