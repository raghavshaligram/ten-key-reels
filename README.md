# ten-key-reels

Daily Instagram reels for [10keytypingtest.com](https://10keytypingtest.com), built in code: real screenshots of the
live test, animated type, a synthetic voice (Kokoro), word-timed captions (Whisper) and a presenter cut-out.

```bash
./setup.sh                                          # once per machine
python3 engine/build.py examples/notebook-10000     # builds examples/notebook-10000/out.mp4
```

Styles: `cream`, `notebook`, `arcade` (see `examples/`). The full daily procedure and the content rules are in
[CLAUDE.md](CLAUDE.md); the topic bank and log are in `content/`.

Needs Python 3.10+, Node 18+, ffmpeg and Playwright with Chromium.
