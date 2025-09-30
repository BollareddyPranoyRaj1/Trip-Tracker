import React,{useEffect, useState} from "react";
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function App() {

  const [trips, setTrips] = useState([]);
  const [currentRoute, setCurrentRoute] = useState([]);
  const [watchId, setWatchId] = useState(null);

  function startTracking() {
    if(watchId){
      alert("Tracking is already active!");
      return;
    };
    const successCallback = (position) => {
      const newPoint = {
        lat:position.coords.latitude,
        lng:position.coords.longitude,
        timestamp:position.timestamp
      };
      setCurrentRoute((prevRoute) => [...prevRoute, newPoint]);
      console.log(`[Tracking] New point recorded: Lat ${newPoint.lat}, Lng ${newPoint.lng}`);
    };
    const errorCallback = (err) => {
      console.error(`Geolocation Error (${err.code}): ${err.message}`);
      if (err.code === 1) {
          alert("Location permission denied. Please grant access in your browser settings.");
      }
    };
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };
    const id=navigator.geolocation.watchPosition(successCallback, errorCallback, options);
    setWatchId(id);
    setCurrentRoute([]);
    alert("Started tracking your trip.");
  };
  const stopTracking = () => {
    if (watchId) {
      // Use the saved ID to tell the browser to stop monitoring
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      alert("Tracking STOPPED. Route data captured in current session.");
      console.log(`Tracking stopped. Total points captured: ${currentRoute.length}`);
    } else {
      alert("Tracking is not currently active.");
    }
  };  
  const MapUpdater = ({ route }) => {
    // useMap() provides the map instance
    const map = useMap(); 
    
    // The positions array is correct
    const positions = route.map(p => [p.lat, p.lng]);

    useEffect(() => {
      // 1. Get the L object (Leaflet core library) safely from the map instance
      //    We need to check if the map instance is fully initialized.
      const L = map.L; 
      
      // We only proceed if we have enough points and the L object is defined
      if (positions.length > 1 && L) {
        // 2. Use the local L object to create the LatLngBounds
        const bounds = new L.LatLngBounds(positions);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (positions.length === 1 && L) {
        // Center on the first point
        map.setView(positions[0], 15);
      }
      
      // Note: We need to include 'L' in the dependency array implicitly since 'map' changes
      // only slightly less often than 'route'.
    }, [route, map]); // Keep the dependencies: route and map

    return (
      <Polyline 
          positions={positions} 
          color="red" 
          weight={4} 
      />
    );
  };
  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
      <h1>Live Route Tracker</h1>
      <p style={{ color: watchId ? 'green' : 'red', fontWeight: 'bold' }}>
        Status: {watchId ? 'ACTIVE' : 'INACTIVE'}
      </p>

      {/* Start Button */}
      <button 
        onClick={startTracking} 
        disabled={!!watchId} // Disabled if watchId exists (tracking is active)
        style={{ padding: '10px 20px', margin: '5px', backgroundColor: 'green', color: 'white' }}
      >
        Start Route Tracking
      </button>

      {/* Stop Button */}
      <button 
        onClick={stopTracking} 
        disabled={!watchId} // Enabled only if watchId exists (tracking is active)
        style={{ padding: '10px 20px', margin: '5px', backgroundColor: 'red', color: 'white' }}
      >
        Stop Tracking & Save
      </button>
      
      <p style={{marginTop: '20px'}}>
        Points Recorded: {currentRoute.length}
      </p>

      <p style={{fontSize: '0.8rem', color: '#666'}}>
        *Open your browser console (F12) to see live coordinate updates.*
      </p>

      {/* --- NEW MAP INTEGRATION --- */}
      <div id="map-container" style={{ height: '300px', width: '100%', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px', overflow: 'hidden' }}>
        {currentRoute.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', color: '#666' }}>
            Start tracking to see your route here.
          </div>
        ) : (
          <MapContainer 
            // Using a generic center/zoom, MapUpdater will adjust it
            center={[0, 0]} 
            zoom={2} 
            style={{ height: '100%', width: '100%' }}
            // Fix for Leaflet initialization with React:
             whenReady={(map) => { 
                if (!window.L) {
                    window.L = map.target._leaflet; 
                }
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* The MapUpdater component draws the polyline */}
            <MapUpdater route={currentRoute} />

          </MapContainer>
        )}
      </div>
      {/* --- END NEW MAP INTEGRATION --- */}
    </div>
  );
}
export default App;