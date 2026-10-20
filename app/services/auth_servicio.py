"""Inicio de sesion y consulta del usuario autenticado."""

from app.domain.errores import CredencialesError
from app.domain.validaciones import validar_correo
from app.infrastructure import seguridad
from app.infrastructure.repositorio_usuarios import RepositorioUsuarios

# bcrypt solo procesa los primeros 72 bytes; mas largo se rechaza de entrada.
MAXIMO_BYTES_CONTRASENA = 72


class AuthServicio:
    """Autentica usuarios y entrega el token de sesion."""

    def __init__(self, repo: RepositorioUsuarios | None = None) -> None:
        self.repo = repo or RepositorioUsuarios()

    def iniciar_sesion(self, correo: str, contrasena: str) -> dict:
        """Valida las credenciales y devuelve el token con los datos del usuario."""
        correo = validar_correo(correo)
        if not contrasena or len(contrasena.encode("utf-8")) > MAXIMO_BYTES_CONTRASENA:
            raise CredencialesError("Correo o contraseña incorrectos")
        usuario = self.repo.buscar_credenciales(correo)
        # Mismo mensaje para correo inexistente y contrasena mala: no revela cual fallo.
        if usuario is None or not seguridad.verificar_contrasena(
            contrasena, usuario["contrasena"]
        ):
            raise CredencialesError("Correo o contraseña incorrectos")
        nombre = f"{usuario['nombre']} {usuario['apellidos']}"
        token = seguridad.crear_token(usuario["id_usuario"], usuario["rol"], nombre)
        usuario.pop("contrasena")
        return {"token": token, "tipo": "bearer", "usuario": usuario}

    def usuario_desde_token(self, token: str) -> dict:
        """Devuelve el usuario del token, confirmando que aun existe."""
        datos = seguridad.leer_token(token)
        usuario = self.repo.obtener(int(datos["sub"]))
        if usuario is None:
            raise CredencialesError("El usuario de la sesión ya no existe")
        return usuario
