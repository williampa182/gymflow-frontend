// Helpers de WhatsApp manual (panel En Riesgo). Cero infraestructura: solo
// construyen enlaces wa.me que el recepcionista abre en su propio WhatsApp.
// El envío siempre lo hace la persona, nunca el sistema.

// Solo dígitos; wa.me exige formato E.164 sin "+", espacios ni guiones.
function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

// Normaliza un teléfono crudo de BD a dígitos wa.me, o null si no sirve.
// Regla CO: móvil de 10 dígitos empezando por 3 → se antepone 57.
// Todo lo demás válido (7-15 dígitos E.164) pasa tal cual; fijos sin código
// de país probablemente no entreguen y el recepcionista decide.
// Basura ("N/A", "no tiene", internacionales con 00) → null = sin botón.
export function normalizarTelefonoWA(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  const digitos = soloDigitos(telefono);
  if (/^3\d{9}$/.test(digitos)) return `57${digitos}`;
  if (/^\d{7,15}$/.test(digitos)) return digitos;
  return null;
}

// Enlace wa.me listo para <a target="_blank">. Mensaje SIEMPRE mínimo
// (nombre + dato operativo, nunca documento ni email): la URL sale del
// sistema al WhatsApp personal del recepcionista (riesgo aceptado).
// Null si el teléfono no normaliza: la UI muestra "Sin teléfono".
export function enlaceWhatsApp(
  telefono: string | null | undefined,
  mensaje: string
): string | null {
  const digitos = normalizarTelefonoWA(telefono);
  if (!digitos) return null;
  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensaje)}`;
}
