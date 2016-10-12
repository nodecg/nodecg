NodeCG features a system for management and playback of sound cues. To add sound cues to your bundle,
create a `nodecg.soundCues` array in your `package.json`:
```json
{
  "name": "test-bundle",
  "nodecg": {
    "soundCues": [
      {
        "name": "name-only"
      },
      {
        "name": "default-volume",
        "defaultVolume": 80
      },
      {
        "name": "non-assignable",
        "assignable": false,
        "defaultFile": "sound/default-file.ogg"
      },
      {
        "name": "default-file",
        "defaultFile": "sound/default-file.ogg"
      },
      {
      	"name": "single-channel",
      	"channels": 1
      }
    ]
  }
}
```

Your bundle will now have a card on the Mixer page of the Dashboard.

<iframe src='https://gfycat.com/ifr/PrestigiousShyGoldeneye' frameborder='0' scrolling='no' width='640' height='426.6666666666667' allowfullscreen></iframe>

`defaultFile`s are audio files that you ship with your bundle. They will be available to that specific cue as a
"Default" option in that cue's dropdown select on the Mixer.

`channels` determines how many instances of a sound can be playing simultaneously. The default value is `100`. If set to `1`,
only one instance can play at a time, and a new instance cannot be started until the currently playing instance has completed.

If your bundle has at least one cue that is `assignable`, it will gain a "Sounds" [Asset]{@tutorial assets} category.
This category accepts `.ogg` and `.mp3` files. Any audio files uploaded to this category will become available as options
in all of your `assignable` cues' dropdown boxes.

If your bundle has Sound Cues, the following API methods will be available to your graphic:
- {@link NodeCG#playSound}
- {@link NodeCG#stopSound}
- {@link NodeCG#stopAllSounds}
