"""Entrega de la aplicacion React compilada desde el mismo servidor de la API.

React Router resuelve rutas como /contratos/3 en el navegador; si el usuario
recarga la pagina o abre el enlace, el servidor no tiene un archivo con ese
nombre. Para que la aplicacion arranque igual, las rutas sin archivo devuelven
index.html. Las rutas de la API y los archivos con extension que no existen
siguen respondiendo 404.
"""

from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles


class ArchivosAplicacion(StaticFiles):
    """StaticFiles que devuelve index.html para las rutas propias de la SPA."""

    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except HTTPException as error:
            if error.status_code != 404 or self._es_ruta_de_servidor(path):
                raise
            return await super().get_response("index.html", scope)

    @staticmethod
    def _es_ruta_de_servidor(path: str) -> bool:
        ultimo = path.rsplit("/", 1)[-1]
        return path.startswith("api/") or "." in ultimo
