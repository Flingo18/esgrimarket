"use client";

import { useMemo, useState } from "react";

import { ModalTorneo, type TorneoDetalle } from "./modal-torneo";
import type { CorreccionConCambios } from "@/lib/correcciones";
import { aFecha, colorBarra } from "@/lib/torneos";

export type TorneoCalendario = TorneoDetalle & {
  fecha_inicio: string;
};

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function clave(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

type Barra = {
  torneo: TorneoCalendario;
  columna: number;
  ancho: number;
  carril: number;
  siguePorIzquierda: boolean;
  siguePorDerecha: boolean;
};

export function CalendarioTorneos({
  torneos,
  correcciones,
}: {
  torneos: TorneoCalendario[];
  correcciones?: Map<string, CorreccionConCambios[]>;
}) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  // El id y no el torneo: ver el comentario en lista-torneos.
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const abierto = torneos.find((t) => t.id === abiertoId) ?? null;

  /**
   * Las semanas del mes, cada una con sus barras ya ubicadas.
   *
   * Un torneo que cruza de una semana a la otra se corta y se vuelve a dibujar
   * en la siguiente, con las puntas redondeadas sólo del lado donde realmente
   * empieza o termina. Los carriles evitan que dos torneos simultáneos se
   * pisen: cada uno baja al primer carril libre.
   */
  const semanas = useMemo(() => {
    const primero = new Date(anio, mes, 1);
    const desplazamiento = (primero.getDay() + 6) % 7; // la semana arranca el lunes
    const inicioGrilla = new Date(anio, mes, 1 - desplazamiento);
    const diasDelMes = new Date(anio, mes + 1, 0).getDate();
    const totalCeldas = Math.ceil((desplazamiento + diasDelMes) / 7) * 7;

    const bloques: { dias: Date[]; barras: Barra[] }[] = [];

    for (let s = 0; s < totalCeldas / 7; s++) {
      const dias = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(inicioGrilla);
        d.setDate(inicioGrilla.getDate() + s * 7 + i);
        return d;
      });

      const desde = dias[0];
      const hasta = dias[6];
      const carriles: Date[] = [];
      const barras: Barra[] = [];

      const enLaSemana = torneos
        .filter((t) => {
          const i = aFecha(t.fecha_inicio);
          const f = aFecha(t.fecha_fin ?? t.fecha_inicio);
          return f >= desde && i <= hasta;
        })
        .sort((a, b) => {
          const ia = aFecha(a.fecha_inicio).getTime();
          const ib = aFecha(b.fecha_inicio).getTime();
          if (ia !== ib) return ia - ib;
          const da = aFecha(a.fecha_fin ?? a.fecha_inicio).getTime() - ia;
          const db = aFecha(b.fecha_fin ?? b.fecha_inicio).getTime() - ib;
          return db - da; // los más largos primero, así quedan arriba
        });

      for (const t of enLaSemana) {
        const i = aFecha(t.fecha_inicio);
        const f = aFecha(t.fecha_fin ?? t.fecha_inicio);
        const recorteI = i < desde ? desde : i;
        const recorteF = f > hasta ? hasta : f;

        const columna = Math.round(
          (recorteI.getTime() - desde.getTime()) / 86_400_000,
        );
        const ancho =
          Math.round((recorteF.getTime() - recorteI.getTime()) / 86_400_000) + 1;

        let carril = carriles.findIndex((libreDesde) => libreDesde <= recorteI);
        if (carril === -1) carril = carriles.length;
        carriles[carril] = new Date(recorteF.getTime() + 86_400_000);

        barras.push({
          torneo: t,
          columna: columna + 1,
          ancho,
          carril,
          siguePorIzquierda: i < desde,
          siguePorDerecha: f > hasta,
        });
      }

      bloques.push({ dias, barras });
    }

    return bloques;
  }, [torneos, anio, mes]);

  const mover = (delta: number) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };

  const claveHoy = clave(hoy);

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

      <div className="mt-4 grid grid-cols-7 text-center">
        {DIAS.map((d) => (
          <div key={d} className="text-xs text-texto-suave pb-2">
            {d}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-borde overflow-hidden">
        {semanas.map((semana, s) => (
          <div key={s} className="border-b border-borde last:border-0">
            <div className="grid grid-cols-7">
              {semana.dias.map((d) => {
                const esDeOtroMes = d.getMonth() !== mes;
                const esHoy = clave(d) === claveHoy;
                return (
                  <div
                    key={clave(d)}
                    className={`px-1.5 pt-1.5 text-xs border-r border-borde last:border-0 ${
                      esDeOtroMes ? "text-texto-suave/40" : "text-texto-suave"
                    } ${esHoy ? "font-bold text-acento" : ""}`}
                  >
                    {d.getDate()}
                  </div>
                );
              })}
            </div>

            <div
              className="grid grid-cols-7 gap-y-0.5 px-1 pb-1.5 pt-0.5"
              style={{ minHeight: "2.25rem" }}
            >
              {semana.barras.map((b) => (
                <button
                  key={`${b.torneo.id}-${s}`}
                  type="button"
                  onClick={() => setAbiertoId(b.torneo.id)}
                  title={
                    correcciones?.get(b.torneo.id)?.length
                      ? `${b.torneo.nombre} — hay una corrección propuesta`
                      : b.torneo.nombre
                  }
                  style={{
                    gridColumn: `${b.columna} / span ${b.ancho}`,
                    gridRow: b.carril + 1,
                    background: colorBarra(b.torneo.federacion),
                    borderTopLeftRadius: b.siguePorIzquierda ? 0 : "0.25rem",
                    borderBottomLeftRadius: b.siguePorIzquierda ? 0 : "0.25rem",
                    borderTopRightRadius: b.siguePorDerecha ? 0 : "0.25rem",
                    borderBottomRightRadius: b.siguePorDerecha ? 0 : "0.25rem",
                    outline: correcciones?.get(b.torneo.id)?.length
                      ? "2px dashed rgba(255,255,255,0.9)"
                      : undefined,
                    outlineOffset: "-2px",
                  }}
                  className="mx-px px-1.5 py-0.5 text-[11px] leading-tight text-white
                             truncate text-left hover:opacity-85"
                >
                  {b.siguePorIzquierda ? "↩ " : ""}
                  {correcciones?.get(b.torneo.id)?.length ? "✎ " : ""}
                  {b.torneo.nombre}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-texto-suave text-center">
        Tocá un torneo para ver los detalles.
        {[...(correcciones?.values() ?? [])].some((c) => c.length > 0) && (
          <> Los marcados con ✎ tienen una corrección esperando aval.</>
        )}
      </p>

      <ModalTorneo
        torneo={abierto}
        correcciones={abierto ? correcciones?.get(abierto.id) : undefined}
        alCerrar={() => setAbiertoId(null)}
      />
    </div>
  );
}
