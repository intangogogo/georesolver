/* =========================================================
   GEORESOLVER // CORE MAP ENGINE & INTERACTIVE LOGIC
   ========================================================= */

// Default Pin Coordinates
let activeCoords = {
    lat: -7.32511,
    lng: 108.22491,
    label: "Primary Target"
};

// User's Location (if Geolocation is enabled)
let userCoords = null;

// Leaflet Map & Layer instances
let map;
let activeMarker;
let activeTileLayer;

// Define Premium Tile Providers
const tileProviders = {
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        options: {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }
    },
    light: {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        options: {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 18
        }
    }
};

// DOM Elements
const dispLat = document.getElementById('disp-lat');
const dispLng = document.getElementById('disp-lng');
const locRegion = document.getElementById('loc-region');
const locDetail = document.getElementById('loc-detail');

const btnRecenter = document.getElementById('btn-recenter');
const btnCopy = document.getElementById('btn-copy');

const themeDark = document.getElementById('theme-dark');
const themeLight = document.getElementById('theme-light');
const themeSatellite = document.getElementById('theme-satellite');

const btnCalcDistance = document.getElementById('btn-calc-distance');
const distPanel = document.getElementById('distance-result-panel');
const distKm = document.getElementById('dist-km');
const distMi = document.getElementById('dist-mi');
const distCoordsPath = document.getElementById('dist-coords-path');

const customPinForm = document.getElementById('custom-pin-form');
const inputLat = document.getElementById('input-lat');
const inputLng = document.getElementById('input-lng');

/* ---------------------------------------------------------
   MAP INITIALIZATION
   --------------------------------------------------------- */
function initMap() {
    // 1. Create Leaflet map container (disable default zoom control position to place it at bottom-right)
    map = L.map('map', {
        zoomControl: false
    }).setView([activeCoords.lat, activeCoords.lng], 14);

    // 2. Add restyled Zoom control at the bottom right
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // 3. Set default Dark Canvas Theme
    setMapTheme('dark');

    // 4. Create and Add Custom Pulse Marker
    updateMarker();
    
    // 5. Setup smooth initial fly-to focus
    setTimeout(() => {
        map.flyTo([activeCoords.lat, activeCoords.lng], 14, {
            animate: true,
            duration: 1.8
        });
    }, 500);
}

/* ---------------------------------------------------------
   THEME MANAGER
   --------------------------------------------------------- */
function setMapTheme(themeName) {
    // Remove current tile layer if it exists
    if (activeTileLayer) {
        map.removeLayer(activeTileLayer);
    }

    // Load new tile layer based on provider
    const provider = tileProviders[themeName];
    activeTileLayer = L.tileLayer(provider.url, provider.options);
    activeTileLayer.addTo(map);

    // Update active button state
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[data-theme="${themeName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

/* ---------------------------------------------------------
   MARKER MANAGER
   --------------------------------------------------------- */
function updateMarker() {
    // Remove existing marker if any
    if (activeMarker) {
        map.removeLayer(activeMarker);
    }

    // Custom animated Radar Dot icon using pure CSS
    const customRadarIcon = L.divIcon({
        className: 'custom-radar-marker-container',
        html: `
            <div class="custom-radar-marker">
                <div class="radar-pulse-halo"></div>
                <div class="radar-pulse"></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    // Premium popup layout content
    const popupContent = `
        <div class="popup-container">
            <div class="popup-header">
                <i class="fa-solid fa-compass brand-icon"></i>
                <span>${activeCoords.label}</span>
            </div>
            <div class="popup-body">
                <p>Pin successfully projected onto map terrain.</p>
                <div class="popup-coords">
                    Lat: ${activeCoords.lat.toFixed(5)}<br>
                    Lng: ${activeCoords.lng.toFixed(5)}
                </div>
            </div>
        </div>
    `;

    // Initialize marker and attach popup
    activeMarker = L.marker([activeCoords.lat, activeCoords.lng], { icon: customRadarIcon })
        .addTo(map)
        .bindPopup(popupContent, {
            offset: [0, -8],
            closeButton: false
        });
    
    // Auto open popup after render
    activeMarker.openPopup();
}

/* ---------------------------------------------------------
   GEODESIC CALCULATOR (Haversine Formula)
   --------------------------------------------------------- */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    const distanceMi = distanceKm * 0.621371; // Convert to miles

    return {
        km: distanceKm.toFixed(2),
        mi: distanceMi.toFixed(2)
    };
}

/* ---------------------------------------------------------
   EVENT LISTENERS & INTERACTION HANDLERS
   --------------------------------------------------------- */

// Theme Selection Click handlers
themeDark.addEventListener('click', () => setMapTheme('dark'));
themeLight.addEventListener('click', () => setMapTheme('light'));
themeSatellite.addEventListener('click', () => setMapTheme('satellite'));

// Recenter Button Click
btnRecenter.addEventListener('click', () => {
    map.flyTo([activeCoords.lat, activeCoords.lng], 14, {
        animate: true,
        duration: 1.5
    });
    activeMarker.openPopup();
});

// Copy Coordinates Button Click
btnCopy.addEventListener('click', () => {
    const coordString = `${activeCoords.lat}, ${activeCoords.lng}`;
    
    navigator.clipboard.writeText(coordString).then(() => {
        // Change button layout temporarily to provide aesthetic positive feedback
        const originalHTML = btnCopy.innerHTML;
        btnCopy.innerHTML = `<i class="fa-solid fa-check" style="color: var(--neon-cyan)"></i> Copied!`;
        btnCopy.classList.add('btn-primary');
        btnCopy.classList.remove('btn-secondary');
        
        setTimeout(() => {
            btnCopy.innerHTML = originalHTML;
            btnCopy.classList.remove('btn-primary');
            btnCopy.classList.add('btn-secondary');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
});

// Geolocation Distance Calculator Click
btnCalcDistance.addEventListener('click', () => {
    btnCalcDistance.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Fetching Location...`;
    
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        btnCalcDistance.innerHTML = `<i class="fa-solid fa-location-arrow"></i> Calculate from My Location`;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Calculate geodesic distance
            const distance = calculateDistance(
                userCoords.lat,
                userCoords.lng,
                activeCoords.lat,
                activeCoords.lng
            );

            // Display results
            distKm.innerText = parseFloat(distance.km).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            distMi.innerText = parseFloat(distance.mi).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            
            distCoordsPath.innerHTML = `From: <span style="color: var(--neon-cyan)">${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}</span> (My GPS) <br>To active target pin`;
            
            // Show Panel
            distPanel.classList.remove('hidden');
            
            // Reset Button
            btnCalcDistance.innerHTML = `<i class="fa-solid fa-location-arrow"></i> Recalculate Distance`;
        },
        (error) => {
            console.error("Geolocation Error: ", error);
            alert(`Unable to retrieve your location. Error: ${error.message}`);
            btnCalcDistance.innerHTML = `<i class="fa-solid fa-location-arrow"></i> Calculate from My Location`;
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
});

// Custom Coordinates Form Submission
customPinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const latVal = parseFloat(inputLat.value);
    const lngVal = parseFloat(inputLng.value);

    if (isNaN(latVal) || isNaN(lngVal)) {
        alert("Please enter valid decimal coordinates.");
        return;
    }

    // Set new active coordinates
    activeCoords = {
        lat: latVal,
        lng: lngVal,
        label: "Custom Projected Pin"
    };

    // Update Floating card display
    dispLat.innerText = activeCoords.lat.toFixed(5);
    dispLng.innerText = activeCoords.lng.toFixed(5);
    
    // Update card location description
    locRegion.innerText = "Custom Projected Location";
    locDetail.innerText = `Geocentric coordinates projected by user`;

    // Redraw marker at new location
    updateMarker();

    // Fly to new marker
    map.flyTo([activeCoords.lat, activeCoords.lng], 14, {
        animate: true,
        duration: 1.5
    });

    // Reset distance panel if it was open (since target coordinates changed)
    if (userCoords) {
        const distance = calculateDistance(
            userCoords.lat,
            userCoords.lng,
            activeCoords.lat,
            activeCoords.lng
        );
        distKm.innerText = parseFloat(distance.km).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        distMi.innerText = parseFloat(distance.mi).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } else {
        distPanel.classList.add('hidden');
    }

    // Clear form inputs
    customPinForm.reset();
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', initMap);
