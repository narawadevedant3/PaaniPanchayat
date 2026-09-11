import sys
import os
from pathlib import Path

# Ensure src/backend is on sys.path for Vercel Serverless Function imports
_root_dir = Path(__file__).resolve().parent.parent
_backend_dir = _root_dir / "src" / "backend"
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from app.main import app
