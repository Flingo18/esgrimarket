"use client";

import { divIcon } from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

import { CENTRO_MAPA, RADIO_DISPLAY_M, difuminarUbicacion, type Punto } from "@/lib/geo";

import "leaflet/dist/leaflet.css";

const iconoSala = divIcon({
  className: "",
  html: `<div style="
    width:22px;height:22px;border-radius:50% 50% 50% 0;
    background:var(--acento);transform:rotate(-45deg);
    border:2px solid var(--fondo);box-shadow:0 1px 4px rgba(0,0,0,.4);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function CapturarClick({
  alElegir,
  difuminar,
}: {
  alElegir: (p: Punto) => void;
  difuminar: boolean;
}) {
  useMapEvents({
    click(e) {
      const punto = { lat: e.latlng.lat, lng: e.latlng.lng };
      // Para productos se difumina en el mismo click: el punto exacto no se
      // guarda ni se manda a ningún lado. Para salas no, porque son
      // instituciones con dirección pública.
      alElegir(difuminar ? difuminarUbicacion(punto) : punto);
    },
  });
  return null;
}

export default function MapaSelector({
  valor,
  alElegir,
  difuminar = true,
}: {
  valor: Punto | null;
  alElegir: (p: Punto) => void;
  /** false para salas: ahí la dirección es pública y exacta. */
  difuminar?: boolean;
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
      <CapturarClick alElegir={alElegir} difuminar={difuminar} />

      {/* Sólo el círculo, nunca un punto: mostrar una chinche daría a entender
          una precisión que a propósito no existe. */}
      {valor && difuminar && (
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

      {/* En salas se marca el punto exacto, así que va una chinche. */}
      {valor && !difuminar && (
        <Marker position={[valor.lat, valor.lng]} icon={iconoSala} />
      )}
    </MapContainer>
  );
}
