"use client";

import { useActionState } from "react";

import { pedirCodigo, validarCodigo } from "@/acciones/auth";

const CAMPO =
  "w-full rounded-lg border border-borde bg-fondo-elevado px-3 py-2.5 " +
  "outline-none focus:border-acento";

const BOTON =
  "w-full rounded-lg bg-acento text-acento-texto font-medium py-2.5 " +
  "hover:opacity-90 disabled:opacity-50";

export function FormularioIngreso() {
  const [pedido, accionPedir, pidiendo] = useActionState(pedirCodigo, {});
  const [validacion, accionValidar, validando] = useActionState(validarCodigo, {});

  // Se cambia el formulario en lugar de navegar: así el mail escrito no se
  // pierde si el código no llega y hay que reintentar.
  if (pedido.email) {
    return (
      <form action={accionValidar} className="space-y-4">
        <input type="hidden" name="email" value={pedido.email} />

        <div>
          <label htmlFor="codigo" className="block text-sm font-medium mb-1.5">
            Código enviado a {pedido.email}
          </label>
          <input
            id="codigo"
            name="codigo"
            inputMode="numeric"
            // Deja que el celular ofrezca el código desde el teclado, sin
            // tener que salir a la app de mail a copiarlo.
            autoComplete="one-time-code"
            maxLength={10}
            required
            autoFocus
            placeholder="12345678"
            className={`${CAMPO} text-center text-2xl tracking-[0.3em]`}
          />
        </div>

        {validacion.error && <p className="text-sm text-alerta">{validacion.error}</p>}

        <button type="submit" disabled={validando} className={BOTON}>
          {validando ? "Verificando…" : "Entrar"}
        </button>

        <p className="text-sm text-texto-suave text-center">
          ¿No te llegó? Fijate en spam, o{" "}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-acento underline"
          >
            probá con otro mail
          </button>
          .
        </p>
      </form>
    );
  }

  return (
    <form action={accionPedir} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Tu mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="vos@mail.com"
          className={CAMPO}
        />
      </div>

      {pedido.error && <p className="text-sm text-alerta">{pedido.error}</p>}

      <button type="submit" disabled={pidiendo} className={BOTON}>
        {pidiendo ? "Enviando…" : "Enviarme el código"}
      </button>

      <p className="text-xs text-texto-suave">
        No usamos contraseñas. Te mandamos un código por mail y con eso entrás.
      </p>
    </form>
  );
}
