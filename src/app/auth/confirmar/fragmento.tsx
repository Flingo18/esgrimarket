"use client";

import { useEffect, useState } from "react";

import { crearClienteNavegador } from "@/lib/supabase/client";

/**
 * Último recurso: los tokens del flujo implícito viajan en el fragmento de
 * la URL (`#access_token=...`), que el navegador nunca manda al servidor.
 * Sólo se puede leer desde acá.
 */
export function RescatarDesdeElFragmento({ destino }: { destino: string }) {
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");

    if (!access_token || !refresh_token) {
      window.location.replace("/ingresar?error=link_invalido");
      return;
    }

    crearClienteNavegador()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) setFallo(true);
        else window.location.replace(destino);
      });
  }, [destino]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      {fallo ? (
        <p className="text-alerta">
          No pudimos abrir tu sesión. Pedí un código nuevo.
        </p>
      ) : (
        <p className="text-texto-suave">Entrando…</p>
      )}
    </div>
  );
}
