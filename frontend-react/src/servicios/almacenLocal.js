// Acceso a localStorage protegido con try/catch: el almacenamiento puede estar bloqueado
// (modo privado, cuota llena, politica del navegador) y la aplicacion debe seguir funcionando.

export const CLAVES = Object.freeze({
  SESION: "pastoreando.sesion",
  LOTES: "pastoreando.lotes",
  CONTRATOS: "pastoreando.contratos",
  REPORTE: "pastoreando.reporte",
});

export function leer(clave, porDefecto = null) {
  try {
    const texto = window.localStorage.getItem(clave);
    return texto === null ? porDefecto : JSON.parse(texto);
  } catch {
    return porDefecto;
  }
}

export function guardar(clave, valor) {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function borrar(clave) {
  try {
    window.localStorage.removeItem(clave);
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}
