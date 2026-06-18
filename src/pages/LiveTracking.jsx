import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/liveTracking.css';
import { BASE_API_URL } from '../config';
import { getItemWithExpiry } from './loginPage';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LiveTracking = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    
    const [myId] = useState(() => Math.random().toString(36).substring(7));
    const [myLocation, setMyLocation] = useState(null);
    const [peers, setPeers] = useState({});
    const wsRef = useRef(null);

    const createSession = async () => {
        try {
            const token = getItemWithExpiry('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${BASE_API_URL}/tracking/create`, {
                method: 'POST',
                headers: headers,
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                navigate(`/tracking/${data.data.session_id}`);
            }
        } catch (err) {
            console.error("Failed to create session", err);
        }
    };

    useEffect(() => {
        if (!sessionId) return;

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHostPath = BASE_API_URL.replace(/^https?:\/\//, ''); 
        const wsUrl = `${wsProtocol}//${wsHostPath}/tracking/ws/${sessionId}`;

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.userId !== myId) {
                setPeers(prev => ({
                    ...prev,
                    [data.userId]: { lat: data.lat, lng: data.lng }
                }));
            }
        };

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setMyLocation(loc);
                
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        userId: myId,
                        lat: loc.lat,
                        lng: loc.lng
                    }));
                }
            },
            (err) => console.error("Geolocation error:", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
            if (wsRef.current) wsRef.current.close();
        };
    }, [sessionId, myId]);

    const copyLink = () => {
        const FRONTEND_URL = "https://master.deepti.qd.je";
        const link = `${FRONTEND_URL}/tracking/${sessionId}`;
        
        navigator.clipboard.writeText(link);
        alert(`Tracking link copied!\n${link}\n\nSend this to the other person.`);
    };

    const peerLocations = Object.values(peers);
    const hasPeer = peerLocations.length > 0;
    const peerLoc = hasPeer ? peerLocations[0] : null;

    if (!sessionId) {
        return (
            <div className="tracking-wrapper">
                <div className="tracking-starter brutal-card">
                    <h1>Real-Time Tracking</h1>
                    <p>Start a session to share your live location.</p>
                    <button className="brutal-button" onClick={createSession}>START TRACKING SESSION</button>
                </div>
            </div>
        );
    }

    if (!myLocation) {
         return <div className="tracking-wrapper"><h2>Acquiring GPS Signal...</h2></div>;
    }

    return (
        <div className="live-tracking-page">
            <div className="tracking-header brutal-card">
                <h2>Session: {sessionId.split('-')[0]}</h2>
                <button className="brutal-button" onClick={copyLink}>📋 COPY INVITE LINK</button>
            </div>

            <div className="map-container-wrapper brutal-card">
                <MapContainer center={[myLocation.lat, myLocation.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />
                    
                    <Marker position={[myLocation.lat, myLocation.lng]}>
                        <Popup>You are here</Popup>
                    </Marker>

                    {Object.entries(peers).map(([id, loc]) => (
                        <Marker key={id} position={[loc.lat, loc.lng]}>
                            <Popup>Partner</Popup>
                        </Marker>
                    ))}

                    {hasPeer && (
                        <Polyline 
                            positions={[[myLocation.lat, myLocation.lng], [peerLoc.lat, peerLoc.lng]]} 
                            color="#ff4444" 
                            weight={4}
                            dashArray="10, 10"
                        />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default LiveTracking;
