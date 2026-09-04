# 🐇 HareBrain 🧠
### *The Complete Hare Apparent MTG Token & Trigger Calculator*

---

## 🧐 What is This?

You built a Commander deck with 30 copies of **[Hare Apparent](https://scryfall.com/card/fdn/15/hare-apparent)**. You looked at the card, smiled at the lack of the singleton restriction, and decided that your opponents do not deserve combat phases.

Many Hare Apparent decks don't actually run or focus on paying for *Offspring* — prioritizing trigger multipliers and synergy pieces like *Delney*, *Elesh Norn*, *Panharmonicon*, and *Thrumming Stone*. Existing calculators often assumed every cast paid the {2} Offspring cost, making it tricky to calculate standard turns or Ripple cascades.

Enter **HareBrain**: a fast, flexible Rabbit Token calculator for Hare Apparent decks that handles standard casts, Ripple sequences, and mass reanimation without assuming Offspring — while still giving you the option to toggle Offspring on when you do pay the {2}!

---

## 🧮 How The Math Works (Without Losing Your Mind)

*Hare Apparent* card text:
> *“When Hare Apparent enters, create a 1/1 white Rabbit creature token for each **other** creature you control named Hare Apparent.”*

### The Formulas:

#### 1. Standard Cast (Without Offspring, $C = 1$)
You control $H$ other Hares on the board. You cast 1 Hare Apparent without paying Offspring. It triggers $(A + 1)$ times (thanks to *Delney* or *Panharmonicon*). Each trigger counts the $H$ other Hares and multiplies by your doublers ($2^T$) and triplers ($3^O$):

$$\text{Rabbit Tokens Created} = (A + 1) \cdot H \cdot (3^O \cdot 2^T)$$

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

#### 5. Partial Offspring Support ($K$ of $C$ Casts)
If you cast $C > 1$ Hares in a turn (e.g. 3 Hares) but only have mana to pay Offspring for a subset ($K \le C$, e.g. 2 of them), HareBrain dynamically steps through:
1. Resolving the $K$ Offspring casts sequentially (multiplying Hare counts with token copies and ETBs).
2. Resolving the remaining $(C - K)$ standard casts with the newly expanded warren.
3. Enforces MTG rules via auto-switching: selecting Offspring automatically switches entry mode to Sequential, while selecting Simultaneous entry automatically resets Offspring to No.

*(Arbitrary-precision `BigInt` is used under the hood so your browser won't crash when you casually generate $10^{18}$ rabbits).*

---

## ✨ Features

- 🐇 **Flexible Offspring & Partial Payment**: Toggle Offspring on/off, and when casting multiple Hares ($C > 1$), customize how many times you pay Offspring ($K \le C$, default 1). Intelligent mutual auto-switching between Offspring and Simultaneous entry ensures MTG rule accuracy.
- 🩸 **ETB Burn & Life Gain Tracker**: Calculate direct burn damage to each opponent (*Purphoros*, *Impact Tremors*, *Witty Roastmaster*, *Mirkwood Bats*) and life gained (*Soul Warden*, *Essence Warden*), complete with table wipe and lethal alerts (`💀`).
- 🔗 **Shareable Board States**: Deep linking via URL parameters and 1-click **"🔗 Share Link"** so you can text or post your exact board state to your playgroup.
- 💥 **"Hare-pocalypse" Milestones**: Dynamic milestone badges when crossing 10, 100, 1,000, 1,000,000, or cosmic-scale rabbit counts.
- 🧱 **Interactive Stack Resolution**: Click **Resolve Stack** for a step-by-step breakdown of how the stack resolves with arrows and trigger counts.
- 📐 **Collapsible "Nerd Math"**: View comprehensive LaTeX formulas and rules breakdowns on demand without cluttering the screen.
- 📋 **Copy Breakdown Button**: 1-click summary with clipboard toast notifications to paste directly into Discord.
- 📱 **Tabletop Ready**: Clean, mobile-optimized, responsive layout designed for quick use during Friday Night Magic.
- 🌓 **Dark & Light Modes**: Seamless 1-tap theme toggle, defaulting to dark mode with saved preference support.
- 🚀 **Zero Dependencies**: Pure HTML5, CSS3, and modern Vanilla JS with arbitrary-precision `BigInt`. No build step or server required.

---

## 🙏 Credits & Acknowledgments

- 💡 **Original Concept & Inspiration**: Immense credit to [solveforhare.com](https://solveforhare.com/) for the brilliant concept and idea that sparked this project!
- 👤 **Brought to you by**: **BrainVirus**
- 🤖 **Created with AI**: Developed, calculated, and refined with the help of **Antigravity AI**.
- 🃏 **Magic: The Gathering**: All card names and mechanics are copyright Wizards of the Coast LLC.
