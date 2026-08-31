"use client";

import { useState } from "react";

import { PAISES, PAIS_POR_DEFECTO, type PaisId } from "@/lib/whatsapp";

/**
 * País + número, juntos.
 *
 * Van en el mismo control porque son un dato solo: el mismo "348 1234567" es
 * un teléfono distinto según de dónde sea, y separarlos en dos preguntas hace
 * que la gente conteste una sola.
 *
 * La ayuda cambia con el país: el "sin el 0 y sin el 15" es argentino y a un
 * italiano lo confundiría — en Italia el 0 es parte del número.
 */
export function CampoTelefono({
  nombre = "telefono",
  valorInicial = "",
  paisInicial = PAIS_POR_DEFECTO,
  requerido = false,
  className,
}: {
  nombre?: string;
  valorInicial?: string;
  paisInicial?: PaisId;
  requerido?: boolean;
  className: string;
}) {
  const [pais, setPais] = useState<PaisId>(paisInicial);

  return (
    <>
      <div className="flex gap-2">
        <select
          name="pais"
          value={pais}
          onChange={(e) => setPais(e.target.value as PaisId)}
          aria-label="País del teléfono"
          className={`${className} w-auto shrink-0`}
        >
          {(Object.keys(PAISES) as PaisId[]).map((id) => (
            <option key={id} value={id}>
              {PAISES[id].bandera} +{PAISES[id].codigo}
            </option>
          ))}
        </select>
        <input
          name={nombre}
          type="tel"
          required={requerido}
          defaultValue={valorInicial}
          placeholder={pais === "AR" ? "11 1234-5678" : "Número sin el código de país"}
          className={className}
        />
      </div>
      <p className="text-xs text-texto-suave mt-1">
        {pais === "AR"
          ? "Escribilo sin el 0 y sin el 15."
          : `Como lo marcarías dentro de ${PAISES[pais].nombre}.`}
      </p>
    </>
  );
}
