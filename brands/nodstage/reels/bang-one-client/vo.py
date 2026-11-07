import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
C="/tmp/claude-0/-home-claude/fb5acdd3-6985-5115-930f-f450ba3d78cd/scratchpad/tkr-test/cache/"
k=Kokoro(C+"kokoro-v1.0.onnx",C+"voices-v1.0.bin")
L=[("Here's one client, start to finish.",.45,1.0),
("Hannah books a call from your booking page.",.35,1.0),
("You send the proposal, and she accepts it.",.4,1.0),
("She reviews the homepage, and leaves her comments right on the design.",.4,1.0),
("Then she asks for something extra. It becomes a change order, and she approves it.",.4,1.0),
("The invoice already includes it. Paid.",.45,.97),
("Then you ask her for a testimonial.",.5,1.0),
("From the first inquiry to the final payment. Run your studio with Nodstage.",.8,.92)]
out=[np.zeros(int(.3*24000),np.float32)];t=.3;segs=[]
for s,g,sp in L:
    a,sr=k.create(s,voice="af_heart",speed=sp,lang="en-us");d=len(a)/sr
    segs.append([s,round(t,2),round(t+d,2)]);out+=[a.astype(np.float32),np.zeros(int(g*sr),np.float32)];t+=d+g
sf.write("vo.wav",np.concatenate(out),24000);json.dump(segs,open("segs.json","w"),indent=0);print(round(t,2));[print(x) for x in segs]
