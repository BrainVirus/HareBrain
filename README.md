# 🪄 HareBrain 🐇
### *The Complete Hare Apparent MTG Token & Trigger Calculator*

> *“Why you getting mad at my 4 vampires — you're about to make like 30 rabbits?”*  
> — Cody Rich, seconds before witnessing a 300-rabbit avalanche of biblical proportions.

---

## 🧐 What is This?

You built a Commander deck with 30 copies of **[Hare Apparent](https://scryfall.com/card/fdn/15/hare-apparent)**. You looked at the card, smiled at the lack of the singleton restriction, and decided that your opponents do not deserve combat phases.

Many Hare Apparent decks don't actually run or focus on paying for *Offspring* — prioritizing trigger multipliers and synergy pieces like *Delney*, *Elesh Norn*, *Panharmonicon*, and *Thrumming Stone*. Existing calculators often assumed every cast paid the {2} Offspring cost, making it tricky to calculate standard turns or Ripple cascades.

Enter **HareBrain**: a versatile MTG calculator that handles standard casts, Ripple sequences, and mass reanimation without assuming Offspring — while still giving you the option to toggle Offspring on when you do pay the {2}!

---

## 🧮 How The Math Works (Without Losing Your Mind)

*Hare Apparent* card text:
> *“When Hare Apparent enters, create a 1/1 white Rabbit creature token for each **other** creature you control named Hare Apparent.”*

### The Formulas:

#### 1. Standard Cast (Without Offspring, $C = 1$)
You control $H$ other Hares on the board. You cast 1 Hare Apparent without paying Offspring. It triggers $(A + 1)$ times (thanks to *Delney* or *Panharmonicon*). Each trigger counts the $H$ other Hares and multiplies by your doublers ($2^T$) and triplers ($3^O$):

$$\text{Rabbits Created} = (A + 1) \cdot H \cdot (3^O \cdot 2^T)$$

> *Note: If $H = 0$, your first bunny enters, looks around the empty field, sees 0 friends, and makes 0 tokens. Do not panic. The next one will see it, and that's when the breeding program begins.*

#### 2. Cast with Offspring Paid ($C = 1$)
You cast 1 Hare Apparent and pay the {2} Offspring cost. It creates $(A + 1)$ Offspring triggers and $(A + 1)$ Make Rabbits triggers. Offspring resolves first, creating $P = (3^O \cdot 2^T)$ token copies of *Hare Apparent* per trigger. Each token copy triggers its own ETB, and the original Hare resolves last, seeing all the new token Hares:

$$\text{Rabbits} = \sum_{n=1}^{A+1} \left[ P^2 \cdot (H + n \cdot P) \cdot (A + 1) \right] + (A + 1) \cdot P \cdot [H + (A + 1) \cdot P]$$

#### 3. The "Thrumming Stone Ripple" Fiesta (Sequential Entry)
You rippled through your deck and chained $C$ Hares one after another. Each Hare enters, resolves its triggers, counts all previous Hares, and leaves behind an ever-growing pile of rabbits:

$$\text{Rabbits} = (A + 1) \cdot (3^O \cdot 2^T) \cdot \left[ C \cdot H + \frac{C(C - 1)}{2} \right]$$

#### 4. The "Graveyard Bunny Apocalypse" (Simultaneous Entry)
You cast *Patriarch's Bidding* or *Raise the Past* and dumped $C$ Hares onto the board at the exact same millisecond. Since all $C$ Hares are already in play when their triggers resolve, every single entering Hare sees all the other $(H + C - 1)$ Hares:

$$\text{Rabbits} = C \cdot (A + 1) \cdot (H + C - 1) \cdot (3^O \cdot 2^T)$$

*(Arbitrary-precision `BigInt` is used under the hood so your browser won't crash when you casually generate $10^{18}$ rabbits).*

---

## ✨ Features

- 🐇 **Flexible Offspring Toggle**: Easily switch between standard casts and paying the {2} Offspring cost.
- ⚡ **Commander Presets**: Quick tap buttons for *Delney* (+1 trigger), *Panharmonicon*, *Anointed Procession* (2×), *Ojer Taq* (3×), and more.
- 🧱 **Interactive Stack Resolution**: Click **Resolve Stack** for an animated, step-by-step breakdown of how the stack resolves with arrows and trigger counts.
- 📋 **Copy Breakdown Button**: 1-click summary to paste directly into Discord to prove to your friends you didn't cheat the math.
- 📱 **Tabletop Ready**: Built with a fantasy parchment aesthetic that looks great on your phone during game night.
- 🚀 **Zero Dependencies**: Pure HTML5, CSS3, and modern Vanilla JS. No build step, no Node server needed to host.

---

## 🙏 Credits & Acknowledgments

- 💡 **Original Concept & Inspiration**: Immense credit to [solveforhare.com](https://solveforhare.com/) for the brilliant concept, quote, and idea that sparked this project!
- 🤖 **Created with AI**: Developed, calculated, and refined with the help of **Antigravity AI**.
- 🃏 **Magic: The Gathering**: All card names, art, and mechanics are copyright Wizards of the Coast LLC. Art fetched via Scryfall.
