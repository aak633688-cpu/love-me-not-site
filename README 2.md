# Songs for you

A small, responsive love-note and music-player experience built with plain HTML, CSS, and JavaScript.

## Run locally

From this directory, start any static web server. For example:

```sh
npx serve .
```

Then open the local URL printed by the server. Serving the files over HTTP is recommended so browser audio loading behaves consistently.

## Song audio

```text
music/love-me-not.mp3
public/music/love-me-not.mp3
```

The supplied MP3 is loaded from the relative URL `./music/love-me-not.mp3` with the HTML5 Audio API. This resolves correctly both at the domain root and when the site is deployed under a project subpath. The `music/` copy supports serving this project from its root; the matching `public/music/` copy ensures deployments that publish the conventional `public/` asset directory include the same file at `/music/love-me-not.mp3`. Keep both copies in sync if replacing the song. If audio loading fails, the player displays the browser's media error and probes the response to identify HTTP, MIME-type, or HTML-fallback problems. The player does not autoplay; its play, pause, seek, time, and volume controls operate on the real audio file.

The opening envelope triggers a locally bundled, full-screen floral illustration (`flowers.svg`, with a portrait layout in `flowers-mobile.svg`), floating petals, and a gradual zoom before revealing the letter. The sequence shortens for reduced-motion preferences.

## Interactions

- Choose **Open your letter** to unfold the envelope and reveal the note.
- Choose **Come listen with me** to open the cassette player.
- The play/pause button, seek bar, and volume slider control the provided audio file.
- Use **back to your letter** to return to the opening note.
- Animations respect the operating system's reduced-motion preference.
