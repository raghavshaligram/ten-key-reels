import sys
from PIL import Image,ImageDraw
ts=sys.argv[1].split(',');W,H=270,480;cols=6
s=Image.new('RGB',(W*cols,H*((len(ts)+cols-1)//cols)),'white')
for i,t in enumerate(ts):
  im=Image.open(f'st_{float(t):g}.jpg').resize((W,H));ImageDraw.Draw(im).text((8,8),t,fill='red');s.paste(im,((i%cols)*W,(i//cols)*H))
s.save(sys.argv[2] if len(sys.argv)>2 else 'sheet.jpg')
