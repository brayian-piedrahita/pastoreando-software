<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" trimDirectiveWhitespaces="true"
         import="java.util.List, co.pastoreando.modelo.CargaLote"
         session="true" errorPage="/WEB-INF/vistas/error.jsp" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="tituloPagina" value="Mis lotes" scope="request"/>
<%@ include file="/WEB-INF/fragmentos/cabecera.jspf" %>
<%-- Scriptlet: suma las cabezas de los lotes que se muestran tras aplicar el filtro. --%>
<%
    @SuppressWarnings("unchecked")
    List<CargaLote> mostrados = (List<CargaLote>) request.getAttribute("lotes");
    int cabezasMostradas = 0;
    for (CargaLote lote : mostrados) {
        cabezasMostradas += lote.getCabezasActuales();
    }
%>

<h1>Mis lotes</h1>

<c:if test="${not empty mensaje}">
    <div class="mensaje mensaje-${mensaje.tipo}"><c:out value="${mensaje.texto}"/></div>
</c:if>

<section class="resumen">
    <div class="tarjeta dato"><strong>${totalLotes}</strong><span>Lotes registrados</span></div>
    <div class="tarjeta dato normal"><strong>${totalNormal}</strong><span>Normales</span></div>
    <div class="tarjeta dato alerta"><strong>${totalAlerta}</strong><span>En alerta</span></div>
    <div class="tarjeta dato sobrecarga"><strong>${totalSobrecarga}</strong><span>En sobrecarga</span></div>
</section>

<%-- GET: consulta que no modifica datos; los criterios quedan en la URL y se pueden compartir. --%>
<form class="tarjeta filtros" method="get" action="${ctx}/lotes">
    <input type="hidden" name="accion" value="listar">
    <div>
        <label for="q">Buscar por nombre o pastura</label>
        <input type="text" id="q" name="q" value="<c:out value="${filtroTexto}"/>">
    </div>
    <div>
        <label for="estado">Estado de carga</label>
        <select id="estado" name="estado">
            <option value="TODOS" ${filtroEstado eq 'TODOS' ? 'selected' : ''}>Todos</option>
            <option value="NORMAL" ${filtroEstado eq 'NORMAL' ? 'selected' : ''}>Normal</option>
            <option value="ALERTA" ${filtroEstado eq 'ALERTA' ? 'selected' : ''}>Alerta</option>
            <option value="SOBRECARGA" ${filtroEstado eq 'SOBRECARGA' ? 'selected' : ''}>Sobrecarga</option>
        </select>
    </div>
    <div class="acciones">
        <button type="submit" class="boton">Filtrar</button>
        <a class="boton boton-secundario" href="${ctx}/lotes">Limpiar</a>
    </div>
</form>

<p>Se muestran <%= mostrados.size() %> de ${totalLotes} lotes, con <%= cabezasMostradas %> cabezas en contratos activos.</p>

<c:choose>
    <c:when test="${empty lotes}">
        <div class="tarjeta vacio">Ningun lote coincide con los criterios indicados.</div>
    </c:when>
    <c:otherwise>
        <section class="lista-lotes">
            <c:forEach items="${lotes}" var="carga" varStatus="fila">
                <c:set var="cargaActual" value="${carga}" scope="request"/>
                <jsp:include page="/WEB-INF/fragmentos/tarjetaLote.jsp">
                    <jsp:param name="posicion" value="${fila.count}"/>
                </jsp:include>
            </c:forEach>
        </section>
    </c:otherwise>
</c:choose>

<div class="acciones">
    <a class="boton" href="${ctx}/lotes?accion=nuevo">Registrar lote</a>
</div>

<%@ include file="/WEB-INF/fragmentos/pie.jspf" %>
