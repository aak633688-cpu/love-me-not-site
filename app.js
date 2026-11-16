const intro = document.querySelector("#intro");
const music = document.querySelector("#music");
const envelope = document.querySelector("#envelope");
const openLetterButton = document.querySelector("#open-letter");
const noteCard = document.querySelector("#note-card");
const continueButton = document.querySelector("#go-to-song");
const backButton = document.querySelector("#back-to-letter");
const flowerBloom = document.querySelector("#flower-bloom");
const audio = document.querySelector("#audio");
const playButton = document.querySelector("#play-button");
const seekSlider = document.querySelector("#seek");
const volumeSlider = document.querySelector("#volume");
const currentTimeLabel = document.querySelector("#current-time");
const durationLabel = document.querySelector("#duration");
const playerStatus = document.querySelector("#player-status");
const cassetteArea = document.querySelector(".cassette-area");
const musicCard = document.querySelector(".music-card");

let letterIsOpen = false;
let progressIsBeingDragged = false;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function showNote() {
  if (letterIsOpen) return;
  letterIsOpen = true;
  envelope.classList.add("is-open");
  openLetterButton.disabled = true;
  openLetterButton.setAttribute("aria-expanded", "true");
  document.querySelector("#intro-hint").textContent = "A little note, from me to you";
  flowerBloom.classList.add("is-active");

  const fadeDelay = reducedMotion.matches ? 80 : 1900;
  const revealDelay = reducedMotion.matches ? 180 : 3150;
  window.setTimeout(() => flowerBloom.classList.add("is-fading"), fadeDelay);
  window.setTimeout(() => {
    flowerBloom.classList.remove("is-active", "is-fading");
    noteCard.classList.add("is-visible");
    noteCard.setAttribute("aria-hidden", "false");
    continueButton.removeAttribute("tabindex");
    continueButton.focus({ preventScroll: true });
  }, revealDelay);
}

function showMusic() {
  intro.classList.add("leaving");
  window.setTimeout(() => {
    intro.hidden = true;
    music.hidden = false;
    music.classList.add("entering");
    document.querySelector("#music-title").focus({ preventScroll: true });
  }, 300);
}

function showLetter() {
  music.hidden = true;
  music.classList.remove("entering");
  intro.hidden = false;
  intro.classList.remove("leaving");
  window.requestAnimationFrame(() => continueButton.focus({ preventScroll: true }));
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function setPlayerState(isPlaying) {
  playButton.setAttribute("aria-pressed", String(isPlaying));
  playButton.setAttribute("aria-label", `${isPlaying ? "Pause" : "Play"} Love Me Not`);
  musicCard.classList.toggle("is-playing", isPlaying);
  cassetteArea.classList.toggle("is-playing", isPlaying);
}

function updateTimeline() {
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  const duration = audio.duration;
  const progress = Number.isFinite(duration) && duration > 0 ? audio.currentTime / duration : 0;
  const sliderValue = progressIsBeingDragged ? Number(seekSlider.value) / 1000 : progress;

  if (!progressIsBeingDragged) seekSlider.value = String(Math.round(progress * 1000));
  seekSlider.style.setProperty("--progress", `${sliderValue * 100}%`);
}

function describeAudioError() {
  const mediaError = audio.error;
  const errorMessages = {
    1: "Audio loading was aborted.",
    2: "A network error interrupted audio loading.",
    3: "The MP3 could not be decoded.",
    4: "The MP3 could not be found or is not supported."
  };
  const message = mediaError?.message || errorMessages[mediaError?.code] || "Audio couldn't be loaded.";
  return `${message} Source: ${audio.currentSrc || audio.src || "not set"}`;
}

async function diagnoseAudioRequest() {
  const source = audio.currentSrc || audio.src;
  if (!source) return;

  try {
    const response = await fetch(source, {
      headers: { Range: "bytes=0-15" },
      cache: "no-store"
    });
    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() || "unknown content type";
    const contentRange = response.headers.get("content-range");
    const reader = response.body?.getReader();
    const { value } = reader ? await reader.read() : { value: undefined };
    await reader?.cancel();
    const signature = value ? new TextDecoder().decode(value.slice(0, 15)).trimStart().toLowerCase() : "";

    if (!response.ok) {
      playerStatus.textContent = `Audio request failed: HTTP ${response.status} ${response.statusText} (${source}).`;
    } else if (contentType.includes("text/html") || signature.startsWith("<!doctype html") || signature.startsWith("<html")) {
      playerStatus.textContent = `Audio URL returned HTML instead of an MP3 (HTTP ${response.status}, ${contentType}): ${source}`;
    } else if (contentType !== "audio/mpeg" && contentType !== "application/octet-stream") {
      playerStatus.textContent = `Audio URL returned an unexpected Content-Type (${contentType}; HTTP ${response.status}): ${source}`;
    } else if (response.status === 200 && contentRange) {
      playerStatus.textContent = `Audio server returned an unexpected range response (HTTP ${response.status}): ${source}`;
    }
  } catch (error) {
    playerStatus.textContent = `${describeAudioError()} Request diagnostic failed: ${error.message}`;
  }
}

async function togglePlayback() {
  if (!audio.paused) {
    audio.pause();
    return;
  }

  try {
    await audio.play();
  } catch (error) {
    setPlayerState(false);
    if (error.name !== "AbortError") {
      playerStatus.textContent = `Playback failed (${error.name}): ${error.message || "no browser detail provided"}. Source: ${audio.currentSrc || audio.src || "not set"}`;
      playerStatus.classList.add("is-error");
    }
  }
}

openLetterButton.addEventListener("click", showNote);
continueButton.addEventListener("click", showMusic);
backButton.addEventListener("click", showLetter);
playButton.addEventListener("click", togglePlayback);

audio.addEventListener("playing", () => {
  setPlayerState(true);
  playerStatus.textContent = "";
  playerStatus.classList.remove("is-error");
});
audio.addEventListener("loadstart", () => {
  playerStatus.textContent = "Loading song…";
});
audio.addEventListener("waiting", () => {
  setPlayerState(false);
  playerStatus.textContent = "Buffering…";
});
audio.addEventListener("canplay", () => {
  if (audio.paused) {
    playerStatus.textContent = "";
    playerStatus.classList.remove("is-error");
  }
});
audio.addEventListener("pause", () => {
  setPlayerState(false);
  if (!audio.ended && !audio.error) {
    playerStatus.textContent = "";
    playerStatus.classList.remove("is-error");
  }
});
audio.addEventListener("ended", () => {
  setPlayerState(false);
  audio.currentTime = 0;
});
audio.addEventListener("loadedmetadata", () => {
  durationLabel.textContent = formatTime(audio.duration);
  seekSlider.disabled = false;
  playerStatus.textContent = "";
  playerStatus.classList.remove("is-error");
  updateTimeline();
});
audio.addEventListener("timeupdate", updateTimeline);
audio.addEventListener("durationchange", () => {
  durationLabel.textContent = formatTime(audio.duration);
});
audio.addEventListener("error", () => {
  setPlayerState(false);
  playerStatus.textContent = describeAudioError();
  playerStatus.classList.add("is-error");
  void diagnoseAudioRequest();
});

seekSlider.addEventListener("input", () => {
  progressIsBeingDragged = true;
  const progress = Number(seekSlider.value) / 1000;
  currentTimeLabel.textContent = formatTime(progress * (audio.duration || 0));
  seekSlider.style.setProperty("--progress", `${progress * 100}%`);
});
seekSlider.addEventListener("change", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = (Number(seekSlider.value) / 1000) * audio.duration;
  }
  progressIsBeingDragged = false;
  updateTimeline();
});

volumeSlider.addEventListener("input", () => {
  audio.volume = Number(volumeSlider.value);
  volumeSlider.style.setProperty("--progress", `${Number(volumeSlider.value) * 100}%`);
});

audio.volume = Number(volumeSlider.value);
volumeSlider.style.setProperty("--progress", `${Number(volumeSlider.value) * 100}%`);
seekSlider.style.setProperty("--progress", "0%");
seekSlider.disabled = true;

document.querySelector("#music-title").setAttribute("tabindex", "-1");
