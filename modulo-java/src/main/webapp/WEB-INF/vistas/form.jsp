<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" trimDirectiveWhitespaces="true"
         session="true" errorPage="/WEB-INF/vistas/error.jsp" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="editando" value="${modo eq 'actualizar'}"/>
<c:set var="tituloPagina" value="${editando ? 'Editar lote' : 'Registrar lote'}" scope="request"/>
<%@ include file="/WEB-INF/fragmentos/cabecera.jspf" %>

<h1><c:out value="${tituloPagina}"/></h1>

<%-- POST: el formulario cambia datos, por eso no usa GET. El atributo novalidate deja que el
     servidor valide y muestre sus propios mensajes. --%>
<form class="tarjeta" method="post" action="${ctx}/lotes" novalidate>
    <input type="hidden" name="accion" value="${modo}">
    <c:if test="${editando}">
        <input type="hidden" name="idLote" value="<c:out value="${datos.idLote}"/>">
    </c:if>

    <c:if test="${not empty error}">
        <div class="mensaje mensaje-error">
            No se guardo el lote.
            <c:if test="${campoError eq 'idLote'}"><c:out value="${error}"/></c:if>
            <c:if test="${campoError ne 'idLote'}">Corrija el campo marcado.</c:if>
        </div>
    </c:if>

    <div class="campo">
        <label for="nombreLote">Nombre del lote</label>
        <input type="text" id="nombreLote" name="nombreLote" maxlength="60"
               value="<c:out value="${datos.nombreLote}"/>" class="${campoError eq 'nombreLote' ? 'invalido' : ''}">
        <c:if test="${campoError eq 'nombreLote'}"><div class="error-campo"><c:out value="${error}"/></div></c:if>
    </div>

    <div class="campo">
        <label for="hectareas">Hectareas</label>
        <input type="text" id="hectareas" name="hectareas" inputmode="decimal"
               value="<c:out value="${datos.hectareas}"/>" class="${campoError eq 'hectareas' ? 'invalido' : ''}">
        <c:if test="${campoError eq 'hectareas'}"><div class="error-campo"><c:out value="${error}"/></div></c:if>
        <div class="ayuda">Mayor que cero, con maximo dos decimales.</div>
    </div>

    <div class="campo">
        <label for="capacidadCarga">Capacidad de carga (cabezas)</label>
        <input type="text" id="capacidadCarga" name="capacidadCarga" inputmode="numeric"
               value="<c:out value="${datos.capacidadCarga}"/>" class="${campoError eq 'capacidadCarga' ? 'invalido' : ''}">
        <c:if test="${campoError eq 'capacidadCarga'}"><div class="error-campo"><c:out value="${error}"/></div></c:if>
        <div class="ayuda">Numero entero de cabezas que el lote soporta.</div>
    </div>

    <div class="campo">
        <label for="tipoPastura">Tipo de pastura</label>
        <input type="text" id="tipoPastura" name="tipoPastura" list="pasturas" maxlength="60"
               value="<c:out value="${datos.tipoPastura}"/>" class="${campoError eq 'tipoPastura' ? 'invalido' : ''}">
        <datalist id="pasturas">
            <option value="Kikuyo">
            <option value="Brachiaria">
            <option value="Estrella Africana">
            <option value="Pasto Elefante">
        </datalist>
        <c:if test="${campoError eq 'tipoPastura'}"><div class="error-campo"><c:out value="${error}"/></div></c:if>
    </div>

    <div class="acciones">
        <button type="submit" class="boton">${editando ? 'Guardar cambios' : 'Registrar lote'}</button>
        <a class="boton boton-secundario" href="${ctx}/lotes">Cancelar</a>
    </div>
</form>

<%@ include file="/WEB-INF/fragmentos/pie.jspf" %>
