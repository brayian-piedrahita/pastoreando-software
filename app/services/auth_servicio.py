"""Registro, inicio de sesion y consulta del usuario autenticado."""

import hmac

from app import config
from app.domain.errores import AccesoDenegadoError, CredencialesError
from app.domain.usuario import validar_nuevo_usuario
from app.domain.validaciones import MAXIMO_BYTES_CONTRASENA, validar_correo
from app.infrastructure import seguridad
from app.infrastructure.repositorio_usuarios import RepositorioUsuarios


class AuthServicio:
    """Registra usuarios, los autentica y entrega el token de sesion."""

    def __init__(self, repo: RepositorioUsuarios | None = None) -> None:
        self.repo = repo or RepositorioUsuarios()

    def registrar(
        self,
        nombre: object,
        apellidos: object,
        cedula: object,
        rol: object,
        correo: object,
        contrasena: object,
        codigo_profesional: object = None,
    ) -> dict:
        """Crea un usuario nuevo y devuelve sus datos sin la contraseña.

        1. El dominio valida cada dato (formato, longitud, caracteres).
        2. Si el rol es profesional (Tecnico o Contador) se exige el codigo de
           invitacion; sin el, cualquiera podria darse un rol con acceso amplio.
        3. La contraseña se guarda solo como hash bcrypt.
        4. La cedula y el correo repetidos los rechaza el repositorio (409).
        """
        nuevo = validar_nuevo_usuario(
            nombre, apellidos, cedula, rol, correo, contrasena
        )
        if nuevo.es_profesional:
            # compare_digest evita adivinar el codigo midiendo tiempos de respuesta.
            enviado = codigo_profesional if isinstance(codigo_profesional, str) else ""
            if not hmac.compare_digest(
                enviado.encode("utf-8"), config.CODIGO_PROFESIONAL.encode("utf-8")
            ):
                raise AccesoDenegadoError(
                    "Este rol requiere un código de profesional válido",
                    "codigo_profesional",
                )
        id_usuario = self.repo.crear(
            nuevo.nombre,
            nuevo.apellidos,
            nuevo.cedula,
            nuevo.rol,
            nuevo.correo,
            seguridad.generar_hash(nuevo.contrasena),
        )
        return self.repo.obtener(id_usuario)

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
