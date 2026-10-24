// Etiqueta con el estado de un contrato, un pago o una firma. Texto y color van juntos: el estado
// no depende solo del color.

const CLASE_POR_ESTADO = {
  Activo: "verde",
  Confirmado: "verde",
  Vigente: "verde",
  Pendiente: "naranja",
  Rechazado: "rojo",
  Anulado: "rojo",
  Desactualizada: "rojo",
  Finalizado: "gris",
};

export default function InsigniaEstado({ estado }) {
  return <span className={`insignia insignia--${CLASE_POR_ESTADO[estado] ?? "gris"}`}>{estado}</span>;
}
