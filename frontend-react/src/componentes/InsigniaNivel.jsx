// Etiqueta con el nivel de carga. Texto y color van juntos: el estado no depende solo del color.

const CLASE_POR_NIVEL = { NORMAL: "verde", ALERTA: "naranja", SOBRECARGA: "rojo" };

export default function InsigniaNivel({ nivel }) {
  return <span className={`insignia insignia--${CLASE_POR_NIVEL[nivel] ?? "verde"}`}>{nivel}</span>;
}
