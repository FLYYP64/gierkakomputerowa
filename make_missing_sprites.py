"""Create transparent fallback sprites for pickups and the missing worker art."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


OUT = Path(__file__).parent / "assets"
OUT.mkdir(exist_ok=True)


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def worker() -> None:
    im = Image.new("RGBA", (120, 170), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((34, 52, 87, 116), radius=8, fill="#527151", outline="#273d32", width=4)
    d.ellipse((39, 20, 82, 64), fill="#ddb08a", outline="#5b453a", width=3)
    d.rectangle((37, 21, 84, 32), fill="#51453b")
    d.line((43, 112, 40, 157), fill="#273942", width=13); d.line((76, 112, 80, 157), fill="#273942", width=13)
    d.line((36, 66, 19, 86), fill="#ddb08a", width=10); d.line((84, 66, 101, 86), fill="#ddb08a", width=10)
    d.line((12, 18, 108, 18), fill="#68573f", width=6); d.rectangle((15, 22, 106, 65), fill="#f4e9cc", outline="#68573f", width=3)
    f = font(13); d.text((60, 31), "CHLEBA!", font=f, fill="#bd3435", anchor="mm")
    d.text((60, 49), "I WOLNOŚCI", font=font(9), fill="#bd3435", anchor="mm")
    im.save(OUT / "robotnik.png", optimize=True)


def orange() -> None:
    im = Image.new("RGBA", (96, 96), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse((17, 17, 79, 80), fill="#f28a2e", outline="#c45a20", width=4)
    d.ellipse((25, 27, 41, 43), fill="#ffbd62")
    d.ellipse((47, 7, 68, 20), fill="#62934b"); d.line((48, 18, 48, 28), fill="#526f36", width=5)
    im.save(OUT / "pomarancza.png", optimize=True)


def dollar() -> None:
    im = Image.new("RGBA", (80, 96), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((12, 6, 68, 90), radius=7, fill="#e9d59c", outline="#a98a4f", width=4)
    d.rounded_rectangle((18, 12, 62, 84), radius=5, outline="#c4a85f", width=2)
    d.text((40, 49), "$", font=font(50), fill="#328051", anchor="mm")
    im.save(OUT / "dolar.png", optimize=True)


def sausage() -> None:
    im = Image.new("RGBA", (104, 72), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((10, 21, 94, 53), radius=16, fill="#b65f43", outline="#713b31", width=4)
    d.ellipse((4, 27, 20, 47), fill="#d98a60", outline="#713b31", width=3)
    d.ellipse((84, 27, 100, 47), fill="#d98a60", outline="#713b31", width=3)
    d.arc((28, 25, 78, 49), 190, 340, fill="#e5a076", width=3)
    im.save(OUT / "kielbasa.png", optimize=True)


if __name__ == "__main__":
    worker(); orange(); dollar(); sausage()
