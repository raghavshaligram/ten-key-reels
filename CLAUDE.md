# Daily reel runbook

This repo makes one Instagram reel a day for **10keytypingtest.com**: a faceless motion-graphics reel built in code
(real screenshots of the live test, animated text, a synthetic voice, captions) with a presenter cut-out who pops up
and points at the screen. No paid video or image generation runs day to day; the presenter clips are already in
`library/pointer/`.

The user approves every script and every finished reel. Nothing gets posted to Instagram from here.

## The daily run

1. **Set up** (fresh clone): `./setup.sh`. It installs fonts, Kokoro voice, Whisper, and downloads the voice model into `cache/`.
2. **Pick the topic.** Read `content/log.md` and `content/topics.md`. Take the topic used least recently, unless the user
   asked for a specific one. Open the site page listed for it (WebFetch https://10keytypingtest.com/...) and note the facts you will use.
3. **Pick the style.** `config.json` → `styles`. Rotate: use the style after the one in the newest log line. If the user has
   picked a single style, `styles` has one entry; use it.
4. **Write the script** with `tools/ig/ig-reel/SKILL.md`:
   - Draft 5 hooks from `tools/ig/ig-reel/hooks.json`, score them with `python3 tools/ig/ig-reel/hookscore.py hooks.txt`, take the best.
     Skip formulas that need a personal past (the presenter is invented, she has no story): #1, 5, 6, 8, 13, 15, 25.
   - 45 to 75 spoken words, 18 to 28 seconds. Five or six beats: hook, the idea, the proof on the real test, the takeaway, the site.
   - Run it through `python3 tools/ig/ig-human/humanize.py script.txt --report` and `detect.py`. Fix what they flag.
5. **Read the script against the user's rules** (below). Then build the reel folder:
   - `reels/YYYY-MM-DD-short-name/`, copy `reel.json` and `scene.html` from the style's example in `examples/`.
   - Edit `reel.json`: `lines` (spoken), `phrases` (captions), `scenes`, `marks`, `pointer`, `sfx`, `run`.
   - Edit `scene.html`: change the on-screen words and which crops of the test each scene shows. Keep the structure.
6. **Build stills first**: `python3 engine/build.py reels/<folder> --stills 1.5,6,10,14,18,22`, then look at `sheet.jpg`.
   The build prints the words Whisper heard; read them against the script. If it prints CAPTION COUNT MISMATCH, it also prints
   every word with its index: fix `phrases`, `scenes` and `marks` from that list and run again (the voice is cached).
7. **Check every still** (Read the sheet image) for: text cut off, text under the presenter, empty areas larger than a third of
   the screen, anything inside the Instagram UI zones (top 230px, bottom 480px, right 230px), and numbers that don't match the run.
   Fix and repeat until clean.
8. **Full build**: `python3 engine/build.py reels/<folder>`. It writes `out.mp4` and a new `sheet.jpg`.
9. **Caption**: write `reels/<folder>/caption.txt` with `tools/ig/ig-caption/SKILL.md`, lint it with
   `python3 tools/ig/ig-caption/caption.py reels/<folder>/caption.txt --keywords "10-key test,data entry test"`, and humanize it.
10. **Send for approval**: SendUserFile with `out.mp4` and `caption.txt`, plus one line: the topic, the style, and the hook formula used.
    Add the line to `content/log.md` with status `sent`.
11. **Commit and push** to `main` (`git add -A && git commit && git push`). Video files are ignored by git; the reel folder keeps
    `reel.json`, `scene.html`, `caption.txt` and `sheet.jpg`, which is enough to rebuild it.

When the user replies with changes, edit the folder, rebuild, send again, update the log line.

## The user's rules for scripts (from their feedback)

- Plain, spoken English, the way a person talks. No copywriter fragments ("Speed. Accuracy. Results."), no hype words.
- It has to make sense as a story from start to end. Don't refer to something the viewer hasn't seen ("that run", "a free one").
- The last line goes **down** in tone, a calm statement, never a rising question or an exclamation.
- When the user supplies their own script, use their exact words. Don't "improve" them.
- Fill the phone screen: big type, close crops, no large empty areas. Reels are watched on phones.
- Her screen time is about half the reel, in three windows of about 4 seconds, not a one-second flash.

## Honesty rules (never break)

- Numbers on screen come from the real run `record.cjs` makes on the live site. Never type a number into a scene by hand.
  If the script says a target (10,000 KPH) and the run misses it, the scene must not say it was hit (see arcade `l4`).
- Accuracy is per entry. A 1-minute test has about 30 entries, so one slip is about 3%; 98% in one minute is not possible. Don't script it.
- The presenter is an invented person. She never tells a personal story ("when I applied..."), never claims a score, never reviews the site.
  When posting, the user should turn on Instagram's AI label.
- No invented users, reviews, testimonials or employer quotes. No competitor names or links.
- No real people's photos or GIFs, no song lyrics, no copyrighted music. Sound effects come from `engine/sfx.py`.
- Facts about tests and employers come from the site's own guides. If a guide doesn't say it, don't say it.

## Spelling for the voice

Kokoro reads digits and symbols oddly. In `lines` write: "ten-key", "K P H", "ten thousand", "ten key typing test dot com".
Captions in `phrases` use the normal spelling ("10-key", "KPH", "10,000", "[10keytypingtest.com]").

## Files

- `engine/build.py`: the whole pipeline; its docstring documents `reel.json`.
- `engine/lib.js`: animation helpers (`pop`, `slam`, `out`, `count`, `drawCrop`, `frameBook`, `caption`, `presenter`, `moveCaption`).
  A scene's `window.render(t)` must be a pure function of time.
- `engine/record.cjs`: types a real 1-minute test on the live site with Playwright and screenshots it.
- `engine/character.js`: Tara, the illustrated presenter for the sticker style, drawn in SVG and posed by code
  (rest, wave, point, present, think, thumbs, oops, cheer), with lip sync from the voice. A scene lists her poses as `[[time, pose], ...]`.
- `engine/sfx.py`: sound effects made in code.
- `engine/key.py`: the green-screen keyer used to make the presenter clips (only needed for new outfits).
- `library/pointer/`: 11 presenter clips (VP9 WebM with transparency). `history.json` keeps the last outfits so one isn't reused within 4 reels.
- `tools/ig/`: hook formulas, humanizer and caption linter from instagram-agent-skill (MIT, see `tools/ig/LICENSE`).
- `examples/`: one finished reel per style (cream, notebook, arcade, sticker), each builds as is.
  In the sticker style the caption is the headline at the top (words turn dark as they're spoken, [accent] words in red serif),
  one sticker prop per beat with a numbered badge, and Tara on screen the whole time, changing pose with the script.

## Secrets

None are needed for the daily run. Never commit `.env` files or keys.
