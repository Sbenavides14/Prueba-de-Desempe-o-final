"""Fuerzo mis llamadas HTTP a resolver solo direcciones IPv4.

Hago esto a nivel de código (no solo de configuración del sistema) porque
deshabilitar IPv6 en el kernel no impide que Python intente resolver un
registro AAAA y falle al conectarse. Esto es portable: funciona igual en
cualquier máquina, sin depender de cómo esté configurada la red del host.
"""
import socket

_original_getaddrinfo = socket.getaddrinfo


def _ipv4_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    results = _original_getaddrinfo(host, port, family, type, proto, flags)
    return [r for r in results if r[0] == socket.AF_INET] or results


def enforce_ipv4_only() -> None:
    socket.getaddrinfo = _ipv4_only_getaddrinfo
