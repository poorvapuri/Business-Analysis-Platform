import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Home, Store, BarChart3, Users, MapPin } from 'lucide-react';
import './index.css';

// Pages placeholders
import Dashboard from './pages/Dashboard';
import Businesses from './pages/Businesses';
import Analytics from './pages/Analytics';
import Influencers from './pages/Influencers';
import GeoSearch from './pages/GeoSearch';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="mb-8 pl-4">
        <h1 className="h3 text-gradient">ReviewLens</h1>
      </div>
      <nav className="flex" style={{ flexDirection: 'column', gap: '0.5rem' }}>
        <NavLink 
          to="/" 
          className={({isActive}) => `btn btn-outline ${isActive ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', border: 'none' }}
        >
          <Home className="mr-2" size={20} /> Dashboard
        </NavLink>
        <NavLink 
          to="/businesses" 
          className={({isActive}) => `btn btn-outline ${isActive ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', border: 'none' }}
        >
          <Store className="mr-2" size={20} /> Businesses
        </NavLink>
        <NavLink 
          to="/analytics" 
          className={({isActive}) => `btn btn-outline ${isActive ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', border: 'none' }}
        >
          <BarChart3 className="mr-2" size={20} /> Analytics
        </NavLink>
        <NavLink 
          to="/influencers" 
          className={({isActive}) => `btn btn-outline ${isActive ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', border: 'none' }}
        >
          <Users className="mr-2" size={20} /> Influencers
        </NavLink>
        <NavLink 
          to="/geo" 
          className={({isActive}) => `btn btn-outline ${isActive ? 'btn-primary' : ''}`}
          style={{ justifyContent: 'flex-start', border: 'none' }}
        >
          <MapPin className="mr-2" size={20} /> Geo Search
        </NavLink>
      </nav>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/influencers" element={<Influencers />} />
            <Route path="/geo" element={<GeoSearch />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
