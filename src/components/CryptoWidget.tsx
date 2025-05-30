

import React, { useState, useEffect, useCallback } from 'react';
import Widget from './Widget';
import { API_BASE_URL, loadingSVG, errorSVG } from '../utils';
import { CryptoData } from '../types';

interface CryptoWidgetProps {
  pair: 'BTCUSD' | 'ETHUSD';
  pairSymbol: string;
  initialPriceColorClass: 'btc' | 'eth';
}

const btcIcon = `<svg fill="var(--color-btc)" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.614 10.124c.36-2.146-1.218-3.505-3.722-4.294l.802-3.223H17.11l-.642 2.588c-.358-.07-.716-.144-1.071-.207l.642-2.588H13.45l-.642 2.588c-.572-.144-1.144-.288-1.644-.429l.358-1.428L9.23 6.056c-.572 1.428.0 2.575 1.218 3.148.859.429 2.35.929 2.35.929.144 0 .215.144.215.288s-.071.288-.215.288c-1.85-.499-1.85-.499-1.85-.499s-1.144.429-1.351.643c-.215.215-.358.929.144 1.351.499.429 1.071.715 1.564.929l-.642 2.588h2.711l.642-2.588c.429.071.798.144 1.144.215l-.642 2.588h2.711l.642-2.588c2.061.214 3.565.786 4.341 2.288.643 1.144.499 2.35-.143 3.148-.573.643-1.428 1-2.498 1H11.86v2.288h2.642c.072 0 .144.072.215.072.572 0 1.071-.072 1.5-.215l.642 2.588h2.711l-.715-2.646c.786-.215 1.499-.499 2.061-.858.143 0 .215 0 .215-.072s-.072-.143-.144-.143c-.071 0-.143 0-.143-.072.929-.642 1.499-1.631 1.631-2.861.143-1.144-.143-2.061-.715-2.861-.572-.714-1.499-1.144-2.712-1.428zm-3.565 3.572h-2.642c-.072 0-.072 0-.144-.072-.715-.288-1.218-.572-1.428-.858-.215-.288-.215-.643.071-.858.288-.215.715-.429 1.428-.643.072 0 .144-.072.144-.072h2.642c1.564 0 2.427.643 2.427 1.631.001.928-.714 1.572-2.499 1.572z"></path></svg>`;
const ethIcon = `<svg fill="var(--color-eth)" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 1.75l-5.92 8.99 5.92 3.27 5.92-3.27L12 1.75zm0 14.57l-5.92-3.27L12 22.25l5.92-9.21-5.92 3.27z"></path></svg>`;

const CryptoWidget: React.FC<CryptoWidgetProps> = ({ pair, pairSymbol, initialPriceColorClass }) => {
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const iconSvg = pair === 'BTCUSD' ? btcIcon : ethIcon;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setExplanation(null); 
      setAiError(null);     
      try {
        const response = await fetch(`${API_BASE_URL}/api/crypto/${pair}`);
        if (!response.ok) {
            // Try to parse error from backend if it's JSON, otherwise use status text
            let errorResponseMessage = `HTTP error! status: ${response.status} ${response.statusText}.`;
            try {
                const errorData = await response.json();
                errorResponseMessage = errorData.error || errorData.message || errorResponseMessage;
            } catch (parseError) {
                // console.warn("Could not parse error response as JSON:", parseError);
            }
            throw new Error(errorResponseMessage);
        }
        const data: CryptoData = await response.json();
        setCryptoData(data);
      } catch (err) {
        console.error(`Error fetching ${pairSymbol} data:`, err);
        let specificMessage = `Failed to load ${pairSymbol} data.`;
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          specificMessage = `Failed to connect to the server at ${API_BASE_URL} for ${pairSymbol} data. Please ensure the backend server (server.js) is running and accessible.`;
        } else if (err instanceof Error) {
          specificMessage = `Error loading ${pairSymbol} data: ${err.message}. Please check the backend server at ${API_BASE_URL} or its connection to CoinGecko.`;
        } else {
          specificMessage = `An unknown error occurred while loading ${pairSymbol} data. Please check the backend server at ${API_BASE_URL}.`;
        }
        setError(specificMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [pair, pairSymbol]); // pairSymbol added for completeness though pair implies it

  const fetchExplanation = useCallback(async () => {
    if (!cryptoData) {
      setAiError("Crypto data not available to generate explanation.");
      return;
    }
    setIsAiLoading(true);
    setExplanation(null);
    setAiError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/explain-crypto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairSymbol, price: cryptoData.price, changePercent: cryptoData.change_percent }),
      });
      if (!res.ok) {
        // Try to parse error from backend if it's JSON, otherwise use status text
        let errorResponseMessage = `HTTP error! status: ${res.status} ${res.statusText}.`;
        try {
            const errorData = await res.json();
            errorResponseMessage = errorData.error || errorData.message || errorResponseMessage;
        } catch (parseError) {
            // console.warn("Could not parse error response as JSON:", parseError);
        }
        throw new Error(errorResponseMessage);
      }
      const data = await res.json();
      if (data.explanation) setExplanation(data.explanation);
      else throw new Error("No explanation content received from backend.");
    } catch (err) {
      console.error('Error fetching AI explanation:', err);
      let specificMessage = 'Failed to get AI explanation.';
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        specificMessage = `Failed to connect to the server at ${API_BASE_URL} for AI explanation. Please ensure the backend server (server.js) is running and accessible.`;
      } else if (err instanceof Error) {
        specificMessage = `Error getting AI explanation: ${err.message}. Check the backend server and its Gemini API configuration.`;
      } else {
        specificMessage = `An unknown error occurred while getting AI explanation. Check the backend server.`;
      }
      setAiError(specificMessage);
    } finally {
      setIsAiLoading(false);
    }
  }, [cryptoData, pairSymbol]);

  return (
    <Widget title={pairSymbol} iconSvg={iconSvg} customClasses={`compact-highlight-widget crypto-widget ${initialPriceColorClass}`}>
      {isLoading && <div className="loading-state" dangerouslySetInnerHTML={{ __html: loadingSVG + `<p>Loading ${pairSymbol}...</p>` }} />}
      {error && <div className="error-state" dangerouslySetInnerHTML={{ __html: errorSVG + `<p>${error}</p>` }} />}
      {!isLoading && !error && cryptoData && (
        <>
          <div className={`price ${initialPriceColorClass}`}>${parseFloat(cryptoData.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div className={`change ${parseFloat(cryptoData.change_percent) >= 0 ? 'positive' : 'negative'}`}>
            {parseFloat(cryptoData.change_percent).toFixed(2)}% (24h)
          </div>
          <button
            onClick={fetchExplanation}
            disabled={isAiLoading || !cryptoData}
            className="widget-header-button" // Re-using for consistent compact button style
            style={{marginTop: '0.75rem', alignSelf: 'flex-start', fontSize: '0.7rem', padding: '0.2rem 0.5rem'}}
            aria-label={`Get AI explanation for ${pairSymbol}`}
            title={`Get AI explanation for ${pairSymbol}`}
          >
            {isAiLoading ? 'AI Thinking...' : 'Explain'}
          </button>
          {explanation && <div className="crypto-explanation-container"><p className="crypto-explanation">{explanation}</p></div>}
          {aiError && <div className="crypto-explanation-container"><p className="crypto-explanation error-text">{aiError}</p></div>}
        </>
      )}
    </Widget>
  );
};

export default CryptoWidget;
