# Audio assets

All files in this folder are generated local placeholder assets and can be replaced later with final production audio using the same filenames.

- `music/lounge-loop.wav`: looping background music.
- `sfx/*.wav`: short, bright interaction and state sound effects.
- `voice/*.wav`: NPC prompt voice lines generated with light pacing and pauses.

The in-game audio toggle saves the player preference in local storage.

Regenerate the current placeholder assets with:

```powershell
node tools\generate_audio_assets.mjs
powershell -ExecutionPolicy Bypass -File tools\generate_voice_assets.ps1
```
