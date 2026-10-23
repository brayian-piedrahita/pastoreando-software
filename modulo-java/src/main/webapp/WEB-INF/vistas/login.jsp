<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" trimDirectiveWhitespaces="true"
         session="true" errorPage="/WEB-INF/vistas/error.jsp" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="tituloPagina" value="Ingreso" scope="request"/>
<%@ include file="/WEB-INF/fragmentos/cabecera.jspf" %>

<h1>Ingreso del propietario</h1>

<c:if test="${param.cerrada eq '1'}">
    <div class="mensaje mensaje-aviso">La sesion se cerro correctamente.</div>
</c:if>

<%-- POST: el identificador viaja en el cuerpo de la peticion, no en la URL. --%>
<form class="tarjeta" method="post" action="${ctx}/sesion" novalidate>
    <c:if test="${not empty error}">
        <div class="mensaje mensaje-error"><c:out value="${error}"/></div>
    </c:if>
    <div class="campo">
        <label for="idPropietario">Identificador del propietario</label>
        <input type="text" id="idPropietario" name="idPropietario" inputmode="numeric" autofocus
               value="<c:out value="${idEscrito}"/>" class="${not empty error ? 'invalido' : ''}">
        <div class="ayuda">Datos de prueba: 1 (Carlos Ramirez) y 6 (Marta Londono).</div>
    </div>
    <div class="acciones">
        <button type="submit" class="boton">Ingresar</button>
    </div>
</form>

<%@ include file="/WEB-INF/fragmentos/pie.jspf" %>
