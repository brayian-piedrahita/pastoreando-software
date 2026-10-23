// Logo y nombre del sistema. El ancho llega por prop para usarlo grande en el acceso y pequeno
// en el encabezado.

export default function MarcaPastoreando({ ancho = 160, mostrarNombre = true }) {
  return (
    <div className="marca">
      <img src="/logo.png" alt="Logo de Pastoreando" width={ancho} height={Math.round(ancho * 0.545)} />
      {mostrarNombre && <span className="marca__nombre">PASTOREANDO</span>}
    </div>
  );
}
