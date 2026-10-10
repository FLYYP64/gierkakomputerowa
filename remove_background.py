#!/usr/bin/env python3
"""Remove image backgrounds from every supported file in a folder."""

from pathlib import Path
import argparse

from PIL import Image


SUPPORTED = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_dir", type=Path, help="Folder containing source images")
    parser.add_argument("output_dir", type=Path, help="Folder for transparent PNG files")
    args = parser.parse_args()

    try:
        from rembg import remove
    except ImportError as exc:
        raise SystemExit("Install dependencies first: python -m pip install rembg pillow") from exc

    args.output_dir.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in args.input_dir.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED)
    if not files:
        raise SystemExit(f"No supported images found in {args.input_dir}")

    for source in files:
        with Image.open(source) as image:
            result = remove(image.convert("RGBA"))
            if not isinstance(result, Image.Image):
                result = Image.open(result)
            result = result.convert("RGBA")
            alpha = result.getchannel("A")
            bounds = alpha.getbbox()
            if bounds:
                result = result.crop(bounds)
            destination = args.output_dir / f"{source.stem}.png"
            result.save(destination, "PNG", optimize=True)
            print(f"{source.name} -> {destination}")


if __name__ == "__main__":
    main()
