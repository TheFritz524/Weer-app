// Global variables to store location data
let selectedLocation = null;

// Demo mode flag (set to true to use sample data for testing)
const DEMO_MODE = false;

// Initialize date inputs with default values
window.addEventListener('DOMContentLoaded', () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Default to last 7 days
    
    document.getElementById('endDate').valueAsDate = endDate;
    document.getElementById('startDate').valueAsDate = startDate;
    
    // Set max date to today
    document.getElementById('endDate').max = endDate.toISOString().split('T')[0];
    document.getElementById('startDate').max = endDate.toISOString().split('T')[0];
    
    // Allow Enter key to trigger search
    document.getElementById('location').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });
});

// Search for location using geocoding API
async function searchLocation() {
    const locationInput = document.getElementById('location').value.trim();
    
    if (!locationInput) {
        showError('Voer een locatie in');
        return;
    }
    
    showLoading(true);
    hideError();
    document.getElementById('locationInfo').style.display = 'none';
    document.getElementById('weatherData').style.display = 'none';
    
    try {
        if (DEMO_MODE) {
            // Demo mode with sample data
            selectedLocation = {
                name: locationInput,
                country: 'Nederland',
                latitude: 52.3676,
                longitude: 4.9041
            };
            displayLocationInfo(selectedLocation);
            document.getElementById('fetchBtn').disabled = false;
        } else {
            // Use Open-Meteo Geocoding API
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationInput)}&count=1&language=nl&format=json`
            );
            
            if (!response.ok) {
                throw new Error('Kon locatie niet ophalen');
            }
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                throw new Error('Locatie niet gevonden. Probeer een andere naam.');
            }
            
            selectedLocation = data.results[0];
            displayLocationInfo(selectedLocation);
            document.getElementById('fetchBtn').disabled = false;
        }
        
    } catch (error) {
        showError(error.message);
        document.getElementById('fetchBtn').disabled = true;
    } finally {
        showLoading(false);
    }
}

// Display location information
function displayLocationInfo(location) {
    const locationInfoDiv = document.getElementById('locationInfo');
    const latDirection = location.latitude >= 0 ? 'N' : 'Z';
    const lonDirection = location.longitude >= 0 ? 'O' : 'W';
    
    // Clear previous content
    locationInfoDiv.innerHTML = '';
    
    // Create elements safely
    const heading = document.createElement('h3');
    heading.textContent = `📍 ${location.name}`;
    
    const countryPara = document.createElement('p');
    countryPara.textContent = `Land: ${location.country || 'Onbekend'}`;
    
    const coordsPara = document.createElement('p');
    coordsPara.textContent = `Coördinaten: ${Math.abs(location.latitude).toFixed(4)}°${latDirection}, ${Math.abs(location.longitude).toFixed(4)}°${lonDirection}`;
    
    locationInfoDiv.appendChild(heading);
    locationInfoDiv.appendChild(countryPara);
    locationInfoDiv.appendChild(coordsPara);
    locationInfoDiv.style.display = 'block';
}

// Fetch historical weather data
async function fetchWeatherData() {
    if (!selectedLocation) {
        showError('Selecteer eerst een locatie');
        return;
    }
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        showError('Selecteer zowel start- als einddatum');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showError('Startdatum moet voor einddatum liggen');
        return;
    }
    
    showLoading(true);
    hideError();
    document.getElementById('weatherData').style.display = 'none';
    
    try {
        if (DEMO_MODE) {
            // Demo mode with sample data
            const data = generateSampleWeatherData(startDate, endDate);
            displayWeatherData(data);
        } else {
            // Use Open-Meteo Historical Weather API
            const url = `https://archive-api.open-meteo.com/v1/archive?` +
                `latitude=${selectedLocation.latitude}&` +
                `longitude=${selectedLocation.longitude}&` +
                `start_date=${startDate}&` +
                `end_date=${endDate}&` +
                `daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,` +
                `precipitation_sum,windspeed_10m_max,weathercode&` +
                `timezone=Europe/Amsterdam`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Kon weergegevens niet ophalen');
            }
            
            const data = await response.json();
            displayWeatherData(data);
        }
        
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Generate sample weather data for demo mode
function generateSampleWeatherData(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const data = {
        daily: {
            time: [],
            temperature_2m_max: [],
            temperature_2m_min: [],
            temperature_2m_mean: [],
            precipitation_sum: [],
            windspeed_10m_max: [],
            weathercode: []
        }
    };
    
    for (let i = 0; i < days; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        data.daily.time.push(date.toISOString().split('T')[0]);
        
        // Generate realistic random weather data
        const baseTemp = 15 + Math.sin(i / 30) * 5;
        data.daily.temperature_2m_mean.push(baseTemp + (Math.random() - 0.5) * 3);
        data.daily.temperature_2m_max.push(baseTemp + 5 + Math.random() * 3);
        data.daily.temperature_2m_min.push(baseTemp - 5 - Math.random() * 3);
        data.daily.precipitation_sum.push(Math.random() < 0.3 ? Math.random() * 15 : 0);
        data.daily.windspeed_10m_max.push(10 + Math.random() * 20);
        
        // Random weather codes
        const codes = [0, 1, 2, 3, 45, 51, 61, 63, 80, 95];
        data.daily.weathercode.push(codes[Math.floor(Math.random() * codes.length)]);
    }
    
    return data;
}

// Weather code descriptions (WMO codes)
function getWeatherDescription(code) {
    const weatherCodes = {
        0: '☀️ Helder',
        1: '🌤️ Overwegend helder',
        2: '⛅ Gedeeltelijk bewolkt',
        3: '☁️ Bewolkt',
        45: '🌫️ Mist',
        48: '🌫️ Aanvriezende mist',
        51: '🌦️ Lichte motregen',
        53: '🌦️ Matige motregen',
        55: '🌦️ Dichte motregen',
        61: '🌧️ Lichte regen',
        63: '🌧️ Matige regen',
        65: '🌧️ Zware regen',
        71: '🌨️ Lichte sneeuw',
        73: '🌨️ Matige sneeuw',
        75: '🌨️ Zware sneeuw',
        77: '❄️ Sneeuwkorrels',
        80: '🌦️ Lichte buien',
        81: '🌧️ Matige buien',
        82: '⛈️ Zware buien',
        85: '🌨️ Lichte sneeuwbuien',
        86: '🌨️ Zware sneeuwbuien',
        95: '⛈️ Onweer',
        96: '⛈️ Onweer met lichte hagel',
        99: '⛈️ Onweer met zware hagel'
    };
    
    return weatherCodes[code] || '❓ Onbekend';
}

// Display weather data in a table
function displayWeatherData(data) {
    const weatherDataDiv = document.getElementById('weatherData');
    const weatherTableDiv = document.getElementById('weatherTable');
    
    if (!data.daily || !data.daily.time) {
        showError('Geen weergegevens beschikbaar voor deze periode');
        return;
    }
    
    let tableHTML = `
        <div class="weather-table">
            <table>
                <thead>
                    <tr>
                        <th>Datum</th>
                        <th>Conditie</th>
                        <th>Max Temp (°C)</th>
                        <th>Min Temp (°C)</th>
                        <th>Gem Temp (°C)</th>
                        <th>Neerslag (mm)</th>
                        <th>Max Wind (km/h)</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    for (let i = 0; i < data.daily.time.length; i++) {
        const date = new Date(data.daily.time[i]);
        const formattedDate = date.toLocaleDateString('nl-NL', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        tableHTML += `
            <tr>
                <td><strong>${formattedDate}</strong></td>
                <td>${getWeatherDescription(data.daily.weathercode[i])}</td>
                <td class="temp-positive">${data.daily.temperature_2m_max[i]?.toFixed(1) ?? '-'}</td>
                <td class="temp-negative">${data.daily.temperature_2m_min[i]?.toFixed(1) ?? '-'}</td>
                <td>${data.daily.temperature_2m_mean[i]?.toFixed(1) ?? '-'}</td>
                <td>${data.daily.precipitation_sum[i]?.toFixed(1) ?? '0.0'}</td>
                <td>${data.daily.windspeed_10m_max[i]?.toFixed(1) ?? '-'}</td>
            </tr>
        `;
    }
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    weatherTableDiv.innerHTML = tableHTML;
    displayWeatherSummary(data);
    weatherDataDiv.style.display = 'block';
}

// Display weather summary statistics
function displayWeatherSummary(data) {
    const summaryDiv = document.getElementById('weatherSummary');
    
    // Calculate statistics
    const temps = data.daily.temperature_2m_mean.filter(t => t !== null);
    const maxTemps = data.daily.temperature_2m_max.filter(t => t !== null);
    const minTemps = data.daily.temperature_2m_min.filter(t => t !== null);
    const precip = data.daily.precipitation_sum.filter(p => p !== null);
    
    const avgTemp = temps.length > 0 ? 
        (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '-';
    const maxTemp = maxTemps.length > 0 ? 
        Math.max(...maxTemps).toFixed(1) : '-';
    const minTemp = minTemps.length > 0 ? 
        Math.min(...minTemps).toFixed(1) : '-';
    const totalPrecip = precip.length > 0 ? 
        precip.reduce((a, b) => a + b, 0).toFixed(1) : '0.0';
    
    summaryDiv.innerHTML = `
        <h3>📊 Samenvatting</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">Gemiddelde Temperatuur</div>
                <div class="value">${avgTemp}°C</div>
            </div>
            <div class="summary-item">
                <div class="label">Hoogste Temperatuur</div>
                <div class="value temp-positive">${maxTemp}°C</div>
            </div>
            <div class="summary-item">
                <div class="label">Laagste Temperatuur</div>
                <div class="value temp-negative">${minTemp}°C</div>
            </div>
            <div class="summary-item">
                <div class="label">Totale Neerslag</div>
                <div class="value">${totalPrecip} mm</div>
            </div>
        </div>
    `;
}

// Helper functions
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '⚠️ ' + message;
    errorDiv.style.display = 'block';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}
