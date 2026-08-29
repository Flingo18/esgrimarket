"use client";

import dynamic from "next/dynamic";
import { useActionState, useMemo, useState } from "react";

import { actualizarPublicacion, crearPublicacion } from "@/acciones/publicar";
import { RADIO_DISPLAY_M, ZONAS, difuminarUbicacion } from "@/lib/geo";
import { crearClienteNavegador } from "@/lib/supabase/client";
import {
  ANIO_MINIMO,
  ARMAS,
  CATEGORIAS,
  ESCALAS_TALLE,
  ESTADOS,
  EMPUNADURAS,
  MANOS,
  MARCAS_SUGERIDAS,
  MONEDAS,
  NIVELES_PROTECCION,
  TIPOS_CON_EMPUNADURA,
  TIPOS_POR_CATEGORIA,
  anioMaximo,
  metaTipo,
  type Arma,
  type Categoria,
} from "@/lib/taxonomy";

const CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-elevado px-3 py-2.5 " +
  "outline-none focus:border-acento";

// Leaflet toca `window` al importarse, y además pesa: se carga sólo si la
// persona decide marcar la ubicación en el mapa.
const MapaSelector = dynamic(() => import("@/components/mapa-selector"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-lg border border-borde bg-fondo-sutil grid place-items-center text-sm text-texto-suave">
      Cargando el mapa…
    </div>
  ),
});

function Campo({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{etiqueta}</label>
      {children}
      {ayuda && <p className="text-xs text-texto-suave mt-1">{ayuda}</p>}
    </div>
  );
}

type Sala = { id: string; nombre: string; barrio: string | null };

/** Valores de una publicación existente, cuando el formulario se usa para editar. */
export type PublicacionEditable = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  tipo: string;
  armas_compatibles: string[];
  es_electrica: boolean | null;
  empunadura: string | null;
  talle: string | null;
  nivel_proteccion: string | null;
  mano: string | null;
  marca: string | null;
  anio: number | null;
  estado: string;
  moneda_base: string;
  monto: number;
  zona: string;
  barrio: string | null;
  sala_entrega_id: string | null;
  fotos: string[];
};

export function FormularioPublicar({
  telefonoGuardado,
  salas,
  inicial,
}: {
  telefonoGuardado: string;
  salas: Sala[];
  inicial?: PublicacionEditable;
}) {
  const editando = Boolean(inicial);
  const [estado, accion, enviando] = useActionState(
    editando ? actualizarPublicacion : crearPublicacion,
    {},
  );

  const [categoria, setCategoria] = useState<Categoria | "">(
    (inicial?.categoria as Categoria) ?? "",
  );
  const [tipo, setTipo] = useState(inicial?.tipo ?? "");
  const [zona, setZona] = useState(inicial?.zona ?? "");
  const [fotos, setFotos] = useState<string[]>(inicial?.fotos ?? []);
  const [subiendo, setSubiendo] = useState(false);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [errorUbicacion, setErrorUbicacion] = useState("");
  const [mostrarMapa, setMostrarMapa] = useState(false);

  const tipos = categoria ? TIPOS_POR_CATEGORIA[categoria] : {};
  const meta = categoria && tipo ? metaTipo(categoria, tipo) : null;

  // Cuando el ítem sirve para una sola arma no hay nada que elegir: se manda
  // esa y listo, sin hacerle marcar una casilla obvia.
  const armasPosibles = useMemo(() => (meta ? meta.armas : []), [meta]);

  async function subirFotos(archivos: FileList) {
    setSubiendo(true);
    try {
      const { default: comprimir } = await import("browser-image-compression");
      const supabase = crearClienteNavegador();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const nuevas: string[] = [];
      for (const archivo of Array.from(archivos).slice(0, 6 - fotos.length)) {
        // Las fotos de celular pesan 4 MB. Sin comprimir, el bucket gratuito
        // de 1 GB se llena con 250 publicaciones.
        const chico = await comprimir(archivo, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });

        const ruta = `${user.id}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage
          .from("fotos")
          .upload(ruta, chico, { contentType: "image/jpeg" });

        if (!error) nuevas.push(ruta);
      }
      setFotos((f) => [...f, ...nuevas]);
    } finally {
      setSubiendo(false);
    }
  }

  function pedirUbicacion() {
    setErrorUbicacion("");
    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no permite compartir ubicación. Marcala en el mapa.");
      setMostrarMapa(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Se difumina acá, en el navegador: la coordenada exacta no sale
        // nunca del dispositivo. Ni siquiera llega al servidor.
        setUbicacion(
          difuminarUbicacion({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        );
      },
      (err) => {
        // Cada causa se arregla distinto, así que decir cuál es no es un
        // lujo: un "no pudimos leer tu ubicación" deja a la persona sin
        // saber si tiene que tocar el navegador o el sistema operativo.
        const porCodigo: Record<number, string> = {
          1: "Bloqueaste el permiso de ubicación para este sitio. Podés habilitarlo desde el candado en la barra de direcciones, o marcarla en el mapa.",
          2: "Tu dispositivo no pudo determinar dónde estás. En una computadora suele pasar: marcala en el mapa.",
          3: "Tardó demasiado en responder. Probá de nuevo o marcala en el mapa.",
        };
        setErrorUbicacion(porCodigo[err.code] ?? "No pudimos leer tu ubicación.");
        setMostrarMapa(true);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <form action={accion} className="space-y-6">
      {inicial && <input type="hidden" name="id" value={inicial.id} />}

      {/* ─────────── Qué es ─────────── */}

      <Campo etiqueta="Categoría">
        <select
          name="categoria"
          required
          value={categoria}
          onChange={(e) => {
            setCategoria(e.target.value as Categoria);
            setTipo("");
          }}
          className={CAMPO}
        >
          <option value="">Elegí una…</option>
          {Object.entries(CATEGORIAS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </Campo>

      {categoria && (
        <Campo etiqueta="Qué es">
          <select
            name="tipo"
            required
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={CAMPO}
          >
            <option value="">Elegí una…</option>
            {Object.entries(tipos).map(([id, m]) => (
              <option key={id} value={id}>{m.label}</option>
            ))}
          </select>
        </Campo>
      )}

      {meta && (
        <>
          <Campo
            etiqueta="¿Para qué arma sirve?"
            ayuda={
              armasPosibles.length === 3
                ? "Dejá las tres marcadas si sirve para cualquiera."
                : undefined
            }
          >
            <div className="flex gap-4">
              {armasPosibles.map((a) => (
                <label key={a} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="armas"
                    value={a}
                    defaultChecked={
                      inicial ? inicial.armas_compatibles.includes(a) : true
                    }
                    className="size-4 accent-[var(--acento)]"
                  />
                  <span>{ARMAS[a as Arma]}</span>
                </label>
              ))}
            </div>
          </Campo>

          {meta.electricidad === "segun" && (
            <Campo etiqueta="¿Es eléctrica?">
              <div className="flex gap-4">
                {[
                  ["si", "Sí"],
                  ["no", "No"],
                ].map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="es_electrica"
                      value={v}
                      defaultChecked={
                        inicial?.es_electrica != null
                          ? (v === "si") === inicial.es_electrica
                          : v === "no"
                      }
                      className="size-4 accent-[var(--acento)]"
                    />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
            </Campo>
          )}

          {categoria === "armas" &&
            (TIPOS_CON_EMPUNADURA as readonly string[]).includes(tipo) && (
              <Campo etiqueta="Empuñadura">
                <select
                  name="empunadura"
                  className={CAMPO}
                  defaultValue={inicial?.empunadura ?? ""}
                >
                  <option value="">Sin especificar</option>
                  {Object.entries(EMPUNADURAS).map(([id, l]) => (
                    <option key={id} value={id}>{l}</option>
                  ))}
                </select>
              </Campo>
            )}

          {meta.talle && (
            <Campo etiqueta={meta.talle === "cable" ? "Largo" : "Talle"}>
              <select
                name="talle"
                className={CAMPO}
                defaultValue={inicial?.talle ?? ""}
              >
                <option value="">Sin especificar</option>
                {ESCALAS_TALLE[meta.talle].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Campo>
          )}

          {meta.mano && (
            <Campo
              etiqueta="Mano"
              ayuda="Importa: a un zurdo no le sirve una prenda de diestro."
            >
              <select
                name="mano"
                className={CAMPO}
                defaultValue={inicial?.mano ?? "indistinto"}
              >
                {Object.entries(MANOS).map(([id, l]) => (
                  <option key={id} value={id}>{l}</option>
                ))}
              </select>
            </Campo>
          )}

          {meta.proteccion && (
            <Campo
              etiqueta="Nivel de protección"
              ayuda="Si no sabés, mirá la etiqueta cosida por dentro."
            >
              <select
                name="nivel_proteccion"
                className={CAMPO}
                defaultValue={inicial?.nivel_proteccion ?? "no_aplica"}
              >
                {Object.entries(NIVELES_PROTECCION).map(([id, l]) => (
                  <option key={id} value={id}>{l}</option>
                ))}
              </select>
            </Campo>
          )}
        </>
      )}

      {/* ─────────── Descripción ─────────── */}

      <Campo etiqueta="Título">
        <input
          name="titulo"
          required
          maxLength={90}
          defaultValue={inicial?.titulo ?? ""}
          placeholder="Ej: Chaqueta blanca FIE 800N talle 42, poco uso"
          className={CAMPO}
        />
      </Campo>

      <Campo etiqueta="Descripción" ayuda="Contá el uso que tuvo, si tiene algún detalle, por qué lo vendés.">
        <textarea
          name="descripcion"
          rows={4}
          maxLength={2000}
          defaultValue={inicial?.descripcion ?? ""}
          className={CAMPO}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo etiqueta="Marca">
          <input
            name="marca"
            list="marcas"
            placeholder="Opcional"
            defaultValue={inicial?.marca ?? ""}
            className={CAMPO}
          />
          <datalist id="marcas">
            {MARCAS_SUGERIDAS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Campo>

        <Campo etiqueta="Año" ayuda="Sobre todo en ropa: la tela se gasta.">
          <input
            name="anio"
            type="number"
            min={ANIO_MINIMO}
            max={anioMaximo()}
            placeholder="Opcional"
            defaultValue={inicial?.anio ?? ""}
            className={CAMPO}
          />
        </Campo>
      </div>

      <Campo etiqueta="Estado">
        <select
          name="estado"
          required
          className={CAMPO}
          defaultValue={inicial?.estado ?? ""}
        >
          <option value="">Elegí uno…</option>
          {Object.entries(ESTADOS).map(([id, l]) => (
            <option key={id} value={id}>{l}</option>
          ))}
        </select>
      </Campo>

      {/* ─────────── Precio ─────────── */}

      <Campo
        etiqueta="Precio"
        ayuda="Se muestra en las dos monedas, convertido al blue del día."
      >
        <div className="flex gap-2">
          <select
            name="moneda_base"
            className={`${CAMPO} w-32`}
            defaultValue={inicial?.moneda_base ?? "USD"}
          >
            {Object.entries(MONEDAS).map(([id, l]) => (
              <option key={id} value={id}>{l}</option>
            ))}
          </select>
          <input
            name="monto"
            required
            inputMode="decimal"
            placeholder="0"
            defaultValue={inicial?.monto ?? ""}
            className={CAMPO}
          />
        </div>
      </Campo>

      {/* ─────────── Fotos ─────────── */}

      <Campo etiqueta="Fotos" ayuda="Hasta 6. Se achican solas antes de subirse.">
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={subiendo || fotos.length >= 6}
          onChange={(e) => e.target.files && subirFotos(e.target.files)}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-acento-suave file:px-3 file:py-2 file:text-sm"
        />
        {subiendo && <p className="text-sm text-texto-suave mt-2">Subiendo…</p>}
        {fotos.length > 0 && (
          <p className="text-sm text-texto-suave mt-2">
            {fotos.length} foto{fotos.length > 1 ? "s" : ""} lista
            {fotos.length > 1 ? "s" : ""}.
          </p>
        )}
        {fotos.map((f) => (
          <input key={f} type="hidden" name="fotos" value={f} />
        ))}
      </Campo>

      {/* ─────────── Dónde ─────────── */}

      <Campo etiqueta="Zona de entrega">
        <select
          name="zona"
          required
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          className={CAMPO}
        >
          <option value="">Elegí una…</option>
          {Object.entries(ZONAS).map(([id, z]) => (
            <option key={id} value={id}>{z.label}</option>
          ))}
        </select>
      </Campo>

      {zona === "caba" && (
        <Campo etiqueta="Barrio">
          <select
            name="barrio"
            className={CAMPO}
            defaultValue={inicial?.barrio ?? ""}
          >
            <option value="">Sin especificar</option>
            {ZONAS.caba.barrios.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </Campo>
      )}

      {salas.length > 0 && (
        <Campo
          etiqueta="¿Lo llevás a alguna sala?"
          ayuda="Es la forma más cómoda de entregar: se lo das en el entrenamiento."
        >
          <select
            name="sala_entrega_id"
            className={CAMPO}
            defaultValue={inicial?.sala_entrega_id ?? ""}
          >
            <option value="">No, coordino por WhatsApp</option>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
                {s.barrio ? ` — ${s.barrio}` : ""}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <Campo
        etiqueta="Ubicación aproximada en el mapa"
        ayuda={`Opcional. Se muestra un círculo de ${RADIO_DISPLAY_M} m, nunca tu dirección exacta.`}
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={pedirUbicacion}
            className="rounded-lg border border-borde px-3 py-2 text-sm hover:border-acento"
          >
            Usar mi ubicación actual
          </button>
          <button
            type="button"
            onClick={() => setMostrarMapa((v) => !v)}
            className="rounded-lg border border-borde px-3 py-2 text-sm hover:border-acento"
          >
            {mostrarMapa ? "Ocultar el mapa" : "Marcar en el mapa"}
          </button>
          {ubicacion && (
            <button
              type="button"
              onClick={() => {
                setUbicacion(null);
                setErrorUbicacion("");
              }}
              className="rounded-lg border border-borde px-3 py-2 text-sm text-texto-suave hover:border-alerta hover:text-alerta"
            >
              Quitar
            </button>
          )}
        </div>

        {errorUbicacion && (
          <p className="text-sm text-alerta mt-2">{errorUbicacion}</p>
        )}

        {ubicacion && (
          <p className="text-sm text-precio mt-2">
            Listo. Se va a mostrar una zona aproximada, corrida al azar.
          </p>
        )}

        {mostrarMapa && (
          <div className="mt-2">
            <MapaSelector
              valor={ubicacion}
              alElegir={(p) => {
                setUbicacion(p);
                setErrorUbicacion("");
              }}
            />
            <p className="text-xs text-texto-suave mt-1">
              Tocá el mapa donde se retira. No hace falta precisión: lo que se
              publica es el círculo, no el punto.
            </p>
          </div>
        )}
        {ubicacion && (
          <>
            <input type="hidden" name="lat_aprox" value={ubicacion.lat} />
            <input type="hidden" name="lng_aprox" value={ubicacion.lng} />
          </>
        )}
      </Campo>

      {/* ─────────── Contacto ─────────── */}

      {/*
        El teléfono es del perfil, no de la publicación: se pide una sola vez.
        Mostrar el campo lleno en cada publicación hacía pensar que había que
        cargarlo siempre.
      */}
      {telefonoGuardado ? (
        <div className="rounded-lg border border-borde bg-fondo-sutil px-4 py-3 text-sm">
          Te van a contactar al <strong>{telefonoGuardado}</strong>.{" "}
          <a href="/cuenta" className="text-acento underline">
            Cambiar
          </a>
        </div>
      ) : (
        <Campo
          etiqueta="Tu WhatsApp"
          ayuda="Se guarda en tu perfil y se usa en todas tus publicaciones. No se muestra en la página: aparece detrás de un botón. Escribilo sin el 0 y sin el 15."
        >
          <input
            name="telefono"
            type="tel"
            required
            placeholder="11 1234-5678"
            className={CAMPO}
          />
        </Campo>
      )}

      {estado.error && (
        <p className="rounded-lg border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || subiendo}
        className="w-full rounded-lg bg-acento text-acento-texto font-medium py-3 hover:opacity-90 disabled:opacity-50"
      >
        {enviando
          ? editando
            ? "Guardando…"
            : "Publicando…"
          : editando
            ? "Guardar cambios"
            : "Publicar"}
      </button>
    </form>
  );
}
