import sys
from PIL import Image,ImageDraw
ts=sys.argv[1].split(',');W,H=216,384;cols=int(sys.argv[2]) if len(sys.argv)>2 else 8
s=Image.new('RGB',(W*cols,H*((len(ts)+cols-1)//cols)),'white')
for i,t in enumerate(ts):
  im=Image.open(f'st_{t}.jpg').resize((W,H));ImageDraw.Draw(im).text((6,6),t,fill='red');s.paste(im,((i%cols)*W,(i//cols)*H))
s.save(sys.argv[3] if len(sys.argv)>3 else 'sheet.jpg',quality=85)
