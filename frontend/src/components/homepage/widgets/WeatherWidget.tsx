import React, { useState, useEffect } from 'react';
import './WeatherWidget.css';

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // In a real application, you would fetch weather data from an API
        // For this example, we'll simulate a delay and provide dummy data
        setLoading(true);
        setError(null);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call delay
        const dummyWeather = "Sunny, 25°C";
        setWeather(dummyWeather);
      } catch (err) {
        setError("Failed to fetch weather");
        console.error("Weather fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return (
    <div className="widget weather-widget glass-panel">
      <div className="widget-header">
        <h3>Weather</h3>
      </div>
      <div className="widget-content">
        {loading && <p>Loading weather...</p>}
        {error && <p className="error-message">{error}</p>}
        {weather && <p className="weather-info">{weather}</p>}
      </div>
    </div>
  );
};

export default WeatherWidget;