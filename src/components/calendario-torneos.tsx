"use client";

import { useMemo, useState } from "react";

import { COLOR_TIPO, TIPOS_TORNEO } from "@/lib/torneos";

export type TorneoCalendario = {
  id: string;
  nombre: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  lugar: string | null;
  url_inscripcion: string | null;
};

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** 'YYYY-MM-DD' sin pasar por Date, que en Argentina corre un día para atrás. */
function aClave(anio: number, mes: number, dia: number) {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function CalendarioTorneos({ torneos }: { torneos: TorneoCalendario[] }) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [elegido, setElegido] = useState<string | null>(null);

  /**
   * Un torneo de varios días ocupa todos sus días, no sólo el primero: quien
   * mira el 20 de septiembre tiene que ver que ese día hay algo, aunque haya
   * empezado el 19.
   */
  const porDia = useMemo(() => {
    const mapa = new Map<string, TorneoCalendario[]>();
    for (const t of torneos) {
      const [ai, mi, di] = t.fecha_inicio.split("-").map(Number);
      const [af, mf, df] = (t.fecha_fin ?? t.fecha_inicio).split("-").map(Number);
      const cursor = new Date(ai, mi - 1, di);
      const ultimo = new Date(af, mf - 1, df);
      while (cursor <= ultimo) {
        const k = aClave(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
        mapa.set(k, [...(mapa.get(k) ?? []), t]);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return mapa;
  }, [torneos]);

  const primero = new Date(anio, mes, 1);
  // getDay() da 0 para domingo; acá la semana empieza el lunes.
  const offset = (primero.getDay() + 6) % 7;
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const celdas = Array.from({ length: offset + diasDelMes }, (_, i) =>
    i < offset ? null : i - offset + 1,
  );

  const mover = (delta: number) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
    setElegido(null);
  };

  const claveHoy = aClave(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const delDiaElegido = elegido ? (porDia.get(elegido) ?? []) : [];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => mover(-1)}
          className="rounded-lg border border-borde px-3 py-1.5 text-sm hover:border-acento"
          aria-label="Mes anterior"
        >
          ←
        </button>
        <p className="font-medium">
          {MESES[mes]} {anio}
        </p>
        <button
          type="button"
          onClick={() => mover(1)}
          className="rounded-lg border border-borde px-3 py-1.5 text-sm hover:border-acento"
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {DIAS.map((d) => (
          <div key={d} className="text-xs text-texto-suave pb-1">
            {d}
          </div>
        ))}

        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`v${i}`} />;

          const clave = aClave(anio, mes, dia);
          const delDia = porDia.get(clave) ?? [];
          const esHoy = clave === claveHoy;
          const activo = elegido === clave;

          return (
            <button
              key={clave}
              type="button"
              disabled={delDia.length === 0}
              onClick={() => setElegido(activo ? null : clave)}
              className={`aspect-square rounded-lg border p-1 flex flex-col items-center justify-start text-sm
                ${activo ? "border-acento bg-acento-suave" : "border-borde"}
                ${delDia.length > 0 ? "hover:border-acento cursor-pointer" : "opacity-50"}
                ${esHoy ? "font-bold text-acento" : ""}`}
            >
              <span>{dia}</span>
              {delDia.length > 0 && (
                <span className="mt-0.5 flex gap-0.5 flex-wrap justify-center">
                  {delDia.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className={`size-1.5 rounded-full ${
                        t.tipo === "fae"
                          ? "bg-acento"
                          : t.tipo === "fecba"
                            ? "bg-precio"
                            : "bg-texto-suave"
                      }`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texto-suave">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-acento" /> FAE
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-precio" /> FECBA
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-texto-suave" /> Internacional
        </span>
      </div>

      {elegido && delDiaElegido.length > 0 && (
        <ul className="mt-5 space-y-2">
          {delDiaElegido.map((t) => (
            <li
              key={t.id}
              className="rounded-xl border border-borde bg-fondo-elevado p-3"
            >
              <span
                className={`text-xs rounded-md px-2 py-0.5 font-medium ${COLOR_TIPO[t.tipo]}`}
              >
                {TIPOS_TORNEO[t.tipo as keyof typeof TIPOS_TORNEO]}
              </span>
              <p className="font-medium mt-1.5">{t.nombre}</p>
              {t.lugar && <p className="text-sm text-texto-suave">{t.lugar}</p>}
              {t.url_inscripcion && (
                <a
                  href={t.url_inscripcion}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-acento underline"
                >
                  Anotarse
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {!elegido && (
        <p className="mt-5 text-sm text-texto-suave text-center">
          Tocá un día marcado para ver qué hay.
        </p>
      )}
    </div>
  );
}
