/**
 * Cuentas nuevas y publicaciones nuevas, mes a mes.
 *
 * Dos gráficos y no uno con dos series: las cuentas se cuentan de a decenas
 * y las publicaciones de a unidades, y meterlas en un mismo par de ejes
 * inventa una correlación que los datos no tienen.
 */

import { contar, mesYAnio, rangoDeMeses, type Punto } from "@/lib/series-mensuales";

function Barras({
  titulo,
  puntos,
  total,
}: {
  titulo: string;
  puntos: Punto[];
  total: number;
}) {
  const max = Math.max(1, ...puntos.map((p) => p.valor));
  const ultimo = puntos[puntos.length - 1];
  const pico = puntos.reduce((a, b) => (b.valor > a.valor ? b : a), puntos[0]);
  // Un número sobre cada barra es ilegible apenas hay unos cuantos meses; con
  // pocos entra todo y evita tener que pasar el mouse para leer el gráfico.
  const etiquetarTodos = puntos.length <= 7;

  return (
    <figure className="rounded-xl border border-borde bg-fondo-elevado p-4">
      <figcaption>
        <h3 className="font-medium">{titulo}</h3>
        <p className="text-sm text-texto-suave">
          {total} en total · {ultimo?.valor ?? 0} este mes
        </p>
      </figcaption>

      <div
        className="mt-4 flex items-end gap-1.5 h-32"
        role="img"
        aria-label={`${titulo}: ${puntos.map((p) => `${p.etiqueta} ${p.valor}`).join(", ")}`}
      >
        {puntos.map((p) => {
          const mostrar = etiquetarTodos || p === pico || p === ultimo;
          return (
            <div
              key={p.clave}
              className="flex-1 flex flex-col items-center justify-end h-full"
              title={`${p.etiqueta}: ${p.valor}`}
            >
              {mostrar && (
                <span className="text-xs tabular-nums text-texto-suave mb-1">{p.valor}</span>
              )}
              <div
                className="w-full rounded-t bg-grafico"
                // Los meses en cero siguen ocupando su lugar con una línea:
                // un hueco invisible se lee como "no hay dato", que es otra cosa.
                style={{
                  height: p.valor === 0 ? "2px" : `max(3px, ${(p.valor / max) * 100}%)`,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex gap-1.5">
        {puntos.map((p) => (
          <span key={p.clave} className="flex-1 text-center text-xs text-texto-suave">
            {p.etiqueta}
          </span>
        ))}
      </div>
    </figure>
  );
}

export function Crecimiento({
  altas,
  publicaciones,
}: {
  /** `created_at` de cada cuenta. */
  altas: string[];
  /** `creado_en` de cada publicación. */
  publicaciones: string[];
}) {
  const claves = rangoDeMeses([...altas, ...publicaciones], new Date());
  if (claves.length === 0) return null;

  const desde = claves[0];
  const hasta = claves[claves.length - 1];

  const serieAltas = contar(altas, claves);
  const seriePublicaciones = contar(publicaciones, claves);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Crecimiento</h2>
      <p className="text-sm text-texto-suave mt-1">
        {claves.length === 1
          ? mesYAnio(hasta)
          : `${mesYAnio(desde)} a ${mesYAnio(hasta)}`}
        , en hora argentina.
      </p>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <Barras titulo="Cuentas nuevas" puntos={serieAltas} total={altas.length} />
        <Barras
          titulo="Publicaciones nuevas"
          puntos={seriePublicaciones}
          total={publicaciones.length}
        />
      </div>

      {/* Los números exactos, para quien los necesite y para quien no pueda
          leer el gráfico. */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-texto-suave hover:text-texto">
          Ver los números
        </summary>
        <table className="mt-3 w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-texto-suave">
              <th className="font-medium py-1.5 border-b border-borde">Mes</th>
              <th className="font-medium py-1.5 border-b border-borde text-right">
                Cuentas
              </th>
              <th className="font-medium py-1.5 border-b border-borde text-right">
                Publicaciones
              </th>
            </tr>
          </thead>
          <tbody>
            {claves.map((k, i) => (
              <tr key={k}>
                <td className="py-1.5 border-b border-borde">{mesYAnio(k)}</td>
                <td className="py-1.5 border-b border-borde text-right tabular-nums">
                  {serieAltas[i].valor}
                </td>
                <td className="py-1.5 border-b border-borde text-right tabular-nums">
                  {seriePublicaciones[i].valor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
