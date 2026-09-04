// 📐 MATHJAX CONFIGURATION
window.MathJax = {
  tex: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"]]
  },
  svg: { fontCache: "global" }
};

let entryMode = "sequential"; // "sequential" or "simultaneous"
let payOffspring = false;     // false = standard, true = paid {2} offspring

function setOffspring(val) {
  payOffspring = Boolean(val);
  document.getElementById('offspringNo').classList.toggle('active', !payOffspring);
  document.getElementById('offspringYes').classList.toggle('active', payOffspring);
  updateResult();
}

// 🧮 CALCULATION CORE WITH BIGINT (prevents integer overflow)
function calcHareMath(H, C, T, A, O, mode, payOffspring) {
  H = BigInt(H);
  C = BigInt(C);
  T = BigInt(T);
  A = BigInt(A);
  O = BigInt(O);

  const perToken = (3n ** O) * (2n ** T);
  const trigsPerHare = A + 1n;

  let totalRabbits = 0n;
  let offspringHaresCreated = 0n;
  let finalHaresOnBoard = H;

  if (!payOffspring) {
    const totalTriggers = C * trigsPerHare;
    if (C === 1n) {
      totalRabbits = trigsPerHare * H * perToken;
    } else if (mode === "simultaneous") {
      const otherHares = (H + C - 1n) > 0n ? (H + C - 1n) : 0n;
      totalRabbits = C * trigsPerHare * otherHares * perToken;
    } else {
      // Sequential
      const sumHares = C * H + (C * (C - 1n)) / 2n;
      totalRabbits = trigsPerHare * perToken * sumHares;
    }
    finalHaresOnBoard = H + C;
    return {
      H, C, T, A, O, mode, payOffspring,
      perToken,
      trigsPerHare,
      totalTriggers,
      totalRabbits,
      offspringHaresCreated: 0n,
      nontokenHaresOnBoard: H + C,
      finalHaresOnBoard
    };
  } else {
    // WITH OFFSPRING PAID
    const offspringTokensPerCast = trigsPerHare * perToken;

    if (C === 1n || mode === "sequential") {
      let currentHares = H;
      for (let k = 0n; k < C; k++) {
        // Step 1: Each Offspring trigger creates perToken 1/1 Hare Apparent token copies
        for (let n = 1n; n <= trigsPerHare; n++) {
          const otherHaresSeen = currentHares + n * perToken;
          const rabFromTrigger = (perToken ** 2n) * trigsPerHare * otherHaresSeen;
          totalRabbits += rabFromTrigger;
        }

        // Step 2: Original Hare's Make Rabbits triggers resolve last
        const otherHaresSeenByOriginal = currentHares + offspringTokensPerCast;
        const rabFromOriginal = trigsPerHare * otherHaresSeenByOriginal * perToken;
        totalRabbits += rabFromOriginal;

        currentHares += 1n + offspringTokensPerCast;
        offspringHaresCreated += offspringTokensPerCast;
      }
      finalHaresOnBoard = currentHares;
    } else {
      // Simultaneous entry with Offspring
      offspringHaresCreated = C * offspringTokensPerCast;
      finalHaresOnBoard = H + C + offspringHaresCreated;
      const otherHares = finalHaresOnBoard > 1n ? finalHaresOnBoard - 1n : 0n;
      const totalHaresTriggering = C + offspringHaresCreated;
      const totalTriggers = totalHaresTriggering * trigsPerHare;
      totalRabbits = totalTriggers * otherHares * perToken;
    }

    const totalTriggers = (C + offspringHaresCreated) * trigsPerHare;

    return {
      H, C, T, A, O, mode, payOffspring,
      perToken,
      trigsPerHare,
      totalTriggers,
      totalRabbits,
      offspringHaresCreated,
      nontokenHaresOnBoard: H + C,
      finalHaresOnBoard
    };
  }
}

function readInputs() {
  const H = Math.max(0, parseInt(document.getElementById('Hnum').value, 10) || 0);
  const C = Math.max(1, parseInt(document.getElementById('Cnum').value, 10) || 1);
  const T = Math.max(0, parseInt(document.getElementById('Tnum').value, 10) || 0);
  const A = Math.max(0, parseInt(document.getElementById('Anum').value, 10) || 0);
  const O = Math.max(0, parseInt(document.getElementById('Onum').value, 10) || 0);
  const R = Math.max(0, parseInt(document.getElementById('Rnum').value, 10) || 0);
  return { H, C, T, A, O, R };
}

function syncInputs(id) {
  document.getElementById(id + "num").value = document.getElementById(id).value;
  checkModeToggle();
  updateResult();
}

function syncSliders(id) {
  const slider = document.getElementById(id);
  const numInput = document.getElementById(id + "num");
  const val = parseInt(numInput.value, 10);
  if (Number.isNaN(val)) return;

  const min = parseInt(slider.min, 10);
  const max = parseInt(slider.max, 10);
  slider.value = Math.min(Math.max(val, min), max);
  checkModeToggle();
  updateResult();
}

function checkModeToggle() {
  const C = parseInt(document.getElementById('Cnum').value, 10) || 1;
  const wrap = document.getElementById('modeToggleWrap');
  if (C > 1) {
    wrap.style.display = 'flex';
  } else {
    wrap.style.display = 'none';
  }
}

function setEntryMode(mode) {
  entryMode = mode;
  document.getElementById('modeSequential').classList.toggle('active', mode === 'sequential');
  document.getElementById('modeSimultaneous').classList.toggle('active', mode === 'simultaneous');
  updateResult();
}

function updateResult() {
  const { H, C, T, A, O, R } = readInputs();
  const data = calcHareMath(H, C, T, A, O, entryMode, payOffspring);
  const grandRabbits = data.totalRabbits + BigInt(R);
  const finalHares = data.finalHaresOnBoard;

  // Power & toughness:
  // Non-token Hares are 2/2.
  // Offspring token Hares are 1/1.
  // Rabbit tokens are 1/1.
  const nontokenHares = data.nontokenHaresOnBoard;
  const offspringHares = data.offspringHaresCreated;
  const harePower = nontokenHares * 2n + offspringHares;
  const rabbitPower = grandRabbits;
  const totalPower = harePower + rabbitPower;

  const resultBox = document.getElementById("result");
  let html = `Rabbits created: ${data.totalRabbits.toLocaleString()}`;
  
  if (R > 0 || grandRabbits > data.totalRabbits) {
    html += `<span class="result-sub">🐰 Total Rabbits now: <strong>${grandRabbits.toLocaleString()}</strong></span>`;
  }
  
  html += `
    <div style="margin-top: 8px;">
      <span class="result-stat-pill">🐇 Total Hares: ${finalHares.toLocaleString()}${offspringHares > 0n ? ` (${offspringHares.toLocaleString()} from Offspring)` : ''}</span>
      <span class="result-stat-pill">⚔️ Total Board Power: ${totalPower.toLocaleString()}</span>
      <span class="result-stat-pill">🛡️ Total Toughness: ${totalPower.toLocaleString()}</span>
    </div>
  `;

  resultBox.innerHTML = html;
}

function buildStackDisplay(groups) {
  const keys = Object.keys(groups).filter(k => groups[k] > 0n || groups[k] > 0);
  if (!keys.length) return "";
  let html = '<div class="stack-line">';
  for (let i = 0; i < keys.length; i++) {
    html += `<div class="stack-box"><strong>${groups[keys[i]].toLocaleString()}</strong>× ${keys[i]}</div>`;
    if (i < keys.length - 1) html += '<div class="stack-arrow">←</div>';
  }
  html += '</div>';
  return html;
}

function resolveStack() {
  const btn = document.getElementById("resolveBtn");
  btn.textContent = "Resolving...";
  btn.classList.add("resolving");

  const { H, C, T, A, O, R } = readInputs();
  const data = calcHareMath(H, C, T, A, O, entryMode, payOffspring);
  const grandRabbits = data.totalRabbits + BigInt(R);

  updateResult();

  const perToken = data.perToken;
  const trigs = data.trigsPerHare;
  const totalCreated = data.totalRabbits;

  // 📝 1. STARTING CONDITIONS
  let nar = `<p class="section-heading">Starting Conditions:</p>
  <ul>
    <li>${perToken === 1n ? "Each token-creating effect creates its normal number of tokens (no doublers or triplers)." : `Each token you create will be multiplied by <strong>${perToken.toLocaleString()}×</strong> (<em>3<sup>${O}</sup> × 2<sup>${T}</sup></em>).`}</li>
    <li>Each Hare Apparent Enter the Battlefield ability will trigger <strong>${trigs.toLocaleString()}</strong> time${trigs > 1n ? "s" : ""} (<em>1 base + ${A} additional trigger${A === 1 ? "" : "s"}</em>).</li>
    <li>You start with <strong>${H}</strong> <em>Hare Apparent${H === 1 ? "" : "s"}</em> and <strong>${R}</strong> Rabbit token${R === 1 ? "" : "s"} on the battlefield.</li>
    <li>Offspring ({2}): <strong>${payOffspring ? "PAID — creating 1/1 token copies of Hare Apparent" : "Not Paid (Standard)"}</strong>.</li>
  </ul>`;

  // 📝 2. ENTERING & STACK PLACEMENT
  if (!payOffspring) {
    if (C === 1) {
      nar += `<p class="section-heading">You cast a Hare Apparent (Standard / No Offspring) and it resolves.</p>
      <ul>
        <li>It enters the battlefield as a regular 2/2 Rabbit creature.</li>
        <li>It triggers its ETB ability <strong>${trigs.toLocaleString()}</strong> time${trigs > 1n ? "s" : ""}, placing the triggers onto the stack.</li>
      </ul>`;

      let stack = { "Make Rabbits ETB Trigger": trigs };
      nar += buildStackDisplay(stack);

      nar += `<p class="section-heading">Resolving the Stack</p>
      <ul>
        <li>The entering Hare Apparent checks how many <strong>other</strong> creatures you control named <em>Hare Apparent</em>.</li>
        <li>It sees <strong>${H}</strong> other <em>Hare Apparent${H === 1 ? "" : "s"}</em> on the battlefield.</li>
        <li>Each trigger makes <strong>${H}</strong> base Rabbits × <strong>${perToken.toLocaleString()}</strong> token multiplier = <strong>${(BigInt(H) * perToken).toLocaleString()}</strong> Rabbit token${(BigInt(H) * perToken) === 1n ? "" : "s"} per trigger.</li>
        <li>All <strong>${trigs.toLocaleString()}</strong> trigger${trigs > 1n ? "s" : ""} resolve sequentially, creating a total of <strong>${totalCreated.toLocaleString()}</strong> 1/1 white Rabbit creature token${totalCreated === 1n ? "" : "s"}!</li>
      </ul>`;

      if (H === 0) {
        nar += `<div class="stack-update">💡 Note: Hare Apparent only counts <em>other</em> creatures named Hare Apparent. Since this was your first one, it saw 0 other Hares and made 0 Rabbits — but the next one you cast will see this Hare and start multiplying!</div>`;
      }

    } else if (entryMode === "simultaneous") {
      nar += `<p class="section-heading"><strong>${C}</strong> Hare Apparents enter the battlefield simultaneously!</p>
      <ul>
        <li>E.g., via mass reanimation or blink (<em>Patriarch's Bidding</em>, <em>Raise the Past</em>, <em>Return to the Ranks</em>).</li>
        <li>All <strong>${C}</strong> Hares enter together, bringing total Hares on the battlefield to <strong>${data.finalHaresOnBoard.toLocaleString()}</strong>.</li>
        <li>Each entering Hare triggers <strong>${trigs.toLocaleString()}</strong> time${trigs > 1n ? "s" : ""}, putting a total of <strong>${data.totalTriggers.toLocaleString()}</strong> Make Rabbits triggers on the stack!</li>
      </ul>`;

      let stack = { "Make Rabbits ETB Trigger": data.totalTriggers };
      nar += buildStackDisplay(stack);

      const otherHares = data.finalHaresOnBoard - 1n;
      const rabbitsPerTrigger = otherHares * perToken;

      nar += `<p class="section-heading">Simultaneous Triggers Resolution</p>
      <ul>
        <li>When each trigger resolves, it checks how many <strong>other</strong> creatures you control named <em>Hare Apparent</em>.</li>
        <li>Since all ${C} Hares are already on the battlefield, each entering Hare sees all existing Hares plus the other entering Hares: <strong>${otherHares.toLocaleString()}</strong> other Hares!</li>
        <li>Each trigger creates <strong>${otherHares.toLocaleString()}</strong> × <strong>${perToken.toLocaleString()}</strong> = <strong>${rabbitsPerTrigger.toLocaleString()}</strong> Rabbit tokens.</li>
        <li>Across all <strong>${data.totalTriggers.toLocaleString()}</strong> triggers, this creates <strong>${totalCreated.toLocaleString()}</strong> total Rabbit tokens!</li>
      </ul>`;

    } else {
      // Sequential
      nar += `<p class="section-heading"><strong>${C}</strong> Hare Apparents enter sequentially (one-by-one / Ripple)</p>
      <ul>
        <li>E.g., cast one after another or cascading with <em>Thrumming Stone</em> (Ripple 4).</li>
        <li>Each Hare enters, resolves all of its triggers, and increases the Hare count on the battlefield before the next one enters!</li>
      </ul>`;

      let currentHares = BigInt(H);
      const maxDetailed = 5;
      const isCondensed = C > maxDetailed;

      for (let k = 1; k <= C; k++) {
        const otherSeen = currentHares;
        const rabForThisHare = trigs * otherSeen * perToken;
        currentHares += 1n;

        if (!isCondensed || k <= 3 || k === C) {
          nar += `<p class="section-heading" style="font-size:0.95em;">Hare #${k} Enters (Current Board: ${currentHares.toLocaleString()} Hares)</p>
          <ul>
            <li>Enters and sees <strong>${otherSeen.toLocaleString()}</strong> other <em>Hare Apparent${otherSeen === 1n ? "" : "s"}</em>.</li>
            <li>Places <strong>${trigs.toLocaleString()}</strong> Make Rabbits trigger${trigs > 1n ? "s" : ""} on the stack.</li>
            <li>Each trigger makes ${(otherSeen * perToken).toLocaleString()} Rabbit token${(otherSeen * perToken) === 1n ? "" : "s"}, yielding <strong>${rabForThisHare.toLocaleString()}</strong> Rabbit tokens from this Hare.</li>
          </ul>`;
        } else if (k === 4) {
          nar += `<p class="section-heading" style="font-size:0.9em; font-style:italic; color:#725a2e;">... Hares #4 through #${C - 1} enter sequentially and each sees an increasing number of Hares ...</p>`;
        }
      }
    }
  } else {
    // WITH OFFSPRING
    if (C === 1) {
      nar += `<p class="section-heading">You cast a Hare Apparent paying its Offspring cost {2}.</p>
      <ul>
        <li>The original 2/2 Hare Apparent enters the battlefield.</li>
        <li>It puts <strong>${trigs.toLocaleString()}</strong> Offspring triggers and <strong>${trigs.toLocaleString()}</strong> Make Rabbits triggers on the stack.</li>
        <li>You stack them so all Offspring triggers resolve first, followed by the original Make Rabbits triggers.</li>
      </ul>`;

      let stack = { "Offspring": trigs, "Make Rabbits (Original)": trigs };
      nar += buildStackDisplay(stack);

      for (let n = 1; n <= Number(trigs); n++) {
        const tokenHares = perToken;
        const totalMake = tokenHares * trigs;
        const totalOtherSeen = BigInt(H) + perToken * BigInt(n);
        const rabbitsFromThisOffspring = (perToken ** 2n) * totalOtherSeen * trigs;

        nar += `<p class="section-heading">Offspring Trigger #${n} Resolves</p>
        <ul>
          <li>Creates <strong>${tokenHares.toLocaleString()}</strong> 1/1 white <em>Hare Apparent</em> token copy${tokenHares === 1n ? "" : "ies"}.</li>
          <li>Each token copy enters and triggers its own ETB <strong>${trigs.toLocaleString()}</strong> times, adding <strong>${totalMake.toLocaleString()}</strong> Make Rabbits triggers on top of the stack.</li>
          <li>Each token sees <strong>${totalOtherSeen.toLocaleString()}</strong> other Hares on the battlefield.</li>
          <li>Resolving these triggers creates <strong>${rabbitsFromThisOffspring.toLocaleString()}</strong> 1/1 white Rabbit tokens!</li>
        </ul>`;
      }

      const otherHaresSeenByOriginal = BigInt(H) + perToken * trigs;
      const rabFromOriginal = trigs * otherHaresSeenByOriginal * perToken;

      nar += `<p class="section-heading">Original Make Rabbits Triggers Resolve</p>
      <ul>
        <li>Now the original Hare Apparent's <strong>${trigs.toLocaleString()}</strong> Make Rabbits triggers resolve.</li>
        <li>It sees all starting Hares plus all Offspring token copies: <strong>${otherHaresSeenByOriginal.toLocaleString()}</strong> other Hares!</li>
        <li>Each trigger makes ${(otherHaresSeenByOriginal * perToken).toLocaleString()} Rabbit tokens, creating <strong>${rabFromOriginal.toLocaleString()}</strong> Rabbit tokens!</li>
      </ul>`;
    } else {
      nar += `<p class="section-heading"><strong>${C}</strong> Hare Apparents enter with Offspring paid!</p>
      <ul>
        <li>Each cast creates 1 original Hare plus <strong>${(trigs * perToken).toLocaleString()}</strong> 1/1 token copies from Offspring.</li>
        <li>All Offspring token copies and original Hares resolve their triggers sequentially, generating <strong>${totalCreated.toLocaleString()}</strong> Rabbit tokens!</li>
      </ul>`;
    }
  }

  // 📝 3. FINAL BOARD STATE
  const finalHares = data.finalHaresOnBoard;
  const nontokenHares = data.nontokenHaresOnBoard;
  const offspringHares = data.offspringHaresCreated;
  const harePower = nontokenHares * 2n + offspringHares;
  const rabbitPower = grandRabbits;
  const totalPower = harePower + rabbitPower;

  nar += `<p class="section-heading">Final Board State</p>
  <ul>
    <li>When all spells and abilities finish resolving, you control:
      <ul>
        <li><strong>${nontokenHares.toLocaleString()}</strong> regular 2/2 <em>Hare Apparent${nontokenHares === 1n ? "" : "s"}</em></li>
        ${offspringHares > 0n ? `<li><strong>${offspringHares.toLocaleString()}</strong> 1/1 token copy${offspringHares === 1n ? "" : "ies"} of <em>Hare Apparent</em> (from Offspring)</li>` : ""}
        <li><strong>${grandRabbits.toLocaleString()}</strong> 1/1 white Rabbit creature token${grandRabbits === 1n ? "" : "s"}${R > 0 ? ` (<strong>${totalCreated.toLocaleString()}</strong> newly made + <strong>${R}</strong> preexisting)` : ""}</li>
        <li><strong>${(finalHares + grandRabbits).toLocaleString()}</strong> total creatures representing <strong>${totalPower.toLocaleString()}</strong> power and <strong>${totalPower.toLocaleString()}</strong> toughness on the board!</li>
      </ul>
    </li>
  </ul>`;

  const narrativeBox = document.getElementById("narrative");
  narrativeBox.innerHTML = nar;

  // Smooth scroll and unroll animation
  narrativeBox.classList.remove("show-scroll");
  void narrativeBox.offsetWidth; // trigger reflow
  narrativeBox.classList.add("show-scroll");

  // MathJax re-render if available
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([narrativeBox]).catch(() => {}).finally(() => {
      btn.textContent = "Resolve Stack";
      btn.classList.remove("resolving");
    });
  } else {
    setTimeout(() => {
      btn.textContent = "Resolve Stack";
      btn.classList.remove("resolving");
    }, 400);
  }
}

// ⚡ PRESETS HANDLER
function applyPreset(name) {
  if (name === 'standard') {
    setOffspring(false);
    document.getElementById('H').value = 3;
    document.getElementById('Hnum').value = 3;
    document.getElementById('C').value = 1;
    document.getElementById('Cnum').value = 1;
    document.getElementById('T').value = 0;
    document.getElementById('Tnum').value = 0;
    document.getElementById('O').value = 0;
    document.getElementById('Onum').value = 0;
    document.getElementById('A').value = 0;
    document.getElementById('Anum').value = 0;
  } else if (name === 'offspring') {
    setOffspring(true);
    document.getElementById('H').value = 3;
    document.getElementById('Hnum').value = 3;
    document.getElementById('C').value = 1;
    document.getElementById('Cnum').value = 1;
    document.getElementById('T').value = 0;
    document.getElementById('Tnum').value = 0;
    document.getElementById('O').value = 0;
    document.getElementById('Onum').value = 0;
    document.getElementById('A').value = 0;
    document.getElementById('Anum').value = 0;
  }
  checkModeToggle();
  updateResult();
}

function addTrigger(card) {
  const aInput = document.getElementById('Anum');
  const cur = parseInt(aInput.value, 10) || 0;
  aInput.value = cur + 1;
  syncSliders('A');
}

function addDoubler() {
  const tInput = document.getElementById('Tnum');
  const cur = parseInt(tInput.value, 10) || 0;
  tInput.value = cur + 1;
  syncSliders('T');
}

function addTripler() {
  const oInput = document.getElementById('Onum');
  const cur = parseInt(oInput.value, 10) || 0;
  oInput.value = cur + 1;
  syncSliders('O');
}

function addEnteringHare() {
  const cInput = document.getElementById('Cnum');
  const cur = parseInt(cInput.value, 10) || 1;
  cInput.value = cur + 1;
  syncSliders('C');
}

function resetInputs() {
  setOffspring(false);
  ['H', 'T', 'O', 'A'].forEach(id => {
    document.getElementById(id).value = 0;
    document.getElementById(id + 'num').value = 0;
  });
  document.getElementById('C').value = 1;
  document.getElementById('Cnum').value = 1;
  document.getElementById('Rnum').value = 0;
  entryMode = 'sequential';
  document.getElementById('modeSequential').classList.add('active');
  document.getElementById('modeSimultaneous').classList.remove('active');
  checkModeToggle();
  updateResult();
  const narrativeBox = document.getElementById("narrative");
  narrativeBox.classList.remove("show-scroll");
  narrativeBox.style.display = "none";
}

function copyBreakdown() {
  const { H, C, T, A, O, R } = readInputs();
  const data = calcHareMath(H, C, T, A, O, entryMode, payOffspring);
  const grandRabbits = data.totalRabbits + BigInt(R);
  const finalHares = data.finalHaresOnBoard;
  const totalPower = data.nontokenHaresOnBoard * 2n + data.offspringHaresCreated + grandRabbits;

  const text = `🐇 HareBrain 🧠 — Hare Apparent Calculation
• Offspring Paid: ${payOffspring ? 'Yes ({2})' : 'No (Standard)'}
• Existing Hares on board: ${H}
• Hares Entering: ${C} (${C > 1 ? entryMode : 'single cast'})
• Token Multiplier: ${data.perToken}x (Doublers: ${T}, Triplers: ${O})
• Additional Triggers: ${A} (Total triggers per Hare: ${data.trigsPerHare})
• Existing Rabbits: ${R}
────────────────────────────────────────
🐇 Rabbits Created: ${data.totalRabbits.toLocaleString()}
🐰 Total Rabbits on Board: ${grandRabbits.toLocaleString()}
🐇 Total Hare Apparents: ${finalHares.toLocaleString()}${data.offspringHaresCreated > 0n ? ` (${data.offspringHaresCreated.toLocaleString()} from Offspring)` : ''}
⚔️ Total Board Power/Toughness: ${totalPower.toLocaleString()}/${totalPower.toLocaleString()}
💡 Original concept by solveforhare.com | Built with AI`;

  navigator.clipboard.writeText(text).then(() => {
    alert("Board breakdown copied to clipboard!");
  }).catch(() => {
    prompt("Copy breakdown:", text);
  });
}

// 🌓 THEME MANAGEMENT (LIGHT / DARK)
function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  if (document.body) {
    document.body.setAttribute("data-theme", isDark ? "dark" : "light");
    if (isDark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }
  const icon = document.getElementById("themeIcon");
  const text = document.getElementById("themeText");
  const btn = document.getElementById("themeToggleBtn");
  if (icon) icon.textContent = isDark ? "☀️" : "🌙";
  if (text) text.textContent = isDark ? "Theme: Light" : "Theme: Dark";
  if (btn) btn.title = isDark ? "Active: Dark Mode. Click to switch to Light Theme." : "Active: Light Mode. Click to switch to Dark Theme.";
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  try {
    localStorage.setItem("harebrain_theme", newTheme);
  } catch (e) {}
}

function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem("harebrain_theme");
  } catch (e) {}
  if (!saved) {
    saved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  applyTheme(saved);
}

// 🧩 INPUT FOCUS / CLEAR LOGIC
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener("focus", () => {
      if (input.value === "0") input.value = "";
    });
    input.addEventListener("blur", () => {
      if (input.value.trim() === "") {
        input.value = input.id === "Cnum" ? "1" : "0";
        const sliderId = input.id.replace("num", "");
        if (document.getElementById(sliderId)) {
          syncSliders(sliderId);
        }
        updateResult();
      }
    });
  });

  checkModeToggle();
  updateResult();
});
