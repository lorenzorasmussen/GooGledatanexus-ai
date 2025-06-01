import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App'; // Assuming App.tsx is in the same directory

// Ensure the HTML has a div with id 'root'
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Failed to find the root element. Please ensure your index.html has a <div id='root'></div>.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);