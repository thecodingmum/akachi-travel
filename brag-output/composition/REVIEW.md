# Review: Akachi Travels launch film (20 s, 1080x1920, 30 fps)

## Creative calls
- Reference grammar (PANAMA TRAVEL CO. Short): one word per beat over footage, solid-to-outline title, boxed stat labels, iris ring, squeeze-to-line into a boxed end card. Rebuilt in Akachi black & gold (Anton, Instrument Serif italic accent, JetBrains Mono).
- Proof is the real site: screenshots of the running page at phone size; chip states are crops of the real "after" screenshot.
- Music: HeyGen library Afrobeats (user request), 120 BPM; cuts and slams on the beat grid.

## Measured
- `hyperframes check`: ok, 0 errors.
- Render: 20.0 s, H.264 1080x1920 30 fps + AAC; frame strip reviewed at 18 points.
- Audio (measured, not heard): -15.8 LUFS integrated, -1.5 dBTP, no clipping (two-pass loudnorm + limiter after render).

## Warnings kept on purpose
- `line_unread` on WANDER/UNWIND/INDULGE and the tagline: false positives from per-glyph splitting (each glyph counted as a word); each is one word held 1.3-1.5 s.
- Montage place-name ticker flashes 0.43 s per beat: decorative, matches the cut rhythm; the hero word carries the read.
- `nested_media_start_basis_ambiguous`: all nested media times are scene-local by design.
- `clip_media_fit` on SFX: slots longer than the short files; harmless.

## Weakest shot
- 9.05 s lens transition briefly shows a narrow keyhole of Dubai over INDULGE; reads as a lens but is not as clean as the iris. With more time: a soft horizontal lens mask instead of the tall ellipse.
