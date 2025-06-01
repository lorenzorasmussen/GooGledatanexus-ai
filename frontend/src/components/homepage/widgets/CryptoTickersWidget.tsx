import React, { useState, useEffect } from 'react';
import './CryptoTickersWidget.css';

interface CryptoData {
  symbol: string;
  price: string;
}

const CryptoTickersWidget: React.FC = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setLoading(true);
        setError(null);
        const API_KEY = '43515aad-dd6a-4f2a-9327-008cd2278117'; // Replace with your actual CoinMarketCap API key
        const response = await fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC,ETH', {
          headers: {
            'X-CMC_PRO_API_KEY': API_KEY,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.status.error_code) {
          throw new Error(data.status.error_message);
        }

        const fetchedData: CryptoData[] = [
          { symbol: 'BTC/USD', price: `$${data.data.BTC.quote.USD.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { symbol: 'ETH/USD', price: `$${data.data.ETH.quote.USD.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        ];
        setCryptoData(fetchedData);
      } catch (err) {
        setError("Failed to fetch crypto data");
        console.error("Crypto fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();

    // Refresh data every 30 seconds (example)
    const interval = setInterval(fetchCryptoData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="widget crypto-tickers-widget glass-panel">
      <div className="widget-header">
        <h3>Crypto Tickers</h3>
      </div>
      <div className="widget-content">
        {loading && <p>Loading crypto data...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && cryptoData.length === 0 && <p>No crypto data available.</p>}
        {!loading && !error && cryptoData.length > 0 && (
          <ul className="crypto-list">
            {cryptoData.map((item) => (
              <li key={item.symbol} className="crypto-item">
                <span className="crypto-symbol">{item.symbol}</span>
                <span className="crypto-price">{item.price}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CryptoTickersWidget;