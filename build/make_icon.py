from PIL import Image, ImageDraw
import os

OUT = r"D:\3DWork\virture\codework\memo-app\build"
os.makedirs(OUT, exist_ok=True)


def make(size):
    s = size * 8  # 슈퍼샘플링
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = int(s * 0.09)

    # 포스트잇 종이
    d.rounded_rectangle([pad, int(s * 0.16), s - pad, s - pad],
                        radius=int(s * 0.05), fill=(255, 206, 170, 255))
    # 마스킹테이프
    tw, th = int(s * 0.46), int(s * 0.17)
    x0 = (s - tw) // 2
    d.rectangle([x0, int(s * 0.07), x0 + tw, int(s * 0.07) + th],
                fill=(255, 255, 255, 228))
    # 글줄
    for i, f in enumerate([0.42, 0.56, 0.70]):
        w = 0.62 if i < 2 else 0.40
        d.rounded_rectangle([int(s * 0.22), int(s * f),
                             int(s * (0.22 + w)), int(s * f) + int(s * 0.055)],
                            radius=int(s * 0.02), fill=(120, 95, 80, 145))
    return img.resize((size, size), Image.LANCZOS)


sizes = [16, 24, 32, 48, 64, 128, 256]
imgs = [make(s) for s in sizes]

ico = os.path.join(OUT, 'icon.ico')
imgs[-1].save(ico, format='ICO', sizes=[(s, s) for s in sizes])
imgs[-1].save(os.path.join(OUT, 'icon.png'))

print('생성:', ico, os.path.getsize(ico), 'bytes')
print('생성:', os.path.join(OUT, 'icon.png'))
