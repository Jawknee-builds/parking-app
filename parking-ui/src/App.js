import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Map, { Source, Layer, NavigationControl, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Securely read Mapbox token from environment variables (prevents GitHub Push Protection triggers)
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

// Dynamic API Base URL support (FastAPI backend endpoint)
const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [zones, setZones] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('zones'); // 'zones' or 'reserve'

  // Simulated coordinate telemetry for Geofencing verification
  const [simLat, setSimLat] = useState(13.3495);
  const [simLon, setSimLon] = useState(74.7922);
  const [parkStatus, setParkStatus] = useState(null); // { status, message }
  const [loading, setLoading] = useState(false);

  // Reservation Form State
  const [selectedZone, setSelectedZone] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Viewport centered on Manipal Academy of Higher Education (MIT)
  const [viewState, setViewState] = useState({
    longitude: 74.792,
    latitude: 13.352,
    zoom: 14.5
  });

  // Load Zones
  const fetchZones = () => {
    axios.get(`${API_BASE}/zones`)
      .then(res => {
        setZones(res.data);
        if (res.data.length > 0) setSelectedZone(res.data[0].id);
      })
      .catch(err => console.error("Database connection failed", err));
  };

  // Load Reservations
  const fetchReservations = () => {
    if (!token) return;
    axios.get(`${API_BASE}/reservations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setReservations(res.data))
    .catch(err => console.error("Could not fetch reservations", err));
  };

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    if (token) {
      fetchReservations();
    }
  }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await axios.post(`${API_BASE}/signup`, { email, password });
        alert("🎉 Account created successfully! Please log in now.");
        setIsSignUp(false);
      } else {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const res = await axios.post(`${API_BASE}/login`, formData);
        setToken(res.data.access_token);
        localStorage.setItem('token', res.data.access_token);
        fetchReservations();
      }
    } catch (err) {
      alert("❌ Authentication failed: " + (err.response?.data?.detail || "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  // Immediate Geofence Parking Session Dispatcher
  const handleParkAction = async (zoneId) => {
    if (!token) {
      alert("🔒 Authentication Required! Please log in to park.");
      return;
    }
    setLoading(true);
    setParkStatus(null);
    try {
      const res = await axios.post(`${API_BASE}/park`, {
        zone_id: zoneId,
        user_lat: simLat,
        user_lon: simLon
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParkStatus(res.data);
    } catch (err) {
      alert("❌ Geofence dispatch failed: " + (err.response?.data?.detail || "Out of boundary"));
    } finally {
      setLoading(false);
    }
  };

  // Booking scheduler dispatch
  const handleReserveAction = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("🔒 Authentication Required!");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/reserve`, {
        zone_id: parseInt(selectedZone),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("📅 Reservation booked successfully!");
      fetchReservations();
      setActiveTab('zones');
    } catch (err) {
      alert("❌ Booking failed: " + (err.response?.data?.detail || "Invalid timeslot"));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken('');
    setReservations([]);
  };

  // Compile Zone coordinate boundaries into GeoJSON format
  const getGeoJSON = (zone) => {
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [zone.min_lon, zone.min_lat],
          [zone.max_lon, zone.min_lat],
          [zone.max_lon, zone.max_lat],
          [zone.min_lon, zone.max_lat],
          [zone.min_lon, zone.min_lat]
        ]]
      }
    };
  };

  return (
    <div style={containerStyle}>
      
      {/* Dynamic Glass Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🅿️</span>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Manipal Campus Smart Parking</h1>
        </div>
        {token && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>💚 GPS Telemetry Connected</span>
            <button onClick={logout} style={logoutBtnStyle}>Sign Out</button>
          </div>
        )}
      </header>

      {/* Landing / Authentication Layer */}
      {!token ? (
        <div style={authWrapperStyle}>
          <div style={authCardStyle}>
            <div style={authHeaderStyle}>
              <span style={{ fontSize: '36px' }}>🔒</span>
              <h2>{isSignUp ? "Register Account" : "Access Campus Gates"}</h2>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '6px' }}>Secure student and faculty parking gateway</p>
            </div>
            <form onSubmit={handleAuth}>
              <input type="email" placeholder="Manipal Edu Email (e.g. name@manipal.edu)" onChange={e => setEmail(e.target.value)} style={inputStyle} required />
              <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} style={inputStyle} required />
              <button type="submit" style={submitBtnStyle} disabled={loading}>
                {loading ? "Authenticating..." : (isSignUp ? "Create Account" : "Authenticate Gate")}
              </button>
            </form>
            <p onClick={() => setIsSignUp(!isSignUp)} style={toggleAuthStyle}>
              {isSignUp ? "Already registered? Login here" : "Need campus access? Request account here"}
            </p>
          </div>
        </div>
      ) : (
        <div style={appBodyStyle}>
          
          {/* CONTROL PANELS SIDEBAR */}
          <div style={sidebarStyle}>
            
            {/* Navigation Tabs */}
            <div style={tabGroupStyle}>
              <button onClick={() => setActiveTab('zones')} style={activeTab === 'zones' ? activeTabStyle : tabStyle}>📍 Zones</button>
              <button onClick={() => setActiveTab('reserve')} style={activeTab === 'reserve' ? activeTabStyle : tabStyle}>📅 Book Spot</button>
            </div>

            {activeTab === 'zones' ? (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <h3 style={sectionTitleStyle}>Parking Zones</h3>
                {zones.length === 0 && <p style={{ color: '#9ca3af', fontSize: '13px' }}>Loading geofences...</p>}
                {zones.map(zone => (
                  <div 
                    key={zone.id} 
                    style={cardStyle(zone.is_available)} 
                    onClick={() => setViewState({ latitude: (zone.min_lat + zone.max_lat) / 2, longitude: (zone.min_lon + zone.max_lon) / 2, zoom: 16 })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>{zone.name}</span>
                      <span style={badgeStyle(zone.is_available)}>
                        {zone.is_available ? "Available" : "Occupied"}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 12px 0' }}>
                      Coordinates: [{(zone.min_lat).toFixed(4)}, {(zone.min_lon).toFixed(4)}]
                    </p>

                    <button 
                      onClick={(e) => { e.stopPropagation(); handleParkAction(zone.id); }} 
                      style={parkBtnStyle(zone.is_available)}
                      disabled={!zone.is_available}
                    >
                      Park Telemetry Now
                    </button>
                  </div>
                ))}

                {/* Geofence Simulator Box */}
                <div style={simulatorBoxStyle}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📡 Campus Geofence GPS Simulator
                  </h4>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                    Recruiters: Adjust your simulated GPS position. Pulsing dot 🔵 shows your location. Click "Park Telemetry Now" to test boundaries.
                  </p>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={sliderLabelStyle}>Simulated Latitude: <code style={{ color: '#8b5cf6' }}>{simLat.toFixed(5)}</code></label>
                    <input type="range" min="13.345" max="13.360" step="0.0001" value={simLat} onChange={e => setSimLat(parseFloat(e.target.value))} style={sliderStyle} />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={sliderLabelStyle}>Simulated Longitude: <code style={{ color: '#8b5cf6' }}>{simLon.toFixed(5)}</code></label>
                    <input type="range" min="74.785" max="74.798" step="0.0001" value={simLon} onChange={e => setSimLon(parseFloat(e.target.value))} style={sliderStyle} />
                  </div>

                  {parkStatus && (
                    <div style={statusBannerStyle(parkStatus.status)}>
                      <strong style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>
                        {parkStatus.status === 'success' ? '✅ Geofence Verified' : '🔴 Geofence Denied'}
                      </strong>
                      <span style={{ fontSize: '11px' }}>{parkStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <h3 style={sectionTitleStyle}>Schedule Reservation</h3>
                <form onSubmit={handleReserveAction} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  
                  <div style={formGroupStyle}>
                    <label style={formLabelStyle}>Select Campus Zone</label>
                    <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)} style={selectStyle}>
                      {zones.map(z => <option key={z.id} value={z.id} style={{ background: '#0b0d16' }}>{z.name}</option>)}
                    </select>
                  </div>

                  <div style={formGroupStyle}>
                    <label style={formLabelStyle}>Start Time</label>
                    <input type="datetime-local" onChange={e => setStartTime(e.target.value)} style={selectStyle} required />
                  </div>

                  <div style={formGroupStyle}>
                    <label style={formLabelStyle}>End Time</label>
                    <input type="datetime-local" onChange={e => setEndTime(e.target.value)} style={selectStyle} required />
                  </div>

                  <button type="submit" style={submitBtnStyle} disabled={loading}>
                    Confirm Scheduled Booking
                  </button>
                </form>

                {/* Reservations List */}
                <h4 style={{ ...sectionTitleStyle, marginTop: '24px', fontSize: '13px' }}>Active Scheduled Bookings</h4>
                {reservations.length === 0 && <p style={{ color: '#6b7280', fontSize: '12px' }}>No reservations found.</p>}
                {reservations.map(res => {
                  const zName = zones.find(z => z.id === res.zone_id)?.name || `Zone ${res.zone_id}`;
                  return (
                    <div key={res.id} style={resCardStyle}>
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '12px' }}>{zName}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                        In: {new Date(res.start_time).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                        Out: {new Date(res.end_time).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DYNAMIC MAPBOX INTERACTION LAYER */}
          <div style={{ flex: 1, position: 'relative' }}>
            {!MAPBOX_TOKEN ? (
              <div style={mapWarningWrapperStyle}>
                <div style={mapWarningCardStyle}>
                  <span style={{ fontSize: '32px' }}>🗺️</span>
                  <h4 style={{ margin: '12px 0 6px 0', color: '#fff' }}>Interactive Map Offline</h4>
                  <p style={{ color: '#9ca3af', fontSize: '12px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                    Mapbox API Access Token is missing. Configure your <code style={{ color: '#8b5cf6' }}>REACT_APP_MAPBOX_TOKEN</code> environment variable in Vercel to activate visual telemetry.
                  </p>
                  <p style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: '600' }}>
                    *Note: Geofencing GPS telemetry checks and scheduler remain 100% operational in sidebar.
                  </p>
                </div>
              </div>
            ) : (
              <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/dark-v10"
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationControl position="top-right" />
                
                {/* Map Geofence Polygons */}
                {zones.map(zone => (
                  <Source key={zone.id} id={`source-${zone.id}`} type="geojson" data={getGeoJSON(zone)}>
                    <Layer 
                      id={`layer-${zone.id}`} 
                      type="fill" 
                      paint={{
                        'fill-color': zone.is_available ? '#10b981' : '#ef4444',
                        'fill-opacity': 0.35,
                        'fill-outline-color': '#000000'
                      }} 
                    />
                  </Source>
                ))}

                {/* Pulsing GPS Telemetry Blue Marker */}
                <Marker longitude={simLon} latitude={simLat} anchor="center">
                  <div style={pulseMarkerStyle}></div>
                </Marker>
              </Map>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// PREMIUM STYLING DICTIONARIES
const containerStyle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  margin: 0,
  padding: 0,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#07080d',
  color: '#f3f4f6'
};

const headerStyle = {
  padding: '16px 28px',
  background: 'rgba(13, 16, 27, 0.8)',
  backdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 10
};

const logoutBtnStyle = {
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: '8px',
  color: '#ef4444',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const authWrapperStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.08) 0%, transparent 60%)'
};

const authCardStyle = {
  background: 'rgba(13, 16, 27, 0.65)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '40px',
  maxWidth: '420px',
  width: '100%',
  borderRadius: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

const authHeaderStyle = {
  textAlign: 'center',
  marginBottom: '30px'
};

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '14px',
  marginBottom: '16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  color: '#fff',
  fontSize: '14px',
  boxSizing: 'border-box'
};

const submitBtnStyle = {
  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  color: 'white',
  border: 'none',
  padding: '14px',
  cursor: 'pointer',
  width: '100%',
  borderRadius: '12px',
  fontWeight: '700',
  boxShadow: '0 4px 15px rgba(109, 40, 217, 0.3)',
  transition: 'all 0.2s'
};

const toggleAuthStyle = {
  textAlign: 'center',
  cursor: 'pointer',
  color: '#a78bfa',
  marginTop: '16px',
  fontSize: '13px',
  fontWeight: '500'
};

const appBodyStyle = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden'
};

const sidebarStyle = {
  width: '360px',
  padding: '24px',
  overflowY: 'auto',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  backgroundColor: '#0a0b12'
};

const tabGroupStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  background: 'rgba(255,255,255,0.03)',
  padding: '4px',
  borderRadius: '10px',
  marginBottom: '24px'
};

const tabStyle = {
  background: 'transparent',
  border: 'none',
  color: '#9ca3af',
  padding: '8px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '13px'
};

const activeTabStyle = {
  ...tabStyle,
  background: '#8b5cf6',
  color: '#fff',
  boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)'
};

const sectionTitleStyle = {
  fontSize: '12px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  color: '#6b7280',
  marginBottom: '16px'
};

const cardStyle = (available) => ({
  padding: '18px',
  border: `1px solid ${available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
  marginBottom: '16px',
  borderRadius: '16px',
  cursor: 'pointer',
  backgroundColor: 'rgba(255, 255, 255, 0.01)',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
});

const badgeStyle = (available) => ({
  fontSize: '11px',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: '20px',
  background: available ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
  color: available ? '#10b981' : '#ef4444',
  border: `1px solid ${available ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
});

const parkBtnStyle = (available) => ({
  background: available ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.03)',
  color: available ? '#fff' : '#6b7280',
  border: available ? 'none' : '1px solid rgba(255,255,255,0.08)',
  padding: '10px 14px',
  cursor: available ? 'pointer' : 'not-allowed',
  width: '100%',
  borderRadius: '10px',
  fontWeight: '600',
  fontSize: '12px',
  transition: 'all 0.2s',
  boxShadow: available ? '0 4px 10px rgba(16, 185, 129, 0.2)' : 'none'
});

const simulatorBoxStyle = {
  background: 'rgba(139, 92, 246, 0.04)',
  border: '1px solid rgba(139, 92, 246, 0.15)',
  padding: '18px',
  borderRadius: '16px',
  marginTop: '30px'
};

const sliderLabelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: '#9ca3af',
  marginBottom: '6px'
};

const sliderStyle = {
  width: '100%',
  cursor: 'pointer',
  accentColor: '#8b5cf6'
};

const statusBannerStyle = (status) => ({
  padding: '12px',
  borderRadius: '10px',
  border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
  background: status === 'success' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
  color: status === 'success' ? '#10b981' : '#ef4444',
  animation: 'popIn 0.3s ease-out'
});

const formGroupStyle = {
  marginBottom: '16px'
};

const formLabelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '600',
  color: '#9ca3af',
  marginBottom: '6px'
};

const selectStyle = {
  ...inputStyle,
  marginBottom: 0
};

const resCardStyle = {
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '10px',
  marginBottom: '10px'
};

const pulseMarkerStyle = {
  width: '14px',
  height: '14px',
  background: '#3b82f6',
  border: '2px solid #fff',
  borderRadius: '50%',
  boxShadow: '0 0 10px #3b82f6, 0 0 20px #3b82f6',
  animation: 'markerPulse 1.5s infinite alternate'
};

const mapWarningWrapperStyle = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#090a10',
  padding: '30px'
};

const mapWarningCardStyle = {
  background: 'rgba(13, 16, 27, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  padding: '32px',
  maxWidth: '400px',
  borderRadius: '20px',
  textAlign: 'center',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
};

export default App;