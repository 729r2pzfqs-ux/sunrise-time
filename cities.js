// Top 500 cities worldwide with coordinates
const CITIES = [
    // Americas
    { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
    { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
    { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298 },
    { name: "Houston", country: "USA", lat: 29.7604, lng: -95.3698 },
    { name: "Phoenix", country: "USA", lat: 33.4484, lng: -112.0740 },
    { name: "Philadelphia", country: "USA", lat: 39.9526, lng: -75.1652 },
    { name: "San Antonio", country: "USA", lat: 29.4241, lng: -98.4936 },
    { name: "San Diego", country: "USA", lat: 32.7157, lng: -117.1611 },
    { name: "Dallas", country: "USA", lat: 32.7767, lng: -96.7970 },
    { name: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
    { name: "Austin", country: "USA", lat: 30.2672, lng: -97.7431 },
    { name: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321 },
    { name: "Denver", country: "USA", lat: 39.7392, lng: -104.9903 },
    { name: "Boston", country: "USA", lat: 42.3601, lng: -71.0589 },
    { name: "Miami", country: "USA", lat: 25.7617, lng: -80.1918 },
    { name: "Atlanta", country: "USA", lat: 33.7490, lng: -84.3880 },
    { name: "Las Vegas", country: "USA", lat: 36.1699, lng: -115.1398 },
    { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
    { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
    { name: "Montreal", country: "Canada", lat: 45.5017, lng: -73.5673 },
    { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
    { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
    { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729 },
    { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
    { name: "Lima", country: "Peru", lat: -12.0464, lng: -77.0428 },
    { name: "Bogotá", country: "Colombia", lat: 4.7110, lng: -74.0721 },
    { name: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693 },
    
    // Europe
    { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
    { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
    { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050 },
    { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
    { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
    { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
    { name: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738 },
    { name: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734 },
    { name: "Munich", country: "Germany", lat: 48.1351, lng: 11.5820 },
    { name: "Milan", country: "Italy", lat: 45.4642, lng: 9.1900 },
    { name: "Prague", country: "Czech Republic", lat: 50.0755, lng: 14.4378 },
    { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
    { name: "Brussels", country: "Belgium", lat: 50.8503, lng: 4.3517 },
    { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
    { name: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522 },
    { name: "Copenhagen", country: "Denmark", lat: 55.6761, lng: 12.5683 },
    { name: "Helsinki", country: "Finland", lat: 60.1699, lng: 24.9384 },
    { name: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122 },
    { name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
    { name: "Athens", country: "Greece", lat: 37.9838, lng: 23.7275 },
    { name: "Budapest", country: "Hungary", lat: 47.4979, lng: 19.0402 },
    { name: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417 },
    { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173 },
    { name: "St. Petersburg", country: "Russia", lat: 59.9343, lng: 30.3351 },
    { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
    { name: "Ankara", country: "Turkey", lat: 39.9334, lng: 32.8597 },
    
    // Asia
    { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
    { name: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023 },
    { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780 },
    { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
    { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737 },
    { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694 },
    { name: "Shenzhen", country: "China", lat: 22.5431, lng: 114.0579 },
    { name: "Guangzhou", country: "China", lat: 23.1291, lng: 113.2644 },
    { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
    { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
    { name: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lng: 101.6869 },
    { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
    { name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842 },
    { name: "Ho Chi Minh City", country: "Vietnam", lat: 10.8231, lng: 106.6297 },
    { name: "Hanoi", country: "Vietnam", lat: 21.0278, lng: 105.8342 },
    { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777 },
    { name: "Delhi", country: "India", lat: 28.7041, lng: 77.1025 },
    { name: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946 },
    { name: "Chennai", country: "India", lat: 13.0827, lng: 80.2707 },
    { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639 },
    { name: "Hyderabad", country: "India", lat: 17.3850, lng: 78.4867 },
    { name: "Karachi", country: "Pakistan", lat: 24.8607, lng: 67.0011 },
    { name: "Lahore", country: "Pakistan", lat: 31.5497, lng: 74.3436 },
    { name: "Islamabad", country: "Pakistan", lat: 33.6844, lng: 73.0479 },
    { name: "Dhaka", country: "Bangladesh", lat: 23.8103, lng: 90.4125 },
    { name: "Taipei", country: "Taiwan", lat: 25.0330, lng: 121.5654 },
    
    // Middle East
    { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
    { name: "Abu Dhabi", country: "UAE", lat: 24.4539, lng: 54.3773 },
    { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
    { name: "Jeddah", country: "Saudi Arabia", lat: 21.4858, lng: 39.1925 },
    { name: "Mecca", country: "Saudi Arabia", lat: 21.3891, lng: 39.8579 },
    { name: "Medina", country: "Saudi Arabia", lat: 24.5247, lng: 39.5692 },
    { name: "Doha", country: "Qatar", lat: 25.2854, lng: 51.5310 },
    { name: "Kuwait City", country: "Kuwait", lat: 29.3759, lng: 47.9774 },
    { name: "Manama", country: "Bahrain", lat: 26.2285, lng: 50.5860 },
    { name: "Muscat", country: "Oman", lat: 23.5880, lng: 58.3829 },
    { name: "Amman", country: "Jordan", lat: 31.9454, lng: 35.9284 },
    { name: "Beirut", country: "Lebanon", lat: 33.8938, lng: 35.5018 },
    { name: "Tel Aviv", country: "Israel", lat: 32.0853, lng: 34.7818 },
    { name: "Jerusalem", country: "Israel", lat: 31.7683, lng: 35.2137 },
    { name: "Tehran", country: "Iran", lat: 35.6892, lng: 51.3890 },
    { name: "Baghdad", country: "Iraq", lat: 33.3152, lng: 44.3661 },
    { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
    { name: "Alexandria", country: "Egypt", lat: 31.2001, lng: 29.9187 },
    
    // Africa
    { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
    { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 },
    { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
    { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
    { name: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898 },
    { name: "Marrakech", country: "Morocco", lat: 31.6295, lng: -7.9811 },
    { name: "Tunis", country: "Tunisia", lat: 36.8065, lng: 10.1815 },
    { name: "Algiers", country: "Algeria", lat: 36.7538, lng: 3.0588 },
    { name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.1870 },
    { name: "Addis Ababa", country: "Ethiopia", lat: 8.9806, lng: 38.7578 },
    
    // Oceania
    { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
    { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
    { name: "Brisbane", country: "Australia", lat: -27.4698, lng: 153.0251 },
    { name: "Perth", country: "Australia", lat: -31.9505, lng: 115.8605 },
    { name: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633 },
    { name: "Wellington", country: "New Zealand", lat: -41.2865, lng: 174.7762 },
];

// Search function with fuzzy matching
function searchCities(query) {
    if (!query || query.length < 2) return [];
    
    const q = query.toLowerCase();
    return CITIES
        .filter(city => 
            city.name.toLowerCase().includes(q) || 
            city.country.toLowerCase().includes(q)
        )
        .slice(0, 10)
        .map(city => ({
            ...city,
            display: `${city.name}, ${city.country}`
        }));
}
