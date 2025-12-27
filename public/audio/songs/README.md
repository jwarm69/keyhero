# Song Audio Files

## Instructions

Add 2-3 CC0/public domain instrumental songs to the directories below:

### Sources for CC0 Music:
- [Free Music Archive](https://freemusicarchive.org/) - Filter by CC0 license
- [Incompetech](https://incompetech.com/) - Kevin MacLeod royalty-free music
- [ccMixter](https://ccmixter.org/) - Creative Commons music

### Requirements per Song:
- **Duration**: 60-90 seconds
- **Format**: WAV (preferred) or high-quality MP3
- **Style**: Instrumental or minimal vocals
- **Beat**: Clear beat structure (120-140 BPM ideal)

### Directory Structure:

```
/public/audio/songs/
├── song1/
│   └── track.wav (or track.mp3)
├── song2/
│   └── track.wav (or track.mp3)
└── song3/
    └── track.wav (or track.mp3)
```

### Example Songs to Search For:
- "Incompetech Cipher" - Electronic, 120 BPM
- "Incompetech Pixel Peeker Polka" - Fast electronic, 140 BPM
- "FMA - Chill Electronic" - Moderate electronic

### After Adding Songs:
Update the metadata in `src/game/songMetadata.ts` with:
- Song title
- Artist name
- BPM (beats per minute)
- Exact duration in seconds
- License information



