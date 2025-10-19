"""Services package exports for easier imports in tests and code.

Exports a lightweight obs_client shim for test-time patching.
"""
from . import obs_client_stub as obs_client
