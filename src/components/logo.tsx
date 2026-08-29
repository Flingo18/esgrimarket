/**
 * Dos floretes cruzados.
 *
 * Va como SVG en línea y no como imagen: escala sin verse borroso, toma el
 * color del texto (así funciona en claro y en oscuro sin dos archivos) y no
 * agrega un pedido más a la carga de la página.
 */
export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Hojas */}
      <path d="M6.5 27.5 L25.5 6.5" strokeWidth="1.7" />
      <path d="M25.5 27.5 L6.5 6.5" strokeWidth="1.7" />

      {/* Cazoletas, sobre cada hoja cerca del puño */}
      <circle cx="11" cy="22.6" r="2.7" strokeWidth="1.4" />
      <circle cx="21" cy="22.6" r="2.7" strokeWidth="1.4" />

      {/* Pomos */}
      <path d="M6.5 27.5 h0.01" strokeWidth="3.2" />
      <path d="M25.5 27.5 h0.01" strokeWidth="3.2" />

      {/* Puntas */}
      <path d="M25.5 6.5 h0.01" strokeWidth="2.4" />
      <path d="M6.5 6.5 h0.01" strokeWidth="2.4" />
    </svg>
  );
}
