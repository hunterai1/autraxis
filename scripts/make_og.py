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

# logo: composite the original supplied mark (white background removed)
mark = Image.open("/app/frontend/public/brand/icon-transparent.png").convert("RGBA")
mark = mark.resize((340, 327), Image.LANCZOS)
img.paste(mark, (95, 150), mark)

# text
font_bold = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
font_mono = "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"
f_brand = ImageFont.truetype(font_bold, 104)
f_tag = ImageFont.truetype(font_bold, 30)
f_url = ImageFont.truetype(font_mono, 28)

tx = 500
d.text((tx, 215), "AUTRAXIS", font=f_brand, fill=WHITE)
d.text((tx + 4, 355), "I N T E L L I G E N C E .  I N T E G R A T E D .", font=f_tag, fill=CYAN)
d.text((tx + 4, 460), "Enterprise integration · AI technology", font=f_url, fill=MIST)

img.save("/app/frontend/public/og-image.png", "PNG")
print("og-image.png written", img.size)
