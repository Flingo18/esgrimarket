import type { Metadata } from "next";

import { FormularioIngreso } from "./formulario";

export const metadata: Metadata = { title: "Ingresar" };

const ERRORES: Record<string, string> = {
  link_invalido: "Ese link no es válido. Pedí uno nuevo.",
  // Pasa más seguido de lo que parece: algunos servidores de correo visitan
  // los links del mail para escanearlos y los queman antes que la persona.
  link_vencido: "Ese link ya venció o se usó. Pedí uno nuevo.",
};

export default async function PaginaIngresar({ searchParams }: PageProps<"/ingresar">) {
  const { error } = await searchParams;
  const mensaje = typeof error === "string" ? ERRORES[error] : undefined;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Ingresá a tu cuenta</h1>
      <p className="mt-2 text-texto-suave">
        Te mandamos un código por mail. No hace falta contraseña.
      </p>

      {mensaje && (
        <p className="mt-6 rounded-lg border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">
          {mensaje}
        </p>
      )}

      <div className="mt-8">
        <FormularioIngreso />
      </div>
    </div>
  );
}
