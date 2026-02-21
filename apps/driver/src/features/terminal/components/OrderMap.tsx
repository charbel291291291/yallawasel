import React, { memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
    driverLocation?: { lat: number; lng: number } | null;
    pickupLocation?: { lat: number; lng: number } | null;
    dropoffLocation?: { lat: number; lng: number } | null;
}

/**
 * ARCHITECTURAL HARDENING: MAP COMPONENT
 * Uses optimized view transitions and memoization to prevent main-thread spikes during GPS updates.
 */
const ChangeView = memo(({ center, zoom }: { center: L.LatLngExpression, zoom: number }) => {
    const map = useMap();
    // Use flyTo for smoother transition or setView for instant but optimized update
    map.setView(center, zoom, { animate: true });
    return null;
});

export const OrderMap: React.FC<MapProps> = memo(({ driverLocation, pickupLocation, dropoffLocation }) => {
    const center: L.LatLngExpression = driverLocation ? [driverLocation.lat, driverLocation.lng] : [33.8938, 35.5018];

    const polyline: L.LatLngExpression[] = [];
    if (driverLocation) polyline.push([driverLocation.lat, driverLocation.lng]);
    if (pickupLocation) polyline.push([pickupLocation.lat, pickupLocation.lng]);
    if (dropoffLocation) polyline.push([dropoffLocation.lat, dropoffLocation.lng]);

    return (
        <div
            className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-inner"
            style={{ contain: 'layout paint' }}
        >
            <MapContainer
                center={center}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                <ChangeView center={center} zoom={14} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {driverLocation && (
                    <Marker position={[driverLocation.lat, driverLocation.lng]}>
                        <Popup>Your Location</Popup>
                    </Marker>
                )}

                {pickupLocation && (
                    <Marker position={[pickupLocation.lat, pickupLocation.lng]}>
                        <Popup>Pickup Point</Popup>
                    </Marker>
                )}

                {dropoffLocation && (
                    <Marker position={[dropoffLocation.lat, dropoffLocation.lng]}>
                        <Popup>Dropoff Point</Popup>
                    </Marker>
                )}

                {polyline.length > 1 && (
                    <Polyline positions={polyline} color="#ef4444" weight={4} opacity={0.6} dashArray="10, 10" />
                )}
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2">
                <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Live GPS</span>
                </div>
            </div>
        </div>
    );
});
