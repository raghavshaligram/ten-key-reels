import sys,glob
from PIL import Image,ImageDraw
ts=sys.argv[1].split(',');W,H=270,480
s=Image.new('RGB',(W*6,H*((len(ts)+5)//6)),'white')
for i,t in enumerate(ts):
  im=Image.open(f'st_{float(t):g}.jpg').resize((W,H));ImageDraw.Draw(im).text((8,8),t,fill='red');s.paste(im,((i%6)*W,(i//6)*H))
s.save('sheet.jpg')
