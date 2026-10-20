/**
 * Panel principal: lotes, costos y contratos segun el rol del usuario.
 * Todo texto del servidor se inserta con textContent para evitar inyeccion HTML.
 */
const sesion = leerSesion();
if (!sesion) {
  window.location.href = '/index.html';
}
const usuario = sesion ? sesion.usuario : { rol: '', id_usuario: 0 };

let lotesCargados = [];
let loteEnEdicion = null;
let contratoGanadoActual = null;

/**
 * Crea un elemento con clase y texto opcionales.
 * @param {string} etiqueta Nombre de la etiqueta HTML.
 * @param {string} [clase] Clases CSS.
 * @param {string} [texto] Texto seguro a mostrar.
 * @returns {HTMLElement}
 */
function crear(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) {
    nodo.className = clase;
  }
  if (texto !== undefined) {
    nodo.textContent = texto;
  }
  return nodo;
}

/**
 * Formatea un valor como pesos colombianos.
 * @param {number} valor Cantidad en pesos.
 * @returns {string}
 */
function pesos(valor) {
  return `$${Math.round(valor).toLocaleString('es-CO')}`;
}

/**
 * Convierte el contenido de un campo en numero, o lo deja vacio para que el
 * servidor lo rechace con su mensaje.
 * @param {string} id Identificador del input.
 * @returns {number|null}
 */
function numeroDe(id) {
  const texto = document.getElementById(id).value;
  return texto === '' ? null : Number(texto);
}

/**
 * Muestra un mensaje breve en pantalla.
 * @param {string} texto Mensaje.
 * @param {boolean} [esError] Si es true se pinta en rojo.
 */
function avisar(texto, esError) {
  // Se escapa el texto: M.toast interpreta su contenido como HTML.
  const seguro = crear('span', '', texto);
  M.toast({
    html: seguro.outerHTML,
    displayLength: 3500,
    classes: esError ? 'red' : 'green'
  });
}

/**
 * Pinta un error del servidor y marca el campo afectado.
 * @param {ErrorApi} error Error recibido.
 * @param {string} idMensaje Parrafo donde se escribe el texto.
 * @param {string} prefijo Prefijo de los ids de los inputs del formulario.
 */
function mostrarError(error, idMensaje, prefijo) {
  document.getElementById(idMensaje).textContent = error.message;
  if (error.campo) {
    const campo = document.getElementById(`${prefijo}${error.campo}`);
    if (campo) {
      campo.classList.add('invalid');
      campo.focus();
    }
  }
}

/**
 * Limpia mensajes y marcas de error de un formulario.
 * @param {HTMLFormElement} formulario Formulario a limpiar.
 * @param {string} idMensaje Parrafo de mensaje.
 */
function limpiarErrores(formulario, idMensaje) {
  document.getElementById(idMensaje).textContent = '';
  formulario.querySelectorAll('.invalid').forEach((c) => c.classList.remove('invalid'));
}

/**
 * Trata un error de la API fuera de un formulario: si la sesion vencio vuelve al login.
 * @param {ErrorApi} error Error recibido.
 */
function manejarError(error) {
  if (error.estado === 401) {
    guardarSesion(null);
    window.location.href = '/index.html';
    return;
  }
  avisar(error.message, true);
}

/* ===================== Pestanas ===================== */

document.querySelectorAll('.pestana').forEach((boton) => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.pestana').forEach((b) => b.classList.remove('activa'));
    document.querySelectorAll('.seccion').forEach((s) => s.classList.remove('activa'));
    boton.classList.add('activa');
    document.getElementById(boton.dataset.seccion).classList.add('activa');
  });
});

/* ===================== Lotes (RF04) ===================== */

/**
 * Dibuja la tarjeta de un lote con su medidor y su alerta.
 * @param {object} lote Lote con estado_carga.
 * @returns {HTMLElement}
 */
function tarjetaLote(lote) {
  const estado = lote.estado_carga;
  const tarjeta = crear('article', `tarjeta-lote nivel-${estado.nivel}`);
  tarjeta.appendChild(crear('h3', '', lote.nombre_lote));
  tarjeta.appendChild(
    crear('div', 'detalle', `${lote.hectareas} ha · pasto ${lote.tipo_pastura}`)
  );
  const medidor = crear('div', 'medidor');
  const barra = crear('div');
  barra.style.width = `${Math.min(estado.porcentaje, 100)}%`;
  medidor.appendChild(barra);
  tarjeta.appendChild(medidor);

  const texto = crear('div', 'texto-ocupacion');
  texto.appendChild(
    crear('span', '', `${estado.carga_actual} de ${estado.capacidad_carga} cabezas (${estado.porcentaje} %)`)
  );
  texto.appendChild(crear('span', `etiqueta ${estado.nivel}`, estado.nivel));
  tarjeta.appendChild(texto);

  if (estado.nivel !== 'NORMAL') {
    const aviso = crear('div', 'aviso-carga');
    aviso.setAttribute('role', 'alert');
    aviso.appendChild(crear('strong', '', estado.mensaje));
    const lista = crear('ul');
    estado.sugerencias.forEach((s) => lista.appendChild(crear('li', '', s)));
    aviso.appendChild(lista);
    tarjeta.appendChild(aviso);
  }

  if (usuario.rol === 'Propietario' && lote.id_propietario === usuario.id_usuario) {
    const acciones = crear('div', 'acciones-tarjeta');
    const editar = crear('button', 'btn-flat', 'Editar');
    editar.addEventListener('click', () => abrirModalLote(lote));
    const borrar = crear('button', 'btn-flat red-text', 'Eliminar');
    borrar.addEventListener('click', () => eliminarLote(lote));
    acciones.append(editar, borrar);
    tarjeta.appendChild(acciones);
  }
  return tarjeta;
}

/**
 * Consulta los lotes y los dibuja.
 */
async function cargarLotes() {
  try {
    lotesCargados = await solicitar('GET', '/api/lotes');
  } catch (error) {
    manejarError(error);
    return;
  }
  const contenedor = document.getElementById('listaLotes');
  contenedor.replaceChildren();
  if (lotesCargados.length === 0) {
    contenedor.appendChild(crear('p', 'vacio', 'Todavía no hay lotes registrados.'));
  }
  lotesCargados.forEach((lote) => contenedor.appendChild(tarjetaLote(lote)));
}

/**
 * Abre el modal de lote, vacio para crear o con datos para editar.
 * @param {object|null} lote Lote a editar, o null para uno nuevo.
 */
function abrirModalLote(lote) {
  loteEnEdicion = lote;
  document.getElementById('tituloModalLote').textContent = lote ? 'Editar lote' : 'Nuevo lote';
  document.getElementById('lote_nombre_lote').value = lote ? lote.nombre_lote : '';
  document.getElementById('lote_hectareas').value = lote ? lote.hectareas : '';
  document.getElementById('lote_capacidad_carga').value = lote ? lote.capacidad_carga : '';
  document.getElementById('lote_tipo_pastura').value = lote ? lote.tipo_pastura : '';
  limpiarErrores(document.getElementById('formLote'), 'mensajeLote');
  M.updateTextFields();
  M.Modal.getInstance(document.getElementById('modalLote')).open();
}

/**
 * Pide confirmacion y elimina un lote.
 * @param {object} lote Lote a eliminar.
 */
async function eliminarLote(lote) {
  if (!window.confirm(`¿Eliminar el lote "${lote.nombre_lote}"?`)) {
    return;
  }
  try {
    await solicitar('DELETE', `/api/lotes/${lote.id_lote}`);
    avisar('Lote eliminado');
    cargarLotes();
  } catch (error) {
    avisar(error.message, true);
  }
}

document.getElementById('formLote').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarErrores(evento.target, 'mensajeLote');
  const cuerpo = {
    nombre_lote: document.getElementById('lote_nombre_lote').value,
    hectareas: numeroDe('lote_hectareas'),
    capacidad_carga: numeroDe('lote_capacidad_carga'),
    tipo_pastura: document.getElementById('lote_tipo_pastura').value
  };
  try {
    if (loteEnEdicion) {
      await solicitar('PUT', `/api/lotes/${loteEnEdicion.id_lote}`, cuerpo);
    } else {
      await solicitar('POST', '/api/lotes', cuerpo);
    }
    M.Modal.getInstance(document.getElementById('modalLote')).close();
    avisar('Lote guardado');
    cargarLotes();
  } catch (error) {
    mostrarError(error, 'mensajeLote', 'lote_');
  }
});

/* ===================== Costos (RF01 y RF02) ===================== */

/**
 * Dibuja el resultado del calculo y el desglose por rubro.
 * @param {object} r Respuesta de /api/costos/calcular.
 */
function mostrarResultadoCosto(r) {
  const contenedor = document.getElementById('resultadoCosto');
  contenedor.replaceChildren();
  const panel = crear('div', 'panel-blanco resultado-costo');
  panel.appendChild(crear('div', '', 'Costo por cabeza (con margen del 20 %)'));
  panel.appendChild(crear('div', 'gran-valor', pesos(r.costo_unitario_final)));
  panel.appendChild(
    crear(
      'p',
      '',
      `Base ${pesos(r.costo_base_por_cabeza)} + manejo ${pesos(r.ajuste_manejo)} ` +
        `+ margen ${pesos(r.margen_por_cabeza)}. Total del lote: ${pesos(r.total_lote_final)}.`
    )
  );
  r.desglose.forEach((fila) => {
    const bloque = crear('div', 'fila-desglose');
    const encabezado = crear('div', 'encabezado');
    encabezado.appendChild(crear('span', '', fila.rubro));
    encabezado.appendChild(
      crear('span', '', `${pesos(fila.valor_lote)} · ${fila.porcentaje} %`)
    );
    const medidor = crear('div', 'medidor');
    const barra = crear('div');
    barra.style.width = `${fila.porcentaje}%`;
    medidor.appendChild(barra);
    bloque.append(encabezado, medidor);
    panel.appendChild(bloque);
  });
  contenedor.appendChild(panel);
}

/**
 * Carga la tabla de ultimos calculos (solo contador y propietario).
 */
async function cargarHistorial() {
  if (usuario.rol !== 'Contador' && usuario.rol !== 'Propietario') {
    return;
  }
  document.getElementById('bloqueHistorial').style.display = 'block';
  try {
    const filas = await solicitar('GET', '/api/costos/historial');
    const cuerpo = document.getElementById('filasHistorial');
    cuerpo.replaceChildren();
    filas.forEach((f) => {
      const tr = crear('tr');
      [
        f.fecha.replace('T', ' '),
        f.usuario,
        f.proposito,
        String(f.cantidad_animales),
        pesos(f.costo_unitario_final)
      ].forEach((texto) => tr.appendChild(crear('td', '', texto)));
      cuerpo.appendChild(tr);
    });
  } catch (error) {
    manejarError(error);
  }
}

document.getElementById('formCosto').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarErrores(evento.target, 'mensajeCosto');
  const cuerpo = {
    alimentacion: numeroDe('costo_alimentacion'),
    mantenimiento: numeroDe('costo_mantenimiento'),
    servicios: numeroDe('costo_servicios'),
    impuestos: numeroDe('costo_impuestos'),
    cantidad_animales: numeroDe('costo_cantidad_animales'),
    proposito: document.getElementById('costo_proposito').value
  };
  try {
    mostrarResultadoCosto(await solicitar('POST', '/api/costos/calcular', cuerpo));
    cargarHistorial();
  } catch (error) {
    mostrarError(error, 'mensajeCosto', 'costo_');
  }
});

/* ===================== Contratos (RF05) y ganado ===================== */

/**
 * Consulta los contratos visibles para el rol y los dibuja en la tabla.
 */
async function cargarContratos() {
  let contratos;
  try {
    contratos = await solicitar('GET', '/api/contratos');
  } catch (error) {
    manejarError(error);
    return;
  }
  const cuerpo = document.getElementById('filasContratos');
  cuerpo.replaceChildren();
  if (contratos.length === 0) {
    const fila = crear('tr');
    const celda = crear('td', 'vacio', 'No hay contratos para mostrar.');
    celda.colSpan = 8;
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
  }
  contratos.forEach((c) => {
    const tr = crear('tr');
    tr.appendChild(crear('td', '', String(c.id_contrato).padStart(4, '0')));
    tr.appendChild(crear('td', '', c.nombre_lote));
    tr.appendChild(crear('td', '', c.nombre_arrendatario));
    tr.appendChild(crear('td', '', `${c.fecha_inicio} a ${c.fecha_fin}`));
    tr.appendChild(crear('td', '', String(c.total_cabezas)));
    tr.appendChild(crear('td', '', pesos(c.valor_mensual)));
    const celdaEstado = crear('td');
    celdaEstado.appendChild(crear('span', `etiqueta ${c.estado}`, c.estado));
    tr.appendChild(celdaEstado);

    const acciones = crear('td');
    const ganado = crear('button', 'btn-flat', 'Ganado');
    ganado.addEventListener('click', () => abrirGanado(c));
    const documento = crear('button', 'btn-flat', 'Documento');
    documento.addEventListener('click', () => verDocumento(c));
    acciones.append(ganado, documento);
    tr.appendChild(acciones);
    cuerpo.appendChild(tr);
  });
}

/**
 * Muestra el texto del contrato con su huella.
 * @param {object} contrato Contrato elegido.
 */
async function verDocumento(contrato) {
  try {
    const doc = await solicitar('GET', `/api/contratos/${contrato.id_contrato}/documento`);
    document.getElementById('textoDocumento').textContent = doc.texto;
    document.getElementById('huellaDocumento').textContent = doc.huella_sha256;
    M.Modal.getInstance(document.getElementById('modalDocumento')).open();
  } catch (error) {
    avisar(error.message, true);
  }
}

document.getElementById('botonImprimir').addEventListener('click', () => window.print());

/**
 * Pinta el aviso de carga del lote que devuelve el servidor.
 * @param {object} estado Estado de carga del lote.
 */
function mostrarAvisoCarga(estado) {
  const aviso = document.getElementById('avisoGanado');
  aviso.replaceChildren();
  if (estado.nivel === 'NORMAL') {
    return;
  }
  const caja = crear('div', `tarjeta-lote nivel-${estado.nivel}`);
  caja.setAttribute('role', 'alert');
  caja.appendChild(crear('strong', '', estado.mensaje));
  caja.appendChild(crear('div', 'detalle', `Carga: ${estado.carga_actual} de ${estado.capacidad_carga} cabezas`));
  aviso.appendChild(caja);
}

/**
 * Abre el modal con el ganado de un contrato.
 * @param {object} contrato Contrato elegido.
 */
async function abrirGanado(contrato) {
  contratoGanadoActual = contrato;
  document.getElementById('tituloModalGanado').textContent =
    `Ganado del contrato ${String(contrato.id_contrato).padStart(4, '0')}`;
  const puedeEditar =
    usuario.rol === 'Arrendatario' &&
    contrato.id_arrendatario === usuario.id_usuario &&
    contrato.estado === 'Activo';
  document.getElementById('formGanado').style.display = puedeEditar ? 'block' : 'none';
  limpiarErrores(document.getElementById('formGanado'), 'mensajeGanado');
  document.getElementById('avisoGanado').replaceChildren();
  await recargarGanado(puedeEditar);
  M.updateTextFields();
  M.Modal.getInstance(document.getElementById('modalGanado')).open();
}

/**
 * Recarga la tabla de ganado del contrato abierto.
 * @param {boolean} puedeEditar Si se muestran los botones de borrar.
 */
async function recargarGanado(puedeEditar) {
  try {
    const hatos = await solicitar('GET', `/api/contratos/${contratoGanadoActual.id_contrato}/ganado`);
    const cuerpo = document.getElementById('filasGanado');
    cuerpo.replaceChildren();
    if (hatos.length === 0) {
      const fila = crear('tr');
      const celda = crear('td', 'vacio', 'Sin ganado registrado.');
      celda.colSpan = 4;
      fila.appendChild(celda);
      cuerpo.appendChild(fila);
    }
    hatos.forEach((h) => {
      const tr = crear('tr');
      tr.appendChild(crear('td', '', h.raza));
      tr.appendChild(crear('td', '', String(h.cantidad_cabezas)));
      tr.appendChild(crear('td', '', h.proposito));
      const celda = crear('td');
      if (puedeEditar) {
        const borrar = crear('button', 'btn-flat red-text', 'Quitar');
        borrar.addEventListener('click', () => quitarGanado(h, puedeEditar));
        celda.appendChild(borrar);
      }
      tr.appendChild(celda);
      cuerpo.appendChild(tr);
    });
  } catch (error) {
    avisar(error.message, true);
  }
}

/**
 * Elimina un hato y refresca las vistas afectadas.
 * @param {object} hato Hato a quitar.
 * @param {boolean} puedeEditar Para repintar la tabla igual.
 */
async function quitarGanado(hato, puedeEditar) {
  try {
    await solicitar('DELETE', `/api/ganado/${hato.id_ganado}`);
    await recargarGanado(puedeEditar);
    cargarContratos();
    cargarLotes();
  } catch (error) {
    avisar(error.message, true);
  }
}

document.getElementById('formGanado').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarErrores(evento.target, 'mensajeGanado');
  const cuerpo = {
    raza: document.getElementById('ganado_raza').value,
    cantidad_cabezas: numeroDe('ganado_cantidad_cabezas'),
    proposito: document.getElementById('ganado_proposito').value
  };
  try {
    const hato = await solicitar(
      'POST',
      `/api/contratos/${contratoGanadoActual.id_contrato}/ganado`,
      cuerpo
    );
    evento.target.reset();
    mostrarAvisoCarga(hato.estado_carga);
    await recargarGanado(true);
    cargarContratos();
    cargarLotes();
  } catch (error) {
    mostrarError(error, 'mensajeGanado', 'ganado_');
  }
});

/**
 * Abre el modal de contrato nuevo con la lista de lotes.
 */
function abrirModalContrato() {
  const selector = document.getElementById('contrato_id_lote');
  selector.replaceChildren();
  lotesCargados.forEach((lote) => {
    const opcion = crear('option', '', lote.nombre_lote);
    opcion.value = String(lote.id_lote);
    selector.appendChild(opcion);
  });
  limpiarErrores(document.getElementById('formContrato'), 'mensajeContrato');
  M.updateTextFields();
  M.Modal.getInstance(document.getElementById('modalContrato')).open();
}

document.getElementById('formContrato').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarErrores(evento.target, 'mensajeContrato');
  const cuerpo = {
    id_lote: Number(document.getElementById('contrato_id_lote').value),
    fecha_inicio: document.getElementById('contrato_fecha_inicio').value,
    meses_duracion: numeroDe('contrato_meses_duracion'),
    tarifa_por_cabeza: numeroDe('contrato_tarifa_por_cabeza')
  };
  try {
    await solicitar('POST', '/api/contratos', cuerpo);
    M.Modal.getInstance(document.getElementById('modalContrato')).close();
    avisar('Contrato creado');
    cargarContratos();
  } catch (error) {
    mostrarError(error, 'mensajeContrato', 'contrato_');
  }
});

/* ===================== Inicio ===================== */

/**
 * Ajusta la pantalla al rol y carga los datos iniciales.
 */
function iniciarPanel() {
  M.Modal.init(document.querySelectorAll('.modal'));
  document.getElementById('textoUsuario').textContent =
    `${sesion.usuario.nombre} ${sesion.usuario.apellidos} · ${usuario.rol}`;
  if (usuario.rol === 'Propietario') {
    document.getElementById('botonNuevoLote').style.display = 'inline-block';
  }
  if (usuario.rol === 'Arrendatario') {
    document.getElementById('botonNuevoContrato').style.display = 'inline-block';
  }
  if (usuario.rol === 'Tecnico') {
    document.getElementById('pestanaCostos').style.display = 'none';
  }
  document.getElementById('botonNuevoLote').addEventListener('click', () => abrirModalLote(null));
  document.getElementById('botonNuevoContrato').addEventListener('click', abrirModalContrato);
  document.getElementById('botonSalir').addEventListener('click', () => {
    guardarSesion(null);
    window.location.href = '/index.html';
  });
  cargarLotes();
  cargarContratos();
  cargarHistorial();
}

if (sesion) {
  registrarServiceWorker();
  vigilarConexion();
  iniciarPanel();
}
