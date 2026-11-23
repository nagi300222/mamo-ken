# Audio envelope acceptance evidence

GitHub Actions run `45130923657`, job `137545983443` reached the offline-audio
assertion after all nine actual in-game hit/guard/pose-hold cases passed. The
assertion compared the final sample above an absolute amplitude of `1e-5` for
Pisuke light and Godan heavy, expecting a duration difference above 60 ms.
Artifact `14797579147` contains ten screenshots and no audio report or WAV;
the old test wrote JSON only after that assertion. Therefore the exact failed
sample durations cannot be reconstructed from that artifact.

The assertion conflated source envelope duration with the final threshold
crossing of different signals. Light is an oscillator scheduled for 81 ms;
heavy is filtered noise scheduled for 190 ms. The latter has both a descending
gain envelope and a low-pass sweep from 620 to 110 Hz. Filtering and noise
amplitude change the threshold crossing independently of the scheduled stop.
The new unit fixture demonstrates that a quiet sustained tail can have exactly
the same `1e-5` last-sample duration as a short sound. This explains a failure
mode of the former metric; it is not a claim that the old missing waveform has
been recovered.

Production sound synthesis, recipes and balance are unchanged. Browser QA now:

- saves eight real rendered PCM WAVs, schedules, waveform metrics and all
  in-game event records **before** the audio assertions;
- seeds noise only during the synchronous offline-fixture synthesis call;
- requires exactly one scheduled voice and its exact original recipe duration;
- requires the heavy source to last over 100 ms longer than light;
- requires nonzero sustained rendered heavy energy after the light source has
  ended, plus a quiet tail after the scheduled stop;
- retains clipping, finite-sample, guard/swing identity, independent volume,
  mute, zero-volume and whiff-silence checks;
- retains the old absolute-threshold duration as a diagnostic rather than
  treating it as a source-envelope clock.

The local evidence-analysis and WAV unit tests pass. Actual Web Audio/WebGL
rerun remains a CI requirement; this workspace's Chromium process cannot open
the necessary sandbox socket. No physical-phone speaker or performance claim
is made.
