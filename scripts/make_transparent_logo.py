"""Create transparent-background versions of the original AUTRAXIS logo assets.
Artwork is preserved pixel-for-pixel; only the white background is removed."""
from PIL import Image

def dewhite(src, dst):
    im = Image.open(src).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            m = min(r, g, b)
            if m >= 246:
                px[x, y] = (r, g, b, 0)
            elif m >= 234:  # soft edge ramp to avoid halos
                alpha = round(255 * (246 - m) / 12)
                px[x, y] = (r, g, b, min(a, alpha))
    im.save(dst, "PNG")
    print("written", dst, im.size)

dewhite("/app/frontend/public/brand/icon.png", "/app/frontend/public/brand/icon-transparent.png")
dewhite("/app/frontend/public/brand/logo-full.webp", "/app/frontend/public/brand/logo-full-transparent.png")
