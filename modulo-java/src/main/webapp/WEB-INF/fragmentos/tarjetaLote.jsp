<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" trimDirectiveWhitespaces="true"
         import="co.pastoreando.modelo.CargaLote" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ include file="/WEB-INF/fragmentos/utilidades.jspf" %>
<%-- Tarjeta de un lote. La pagina del tablero la invoca con jsp:include: el lote llega en el atributo
     cargaActual del request y la posicion en el parametro posicion de jsp:param. --%>
<%
    CargaLote carga = (CargaLote) request.getAttribute("cargaActual");
    String clase = claseEstado(carga.getEstado());
%>
<fmt:setLocale value="es_CO"/>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<c:set var="ancho"><fmt:formatNumber value="${cargaActual.porcentajeOcupacion gt 100 ? 100 : cargaActual.porcentajeOcupacion}" pattern="0" groupingUsed="false"/></c:set>
<article class="tarjeta lote">
    <h2>
        <span class="numero">#<c:out value="${param.posicion}"/></span> <c:out value="${cargaActual.lote.nombreLote}"/>
        <span class="etiqueta <%= clase %>"><c:out value="${cargaActual.estado.etiqueta}"/></span>
    </h2>
    <div class="detalle">
        Lote <c:out value="${cargaActual.lote.idLote}"/> |
        <c:out value="${cargaActual.lote.tipoPastura}"/> |
        <fmt:formatNumber value="${cargaActual.lote.hectareas}" minFractionDigits="2" maxFractionDigits="2"/> ha
    </div>
    <div class="barra-carga" title="Ocupacion del lote">
        <div class="<%= clase %>" style="width: ${ancho}%"></div>
    </div>
    <div>
        <strong><c:out value="${cargaActual.cabezasActuales}"/></strong> de
        <c:out value="${cargaActual.lote.capacidadCarga}"/> cabezas
        (<fmt:formatNumber value="${cargaActual.porcentajeOcupacion}" minFractionDigits="1" maxFractionDigits="1"/> %)
    </div>
    <div class="acciones">
        <a class="boton" href="${ctx}/lotes?accion=ver&amp;idLote=${cargaActual.lote.idLote}">Ver</a>
        <a class="boton boton-secundario" href="${ctx}/lotes?accion=editar&amp;idLote=${cargaActual.lote.idLote}">Editar</a>
    </div>
</article>
