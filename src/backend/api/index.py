import sys
from pathlib import Path

# Ensure the root directory of the backend repository is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Import app for standalone backend repo (Vercel) & fallback for monorepo linter
try:
    from app.main import app  # type: ignore
except ImportError:
    from backend.app.main import app  # type: ignore

__all__ = ["app"]
