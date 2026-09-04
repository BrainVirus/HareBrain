# 🪄 HareBrain 🐇
### *The "I Refuse to Pay for Offspring" Hare Apparent MTG Calculator*

> *“Why you getting mad at my 4 vampires — you're about to make like 30 rabbits?”*  
> — Cody Rich, seconds before witnessing a 300-rabbit avalanche of biblical proportions.

---

## 🧐 What is This?

You built a Commander deck with 30 copies of **[Hare Apparent](https://scryfall.com/card/fdn/15/hare-apparent)**. You looked at the card, smiled at the lack of the singleton restriction, and decided that your opponents do not deserve combat phases.

Then you found the glorious [solveforhare.com](https://solveforhare.com/), only to realize:
> *"Wait... that calculator assumes I'm paying the {2} Offspring cost with Zinnia! I don't run Offspring cards! I run Delney, Elesh Norn, and Thrumming Stone! I am a purist of the burrow!"*

Enter **HareBrain**: the dedicated MTG calculator engineered specifically for the noble player who **does not pay for Offspring**. No token copies of *Hare Apparent*. Just pure, exponential, unadulterated 1/1 white Rabbit tokens flooding the table until your playgroup bans dice from the premises.

---

## 🧮 How The Math Works (Without Losing Your Mind)

*Hare Apparent* text:
> *“When Hare Apparent enters, create a 1/1 white Rabbit creature token for each **other** creature you control named Hare Apparent.”*

### The Formula:

#### 1. The Standard Turn (Casting 1 Hare, $C = 1$)
You control $H$ other Hares on the board. You cast 1 Hare Apparent. It triggers $(A + 1)$ times (thanks to *Delney* or *Panharmonicon*). Each trigger counts the $H$ other Hares and multiplies by your doublers ($2^T$) and triplers ($3^O$):

$$\text{Rabbits Created} = (A + 1) \cdot H \cdot (3^O \cdot 2^T)$$

> *Note: If $H = 0$, your first bunny enters, looks around the empty field, sees 0 friends, and makes 0 tokens. Do not panic. The next one will see it, and that's when the breeding program begins.*

#### 2. The "Thrumming Stone Ripple" Fiesta (Sequential Entry)
You rippled through your deck and chained $C$ Hares one after another. Each Hare enters, resolves its triggers, counts all previous Hares, and leaves behind an ever-growing pile of rabbits:

$$\text{Rabbits} = (A + 1) \cdot (3^O \cdot 2^T) \cdot \left[ C \cdot H + \frac{C(C - 1)}{2} \right]$$

#### 3. The "Graveyard Bunny Apocalypse" (Simultaneous Entry)
You cast *Patriarch's Bidding* or *Raise the Past* and dumped $C$ Hares onto the board at the exact same millisecond. Since all $C$ Hares are already in play when their triggers resolve, every single entering Hare sees all the other $(H + C - 1)$ Hares:

$$\text{Rabbits} = C \cdot (A + 1) \cdot (H + C - 1) \cdot (3^O \cdot 2^T)$$

*(Yes, this number gets horrifying very quickly. We use arbitrary-precision `BigInt` under the hood so your browser won't crash when you casually generate $10^{18}$ rabbits).*

---

## ✨ Features

- 🐇 **Precise Non-Offspring Trigger Math**: Accurate to the MTG Comprehensive Rules.
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
