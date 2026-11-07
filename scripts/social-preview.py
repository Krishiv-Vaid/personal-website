"""Optional asset regeneration: requires Pillow and a path to a sans-serif TTF/TTC."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont
font=sys.argv[1] if len(sys.argv)>1 else '/System/Library/Fonts/Helvetica.ttc'
im=Image.new('RGB',(1200,630),'#fafafa'); draw=ImageDraw.Draw(im)
for xy,text,size,color in [((90,110),'KRISHVAID.ME',22,'#666666'),((85,245),'Krishiv Vaid',76,'#171717'),((90,350),'physics, electronics & software',32,'#666666'),((90,525),'Applied Physics · University of Waterloo',22,'#666666')]:
    draw.text(xy,text,font=ImageFont.truetype(font,size),fill=color)
draw.line((90,490,1110,490),fill='#e5e5e5',width=2)
im.save(Path(__file__).resolve().parents[1]/'public/images/social-preview.png',optimize=True)
