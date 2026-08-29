/**
 * Roles de cuenta.
 *
 * Vive acá y no en las acciones de servidor: un archivo `"use server"` sólo
 * puede exportar funciones async, y Next descarta el resto sin avisar. Una
 * constante exportada desde ahí llega como `undefined` al cliente, y el
 * síntoma es un desplegable vacío sin ningún error en consola.
 */
export const ROLES = {
  admin: "Administrador",
  pro: "Pro",
  regular: "Regular",
} as const;

export type Rol = keyof typeof ROLES;

/** Qué habilita cada rol, para explicarlo en la interfaz. */
export const LIMITE_POR_ROL: Record<Rol, number> = {
  admin: 9999,
  pro: 200,
  regular: 5,
};
