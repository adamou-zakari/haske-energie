import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// On rend l'application SANS React.StrictMode pour éviter
// les doubles montages/démontages qui provoquent l'erreur
// "removeChild ... not a child of this node" avec Recharts.
root.render(<App />);

reportWebVitals();
