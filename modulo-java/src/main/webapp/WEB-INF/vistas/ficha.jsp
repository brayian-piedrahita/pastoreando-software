<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" trimDirectiveWhitespaces="true"
         import="co.pastoreando.modelo.CargaLote" session="true" errorPage="/WEB-INF/vistas/error.jsp" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<c:set var="tituloPagina" value="Lote ${carga.lote.idLote}" scope="request"/>
<%@ include file="/WEB-INF/fragmentos/cabecera.jspf" %>
<fmt:setLocale value="es_CO"/>
<%-- Expresion y declaracion: la clase de color la calcula claseEstado(), definida en utilidades.jspf. --%>
<% String clase = claseEstado(((CargaLote) request.getAttribute("carga")).getEstado()); %>
<c:set var="porcentaje" value="${carga.porcentajeOcupacion}"/>
<c:set var="ancho"><fmt:formatNumber value="${porcentaje gt 100 ? 100 : porcentaje}" pattern="0" groupingUsed="false"/></c:set>

<h1>Monitoreo de <c:out value="${carga.lote.nombreLote}"/></h1>

<c:if test="${not empty mensaje}">
    <div class="mensaje mensaje-${mensaje.tipo}"><c:out value="${mensaje.texto}"/></div>
</c:if>

<%-- Pantalla de confirmacion: el borrado real solo ocurre con el POST de este formulario. --%>
<c:if test="${confirmarEliminacion}">
    <div class="tarjeta confirmacion" style="margin-bottom: 1rem;">
        <strong>Confirme la eliminacion del lote <c:out value="${carga.lote.nombreLote}"/>.</strong>
        Esta accion no se puede deshacer.
        <div class="acciones">
            <form method="post" action="${ctx}/lotes">
                <input type="hidden" name="accion" value="eliminar">
                <input type="hidden" name="idLote" value="${carga.lote.idLote}">
                <button type="submit" class="boton boton-peligro">Si, eliminar</button>
            </form>
            <a class="boton boton-secundario" href="${ctx}/lotes?accion=ver&amp;idLote=${carga.lote.idLote}">Cancelar</a>
        </div>
    </div>
</c:if>

<section class="tarjeta ficha">
    <div class="indicador <%= clase %>" style="--p: ${ancho}">
        <div>
            <strong><fmt:formatNumber value="${porcentaje}" minFractionDigits="1" maxFractionDigits="1"/> %</strong>
            <span>ocupacion</span>
        </div>
    </div>
    <table class="datos">
        <tr><th>Identificador</th><td><c:out value="${carga.lote.idLote}"/></td></tr>
        <tr><th>Tipo de pastura</th><td><c:out value="${carga.lote.tipoPastura}"/></td></tr>
        <tr><th>Area</th><td><fmt:formatNumber value="${carga.lote.hectareas}" minFractionDigits="2" maxFractionDigits="2"/> ha</td></tr>
        <tr><th>Capacidad de carga</th><td><c:out value="${carga.lote.capacidadCarga}"/> cabezas</td></tr>
        <tr><th>Ganado actual</th><td><c:out value="${carga.cabezasActuales}"/> cabezas (contratos activos)</td></tr>
        <tr><th>Estado</th><td><span class="etiqueta <%= clase %>"><c:out value="${carga.estado.etiqueta}"/></span></td></tr>
    </table>
</section>

<div class="alerta-ambiental <%= clase %>">
    <div><c:out value="${carga.estado.mensaje}"/></div>
    <div>
        <c:choose>
            <c:when test="${carga.estado eq 'SOBRECARGA'}">Exceso: <c:out value="${carga.cabezasExcedentes}"/> cabezas por encima de la capacidad.</c:when>
            <c:otherwise>Cupo disponible: <c:out value="${carga.cupoDisponible}"/> cabezas.</c:otherwise>
        </c:choose>
    </div>
</div>

<div class="acciones">
    <a class="boton boton-secundario" href="${ctx}/lotes">Volver a mis lotes</a>
    <a class="boton" href="${ctx}/lotes?accion=editar&amp;idLote=${carga.lote.idLote}">Editar</a>
    <c:if test="${not confirmarEliminacion}">
        <a class="boton boton-peligro" href="${ctx}/lotes?accion=eliminar&amp;idLote=${carga.lote.idLote}">Eliminar</a>
    </c:if>
</div>

<%@ include file="/WEB-INF/fragmentos/pie.jspf" %>
