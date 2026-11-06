/**
 * Serializa datos estructurados para meterlos dentro de un `<script>`.
 *
 * `JSON.stringify` escapa comillas pero no `<`, así que un título que
 * contenga `</script>` termina la etiqueta antes de tiempo y todo lo que
 * venga después corre como JavaScript en nuestro origen — con la sesión de
 * quien esté mirando la página. El título de una publicación lo escribe
 * cualquiera que se registre, así que esto no es hipotético.
 *
 * `<` es la forma escapada de `<` dentro de un string JSON: los
 * buscadores lo leen igual y el navegador ya no puede cerrar la etiqueta.
 */
export function jsonLd(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}
