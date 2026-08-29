"use client";

import { useActionState, useState } from "react";

import { borrarBusqueda, guardarBusqueda } from "@/acciones/busquedas";
import {
  ARMAS,
  CATEGORIAS,
  MANOS,
  MONEDAS,
  TIPOS_POR_CATEGORIA,
  type Categoria,
} from "@/lib/taxonomy";

const CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-elevado px-3 py-2.5 " +
  "outline-none focus:border-acento";

type Busqueda = {
  id: string;
  texto: string | null;
  categoria: string | null;
  tipo: string | null;
  arma: string | null;
  mano: string | null;
  talle: string | null;
  precio_max: number | null;
  moneda: string;
  avisos: number;
};

/** Resume la búsqueda en una frase, para no mostrar una tabla de campos. */
function describir(b: Busqueda): string {
  const partes: string[] = [];
  if (b.texto) partes.push(`“${b.texto}”`);
  if (b.categoria) partes.push(CATEGORIAS[b.categoria as Categoria]);
  if (b.arma) partes.push(ARMAS[b.arma as keyof typeof ARMAS]);
  if (b.mano && b.mano !== "indistinto")
    partes.push(MANOS[b.mano as keyof typeof MANOS]);
  if (b.talle) partes.push(`talle ${b.talle}`);
  if (b.precio_max)
    partes.push(`hasta ${b.moneda === "USD" ? "US$" : "$"} ${b.precio_max}`);
  return partes.join(" · ") || "Cualquier cosa";
}

export function ListaBusquedas({ busquedas }: { busquedas: Busqueda[] }) {
  return (
    <ul className="mt-6 space-y-2">
      {busquedas.map((b) => (
        <li
          key={b.id}
          className="rounded-xl border border-borde bg-fondo-elevado p-3 flex items-center gap-3"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">{describir(b)}</p>
            <p className="text-xs text-texto-suave">
              {b.avisos === 0
                ? "Todavía no apareció nada"
                : `${b.avisos} ${b.avisos === 1 ? "aviso enviado" : "avisos enviados"}`}
            </p>
          </div>
          <form action={borrarBusqueda}>
            <input type="hidden" name="id" value={b.id} />
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-borde px-3 py-1.5 text-sm text-texto-suave hover:border-alerta hover:text-alerta"
            >
              Quitar
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

export function FormularioBusqueda() {
  const [estado, accion, guardando] = useActionState(guardarBusqueda, {});
  const [categoria, setCategoria] = useState<Categoria | "">("");

  const tipos = categoria ? TIPOS_POR_CATEGORIA[categoria] : {};

  return (
    <form action={accion} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">¿Qué buscás?</label>
        <input
          name="texto"
          placeholder="Chaquetilla eléctrica talle 44"
          maxLength={120}
          className={CAMPO}
        />
        <p className="text-xs text-texto-suave mt-1">
          Escribilo como se te ocurra. Buscamos esas palabras en el título, la
          descripción y la marca.
        </p>
      </div>

      <details className="rounded-lg border border-borde p-3">
        <summary className="text-sm cursor-pointer text-texto-suave">
          Afinar con filtros (opcional)
        </summary>

        <div className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria)}
              className={CAMPO}
            >
              <option value="">Cualquier categoría</option>
              {Object.entries(CATEGORIAS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>

            <select name="tipo" className={CAMPO} defaultValue="" disabled={!categoria}>
              <option value="">Cualquier tipo</option>
              {Object.entries(tipos).map(([id, m]) => (
                <option key={id} value={id}>{m.label}</option>
              ))}
            </select>

            <select name="arma" className={CAMPO} defaultValue="">
              <option value="">Cualquier arma</option>
              {Object.entries(ARMAS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>

            <select name="mano" className={CAMPO} defaultValue="">
              <option value="">Diestro o zurdo</option>
              {Object.entries(MANOS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>

            <input name="talle" placeholder="Talle" className={CAMPO} maxLength={10} />

            <div className="flex gap-2">
              <select name="moneda" className={`${CAMPO} w-28`} defaultValue="USD">
                {Object.entries(MONEDAS).map(([id, l]) => (
                  <option key={id} value={id}>{l}</option>
                ))}
              </select>
              <input
                name="precio_max"
                inputMode="decimal"
                placeholder="Precio máximo"
                className={CAMPO}
              />
            </div>
          </div>
        </div>
      </details>

      {estado.error && (
        <p className="rounded-lg border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">
          {estado.error}
        </p>
      )}
      {estado.ok && <p className="text-sm text-precio">{estado.ok}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="w-full rounded-lg bg-acento text-acento-texto font-medium py-2.5 hover:opacity-90 disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Avisarme cuando aparezca"}
      </button>
    </form>
  );
}
