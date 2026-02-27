import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- CONFIGURATION ---
// Injecting the API Key for the Gemini SDK (Google GenAI)
// This ensures 'process.env.API_KEY' resolves correctly in the browser environment.
(window as any).process = {
  env: {
    API_KEY: "AIzaSyBe475nqql4OdG6swsBHbZ0RYlqAafOUGk"
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);