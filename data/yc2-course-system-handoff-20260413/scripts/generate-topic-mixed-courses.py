#!/usr/bin/env python3
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "generate-courses.py"


def main() -> None:
    runpy.run_path(str(SCRIPT), run_name="__main__")


if __name__ == "__main__":
    main()

