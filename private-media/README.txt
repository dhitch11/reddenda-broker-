BROKER-AUDIO drops the practice recording here. Two files, both named exactly:

  practiceaudio.mp3    the take (mp3, 44.1 kHz, so Safari on macOS and iOS will play it)
  practiceaudio.json   the sidecar

The page reads the sidecar server side and renders nothing without it, so a half
written JSON means no player rather than a dead play button. Required keys:

  duration   seconds, a number greater than zero. This is what arms the progress
             bar before the network answers, because preload="metadata" leaves the
             element's own duration NaN until it does.
  src        the mp3 filename only, e.g. "practiceaudio.mp3". Not a path.

Optional, and each one lights up a part of the page:

  chapters   [{ t: 0, text: "The QPA denominator" }]      the question list
  captions   [{ t0: 0.12, t1: 1.82, text: "...", speaker: "Blair" }]  the synced line
  peaks      [0..100, ...]  the measured waveform. Leave it out rather than invent
             one: with no peaks the page draws a plain rail, which is honest, and a
             decorative waveform is a picture of a recording that does not exist.
  transcript the full text, blank line between paragraphs, behind "Read it instead"
  title, claimCheck, voice, loudness, renderedAt

⛔ NOTHING IN THIS DIRECTORY IS PUBLIC. src/proxy.ts returns 404 for every
request to /practice-audio-media/* without the gate cookie, including the mp3.
Do not move the audio into public/audio/ to "make it work" - that directory is
served straight off the CDN with no gate, and this recording is private.
