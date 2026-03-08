const axios = require('axios');

let weatherCache = null;
let lastFetch = null;
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 saat

const getWeather = async () => {
  // Cache kontrolü
  if (weatherCache && lastFetch && (Date.now() - lastFetch < CACHE_DURATION)) {
    return weatherCache;
  }

  try {
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    const CITY = 'Aksaray';
    const COUNTRY = 'TR';
    
    if (!API_KEY) {
      return { error: 'API key tanımlı değil' };
    }

    // Mevcut hava durumu
    const currentRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${CITY},${COUNTRY}&appid=${API_KEY}&units=metric&lang=tr`
    );

    // 5 günlük tahmin
    const forecastRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${CITY},${COUNTRY}&appid=${API_KEY}&units=metric&lang=tr`
    );

    const current = currentRes.data;
    const forecast = forecastRes.data;

    // Günlük tahminleri grupla (her gün için öğlen saati)
    const dailyForecast = [];
    const processedDays = new Set();
    
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toISOString().split('T')[0];
      const hour = date.getHours();
      
      // Her gün için sadece öğlen saatini al
      if (hour === 12 && !processedDays.has(day) && dailyForecast.length < 5) {
        processedDays.add(day);
        dailyForecast.push({
          date: day,
          temp: Math.round(item.main.temp),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          windSpeed: Math.round(item.wind.speed * 3.6), // m/s to km/h
          rain: item.rain ? item.rain['3h'] || 0 : 0
        });
      }
    });

    weatherCache = {
      current: {
        temp: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        tempMin: Math.round(current.main.temp_min),
        tempMax: Math.round(current.main.temp_max),
        description: current.weather[0].description,
        icon: current.weather[0].icon,
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind.speed * 3.6),
        pressure: current.main.pressure,
        visibility: Math.round(current.visibility / 1000), // km
        sunrise: new Date(current.sys.sunrise * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        sunset: new Date(current.sys.sunset * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      },
      forecast: dailyForecast,
      city: current.name,
      lastUpdate: new Date().toISOString()
    };

    lastFetch = Date.now();
    return weatherCache;

  } catch (error) {
    console.error('Hava durumu hatası:', error.message);
    return weatherCache || { error: 'Hava durumu alınamadı' };
  }
};

module.exports = { getWeather };
