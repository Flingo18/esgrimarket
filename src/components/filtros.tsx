import { ARMAS, CATEGORIAS, MANOS } from "@/lib/taxonomy";
import { ZONAS } from "@/lib/geo";

const SELECT =
  "rounded-lg border border-borde bg-fondo-elevado px-2.5 py-2 text-sm outline-none focus:border-acento";

/**
 * Filtros como formulario GET: la búsqueda queda en la URL, así se puede
 * compartir "todos los sables zurdos" por WhatsApp y funciona sin JavaScript.
 */
export function Filtros({
  valores,
}: {
  valores: Record<string, string | undefined>;
}) {
  return (
    <form className="flex flex-wrap gap-2 items-center">
      <input
        type="search"
        name="q"
        defaultValue={valores.q ?? ""}
        placeholder="Buscar…"
        className={`${SELECT} flex-1 min-w-40`}
      />

      <select name="categoria" defaultValue={valores.categoria ?? ""} className={SELECT}>
        <option value="">Todas las categorías</option>
        {Object.entries(CATEGORIAS).map(([id, label]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>

      <select name="arma" defaultValue={valores.arma ?? ""} className={SELECT}>
        <option value="">Cualquier arma</option>
        {Object.entries(ARMAS).map(([id, label]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>

      <select name="mano" defaultValue={valores.mano ?? ""} className={SELECT}>
        <option value="">Diestro o zurdo</option>
        {Object.entries(MANOS).map(([id, label]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>

      <select name="zona" defaultValue={valores.zona ?? ""} className={SELECT}>
        <option value="">Toda la ciudad</option>
        {Object.entries(ZONAS).map(([id, z]) => (
          <option key={id} value={id}>{z.label}</option>
        ))}
      </select>

      <select name="orden" defaultValue={valores.orden ?? ""} className={SELECT}>
        <option value="">Más recientes</option>
        <option value="barato">Más baratos</option>
        <option value="caro">Más caros</option>
      </select>

      <button
        type="submit"
        className="rounded-lg bg-acento text-acento-texto text-sm font-medium px-4 py-2 hover:opacity-90"
      >
        Filtrar
      </button>
    </form>
  );
}
