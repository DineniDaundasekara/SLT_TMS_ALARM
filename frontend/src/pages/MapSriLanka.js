import React, { useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// ---- Map center/zoom for Sri Lanka ----
const sriLankaCenter = [7.8731, 80.7718];
const defaultZoom = 7;

// ---- Color palette ----
const COLORS = {
  dialogFill: '#FFFFFF',         // white
  dialogStroke: '#111827',       // near-black stroke for visibility
  etisalat: '#16A34A',           // green
  mobitel: '#2563EB',            // blue
  hutch: '#C2410C',              // dark orange
  issue: '#EF4444',              // red
  shadow: '#111827',
};

// ---- Build a SVG pin as data URL ----
function makePinDataUrl(fill = '#2563EB', stroke = '#111827') {
  // Simple map-pin path with drop shadow-like stroke
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
    <g fill="none" fill-rule="evenodd">
      <path d="M16 0C7.715 0 1 6.715 1 15c0 10.5 13.5 28 15 28s15-17.5 15-28C31 6.715 24.285 0 16 0z"
            fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <circle cx="16" cy="15" r="5.5" fill="rgba(0,0,0,0.08)"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ---- Icon factory ----
function makeIcon(fill, stroke = COLORS.shadow) {
  return L.icon({
    iconUrl: makePinDataUrl(fill, stroke),
    iconSize: [28, 38],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
    shadowUrl: undefined,
  });
}

// ---- Decide icon color per alarm ----
// Rule: severity === 'High' => red (issue icon). Otherwise carrier color.
function getAlarmIcon(alarm) {
  const isIssue = alarm.severity === 'High'; // adjust rule here if needed
  if (isIssue) {
    return makeIcon(COLORS.issue);
  }
  switch ((alarm.carrier || '').toLowerCase()) {
    case 'dialog':
      return makeIcon(COLORS.dialogFill, COLORS.dialogStroke);
    case 'etisalat':
      return makeIcon(COLORS.etisalat);
    case 'mobitel':
      return makeIcon(COLORS.mobitel);
    case 'hutch':
      return makeIcon(COLORS.hutch);
    default:
      return makeIcon('#6B7280'); // gray fallback
  }
}

// ---- Legend component ----
const Legend = () => (
  <div
    style={{
      position: 'absolute',
      right: 12,
      bottom: 12,
      background: 'white',
      padding: '8px 10px',
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      fontSize: 12,
      lineHeight: 1.4,
      minWidth: 140
    }}
  >
    <div style={{ fontWeight: 700, marginBottom: 6 }}>Legend</div>
    <Item color={COLORS.issue} label="Issue (High severity)" />
    <Item color={COLORS.dialogFill} stroke={COLORS.dialogStroke} label="Dialog" />
    <Item color={COLORS.etisalat} label="Etisalat" />
    <Item color={COLORS.mobitel} label="Mobitel" />
    <Item color={COLORS.hutch} label="Hutch" />
  </div>
);

const Item = ({ color, stroke = '#111827', label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
    <span
      style={{
        width: 14,
        height: 14,
        display: 'inline-block',
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        background: color,
        border: `1.5px solid ${stroke}`,
      }}
    />
    <span>{label}</span>
  </div>
);

const MapSriLanka = ({ alarms = [] }) => {
  const bounds = useMemo(() => {
    if (!alarms.length) return null;
    const latlngs = alarms.map(a => [a.lat, a.lng]);
    return L.latLngBounds(latlngs);
  }, [alarms]);

  // ---- Filter state ----
  const [carrierFilter, setCarrierFilter] = React.useState('All');

  // ---- Filter alarms by carrier ----
  const filteredAlarms = useMemo(() => {
    if (carrierFilter === 'All') return alarms;
    return alarms.filter(alarm => alarm.carrier === carrierFilter);
  }, [alarms, carrierFilter]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* ---- Carrier filter dropdown ---- */}
      <div style={{ position: 'absolute', right: 12, top: 12, background: 'white', padding: '8px 10px', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.15)', zIndex: 1000 }}>
        <select value={carrierFilter} onChange={e => setCarrierFilter(e.target.value)} style={{ border: '1px solid #ccc', borderRadius: 4, padding: 4, fontSize: 14 }}>
          <option value="All">All</option>
          <option value="Dialog">Dialog</option>
          <option value="Mobitel">Mobitel</option>
          <option value="Etisalat">Etisalat</option>
          <option value="Hutch">Hutch</option>
          <option value="Other">Otherr</option>
        </select>
      </div>

      <MapContainer
        center={sriLankaCenter}
        zoom={defaultZoom}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
        whenCreated={(map) => {
          if (bounds) {
            map.fitBounds(bounds, { padding: [30, 30] });
          }
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredAlarms.map(alarm => (
          <Marker
            key={alarm.id}
            position={[alarm.lat, alarm.lng]}
            icon={getAlarmIcon(alarm)}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{alarm.name}</div>
                <div><strong>Carrier:</strong> {alarm.carrier}</div>
                <div><strong>City:</strong> {alarm.city}</div>
                <div><strong>Severity:</strong> {alarm.severity}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>ID: {alarm.id}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <Legend />
    </div>
  );
};

export default MapSriLanka;
