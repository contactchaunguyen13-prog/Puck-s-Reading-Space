let state = {
  mode: "flow",
  rhythm: 40,
  rawText: "",
  theme: "beige"
};

const slider = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");
const thresholds = document.querySelectorAll(".thresholds span");
const textInput = document.getElementById("textInput");

const flowBtn = document.getElementById("flowBtn");
const emphasisBtn = document.getElementById("emphasisBtn");
const chunkBtn = document.getElementById("chunkBtn");

const display = document.getElementById("display");
const rhythmControl = document.getElementById("rhythmControl");

const infoBtn = document.getElementById("infoBtn");
const themeBtn = document.getElementById("themeBtn");

const infoOverlay = document.getElementById("infoOverlay");
const closeInfo = document.getElementById("closeInfo");

const siteLogo = document.getElementById("siteLogo");

const puckImages = [
    "brownpuck.png",
    "bluepuck.png",
    "greenpuck.png"
];

puckImages.forEach(src => {
    const img = new Image();
    img.src = src;
});

function updateLogo() {

    if (state.theme === "beige") {
        siteLogo.src = "brownpuck.png";
    }

    else if (state.theme === "blue") {
        siteLogo.src = "bluepuck.png";
    }

    else {
        siteLogo.src = "greenpuck.png";
    }

}

function saveState() {
    const savedState = {
    text: state.rawText,
    speed: state.rhythm,
    mode: state.mode,
    theme: state.theme
};

    localStorage.setItem("readerAppState", JSON.stringify(savedState));
}

function resetDisplayMode() {
    display.classList.remove(
        "mode-flow",
        "mode-emphasis",
        "mode-chunk-level3"
    );
}

function updateActiveButton() {
    clearActiveButtons();

    if (state.mode === "flow") {
        flowBtn.classList.add("active");
    } 
    else if (state.mode === "emphasis") {
        emphasisBtn.classList.add("active");
    } 
    else {
        chunkBtn.classList.add("active");
    }
}

function render() {
    resetDisplayMode();
    applyTheme();
    updateActiveButton();

    const hasText = state.rawText.trim();

    if (!hasText) {

    display.innerHTML = "";
    updateSliderFill();
    return;
}

    if (state.mode === "flow") {
        display.classList.add("mode-flow");
        startFlow(state.rhythm);

    } else if (state.mode === "emphasis") {
        display.classList.add("mode-emphasis");
        gentleEmphasis(state.rhythm);

    } else {
    startChunk(state.rhythm);
    }

    updateSliderFill();
}

function setMode(mode) {
    state.mode = mode;
    saveState();
    render(); //
}

function loadState() {
    
    const saved = localStorage.getItem("readerAppState");

    if (!saved) {
        state.mode = "flow";
        state.rhythm = 40;
        state.rawText = "";

    } else {
    
        const parsed = JSON.parse(saved);

        state.rawText = parsed.text || "";
        state.rhythm = Number(parsed.speed ?? 40);
        state.mode = parsed.mode || "flow";
        state.theme = parsed.theme || "beige";
    }

    textInput.value = state.rawText;
    slider.value = state.rhythm;

    render();
}

function applyTheme() {

    document.body.classList.remove(
        "theme-beige",
        "theme-blue",
        "theme-green"
    );

    document.body.classList.add(`theme-${state.theme}`);

    updateLogo();
}

function startFlow(intensity = state.rhythm) {

    const text = state.rawText;

    if (!text.trim()) {
        display.innerHTML = "";
        return;
    }

    const paragraphs = text
        .split("\n")
        .filter(p => p.trim() !== "");

    const fadeAmount = 0.35 + (1 - intensity / 100) * 0.45;

    display.style.setProperty(
    "--flow-opacity",
    fadeAmount
);

    display.innerHTML = paragraphs
        .map(p => `<p>${p}</p>`)
        .join("");

    const renderedParagraphs = display.querySelectorAll("p");

    renderedParagraphs.forEach(paragraph => {

    function activateParagraph() {

        renderedParagraphs.forEach(p => {
            p.classList.remove("active-focus");
        });

        paragraph.classList.add("active-focus");
    }

    paragraph.addEventListener("mouseenter", activateParagraph);
    paragraph.addEventListener("click", activateParagraph);
    paragraph.addEventListener("touchstart", activateParagraph, { passive: true });

});

    if (renderedParagraphs.length > 0) {
    renderedParagraphs[0].classList.add("active-focus");
}
}

function gentleEmphasis(intensity = state.rhythm) {
    if (!state.rawText.trim()) {
        display.innerHTML = "";
        return;
    }

    const paragraphs = state.rawText.split(/\r?\n/);

    const emphasizedText = paragraphs.map(paragraph => {
        const words = paragraph.split(/\s+/).filter(w => w.length > 0);

        return words.map(word => {

            const leadingMatch = word.match(/^[^\p{L}\p{M}0-9]+/u);
            const leading = leadingMatch ? leadingMatch[0] : "";

            const trailingMatch = word.match(/[^\p{L}\p{M}0-9]+$/u);
            const trailing = trailingMatch ? trailingMatch[0] : "";

            const core = word
                .replace(/^[^\p{L}\p{M}0-9]+/u, "")
                .replace(/[^\p{L}\p{M}0-9]+$/u, "");

            if (!core) return word;

            if (/[0-9]/.test(core)) {
                return `${leading}<strong>${core}</strong>${trailing}`;
            }

            const parts = core.split(/([-–—])/);

            const processed = parts.map(part => {
                if (/^[-–—]$/.test(part)) return part;

                const length = part.length;
                const intensityFactor = intensity / 100;

                let boldCount;

                if (length <= 3) boldCount = 1;
                else if (length === 4) boldCount = 2;
                else if (length <= 7) boldCount = Math.ceil(2 + intensityFactor * 2);
                else boldCount = Math.ceil(3 + intensityFactor * 3);

                boldCount = Math.min(boldCount, length);

                return `<strong>${part.slice(0, boldCount)}</strong>${part.slice(boldCount)}`;
            });

            return `${leading}${processed.join("")}${trailing}`;

        }).join(" ");

    }).join("<br><br>");

    display.innerHTML = emphasizedText;

    const anchors = display.querySelectorAll("strong");
    const minWeight = 550;
    const maxWeight = 720;
    const weight = Math.round(minWeight + (intensity / 100) * (maxWeight - minWeight));

    anchors.forEach(anchor => {
        anchor.style.fontWeight = weight;
    });
}

function startChunk(level = state.rhythm) {
    const rawText = state.rawText;
    if (!rawText.trim()) { display.innerHTML = ""; return; }

    const softGap = 0.08 + (Math.min(level, 30) / 30) * 0.25;

    display.style.setProperty("--chunk-gap", `${softGap}em`);

    let modeLevel;

if (level < 40) {
    modeLevel = 1;
} else if (level <= 60) {
    modeLevel = 2;
} else {
    modeLevel = 3;
}

  display.classList.add("mode-chunk");
    
    if (modeLevel === 3) {
    display.classList.add("mode-chunk-level3");
}

    const paragraphs = rawText.split(/\r?\n/);

    const processed = paragraphs.map(paragraph => {
        if (!paragraph.trim()) return "";

        // --- LEVEL 1: Sentence Air (The Foundation) ---
        let sentences = paragraph.split(/(?<=[.!?])\s+/);
        let finalChunks = [];

        sentences.forEach(sentence => {
            let workingParts = [sentence.trim()];
            const wordCount = sentence.trim().split(/\s+/).length;

            // --- LEVEL 2: Long Sentence Relief (Trigger: > 16 words) ---
            const commaTrigger = level < 50 ? 22 : 16;

        if (modeLevel >= 2 && wordCount > commaTrigger) {
                const commaParts = sentence.split(/(?<=,)\s+/);
                
                // Protection: Each chunk must have ≥ 3 words
                const validCommaParts = commaParts.every(part => 
                    part.trim().split(/\s+/).length >= 3
                );

                if (validCommaParts) {
                    workingParts = commaParts.map(p => p.trim());
                }
            }

            
            if (modeLevel === 3) {
                workingParts = workingParts.flatMap(part => {
                    const partWordCount = part.split(/\s+/).length;
                    const conjunctionTrigger = level < 80 ? 24 : 16;

                    if (partWordCount <= conjunctionTrigger) return [part];

                    
                    const conjRegex = /(?<=\s)(and|but|because|although|when|whereas|while|such as|or)\s/i;
                    const split = part.split(conjRegex);

                    if (split.length < 3) return [part];

                    
                    let rebuilt = [];
                    for (let i = 0; i < split.length; i++) {
                        let piece = split[i].trim();
                        if (!piece) continue;

                        if (piece.match(/^(and|but|because|although|when|whereas|while|such as|or)$/i) && i + 1 < split.length) {
                            rebuilt.push(piece + " " + split[i+1].trim());
                            i++; 
                        } else {
                            rebuilt.push(piece);
                        }
                    }

                
                    const isValid = rebuilt.every(piece => 
                        piece.split(/\s+/).length >= 3 && !/^[.,!?]/.test(piece)
                    );

                    return isValid ? rebuilt : [part];
                });
            }

            finalChunks.push(...workingParts);
        });

        return `<p>${finalChunks.map(chunk => `<span class="chunk">${chunk}</span>`).join(" ")}</p>`;
    });

    display.innerHTML = processed.join("");
}

function updateSliderFill() {
    const value = slider.value;
    const snapped = Math.round(value / 10) * 10;
    
    slider.value = snapped;

    const percentage =
        (snapped - slider.min) / (slider.max - slider.min) * 100;

    const styles = getComputedStyle(document.body);

    const fill = styles.getPropertyValue("--slider-fill");
    const track = styles.getPropertyValue("--slider-track");

    slider.style.background =
    `linear-gradient(to right,
    ${fill} 0%,
    ${fill} ${percentage}%,
    ${track} ${percentage}%,
    ${track} 100%)`;

    speedValue.textContent = snapped + "%";
    updateThresholdHighlight(snapped);
}

function updateThresholdHighlight(value) {
    thresholds.forEach(span => span.style.fontWeight = 400);

    if (value < 40)
    thresholds[0].style.fontWeight = 600;
else if (value <= 60)
    thresholds[1].style.fontWeight = 600;
else
    thresholds[2].style.fontWeight = 600;
}

function clearActiveButtons() {
    flowBtn.classList.remove("active");
    emphasisBtn.classList.remove("active");
    chunkBtn.classList.remove("active");
}

textInput.addEventListener("input", () => {
    state.rawText = textInput.value;

    saveState();
    render();
});

slider.addEventListener("input", () => {
    state.rhythm = Number(slider.value);

    saveState();
    render();
});

flowBtn.addEventListener("click", () => {
    setMode("flow");
});

emphasisBtn.addEventListener("click", () => {
    setMode("emphasis");
});

chunkBtn.addEventListener("click", () => {
    setMode("chunk");
});

const themes = ["beige", "blue", "green"];

themeBtn.addEventListener("click", () => {

    const currentIndex = themes.indexOf(state.theme);
    const nextIndex = (currentIndex + 1) % themes.length;

    state.theme = themes[nextIndex];

    saveState();
    render();

    themeBtn.blur();
});

function closeModal() {
    infoOverlay.classList.remove("active");
    document.body.classList.remove("modal-open");
}

infoBtn.addEventListener("click", () => {
    infoOverlay.classList.add("active");
    document.body.classList.add("modal-open");

    infoBtn.blur();
});

closeInfo.addEventListener("click", closeModal);

infoOverlay.addEventListener("click", (e) => {
    if (e.target === infoOverlay) {
        closeModal();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeModal();
    }
});

document.addEventListener("DOMContentLoaded", loadState);
