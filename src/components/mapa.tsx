"use client";

import { divIcon } from "leaflet";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { CENTRO_MAPA, RADIO_DISPLAY_M, ZOOM_INICIAL } from "@/lib/geo";

import "leaflet/dist/leaflet.css";

export type SalaMapa = {
  id: string;
  nombre: string;
  direccion: string | null;
  barrio: string | null;
  telefono: string | null;
  lat: number;
  lng: number;
};

export type ZonaMapa = {
  id: string;
  titulo: string;
  lat: number;
  lng: number;
};

/**
 * Icono dibujado en HTML en vez de una imagen.
 *
 * Los marcadores que trae Leaflet apuntan a archivos .png por ruta relativa,
 * que los bundlers rompen: es el bug clásico del "marcador invisible". Un
 * divIcon no depende de ningún archivo y además se puede pintar con las
 * variables de color del sitio.
 */
const iconoSala = divIcon({
  className: "",
  html: `<div style="
    width:26px;height:26px;border-radius:50% 50% 50% 0;
    background:var(--acento);transform:rotate(-45deg);
    border:2px solid var(--fondo);box-shadow:0 1px 4px rgba(0,0,0,.4);
  "></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26],
});

export default function Mapa({
  salas,
  zonas,
}: {
  salas: SalaMapa[];
  zonas: ZonaMapa[];
}) {
  return (
    <MapContainer
      center={[CENTRO_MAPA.lat, CENTRO_MAPA.lng]}
      zoom={ZOOM_INICIAL}
      scrollWheelZoom={false}
      className="h-[70vh] min-h-100 w-full rounded-xl border border-borde z-0"
    >
      <TileLayer
        // OpenStreetMap: sin API key y sin tarjeta. La atribución es
        // obligatoria por licencia, no es decorativa.
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {salas.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={iconoSala}>
          <Popup>
            <strong>{s.nombre}</strong>
            {s.direccion && (
              <>
                <br />
                {s.direccion}
                {s.barrio ? `, ${s.barrio}` : ""}
              </>
            )}
            {s.telefono && (
              <>
                <br />
                <a href={`tel:${s.telefono.replace(/\D/g, "")}`}>{s.telefono}</a>
              </>
            )}
            <br />
            <a href={`/salas/${s.id}/corregir`}>
              <strong>¿Falta un dato o está mal? Corregilo</strong>
            </a>
          </Popup>
        </Marker>
      ))}

      {/* Zonas de retiro: un círculo, nunca una chinche. El punto ya viene
          corrido al azar desde el navegador de quien publicó. */}
      {zonas.map((z) => (
        <Circle
          key={z.id}
          center={[z.lat, z.lng]}
          radius={RADIO_DISPLAY_M}
          pathOptions={{
            color: "var(--precio)",
            fillColor: "var(--precio)",
            fillOpacity: 0.12,
            weight: 1.5,
          }}
        >
          <Popup>
            <strong>{z.titulo}</strong>
            <br />
            Zona aproximada de entrega
            <br />
            <a href={`/p/${z.id}`}>Ver publicación</a>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}
