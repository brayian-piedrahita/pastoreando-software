package co.pastoreando.app.datos;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import co.pastoreando.app.modelo.EntradaCosto;
import co.pastoreando.app.modelo.EstadoCarga;
import co.pastoreando.app.modelo.Lote;
import co.pastoreando.app.modelo.NivelCarga;
import co.pastoreando.app.modelo.ResultadoCosto;
import co.pastoreando.app.modelo.RubroCosto;
import co.pastoreando.app.modelo.SesionIniciada;
import co.pastoreando.app.modelo.Usuario;

/**
 * Traduce entre el JSON de la API y los objetos del modelo (Gson). Concentra en un solo lugar
 * los nombres de los campos del servidor; si la API cambia, solo se toca esta clase.
 */
public final class ConversorJson {

    private ConversorJson() {
    }

    // ------------------------------------------------------------ cuerpos que envia la app

    public static String cuerpoLogin(String correo, String clave) {
        JsonObject cuerpo = new JsonObject();
        cuerpo.addProperty("correo", correo == null ? "" : correo.trim());
        cuerpo.addProperty("contrasena", clave == null ? "" : clave);
        return cuerpo.toString();
    }

    public static String cuerpoCosto(EntradaCosto entrada) {
        JsonObject cuerpo = new JsonObject();
        cuerpo.addProperty("alimentacion", entrada.getAlimentacion());
        cuerpo.addProperty("mantenimiento", entrada.getMantenimiento());
        cuerpo.addProperty("servicios", entrada.getServicios());
        cuerpo.addProperty("impuestos", entrada.getImpuestos());
        cuerpo.addProperty("cantidad_animales", entrada.getCantidadAnimales());
        cuerpo.addProperty("proposito", entrada.getProposito());
        return cuerpo.toString();
    }

    // ------------------------------------------------------------ respuestas del servidor

    /** Respuesta de POST /auth/login. */
    public static SesionIniciada sesion(String json) throws ErrorApi {
        try {
            JsonObject raiz = objeto(json);
            String token = texto(raiz, "", "token");
            if (token.isEmpty()) {
                throw new IllegalStateException("La respuesta no trae token");
            }
            JsonObject u = raiz.has("usuario") && raiz.get("usuario").isJsonObject()
                    ? raiz.getAsJsonObject("usuario")
                    : new JsonObject();
            Usuario usuario = new Usuario(
                    entero(u, 0, "id_usuario"),
                    texto(u, "", "nombre"),
                    texto(u, "", "apellidos"),
                    texto(u, "", "correo"),
                    texto(u, "", "rol"));
            return new SesionIniciada(token, usuario);
        } catch (RuntimeException e) {
            throw ErrorApi.respuestaInvalida(e);
        }
    }

    /** Respuesta de GET /lotes: una lista de lotes, cada uno con su estado_carga. */
    public static List<Lote> lotes(String json) throws ErrorApi {
        try {
            JsonElement raiz = JsonParser.parseString(json);
            JsonArray arreglo;
            if (raiz.isJsonArray()) {
                arreglo = raiz.getAsJsonArray();
            } else if (raiz.isJsonObject() && raiz.getAsJsonObject().has("lotes")) {
                arreglo = raiz.getAsJsonObject().getAsJsonArray("lotes");
            } else {
                throw new IllegalStateException("La respuesta no es una lista de lotes");
            }
            List<Lote> lotes = new ArrayList<>();
            for (JsonElement elemento : arreglo) {
                lotes.add(lote(elemento.getAsJsonObject()));
            }
            return lotes;
        } catch (RuntimeException e) {
            throw ErrorApi.respuestaInvalida(e);
        }
    }

    /** Respuesta de POST /costos/calcular. */
    public static ResultadoCosto costo(String json) throws ErrorApi {
        try {
            JsonObject raiz = objeto(json);
            List<RubroCosto> desglose = new ArrayList<>();
            JsonElement bruto = raiz.get("desglose");
            if (bruto != null && bruto.isJsonArray()) {
                for (JsonElement fila : bruto.getAsJsonArray()) {
                    JsonObject o = fila.getAsJsonObject();
                    desglose.add(new RubroCosto(
                            texto(o, "", "rubro", "nombre"),
                            numero(o, 0, "valor_lote"),
                            numero(o, 0, "valor_por_cabeza"),
                            numero(o, 0, "porcentaje")));
                }
            } else if (bruto != null && bruto.isJsonObject()) {
                for (Map.Entry<String, JsonElement> entrada : bruto.getAsJsonObject().entrySet()) {
                    JsonObject o = entrada.getValue().getAsJsonObject();
                    desglose.add(new RubroCosto(
                            entrada.getKey(),
                            numero(o, 0, "valor_lote"),
                            numero(o, 0, "valor_por_cabeza"),
                            numero(o, 0, "porcentaje")));
                }
            }
            return new ResultadoCosto(
                    numero(raiz, 0, "subtotal_lote"),
                    numero(raiz, 0, "costo_base_por_cabeza"),
                    numero(raiz, 1, "factor_manejo"),
                    numero(raiz, 0, "margen_por_cabeza"),
                    numero(raiz, 0, "costo_unitario_final"),
                    numero(raiz, 0, "total_lote_final"),
                    desglose,
                    false);
        } catch (RuntimeException e) {
            throw ErrorApi.respuestaInvalida(e);
        }
    }

    // ------------------------------------------------------------ piezas

    private static Lote lote(JsonObject o) {
        EstadoCarga estado = null;
        if (o.has("estado_carga") && o.get("estado_carga").isJsonObject()) {
            JsonObject e = o.getAsJsonObject("estado_carga");
            int capacidad = entero(e, entero(o, 0, "capacidad_carga"), "capacidad_carga");
            int carga = entero(e, 0, "carga_actual");
            double porcentaje = numero(e, capacidad > 0 ? carga * 100.0 / capacidad : 0, "porcentaje");
            estado = new EstadoCarga(
                    carga,
                    capacidad,
                    porcentaje,
                    NivelCarga.desdeTexto(texto(e, "", "nivel"), porcentaje),
                    texto(e, "", "mensaje"),
                    entero(e, 0, "excedente"),
                    unir(e.get("sugerencias")));
        }
        return new Lote(
                entero(o, 0, "id_lote"),
                texto(o, "", "nombre_lote"),
                numero(o, 0, "hectareas"),
                entero(o, 0, "capacidad_carga"),
                texto(o, "", "tipo_pastura"),
                estado);
    }

    private static JsonObject objeto(String json) {
        JsonElement raiz = JsonParser.parseString(json);
        if (!raiz.isJsonObject()) {
            throw new IllegalStateException("Se esperaba un objeto JSON");
        }
        return raiz.getAsJsonObject();
    }

    /** Las sugerencias pueden llegar como texto o como lista de textos. */
    private static String unir(JsonElement elemento) {
        if (elemento == null || elemento.isJsonNull()) {
            return "";
        }
        if (elemento.isJsonArray()) {
            StringBuilder texto = new StringBuilder();
            for (JsonElement parte : elemento.getAsJsonArray()) {
                if (texto.length() > 0) {
                    texto.append('\n');
                }
                texto.append(parte.getAsString());
            }
            return texto.toString();
        }
        return elemento.getAsString();
    }

    private static JsonElement buscar(JsonObject o, String... claves) {
        for (String clave : claves) {
            JsonElement valor = o.get(clave);
            if (valor != null && !valor.isJsonNull()) {
                return valor;
            }
        }
        return null;
    }

    private static String texto(JsonObject o, String defecto, String... claves) {
        JsonElement valor = buscar(o, claves);
        return valor == null ? defecto : valor.getAsString();
    }

    private static int entero(JsonObject o, int defecto, String... claves) {
        JsonElement valor = buscar(o, claves);
        return valor == null ? defecto : (int) Math.round(valor.getAsDouble());
    }

    private static double numero(JsonObject o, double defecto, String... claves) {
        JsonElement valor = buscar(o, claves);
        return valor == null ? defecto : valor.getAsDouble();
    }
}
