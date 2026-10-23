// Iconos de linea en SVG en linea. Evitan cargar una fuente externa de iconos, que en una
// conexion LTE intermitente puede fallar y dejar la pantalla con texto en lugar de dibujos.

const TRAZOS = {
  usuario: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),
  candado: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  correo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  tarjeta: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M14 10h4M14 14h4M6.5 16c.5-1.5 1.5-2 2.5-2s2 .5 2.5 2" />
    </>
  ),
  ojo: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  ojoCerrado: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.2-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  salir: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  calculadora: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17.5v.01" />
    </>
  ),
  terreno: <path d="M2 19 9 7l4 6 3-4 6 10H2Z" />,
  animal: (
    <>
      <circle cx="7" cy="9" r="1.8" />
      <circle cx="12" cy="6" r="1.8" />
      <circle cx="17" cy="9" r="1.8" />
      <path d="M12 12c-3.5 0-6 3.2-6 5.5 0 1.4 1.1 2 2.5 2 1.2 0 2-.5 3.5-.5s2.3.5 3.5.5c1.4 0 2.5-.6 2.5-2 0-2.3-2.5-5.5-6-5.5Z" />
    </>
  ),
  moneda: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M14.5 9.5c-.5-.9-1.4-1.3-2.5-1.3-1.5 0-2.5.8-2.5 1.9 0 2.6 5 1.2 5 3.8 0 1.1-1 2-2.5 2-1.1 0-2-.4-2.5-1.3" />
    </>
  ),
  hoja: (
    <>
      <path d="M5 19C4 11 9 5 20 4c0 11-5 16-13 15" />
      <path d="M5 19c2-5 5-8 9-10" />
    </>
  ),
  llave: <path d="M14.5 6.5a4 4 0 0 0-5.3 5L3 17.7V21h3.3l.7-1.3H8.5V18h1.7l.8-.9a4 4 0 0 0 4.9-5.2l-2.3 2.3-2.4-.7-.7-2.4 2.3-2.3Z" />,
  gota: <path d="M12 3c3.5 4.5 6 7.7 6 11a6 6 0 0 1-12 0c0-3.3 2.5-6.5 6-11Z" />,
  recibo: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  lista: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  sinNube: (
    <>
      <path d="M3 3l18 18" />
      <path d="M17.5 17.5H7a4 4 0 0 1-.9-7.9M9 6.2A6 6 0 0 1 18 9a4.5 4.5 0 0 1 3 4.2" />
    </>
  ),
  refrescar: (
    <>
      <path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4" />
    </>
  ),
  campana: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
};

export default function Icono({ nombre, tamano = 24, className = "" }) {
  const trazos = TRAZOS[nombre];
  if (!trazos) return null;
  return (
    <svg
      className={`icono ${className}`.trim()}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {trazos}
    </svg>
  );
}
