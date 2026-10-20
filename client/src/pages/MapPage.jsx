import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Hotel, Plane, Navigation } from 'lucide-react';
import { tripService } from '../services/tripService';
import { hotelService } from '../services/hotelService';

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createColoredIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px;"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const tripIcon = createColoredIcon('#6366f1');
const hotelIcon = createColoredIcon('#14b8a6');

function MapCenterSetter({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 12); }, [center, map]);
  return null;
}

export default function MapPage() {
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrips, setShowTrips] = useState(true);
  const [showHotels, setShowHotels] = useState(true);

  const { data: tripsData } = useQuery({
    queryKey: ['trips-map'],
    queryFn: () => tripService.getMyTrips({ limit: 50 }).then((r) => r.data.data.trips),
  });

  const { data: hotelsData } = useQuery({
    queryKey: ['hotels-map'],
    queryFn: () => hotelService.searchHotels({ limit: 50 }).then((r) => r.data.data.hotels),
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch {}
  };

  const tripMarkers = (tripsData || []).filter((t) => t.destinationCoordinates?.lat && showTrips);
  const hotelMarkers = (hotelsData || []).filter((h) => h.coordinates?.lat && showHotels);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">🗺️ Interactive Map</h1>
          <p className="text-slate-400 mt-1">Explore your trips and hotels on the map</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTrips(!showTrips)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${showTrips ? 'bg-primary-500/20 text-primary-400 border-primary-500/40' : 'bg-dark-800 text-slate-400 border-dark-700'}`}>
            <div className="w-3 h-3 rounded-full bg-primary-500" /> Trips
          </button>
          <button onClick={() => setShowHotels(!showHotels)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${showHotels ? 'bg-accent/20 text-accent border-accent/40' : 'bg-dark-800 text-slate-400 border-dark-700'}`}>
            <div className="w-3 h-3 rounded-full bg-accent" /> Hotels
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search any location..." className="input-field pl-11" />
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2 px-5"><Navigation size={16} />Go</button>
      </form>

      {/* Map */}
      <div className="h-[600px] rounded-2xl overflow-hidden border border-dark-700">
        <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }} className="z-0">
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterSetter center={mapCenter} />

          {/* Trip Markers */}
          {tripMarkers.map((trip) => (
            <Marker key={trip._id} position={[trip.destinationCoordinates.lat, trip.destinationCoordinates.lng]} icon={tripIcon}>
              <Popup>
                <div className="min-w-48">
                  <div className="font-semibold">{trip.title || trip.destination}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={10} /> {trip.destination}
                  </div>
                  <div className="text-xs mt-1">{trip.duration} days • {trip.travelers} travelers</div>
                  <a href={`/trips/${trip._id}`} className="text-indigo-600 text-xs font-medium mt-2 block">View Trip →</a>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Hotel Markers */}
          {hotelMarkers.map((hotel) => (
            <Marker key={hotel._id} position={[hotel.coordinates.lat, hotel.coordinates.lng]} icon={hotelIcon}>
              <Popup>
                <div className="min-w-48">
                  <div className="font-semibold">{hotel.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={10} /> {hotel.city}
                  </div>
                  <div className="text-xs mt-1">₹{hotel.pricePerNight?.toLocaleString()}/night • ⭐{hotel.averageRating}</div>
                  <a href={`/hotels/${hotel._id}`} className="text-teal-600 text-xs font-medium mt-2 block">View Hotel →</a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-primary-500" />{tripMarkers.length} Trip destinations</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-accent" />{hotelMarkers.length} Hotels</div>
        <div className="text-slate-500">Click markers for details • Powered by OpenStreetMap</div>
      </div>
    </div>
  );
}
