<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" trimDirectiveWhitespaces="true"
         isErrorPage="true" session="true" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="tituloPagina" value="No se pudo completar la solicitud" scope="request"/>
<%@ include file="/WEB-INF/fragmentos/cabecera.jspf" %>

<h1>No se pudo completar la solicitud</h1>

<div class="tarjeta">
    <c:set var="codigo" value="${requestScope['jakarta.servlet.error.status_code']}"/>
    <c:set var="motivo" value="${requestScope['jakarta.servlet.error.message']}"/>
    <c:choose>
        <%-- isErrorPage="true" habilita el objeto implicito exception --%>
        <c:when test="${not empty pageContext.exception}">
            <p><c:out value="${pageContext.exception.message}"/></p>
        </c:when>
        <c:when test="${codigo eq 404}">
            <p>La pagina que busca no existe.</p>
        </c:when>
        <c:otherwise>
            <p><c:out value="${empty motivo ? 'La peticion no se pudo atender.' : motivo}"/></p>
        </c:otherwise>
    </c:choose>
    <c:if test="${not empty codigo}"><div class="ayuda">Codigo HTTP: <c:out value="${codigo}"/></div></c:if>
    <div class="acciones">
        <a class="boton" href="${ctx}/">Ir al inicio</a>
    </div>
</div>

<%@ include file="/WEB-INF/fragmentos/pie.jspf" %>
