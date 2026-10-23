// Mensaje de error, exito o informacion. Los errores se anuncian de inmediato (role=alert).

export default function MensajeAviso({ tipo = "info", children }) {
  if (!children) return null;
  return (
    <div className={`mensaje-aviso mensaje-aviso--${tipo}`} role={tipo === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
