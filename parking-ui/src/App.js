import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [zones, setZones] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Signup

  // 1. Fetch Zones from the database via FastAPI
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/zones')
      .then(res => setZones(res.data))
      .catch(err => console.error("Database connection failed. Check FastAPI/Postgres.", err));
  }, []);

  // 2. Auth Logic (Signup or Login)
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        // Sign Up: Hits your @app.post("/signup")
        await axios.post('http://127.0.0.1:8000/signup', { email, password });
        alert("Account created in Postgres! Now please Login.");
        setIsSignUp(false);
      } else {
        // Login: Hits your @app.post("/login")
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const res = await axios.post('http://127.0.0.1:8000/login', formData);
        setToken(res.data.access_token);
        localStorage.setItem('token', res.data.access_token);
        alert("Logged in successfully!");
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Action failed"));
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#f04e23', textAlign: 'center' }}>🅿️ Manipal Smart Parking</h1>
      
      {/* AUTH SECTION */}
      {!token ? (
        <form onSubmit={handleAuth} style={cardStyle}>
          <h3>{isSignUp ? "Create Student Account" : "Student Login"}</h3>
          <input type="email" placeholder="Manipal Email" onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} style={inputStyle} required />
          <button type="submit" style={btnStyle}>{isSignUp ? "Register" : "Login"}</button>
          <p 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ textAlign: 'center', cursor: 'pointer', color: '#007bff', marginTop: '10px' }}
          >
            {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </p>
        </form>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Logged in as {email}</p>
          <button onClick={() => {localStorage.clear(); setToken('');}} style={{...btnStyle, backgroundColor: '#666', width: 'auto'}}>Logout</button>
        </div>
      )}

      {/* ZONES SECTION */}
      <h3>📍 Available Parking Zones</h3>
      {zones.map(zone => (
        <div key={zone.id} style={cardStyle}>
          <strong>{zone.name}</strong>
          <p>Status: {zone.is_available ? "🟢 Available" : "🔴 Full"}</p>
          <button onClick={() => alert(`Parking at ${zone.name}...`)} style={{...btnStyle, backgroundColor: '#333'}}>
            Park Now
          </button>
        </div>
      ))}
    </div>
  );
}

// Styling
const cardStyle = { padding: '20px', border: '1px solid #ddd', marginBottom: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };
const inputStyle = { display: 'block', width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
const btnStyle = { backgroundColor: '#f04e23', color: 'white', border: 'none', padding: '12px 20px', cursor: 'pointer', width: '100%', borderRadius: '6px', fontWeight: 'bold' };

export default App;