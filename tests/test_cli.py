"""Pruebas de la version de consola (standalone)."""

from app.cli import menu
from app.domain.usuario import ACTOR_CONSOLA
from app.services.lote_servicio import LoteServicio


def _simular_entradas(monkeypatch, respuestas: list[str]) -> None:
    iterador = iter(respuestas)
    monkeypatch.setattr("builtins.input", lambda _="": next(iterador))


def test_consola_registra_lote(cliente, monkeypatch, capsys):
    """CP-X01 | CLI | Registrar un lote desde la consola | Mensaje de exito y el lote aparece"""
    _simular_entradas(monkeypatch, ["1", "Lote Consola", "7,5", "14", "Kikuyo"])
    menu.registrar_lote()
    assert "Lote registrado" in capsys.readouterr().out
    nombres = [lote["nombre_lote"] for lote in LoteServicio().listar()]
    assert "Lote Consola" in nombres


def test_consola_muestra_error_de_validacion(cliente, monkeypatch, capsys):
    """CP-X02 | CLI | Menu: registrar lote con hectareas 'abc' | Imprime el error y no se cierra"""
    _simular_entradas(monkeypatch, ["2", "1", "Lote Malo", "abc", "10", "Kikuyo", "0"])
    menu.main()
    salida = capsys.readouterr().out
    assert "Error (hectareas)" in salida
    assert "Hasta pronto" in salida


def test_consola_calcula_costo(cliente, monkeypatch, capsys):
    """CP-X03 | CLI | Calcular costo desde consola | Imprime $288.000"""
    _simular_entradas(
        monkeypatch, ["6000000", "3000000", "1500000", "1500000", "50", "Carne"]
    )
    menu.calcular_costo()
    assert "$288.000" in capsys.readouterr().out


def test_consola_actua_como_administrador(cliente):
    """CP-X04 | CLI | La consola elimina un lote sin sesion | Permitido (actor Consola)"""
    lote = LoteServicio().crear(
        ACTOR_CONSOLA,
        {
            "id_propietario": 1,
            "nombre_lote": "Temporal",
            "hectareas": 2,
            "capacidad_carga": 4,
            "tipo_pastura": "Kikuyo",
        },
    )
    LoteServicio().eliminar(ACTOR_CONSOLA, lote["id_lote"])
