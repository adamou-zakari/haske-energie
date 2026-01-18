import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import AI from './pages/AI';
import Alerts from './pages/Alerts';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;