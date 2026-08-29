"use client";

import { useActionState } from "react";

import { cambiarRol } from "@/acciones/admin";
import { ROLES } from "@/lib/roles";

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  rol: "admin" | "pro" | "regular";
  telefono: string | null;
  activas: number;
  alta: string;
};

const COLOR_ROL: Record<string, string> = {
  admin: "bg-acento text-acento-texto",
  pro: "bg-precio/20 text-precio",
  regular: "bg-fondo-sutil text-texto-suave",
};

export function FilaUsuario({
  usuario: u,
  esUnoMismo,
}: {
  usuario: Usuario;
  esUnoMismo: boolean;
}) {
  const [estado, accion, guardando] = useActionState(cambiarRol, {});

  return (
    <li className="rounded-xl border border-borde bg-fondo-elevado p-3 flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{u.nombre || u.email}</p>
        <p className="text-sm text-texto-suave truncate">
          {u.nombre ? `${u.email} · ` : ""}
          {u.activas} {u.activas === 1 ? "activa" : "activas"}
          {u.telefono ? ` · ${u.telefono}` : " · sin teléfono"}
        </p>
        {estado.error && <p className="text-sm text-alerta mt-1">{estado.error}</p>}
        {estado.ok && <p className="text-sm text-precio mt-1">{estado.ok}</p>}
      </div>

      {esUnoMismo ? (
        <span
          className={`text-xs rounded-md px-2 py-1 font-medium ${COLOR_ROL[u.rol]}`}
        >
          {ROLES[u.rol]} · vos
        </span>
      ) : (
        <form action={accion} className="flex items-center gap-2">
          <input type="hidden" name="usuario" value={u.id} />
          <select
            name="rol"
            defaultValue={u.rol}
            className="rounded-lg border border-borde bg-fondo px-2.5 py-1.5 text-sm outline-none focus:border-acento"
          >
            {Object.entries(ROLES).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg border border-borde px-3 py-1.5 text-sm hover:border-acento disabled:opacity-50"
          >
            {guardando ? "…" : "Guardar"}
          </button>
        </form>
      )}
    </li>
  );
}
