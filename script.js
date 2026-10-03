const cipherSets = {
  cosmic: [..."abcdefghijklmnopqrstuvwxyz"],
  nature: [..."abcdefghijklmnopqrstuvwxyz"],
  sweet: [..."abcdefghijklmnopqrstuvwxyz"]
};

const emojiSets = {
  cosmic: ["🌙", "⭐", "🪐", "🚀", "☄️", "🌌", "🛸", "👽", "🌠", "✨", "🔭", "🌟", "🌑", "🌕", "🛰️", "💫", "🌛", "🌜", "☀️", "🌞", "🌚", "🌝", "⚡", "🔮", "💎", "🧿"],
  nature: ["🌿", "🍀", "🌵", "🌴", "🌳", "🌲", "🌱", "🍃", "🌾", "🌻", "🌼", "🌷", "🌹", "🌺", "🪷", "🍄", "🌰", "🪴", "🌊", "🐚", "🪸", "🐝", "🦋", "🐞", "🐢", "🦜"],
  sweet: ["🍓", "🍒", "🍑", "🍊", "🍋", "🍍", "🥝", "🍇", "🫐", "🍉", "🍎", "🍐", "🥭", "🍈", "🥥", "🍰", "🧁", "🍭", "🍬", "🍫", "🍩", "🍪", "🥨", "🍯", "🧋", "🍡"]
};

const digitEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
const punctuation = new Map([
  [".", "🔸"], [",", "🔹"], ["!", "❗"], ["?", "❓"], ["'", "🫧"], ['"', "🪞"],
  ["-", "➖"], ["_", "〰️"], [":", "🧭"], [";", "🧩"], ["(", "🌘"], [")", "🌒"],
  ["[", "🟪"], ["]", "🟫"], ["/", "⚔️"], ["@", "📍"], ["#", "🔱"], ["&", "🪢"],
  ["+", "➕"], ["=", "🟰"], ["$", "💰"], ["%", "💯"], ["*", "✳️"], ["\n", "↩️"]
]);
const reversePunctuation = new Map([...punctuation].map(([character, emoji]) => [emoji, character]));
const input = document.querySelector("#message-input");
const output = document.querySelector("#message-output");
const themeSelect = document.querySelector("#theme-select");
const actionButton = document.querySelector("#action-button");
const copyButton = document.querySelector("#copy-button");
const toast = document.querySelector("#toast");
const modes = [...document.querySelectorAll(".mode-button")];
let mode = "encode";
let toastTimeout;

function encode(message, theme) {
  const alphabet = new Map(cipherSets[theme].map((letter, index) => [letter, emojiSets[theme][index]]));

  return [...message].map((character) => {
    if (character === " ") return "▫️";
    if (character === "\t") return "↪️";
    if (/[A-Z]/.test(character)) return `⬆️${alphabet.get(character.toLowerCase())}`;
    if (alphabet.has(character)) return alphabet.get(character);
    if (/\d/.test(character)) return digitEmojis[Number(character)];
    return punctuation.get(character) ?? `🔣${character.codePointAt(0).toString(16)}`;
  }).join(" | ");
}

function decode(message, theme) {
  const alphabet = new Map(emojiSets[theme].map((emoji, index) => [emoji, cipherSets[theme][index]]));
  const tokens = message.split(" | ");
  let uppercaseNext = false;
  let decoded = "";

  for (const token of tokens) {
    if (!token) continue;
    if (token === "⬆️") {
      uppercaseNext = true;
      continue;
    }
    let character;
    if (token.startsWith("⬆️")) {
      uppercaseNext = true;
      character = alphabet.get(token.slice("⬆️".length));
    } else {
      character = alphabet.get(token);
    }

    if (character !== undefined) {
      decoded += uppercaseNext ? character.toUpperCase() : character;
      uppercaseNext = false;
    } else if (token === "▫️") {
      decoded += " ";
      uppercaseNext = false;
    } else if (token === "↪️") {
      decoded += "\t";
      uppercaseNext = false;
    } else if (token === "↩️") {
      decoded += "\n";
      uppercaseNext = false;
    } else {
      const digit = digitEmojis.indexOf(token);
      if (digit !== -1) {
        decoded += String(digit);
      } else if (token.startsWith("🔣")) {
        const codePoint = Number.parseInt(token.slice("🔣".length), 16);
        if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
          decoded += token;
        } else {
          decoded += String.fromCodePoint(codePoint);
        }
      } else {
        decoded += reversePunctuation.get(token) ?? token;
      }
      uppercaseNext = false;
    }
  }
  return decoded;
}

function updateOutput() {
  const text = input.value;
  const result = mode === "encode" ? encode(text, themeSelect.value) : decode(text, themeSelect.value);
  output.textContent = text ? result : "";
  if (!text) output.setAttribute("data-placeholder", "Your emoji code will appear here...");
  else output.removeAttribute("data-placeholder");
  document.querySelector("#char-count").textContent = `${text.length} / 1000`;
  const symbolCount = result ? [...result].length : 0;
  document.querySelector("#output-count").textContent = `${symbolCount} ${symbolCount === 1 ? "symbol" : "symbols"}`;
  document.querySelector("#status-text").textContent = text ? "UPDATED" : "READY";
  copyButton.disabled = !result;
}

function setMode(nextMode) {
  mode = nextMode;
  modes.forEach((button) => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  const isEncode = mode === "encode";
  document.querySelector("#input-label").textContent = isEncode ? "YOUR MESSAGE" : "EMOJI CODE";
  document.querySelector("#input-hint").textContent = isEncode ? "WRITE A SECRET" : "PASTE YOUR CODE";
  document.querySelector("#output-label").textContent = isEncode ? "YOUR EMOJI CODE" : "YOUR MESSAGE";
  input.placeholder = isEncode ? "Type something lovely..." : "Paste an emoji code to decode...";
  document.querySelector("#mode-tip").textContent = isEncode
    ? "Each letter gets its own emoji. Same emoji set = same secret code."
    : "Choose the same emoji set that was used to encode this message.";
  document.querySelector("#action-label").textContent = isEncode ? "Turn into emoji" : "Decode my message";
  document.querySelector("#output-count").textContent = "0 symbols";
  input.value = "";
  updateOutput();
  input.focus();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

modes.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
input.addEventListener("input", updateOutput);
themeSelect.addEventListener("change", updateOutput);
actionButton.addEventListener("click", () => {
  if (!input.value.trim()) {
    showToast(mode === "encode" ? "Write a message first ✍️" : "Paste an emoji code first 🪄");
    input.focus();
    return;
  }
  updateOutput();
  showToast(mode === "encode" ? "Your secret code is ready ✨" : "Message decoded successfully ✨");
});
document.querySelector("#clear-button").addEventListener("click", () => {
  input.value = "";
  updateOutput();
  input.focus();
});
copyButton.addEventListener("click", async () => {
  if (!output.textContent) return;
  try {
    await navigator.clipboard.writeText(output.textContent);
    showToast("Copied to clipboard ✨");
  } catch (error) {
    showToast("Copy unavailable — select the result and copy it manually.");
  }
});

updateOutput();

