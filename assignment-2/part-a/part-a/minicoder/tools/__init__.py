"""Importing these modules is what registers the tools."""

from . import files, search, shell  # noqa: F401
from .base import registry

__all__ = ["registry", "files", "search", "shell"]
