

import React, { useState, useEffect } from 'react';
import Widget from './Widget';
import { API_BASE_URL, loadingSVG, errorSVG } from '../utils';
import { WeatherData } from '../types';

const weatherWidgetIcon = `<svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 9.293A8 8 0 0010 4C7.344 4 5.051 5.546 4 7.653A5.001 5.001 0 002 12.5C2 15.533 4.467 18 7.5 18h5c3.033 0 5.5-2.467 5.5-5.5 0-2.033-1.117-3.79-2.707-4.707z"></path></svg>`;

const WeatherWidget: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<string | null>('Attempting to get your location...');

  useEffect(() => {
    const fetchWeather = async (lat?: number, lon?: number) => {
      setIsLoading(true);
      setError(null); 
      let url = `${API_BASE_URL}/api/weather${(lat !== undefined && lon !== undefined) ? `?lat=${lat}&lon=${lon}` : ''}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          // Try to parse error from backend if it's JSON, otherwise use status text
          let errorResponseMessage = `HTTP error! Status: ${response.status} ${response.statusText}.`;
          try {
              const errorData = await response.json();
              errorResponseMessage = errorData.error || errorData.message || errorResponseMessage;
          } catch (parseError) {
              // console.warn("Could not parse error response as JSON:", parseError);
          }
          throw new Error(errorResponseMessage);
        }
        const data: WeatherData = await response.json();
        setWeatherData(data);
        setUserMessage(null); 
      } catch (err) {
        console.error('Error fetching weather data:', err);
        let specificMessage = "Could not fetch weather data.";
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          specificMessage = `Failed to connect to the server at ${API_BASE_URL} for weather data. Please ensure the backend server (server.js) is running and accessible.`;
        } else if (err instanceof Error) {
          specificMessage = `Error fetching weather: ${err.message}. Please verify the backend server at ${API_BASE_URL} and its API connections.`;
        } else {
          specificMessage = `An unknown error occurred while fetching weather. Please check the backend server at ${API_BASE_URL}.`;
        }
        setError(specificMessage);
        setUserMessage(null); 
      } finally {
        setIsLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserMessage('Location found. Fetching weather...');
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (geoError: GeolocationPositionError) => {
          let geoMsg = 'Could not retrieve location. ';
          const errorMessages: { [key: number]: string } = {
            [geoError.PERMISSION_DENIED]: "Location access denied.",
            [geoError.POSITION_UNAVAILABLE]: "Location information unavailable.",
            [geoError.TIMEOUT]: "Location request timed out."
          };
          geoMsg += errorMessages[geoError.code] || `Unknown error (Code: ${geoError.code}).`;
          console.warn('Geolocation error:', geoError.message);
          setUserMessage(`${geoMsg} Fetching default weather.`);
          fetchWeather(); 
        }
      );
    } else {
      setUserMessage('Geolocation not supported. Fetching default weather.');
      fetchWeather(); 
    }
  }, []); // Empty dependency array: runs once on mount.

  const renderContent = () => {
    if (isLoading && !weatherData && !error) { // Show initial loading or location message
        return <div className="loading-state" dangerouslySetInnerHTML={{ __html: loadingSVG + `<p>${userMessage || 'Loading weather...'}</p>` }} />;
    }
    if (error) return <div className="error-state" dangerouslySetInnerHTML={{ __html: errorSVG + `<p>${error}</p>` }} />;
    if (weatherData) {
      return (
        <div className="weather-widget">
          <div className="weather-icon-placeholder" dangerouslySetInnerHTML={{ __html: weatherWidgetIcon }} />
          <div className="temp">{Math.round(weatherData.temperature)}°C</div>
          <div className="condition">{weatherData.condition}</div>
          <div className="location">{weatherData.location}</div>
        </div>
      );
    }
     // Fallback for user message if still relevant and no other state is dominant
    if (userMessage) return <div className="loading-state" dangerouslySetInnerHTML={{ __html: loadingSVG + `<p>${userMessage}</p>` }} />;
    return null;
  };

  return (
    <Widget title="Weather" iconSvg={weatherWidgetIcon} customClasses="compact-highlight-widget weather-widget">
      {renderContent()}
    </Widget>
  );
};

export default WeatherWidget;
