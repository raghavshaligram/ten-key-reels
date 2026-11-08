import json
r=json.load(open('reel.json'))
s=open('head.html').read().replace('__PH__',json.dumps([p[0] for p in r['phrases']]))
s+=open('room.js').read()+open('chars.js').read()+open('main.js').read()+open('overlay.js').read()+"\n</script></body></html>\n"
open('scene.html','w').write(s)
import os
if os.path.exists('timeline.json'):
  open('build.html','w').write(s.replace('__TIMELINE__',open('timeline.json').read()).replace('__RUN__','{"frames":[]}').replace('__MODE__','video'))
