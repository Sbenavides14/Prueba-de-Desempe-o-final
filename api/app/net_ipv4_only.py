"""Fuerzo mis llamadas HTTP a resolver solo direcciones IPv4, por la misma razón que en Airflow."""
import socket

_original_getaddrinfo = socket.getaddrinfo


def _ipv4_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    results = _original_getaddrinfo(host, port, family, type, proto, flags)
    return [r for r in results if r[0] == socket.AF_INET] or results


def enforce_ipv4_only() -> None:
    socket.getaddrinfo = _ipv4_only_getaddrinfo
