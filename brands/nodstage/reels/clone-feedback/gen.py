import json,sys
O,N='am_puck','af_jessica'
# (speaker, spoken text, pause after, speed, [(count, caption, markname)])
L=[(O,"Nod, a client just sent feedback. Four emails, two voice notes and a screenshot.",.22,1.08,[(6,"Nod, a client just sent feedback.","l0"),(2,"Four emails,","emails"),(3,"two voice notes","voice"),(3,"and a screenshot.","shot")]),
(N,"Which version?",.2,1.05,[(2,"Which version?","l1")]),
(O,"Nobody knows.",.22,1.0,[(2,"Nobody knows.","l2")]),
(N,"Tell them how you handle it.",.2,1.08,[(6,"Tell them how you handle it.","l3")]),
(O,"A spreadsheet. Sticky notes. Three hours of copy and paste.",.22,1.08,[(2,"A spreadsheet.","l4"),(2,"Sticky notes.","sticky"),(2,"Three hours","hours"),(4,"of copy and paste.","paste")]),
(N,"They want easy.",.2,1.0,[(3,"They want EASY.","l5")]),
(O,"Then show them.",.18,1.05,[(3,"Then show them.","l6")]),
(N,"Watch.",.3,1.0,[(1,"Watch.","l7")]),
(N,"Step one. Share the proof in her portal.",.2,1.08,[(2,"Step one.","l8"),(3,"Share the proof","share"),(3,"in her portal.","portal")]),
(O,"Does she need an account?",.18,1.08,[(5,"Does she need an account?","l9")]),
(N,"No. She clicks the work and comments.",.2,1.08,[(1,"No.","l10"),(4,"She clicks the work","clicks"),(2,"and comments.","comments")]),
(O,"Even voice notes?",.18,1.05,[(3,"Even voice notes?","l11")]),
(N,"Voice notes. Video. Arrows on the design.",.22,1.05,[(2,"Voice notes.","l12"),(1,"Video.","video"),(4,"Arrows on the design.","arrows")]),
(N,"Step two. Every comment becomes a task.",.2,1.08,[(2,"Step two.","l13"),(2,"Every comment","every"),(3,"becomes a task.","task")]),
(O,"With the pin?",.18,1.05,[(3,"With the pin?","l14")]),
(N,"Right where she left it. Assigned, with a deadline.",.22,1.08,[(5,"Right where she left it.","l15"),(1,"Assigned,","assigned"),(3,"with a deadline.","deadline")]),
(N,"Step three. She asks for something extra.",.2,1.08,[(2,"Step three.","l16"),(3,"She asks for","asks"),(2,"something extra.","extra")]),
(O,"Round five.",.2,.98,[(2,"Round five.","l17")]),
(N,"It becomes a change order. She approves it. It lands on the invoice.",.22,1.1,[(5,"It becomes a change order.","l18"),(3,"She approves it.","approves"),(5,"It lands on the invoice.","lands")]),
(O,"Wait. Can my team use this too?",.18,1.08,[(1,"Wait.","l19"),(6,"Can my team use this too?","team")]),
(N,"Yep. Clients and freelancers you bring in are free. One price per studio.",.22,1.1,[(1,"Yep.","l20"),(3,"Clients and freelancers","clients"),(5,"you bring in are free.","free"),(4,"One price per studio.","price")]),
(O,"So I never chase feedback again?",.2,1.05,[(4,"So I never chase","l21"),(2,"feedback again?","again")]),
(N,"Less chasing. Clients are still clients.",.25,1.0,[(2,"Less chasing.","l22"),(4,"Clients are still clients.","still")]),
(O,"So the problem was me?",.3,1.0,[(5,"So the problem was me?","l23")]),
(N,"The problem was four inboxes.",.3,.95,[(3,"The problem was","l24"),(2,"[four inboxes].","inboxes")])]
adj=json.loads(sys.argv[1]) if len(sys.argv)>1 else {}
lines=[];ph=[];marks={};spk=[];k=0
for sp,txt,p,s,P in L:
  lines.append([txt,min(.28,p+.03),sp,round(s/1.07,3)]); 
  for c,cap,m in P:
    c=adj.get(cap,c); ph.append([c,cap]); marks[m]=k
    if m.startswith('l') and m[1:].isdigit(): spk.append([k,"Y" if sp==O else "N"])
    k+=c
r={"title":"Nodstage: clone of the feedback format","voice":O,"speed":1.0,"lines":lines,"phrases":ph,"marks":marks,
 "scenes":[0,marks['l8'],marks['l13'],marks['l16'],marks['l19'],marks['l23'],k-1],"tail":3.6,"run":None,"pointer":None,
 "sfx":[["emails-0.05","pop",700],["voice-0.05","pop",800],["shot-0.05","pop",900],["l1-0.1","whoosh",.25],["l3-0.1","whoosh",.25],["l4","pop",600],["sticky","pop",750],["hours","ticks",1.3],["paste+0.6","pop",380],
  ["l5-0.08","whoosh",.3],["l8-0.2","whoosh",.5],["l10","pop",900],["clicks+0.3","click"],["l12","pop",800],["video","pop",900],["arrows","pop",1000],["l13-0.2","whoosh",.4],["task","pop",900],["assigned","pop",950],["deadline","pop",1000],
  ["l16-0.2","whoosh",.4],["l17","pop",380],["l18+0.2","pop",900],["approves","click"],["lands","win"],["l19-0.1","whoosh",.3],["free","pop",1000],["price","pop",1100],["l23-0.1","whoosh",.4],["l24","whoosh",.2],["inboxes","pop",380],["inboxes+1.6","whoosh",.6]]}
json.dump(r,open('reel.json','w'),indent=1); json.dump(spk,open('spk.json','w'))
print(k,'words')
