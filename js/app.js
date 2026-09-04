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
function calcHareMath(H, C, T, A, O, mode, payOffspring, D = 0, L = 0) {
  H = BigInt(H);
  C = BigInt(C);
  T = BigInt(T);
  A = BigInt(A);
  O = BigInt(O);
  const D_val = BigInt(D || 0);
  const L_val = BigInt(L || 0);

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
  }

  const totalTriggers = (C + offspringHaresCreated) * trigsPerHare;
  const enteringCreatures = C + offspringHaresCreated + totalRabbits;
  const totalDamage = D_val * enteringCreatures;
  const totalLife = L_val * enteringCreatures;

  return {
    H, C, T, A, O, mode, payOffspring,
    perToken,
    trigsPerHare,
    totalTriggers,
    totalRabbits,
    offspringHaresCreated,
    nontokenHaresOnBoard: H + C,
    finalHaresOnBoard,
    D: D_val,
    L: L_val,
    enteringCreatures,
    totalDamage,
    totalLife
  };
}

function readInputs() {
  const H = Math.max(0, parseInt(document.getElementById('Hnum')?.value, 10) || 0);
  const C = Math.max(1, parseInt(document.getElementById('Cnum')?.value, 10) || 1);
  const T = Math.max(0, parseInt(document.getElementById('Tnum')?.value, 10) || 0);
  const A = Math.max(0, parseInt(document.getElementById('Anum')?.value, 10) || 0);
  const O = Math.max(0, parseInt(document.getElementById('Onum')?.value, 10) || 0);
  const R = Math.max(0, parseInt(document.getElementById('Rnum')?.value, 10) || 0);
  const D = Math.max(0, parseInt(document.getElementById('Dnum')?.value, 10) || 0);
  const L = Math.max(0, parseInt(document.getElementById('Lnum')?.value, 10) || 0);
  return { H, C, T, A, O, R, D, L };
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

let lastMilestoneTier = null;

// 💥 HARE-POCALYPSE MILESTONE DETECTOR
function getMilestone(rabbits) {
  if (rabbits < 10n) return null;
  if (rabbits < 25n) {
    return {
      tier: "tier-1",
      title: "🐇 The Burrow Stirs!",
      subtitle: "“Wait, how many rabbits did you just say?”"
    };
  }
  if (rabbits < 50n) {
    return {
      tier: "tier-2",
      title: "🐰 Multiplying Like Rabbits!",
      subtitle: "The table begins to nervously count their blockers."
    };
  }
  if (rabbits < 100n) {
    return {
      tier: "tier-3",
      title: "🥕 A Warren Awakens!",
      subtitle: "Opponents start frantically searching their hands for a board wipe."
    };
  }
  if (rabbits < 1000n) {
    return {
      tier: "tier-4",
      title: "⚠️ Critical Hare Mass!",
      subtitle: "Judge call incoming: “Does anyone at this LGS have 100 dice?”"
    };
  }
  if (rabbits < 10000n) {
    return {
      tier: "tier-5",
      title: "🚨 Warren Breach!",
      subtitle: "“Why you getting mad at my 4 vampires — you're about to make like 1,000 rabbits?”"
    };
  }
  if (rabbits < 100000n) {
    return {
      tier: "tier-6",
      title: "🌪️ Exponential Lagomorpha!",
      subtitle: "This is no longer Magic: The Gathering. This is an advanced math lecture."
    };
  }
  if (rabbits < 1000000n) {
    return {
      tier: "tier-7",
      title: "💥 HARE-POCALYPSE UNLEASHED!",
      subtitle: "The Dragon Shield sleeves are melting from the sheer friction of entering tokens."
    };
  }
  if (rabbits < 1000000000n) {
    return {
      tier: "tier-8",
      title: "🪐 Planetary Rabbit Density!",
      subtitle: "The entire continent of Dominaria is submerged beneath 1/1 white Rabbits."
    };
  }
  if (rabbits < 10n ** 80n) {
    return {
      tier: "tier-9",
      title: "🌌 Cosmic Hare Singularity!",
      subtitle: "Gravitational collapse imminent. Space-time bends around the sheer mass of rabbits."
    };
  }
  return {
    tier: "tier-cosmic",
    title: "⚛️ Omniversal Warren!",
    subtitle: "There are more Rabbits on your battlefield than fundamental particles in the observable universe (~10⁸⁰). Elesh Norn wept."
  };
}

// 🐇 CONFETTI & RABBIT SHOWER
function launchRabbitShower(customSymbols) {
  let container = document.getElementById("confetti-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "confetti-container";
    document.body.appendChild(container);
  }
  const symbols = customSymbols || ["🐇", "🐰", "✨", "🥕", "💥", "🧠", "🔥"];
  const count = 35;
  const vw = window.innerWidth;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "confetti-particle";
    p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    const xStart = (Math.random() * vw).toFixed(0) + "px";
    const xEnd = (parseFloat(xStart) + (Math.random() * 200 - 100)).toFixed(0) + "px";
    const duration = (1.8 + Math.random() * 1.5).toFixed(2) + "s";
    const delay = (Math.random() * 0.4).toFixed(2) + "s";
    const size = (22 + Math.random() * 16).toFixed(0) + "px";
    const rot = (Math.random() * 720 - 360).toFixed(0) + "deg";

    p.style.setProperty("--x-start", xStart);
    p.style.setProperty("--x-end", xEnd);
    p.style.setProperty("--fall-duration", duration);
    p.style.setProperty("--particle-size", size);
    p.style.setProperty("--rot-end", rot);
    p.style.animationDelay = delay;

    container.appendChild(p);
    setTimeout(() => {
      p.remove();
    }, 3500);
  }
}

function updateResult() {
  const { H, C, T, A, O, R, D, L } = readInputs();
  const data = calcHareMath(H, C, T, A, O, entryMode, payOffspring, D, L);
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

  if (data.D > 0n) {
    const isLethal = data.totalDamage >= 40n;
    const isWipe = data.totalDamage >= 120n;
    html += `
      <div class="result-burn-pill ${isLethal ? 'lethal' : ''}">
        🔥 Deals <strong>${data.totalDamage.toLocaleString()}</strong> damage to each opponent!${isWipe ? ' 💀 Table Wipe!' : isLethal ? ' 💀 Lethal!' : ''}
      </div>
    `;
  }

  if (data.L > 0n) {
    html += `
      <div class="result-life-pill">
        ❤️ You gain <strong>${data.totalLife.toLocaleString()}</strong> life!
      </div>
    `;
  }

  resultBox.innerHTML = html;

  // 💥 Milestone Badge
  const badge = document.getElementById("milestoneBadge");
  if (badge) {
    const m = getMilestone(grandRabbits);
    if (m) {
      badge.style.display = "block";
      badge.innerHTML = `<span class="milestone-title">${m.title}</span><span class="milestone-subtitle">${m.subtitle}</span>`;
      if (m.tier !== lastMilestoneTier) {
        lastMilestoneTier = m.tier;
        badge.classList.remove("pop-badge");
        void badge.offsetWidth;
        badge.classList.add("pop-badge");
        launchRabbitShower(["🐇", "✨", "🎉"]);
      }
    } else {
      badge.style.display = "none";
      lastMilestoneTier = null;
    }
  }

  updateUrlState();
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

  const { H, C, T, A, O, R, D, L } = readInputs();
  const data = calcHareMath(H, C, T, A, O, entryMode, payOffspring, D, L);
  const grandRabbits = data.totalRabbits + BigInt(R);

  updateResult();

  if (grandRabbits > 0n || data.totalDamage > 0n) {
    const symbols = data.totalDamage >= 40n
      ? ["🔥", "💀", "🐇", "💥", "🌋", "✨"]
      : ["🐇", "🐰", "✨", "🥕", "💥", "🧠"];
    launchRabbitShower(symbols);
  }

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
    ${D > 0 || L > 0 ? `<li>ETB Synergy: <strong>${D > 0 ? `${D} damage per creature` : ''}${D > 0 && L > 0 ? ' & ' : ''}${L > 0 ? `${L} life gained per creature` : ''}</strong>.</li>` : ''}
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

  // 📝 3. ETB DAMAGE & LIFE GAIN
  if (D > 0 || L > 0) {
    nar += `<p class="section-heading">🩸 ETB Damage &amp; Lifegain Triggers</p>
    <ul>
      <li>Total creatures entering the battlefield this turn: <strong>${data.enteringCreatures.toLocaleString()}</strong> (${C} cast${C > 1 ? 's' : ''}${offspringHares > 0n ? ` + ${offspringHares.toLocaleString()} Offspring token copy${offspringHares === 1n ? '' : 'ies'}` : ''} + ${totalCreated.toLocaleString()} Rabbit token${totalCreated === 1n ? '' : 's'}).</li>`;
    if (D > 0) {
      nar += `<li><strong>Damage to Each Opponent:</strong> With ${D} damage per entering creature (<em>Purphoros</em>, <em>Impact Tremors</em>, <em>Mirkwood Bats</em>), you deal <strong>${data.totalDamage.toLocaleString()}</strong> direct damage to each opponent!${data.totalDamage >= 120n ? ' 💀 <em>(Entire table wiped out!)</em>' : data.totalDamage >= 40n ? ' 💀 <em>(Lethal damage to a player!)</em>' : ''}</li>`;
    }
    if (L > 0) {
      nar += `<li><strong>Life Gained:</strong> With ${L} life gained per entering creature (<em>Soul Warden</em>, <em>Essence Warden</em>), you gain <strong>${data.totalLife.toLocaleString()}</strong> life!</li>`;
    }
    nar += `</ul>`;
  }

  // 📝 4. FINAL BOARD STATE
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

  const m = getMilestone(grandRabbits);
  if (m) {
    nar += `
      <div class="milestone-badge" style="margin-top: 14px;">
        <span class="milestone-title">${m.title}</span>
        <span class="milestone-subtitle">${m.subtitle}</span>
      </div>
    `;
  }

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
    document.getElementById('D').value = 0;
    document.getElementById('Dnum').value = 0;
    document.getElementById('L').value = 0;
    document.getElementById('Lnum').value = 0;
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
    document.getElementById('D').value = 0;
    document.getElementById('Dnum').value = 0;
    document.getElementById('L').value = 0;
    document.getElementById('Lnum').value = 0;
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

function addDmg(amt) {
  const input = document.getElementById('Dnum');
  if (!input) return;
  const cur = parseInt(input.value, 10) || 0;
  input.value = cur + amt;
  syncSliders('D');
  if (amt === 1) {
    showToast("🔥 Added Impact Tremors (+1 ETB Damage)!");
  } else if (amt === 2) {
    showToast("🌋 Added Purphoros (+2 ETB Damage)!");
  } else {
    showToast(`🔥 Added +${amt} ETB Damage!`);
  }
}

function addLife(amt) {
  const input = document.getElementById('Lnum');
  if (!input) return;
  const cur = parseInt(input.value, 10) || 0;
  input.value = cur + amt;
  syncSliders('L');
  showToast(`❤️ Added Soul Warden (+${amt} ETB Life Gain)!`);
}

function resetInputs() {
  setOffspring(false);
  lastMilestoneTier = null;
  ['H', 'T', 'O', 'A', 'D', 'L'].forEach(id => {
    const slider = document.getElementById(id);
    const numInput = document.getElementById(id + 'num');
    if (slider) slider.value = 0;
    if (numInput) numInput.value = 0;
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
  const badge = document.getElementById("milestoneBadge");
  if (badge) badge.style.display = "none";
}

// 🍞 TOAST NOTIFICATION
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  if (window._toastTimeout) clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// 🔗 URL STATE MANAGEMENT (DEEP LINKING)
function updateUrlState() {
  const { H, C, T, A, O, R, D, L } = readInputs();
  const params = new URLSearchParams();
  if (H > 0) params.set("h", H);
  if (C > 1) params.set("c", C);
  if (T > 0) params.set("t", T);
  if (O > 0) params.set("o", O);
  if (A > 0) params.set("a", A);
  if (R > 0) params.set("r", R);
  if (D > 0) params.set("d", D);
  if (L > 0) params.set("l", L);
  if (payOffspring) params.set("offspring", "1");
  if (C > 1 && entryMode === "simultaneous") params.set("mode", "sim");

  const qs = params.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", newUrl);
}

function loadUrlState() {
  let params = new URLSearchParams(window.location.search);
  if (!params.toString() && window.location.hash) {
    params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  }
  if (!params.toString()) return;

  if (params.has("h")) {
    const v = Math.max(0, parseInt(params.get("h"), 10) || 0);
    const el = document.getElementById("Hnum");
    if (el) el.value = v;
    syncSliders("H");
  }
  if (params.has("c")) {
    const v = Math.max(1, parseInt(params.get("c"), 10) || 1);
    const el = document.getElementById("Cnum");
    if (el) el.value = v;
    syncSliders("C");
  }
  if (params.has("t")) {
    const v = Math.max(0, parseInt(params.get("t"), 10) || 0);
    const el = document.getElementById("Tnum");
    if (el) el.value = v;
    syncSliders("T");
  }
  if (params.has("o")) {
    const v = Math.max(0, parseInt(params.get("o"), 10) || 0);
    const el = document.getElementById("Onum");
    if (el) el.value = v;
    syncSliders("O");
  }
  if (params.has("a")) {
    const v = Math.max(0, parseInt(params.get("a"), 10) || 0);
    const el = document.getElementById("Anum");
    if (el) el.value = v;
    syncSliders("A");
  }
  if (params.has("r")) {
    const v = Math.max(0, parseInt(params.get("r"), 10) || 0);
    const el = document.getElementById("Rnum");
    if (el) el.value = v;
  }
  if (params.has("d")) {
    const v = Math.max(0, parseInt(params.get("d"), 10) || 0);
    const el = document.getElementById("Dnum");
    if (el) el.value = v;
    syncSliders("D");
  }
  if (params.has("l")) {
    const v = Math.max(0, parseInt(params.get("l"), 10) || 0);
    const el = document.getElementById("Lnum");
    if (el) el.value = v;
    syncSliders("L");
  }
  if (params.has("offspring")) {
    const v = params.get("offspring");
    setOffspring(v === "1" || v === "true");
  }
  if (params.has("mode")) {
    const m = params.get("mode");
    if (m === "sim" || m === "simultaneous") {
      setEntryMode("simultaneous");
    } else {
      setEntryMode("sequential");
    }
  }
}

function shareLink() {
  updateUrlState();
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    showToast("🔗 Share link copied to clipboard!");
  }).catch(() => {
    prompt("Copy this share link:", url);
  });
}

function copyBreakdown() {
  const { H, C, T, A, O, R, D, L } = readInputs();
  const data = calcHareMath(H, C, T, A, O, entryMode, payOffspring, D, L);
  const grandRabbits = data.totalRabbits + BigInt(R);
  const finalHares = data.finalHaresOnBoard;
  const totalPower = data.nontokenHaresOnBoard * 2n + data.offspringHaresCreated + grandRabbits;

  let text = `🐇 HareBrain 🧠 — Hare Apparent Calculation
• Offspring Paid: ${payOffspring ? 'Yes ({2})' : 'No (Standard)'}
• Existing Hares on board: ${H}
• Hares Entering: ${C} (${C > 1 ? entryMode : 'single cast'})
• Token Multiplier: ${data.perToken}x (Doublers: ${T}, Triplers: ${O})
• Additional Triggers: ${A} (Total triggers per Hare: ${data.trigsPerHare})
• Existing Rabbits: ${R}`;

  if (D > 0) text += `\n• Damage per ETB: ${D} (Total burn: ${data.totalDamage.toLocaleString()} to each opponent${data.totalDamage >= 40n ? ' - LETHAL' : ''})`;
  if (L > 0) text += `\n• Life gained per ETB: ${L} (Total life gained: ${data.totalLife.toLocaleString()})`;

  text += `\n────────────────────────────────────────
🐇 Rabbits Created: ${data.totalRabbits.toLocaleString()}
🐰 Total Rabbits on Board: ${grandRabbits.toLocaleString()}
🐇 Total Hare Apparents: ${finalHares.toLocaleString()}${data.offspringHaresCreated > 0n ? ` (${data.offspringHaresCreated.toLocaleString()} from Offspring)` : ''}
⚔️ Total Board Power/Toughness: ${totalPower.toLocaleString()}/${totalPower.toLocaleString()}`;

  const m = getMilestone(grandRabbits);
  if (m) text += `\n🏆 Milestone: ${m.title} — ${m.subtitle}`;

  text += `\n🔗 View Board: ${window.location.href}`;
  text += `\n💡 Original concept by solveforhare.com | Built with AI`;

  navigator.clipboard.writeText(text).then(() => {
    showToast("📋 Summary copied to clipboard!");
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
  if (icon) icon.textContent = isDark ? "🌙" : "☀️";
  if (text) text.textContent = isDark ? "Dark Theme" : "Light Theme";
  if (btn) btn.title = isDark ? "Currently on Dark Theme (click to switch to Light Theme)" : "Currently on Light Theme (click to switch to Dark Theme)";
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
    saved = "dark";
  }
  applyTheme(saved);
}

// 🧩 INPUT FOCUS / CLEAR LOGIC
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadUrlState();

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
