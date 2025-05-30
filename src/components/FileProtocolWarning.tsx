
import React from 'react';

const FileProtocolWarning: React.FC = React.memo(() => {
  return (
    <div id="file-protocol-warning-react-container" className="file-protocol-warning-overlay">
      <div className="file-protocol-warning-content">
        <h1>Application Loading Error</h1>
        <p>
          This application needs to be accessed via an <strong>HTTP server</strong> (e.g., <code>http://localhost:xxxx</code>) due to its use of JavaScript Modules and React.
        </p>
        <p>
          Opening the <code>index.html</code> file directly (using the <code>file:///</code> protocol) is causing issues with loading application components.
        </p>
        <h2>To run the application correctly:</h2>
        <ul>
          <li>Ensure you have Node.js and npm installed.</li>
          <li>Set up a React development environment (e.g., using Vite or Create React App).
            <ul>
              <li>Example with Vite: <code>npm create vite@latest my-app -- --template react-ts</code>, then copy these source files into the <code>my-app/src</code> directory.</li>
            </ul>
          </li>
          <li>Install dependencies: <code>npm install</code> in your React project directory.</li>
          <li>Run the development server: <code>npm run dev</code> (for Vite) or <code>npm start</code> (for CRA).</li>
          <li>Open the URL provided by the development server (usually <code>http://localhost:5173</code> or <code>http://localhost:3000</code>).</li>
        </ul>
        <p className="subtext">
          The Node.js backend server (`server.js`) should also be running on `http://localhost:5001` for API calls.
        </p>
      </div>
    </div>
  );
});

export default FileProtocolWarning;
