import { ImageResponse } from "next/og";

export const alt = "Esgrimarket — equipamiento de esgrima";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagen de vista previa para cuando el link se pega en WhatsApp.
 *
 * Es el canal por el que va a circular el sitio: un link sin imagen en un
 * grupo pasa desapercibido, uno con imagen se toca.
 */
export default function Imagen() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e1114",
          color: "#e8ebee",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 32 32" fill="none"
             stroke="#4a9eff" strokeLinecap="round">
          <path d="M6.5 27.5 L25.5 6.5" strokeWidth="1.7" />
          <path d="M25.5 27.5 L6.5 6.5" strokeWidth="1.7" />
          <circle cx="11" cy="22.6" r="2.7" strokeWidth="1.4" />
          <circle cx="21" cy="22.6" r="2.7" strokeWidth="1.4" />
        </svg>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 24 }}>
          Esgrimarket
        </div>
        <div style={{ fontSize: 32, color: "#98a3ae", marginTop: 12 }}>
          Equipamiento de esgrima · Buenos Aires
        </div>
      </div>
    ),
    size,
  );
}
