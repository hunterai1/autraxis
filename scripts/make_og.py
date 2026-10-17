"""Generate the AUTRAXIS social share card (og-image.png, 1200x630)."""
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
NAVY = (3, 7, 18)
CYAN = (6, 182, 212)
SKY = (56, 189, 248)
BLUE = (37, 99, 235)
WHITE = (248, 250, 252)
MIST = (148, 163, 184)

img = Image.new("RGB", (W, H), NAVY)
d = ImageDraw.Draw(img, "RGBA")

# grid
for x in range(0, W, 56):
    d.line([(x, 0), (x, H)], fill=(56, 189, 248, 14), width=1)
for y in range(0, H, 56):
    d.line([(0, y), (W, y)], fill=(56, 189, 248, 14), width=1)

# glow blobs
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([W - 500, -220, W + 120, 400], fill=(37, 99, 235, 46))
gd.ellipse([-240, H - 320, 300, H + 160], fill=(6, 182, 212, 30))
glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(120))
img.paste(glow, (0, 0), glow)

# logo mark: ring with bottom gap + gradient arch + dot
cx, cy, r = 265, 285, 150
d.arc([cx - r, cy - r, cx + r, cy + r], start=125, end=415, fill=(226, 232, 240, 110), width=11)

arch_rx, arch_ry, arch_cy = 108, 128, 420
for ang in range(180, 361):
    a1 = math.radians(ang)
    a2 = math.radians(ang + 2)
    x1, y1 = cx + arch_rx * math.cos(a1), arch_cy - arch_ry * math.sin(a1)
    x2, y2 = cx + arch_rx * math.cos(a2), arch_cy - arch_ry * math.sin(a2)
    t = (y1 - (arch_cy - arch_ry)) / arch_ry  # 0 at apex, 1 at feet
    col = tuple(round(SKY[i] + (BLUE[i] - SKY[i]) * t) for i in range(3))
    d.line([(x1, y1), (x2, y2)], fill=col, width=24)

dot_r = 42
d.ellipse([cx - dot_r, 332 - dot_r, cx + dot_r, 332 + dot_r], fill=BLUE)

# text
font_bold = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
font_mono = "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"
f_brand = ImageFont.truetype(font_bold, 104)
f_tag = ImageFont.truetype(font_bold, 30)
f_url = ImageFont.truetype(font_mono, 28)

tx = 500
d.text((tx, 215), "AUTRAXIS", font=f_brand, fill=WHITE)
d.text((tx + 4, 355), "I N T E L L I G E N C E .  I N T E G R A T E D .", font=f_tag, fill=CYAN)
d.text((tx + 4, 460), "Enterprise integration · AI technology · autraxis.com", font=f_url, fill=MIST)

img.save("/app/frontend/public/og-image.png", "PNG")
print("og-image.png written", img.size)
