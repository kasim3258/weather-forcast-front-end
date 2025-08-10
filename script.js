document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const errorMessage = document.getElementById('error-message');
    const weatherInfo = document.getElementById('weather-info');
    
    // Weather elements
    const locationElement = document.getElementById('location');
    const dateElement = document.getElementById('date');
    const weatherIcon = document.getElementById('weather-icon');
    const temperatureElement = document.getElementById('temperature');
    const weatherDescription = document.getElementById('weather-description');
    const minTempElement = document.getElementById('min-temp');
    const maxTempElement = document.getElementById('max-temp');
    const humidityElement = document.getElementById('humidity');
    const windSpeedElement = document.getElementById('wind-speed');
    const forecastItems = document.getElementById('forecast-items');

    // API key - in a real app, this should be secured
    const apiKey = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
    
    // Initial load - show weather for default city
    fetchWeather('Guntur');
    
    // Event listeners
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    });
    
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                fetchWeather(city);
            }
        }
    });
    
    // Fetch weather data from OpenWeatherMap API
    function fetchWeather(city) {
        // Current weather
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('City not found');
                }
                return response.json();
            })
            .then(data => {
                displayWeather(data);
                errorMessage.style.display = 'none';
                weatherInfo.style.display = 'block';
                
                // Fetch forecast after current weather is loaded
                return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Forecast not available');
                }
                return response.json();
            })
            .then(forecastData => {
                displayForecast(forecastData);
            })
            .catch(error => {
                console.error('Error:', error);
                weatherInfo.style.display = 'none';
                errorMessage.style.display = 'block';
            });
    }
    
    // Display current weather
    function displayWeather(data) {
        locationElement.textContent = `${data.name}, ${data.sys.country}`;
        
        const now = new Date();
        dateElement.textContent = formatDate(now);
        
        temperatureElement.innerHTML = `${Math.round(data.main.temp)}<span>°C</span>`;
        weatherDescription.textContent = data.weather[0].description;
        minTempElement.textContent = `${Math.round(data.main.temp_min)}°C`;
        maxTempElement.textContent = `${Math.round(data.main.temp_max)}°C`;
        humidityElement.textContent = `${data.main.humidity}%`;
        windSpeedElement.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        
        const iconCode = data.weather[0].icon;
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.alt = data.weather[0].main;
    }
    
    // Display 5-day forecast
    function displayForecast(data) {
        forecastItems.innerHTML = '';
        
        // Filter to get one forecast per day at noon (or closest available)
        const dailyForecasts = [];
        const daysAdded = new Set();
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Only add one forecast per day
            if (!daysAdded.has(day)) {
                daysAdded.add(day);
                dailyForecasts.push({
                    day,
                    temp: Math.round(item.main.temp),
                    icon: item.weather[0].icon,
                    description: item.weather[0].description
                });
            }
            
            // Stop when we have 5 days
            if (dailyForecasts.length >= 5) return;
        });
        
        // Create forecast items
        dailyForecasts.forEach(forecast => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-day">${forecast.day}</div>
                <div class="forecast-icon">
                    <img src="https://openweathermap.org/img/wn/${forecast.icon}.png" alt="${forecast.description}">
                </div>
                <div class="forecast-temp">${forecast.temp}°C</div>
            `;
            forecastItems.appendChild(forecastItem);
        });
    }
    
    // Helper function to format date
    function formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
});