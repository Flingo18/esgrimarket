"use client";

import { divIcon } from "leaflet";
import { Circle, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

import { CENTRO_MAPA, RADIO_DISPLAY_M, difuminarUbicacion, type Punto } from "@/lib/geo";

import "leaflet/dist/leaflet.css";

export const iconoVacio = divIcon({ className: "", iconSize: [0, 0] });

function CapturarClick({ alElegir }: { alElegir: (p: Punto) => void }) {
  useMapEvents({
    click(e) {
      // Se difumina en el mismo momento del click: el punto exacto que tocó
      // la persona no se guarda ni se manda a ningún lado.
      alElegir(difuminarUbicacion({ lat: e.latlng.lat, lng: e.latlng.lng }));
    },
  });
  return null;
}

export default function MapaSelector({
  valor,
  alElegir,
}: {
  valor: Punto | null;
  alElegir: (p: Punto) => void;
}) {
  return (
    <MapContainer
      center={valor ? [valor.lat, valor.lng] : [CENTRO_MAPA.lat, CENTRO_MAPA.lng]}
      zoom={valor ? 14 : 11}
      scrollWheelZoom={false}
      className="h-72 w-full rounded-lg border border-borde z-0 cursor-crosshair"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={18}
      />
      <CapturarClick alElegir={alElegir} />

      {/* Sólo el círculo, nunca un punto: mostrar una chinche daría a entender
          una precisión que a propósito no existe. */}
      {valor && (
        <Circle
          center={[valor.lat, valor.lng]}
          radius={RADIO_DISPLAY_M}
          pathOptions={{
            color: "var(--precio)",
            fillColor: "var(--precio)",
            fillOpacity: 0.15,
            weight: 2,
          }}
        />
      )}
    </MapContainer>
  );
}
