package co.pastoreando.app.datos;

/** Respuestas de ejemplo con la forma de la API de Pastoreando, usadas por las pruebas. */
final class MuestrasJson {

    private MuestrasJson() {
    }

    static final String LOGIN = "{\"mensaje\":\"Autenticacion satisfactoria\",\"token\":\"abc.def.ghi\","
            + "\"tipo\":\"bearer\",\"usuario\":{\"id_usuario\":1,\"nombre\":\"Carlos\","
            + "\"apellidos\":\"Ramirez Soto\",\"cedula\":\"1010101010\",\"rol\":\"Propietario\","
            + "\"correo\":\"carlos.ramirez@pastoreando.co\"}}";

    static final String LOTES = "[{\"id_lote\":1,\"nombre_lote\":\"Potrero La Esperanza\",\"hectareas\":12.5,"
            + "\"capacidad_carga\":30,\"tipo_pastura\":\"Brachiaria\",\"estado_carga\":{\"carga_actual\":26,"
            + "\"capacidad_carga\":30,\"porcentaje\":86.7,\"nivel\":\"ALERTA\",\"mensaje\":\"Cerca del limite\","
            + "\"excedente\":0,\"sugerencias\":[\"Evitar nuevos ingresos\"]}},"
            + "{\"id_lote\":2,\"nombre_lote\":\"Lote Alto El Mirador\",\"hectareas\":8,"
            + "\"capacidad_carga\":20,\"tipo_pastura\":\"Kikuyo\",\"estado_carga\":{\"carga_actual\":24,"
            + "\"capacidad_carga\":20,\"porcentaje\":120.0,\"nivel\":\"SOBRECARGA\",\"mensaje\":\"Sobrecarga\","
            + "\"excedente\":4,\"sugerencias\":[\"Retirar 4 cabezas\",\"Rotar el hato\"]}}]";

    static final String COSTO = "{\"proposito\":\"Carne\",\"estrategia\":\"Sin recargo de manejo\",\"cantidad_animales\":50,\"id_calculo\":7,\"subtotal_lote\":12000000,\"costo_base_por_cabeza\":240000,"
            + "\"factor_manejo\":1.0,\"margen_por_cabeza\":48000,\"costo_unitario_final\":288000,"
            + "\"total_lote_final\":14400000,\"desglose\":["
            + "{\"rubro\":\"Alimentaci\u00f3n\",\"valor_lote\":6000000,\"valor_por_cabeza\":120000,\"porcentaje\":50},"
            + "{\"rubro\":\"Mantenimiento\",\"valor_lote\":3000000,\"valor_por_cabeza\":60000,\"porcentaje\":25},"
            + "{\"rubro\":\"Servicios\",\"valor_lote\":1500000,\"valor_por_cabeza\":30000,\"porcentaje\":12.5},"
            + "{\"rubro\":\"Impuestos\",\"valor_lote\":1500000,\"valor_por_cabeza\":30000,\"porcentaje\":12.5}]}";
}
