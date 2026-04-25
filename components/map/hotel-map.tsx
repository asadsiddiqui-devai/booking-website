"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { HotelOfferDTO } from "@/lib/duffel/types";
import { formatMoney } from "@/lib/utils/format";

// Fix default icon paths (Leaflet default markers break under bundlers)
// @ts-expect-error - private Leaflet method used to override default icon URL
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export function HotelMap({
  center,
  hotels,
  highlightId,
}: {
  center: [number, number];
  hotels: HotelOfferDTO[];
  highlightId: string | null;
}) {
  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      {hotels.map((h) =>
        h.lat && h.lng ? (
          <CircleMarker
            key={h.id}
            center={[h.lat, h.lng]}
            radius={highlightId === h.id ? 12 : 8}
            pathOptions={{
              color: highlightId === h.id ? "#7c3aed" : "#4f46e5",
              fillColor: highlightId === h.id ? "#7c3aed" : "#4f46e5",
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{h.name}</div>
                <div className="text-xs">{formatMoney(h.totalPrice, h.currency)} total</div>
              </div>
            </Popup>
          </CircleMarker>
        ) : null,
      )}
      <Marker position={center} />
    </MapContainer>
  );
}
