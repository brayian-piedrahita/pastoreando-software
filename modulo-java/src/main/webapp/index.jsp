<%@ page contentType="text/html;charset=UTF-8" pageEncoding="UTF-8" session="true" %>
<%-- Punto de entrada de la aplicacion: envia a quien ya se identifico al tablero y a los demas al ingreso. --%>
<% if (session.getAttribute("idPropietario") != null) { %>
    <jsp:forward page="/lotes"/>
<% } else { %>
    <jsp:forward page="/sesion"/>
<% } %>
