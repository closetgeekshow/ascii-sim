markdown
# ASCII Strategy Simulation – Game Design Document

---

## 1. Overview

- **Game Type:** Turn-based, observer-only simulation.
- **Theme:** Ancient times, no technology tree.
- **Display:** Colored ASCII graphics with CRT-like effects and interactive UI.
- **Inspiration:** Conway’s Game of Life, but with nations as living organisms.

---

## 2. Map Structure

- **Main Grid:** 10x10 squares.
- **Inner Grid:** Each main square contains a 10x10 subgrid.

### Allowed Values

- `TERRAIN_TYPES = ['land', 'ocean', 'mountain', 'river']`
- `DEVELOPMENT_TYPES = ['none', 'farm', 'mine', 'forest', 'town', 'city', 'castle']`
- `ORDER_TYPES = ['move', 'attack', 'defend', 'build', null]`
- `RESOURCE_TYPES = ['gold', 'wood', 'food', 'metal']`

### Data Structures

- **Map Cell (`map[x][y]`):**
  - `owner`: int | null — Nation ID or null if unclaimed
  - `terrain`: string — must be in `TERRAIN_TYPES`
  - `resources`: dict with keys from `RESOURCE_TYPES`
  - `development`: string — must be in `DEVELOPMENT_TYPES`
  - `army`: `Army` object | null
  - `population`: int
  - `innerGrid`: 10x10 array of `InnerCell`

- **InnerCell:**
  - `terrain`: string — must be in `TERRAIN_TYPES`
  - `resources`: dict with keys from `RESOURCE_TYPES` | null
  - `development`: string — must be in `DEVELOPMENT_TYPES`
  - `army`: `Army` object | null
  - `population`: int
  - `road`: bool
  - `level`: int (for towns/cities)

- **Nation:**
  - `id`: int
  - `name`: string
  - `symbol`: string
  - `resources`: dict with keys from `RESOURCE_TYPES`
  - `territory`: array of `{x: int, y: int}`
  - `armies`: array of `Army`
  - `capital`: `{x: int, y: int}`
  - `diplomacy`: dict of nationId -> string
  - `tradeOffers`: array of `TradeOffer`
  - `battles`: array of `Battle`

- **Army:**
  - `nationId`: int
  - `x`, `y`: int (main grid position)
  - `innerX`, `innerY`: int (inner grid position)
  - `level`: int
  - `health`: int
  - `experience`: int
  - `movementPoints`: int
  - `orders`: string | null — must be in `ORDER_TYPES`

- **Resource:**
  - `gold`: int
  - `wood`: int
  - `food`: int
  - `metal`: int

- **Random Generation:** Map, resources, oceans, rivers, mountains, and neutral land are generated randomly each game.
- **Random Seed Control:** The simulation allows specifying a random seed for reproducible map and event generation. If no seed is provided, a random one is used. The current seed is displayed in the UI and can be reused for debugging or sharing simulation results.
- **Zoom:** Player can zoom into any square for detailed view.
- **Zoomed Square Info Panel:** When zoomed in, a panel displays the number and types of developments in that square, summarizing inner grid development counts.
- **Army Placement:** Armies are placed and tracked within specific inner grid cells, not just the main square.
- **Inner Grid Roads:** Roads can be built between towns/cities within the inner grid using simple pathfinding, and are visually represented.

---

## 3. Player Role

- **Observer Only:** No direct control over nations.
- **Visibility:** Full map and entire game history (logs) are always visible.
- **Charts:** A chart page tracks all possible statistics.
- **Interactive Map:** Players can interact with the map and logs by clicking on coordinates to highlight and focus on specific main or inner grid squares.

---

## 4. Nations

- **Balance:** All nations operate identically and are balanced.
- **Spawning:** Nations spawn at a minimum distance from each other, with equal starting gold and land.
- **Capabilities:**
  - Trade resources.
  - Declare war or make peace.
  - Expand territory, especially towards scarce resources.
  - Attempt to spread resources evenly over their territory.
- **Diplomacy:** Nations can see and react to each other and to resources.

---

## 5. Resources

- **Types:** Gold, wood, food, metal.
- **Distribution:** Value based on rarity across the map; spread encourages expansion.
- **Acquisition:** Collected by population in towns/cities and through developed land (farms, forests, mines).
- **Logistics:** Gold and resources must be transported via roads to where they are needed (e.g., for building armies or development).

---

## 6. Terrain & Features

- **Oceans:** Randomly generated to separate continents; impassable except at reduced speed.
- **Rivers:** Randomly generated, connect oceans, provide food, and allow faster movement.
- **Mountains:** Randomly generated, impassable by armies, mines operate at 20% efficiency.
- **Neutral Land:** Can be claimed by any nation.

---

## 7. Cities, Towns, and Population

- **Settlements:** Population only lives in towns and cities.
- **Growth:** Towns/cities have 3 levels; as they grow, their resource gathering radius increases.
- **Capital:** The largest city is the nation’s capital.
- **Roads:** Connect towns/cities and enable resource flow.
- **Inner Grid Developments:** Developments such as farms, forests, mines, towns, cities, and castles are built within the inner grid, and their distribution is visible when zoomed in.

---

## 8. Armies & Warfare

- **Creation:** Spawn at towns/cities (max level 3 from towns).
- **Requirements:** Require wood, food, and metal to be created.
- **Placement:** Armies are placed in specific inner grid cells and their positions are tracked and displayed.
- **Movement:**
  - Oceans: 0.25x speed.
  - Rivers: 3x speed.
  - Mountains: Impassable.
  - **Inner Grid Movement:** Armies can move within the inner grid, not just between main squares.
- **Actions:**
  - Conquer, defend, attack (other nations or neutral squares).
  - Build castles (defensive, allow army funding).
- **Levels:** Range from 1 to 10, based on funding.
- **Health & Experience:** Armies have health and experience attributes; they can take damage or be destroyed in battle.
- **Upkeep:** Nations pay upkeep based on armies and developed land.
- **Battles:** Resolved by army level difference and a Risk-like dice mechanic.
- **Battle List:** All battles and stats are tracked and viewable.
- **Battle Details:** Battle logs include dice rolls, power comparisons, and explicit winner/loser information.
- **Recent Battles Panel:** A dedicated panel lists the most recent battles, including clickable location links to jump to the battle site.

---

## 9. Development

- **Inner Squares:** Can be developed into farms, forests, mines, towns, cities, and castles.
- **Resource Spread:** Resources are distributed via roads and development.
- **Road Building:** Roads are built between settlements within the inner grid using simple pathfinding and are visually represented.

---

## 10. Visuals & Effects

- **Color Coding:** Map squares are color-coded by owner.
- **CRT Effects:** Visual effects mimic a CRT monitor, including a CSS-based scanline overlay for a retro look.
- **Legend:** All symbols and colors are explained in a legend.
- **Dynamic Legend:** The legend updates dynamically depending on whether the player is zoomed in or not, showing different symbols for main grid vs. inner grid developments.
- **Highlighting:** Both main grid and inner grid squares can be highlighted (with a yellow border and glow) when referenced in logs or legend, providing visual feedback. Highlights auto-clear after a short timeout.
- **Hover Effects:** Map and legend cells have hover effects for better interactivity.
- **Responsive Layout:** UI is styled for clarity and retro aesthetics, with color-coded tables, grids, and panels.

---

## 11. Logging & History

- **Comprehensive Logs:** Almost every action is logged.
- **Turn-Based:** Game progresses in turns; logs are turn-stamped.
- **History:** Full history is accessible to the player.
- **Clickable Coordinates:** Log entries containing coordinates are rendered as clickable links. Clicking them highlights the corresponding main or inner grid square on the map for a few seconds.
- **Auto-scroll:** The game log automatically scrolls to show the latest entries.
- **Interactive Controls:** Buttons for "Next Turn", "Auto Play", "Pause", "Reset", and "Zoom Out" are present and styled for user interaction.

---

## 12. Error Handling & Edge Cases

- **Nation Elimination:** When a nation's population drops to zero or it loses all territory, it is considered eliminated. Its armies are removed, and its resources are redistributed or lost.
- **Resource Depletion:** If a nation runs out of a critical resource (e.g., food), population growth halts and armies may suffer attrition or disband.
- **Stalemate Detection:** If no nation can make progress for a set number of turns, the game logs a stalemate and may offer to reset or end.
- **Invalid Actions:** The game prevents or logs invalid actions, such as moving armies into impassable terrain or building developments without sufficient resources.
- **UI Feedback:** The UI provides clear feedback when an edge case or error occurs, such as highlighting affected areas or displaying warning messages.

---

## 13. Extensibility Guidelines

- **Adding New Resource Types:** Define the new resource in the `RESOURCE_TYPES` array and update resource generation, collection, and display logic in both the main and inner grids.
- **Introducing New Terrain Features:** Add the terrain type to `TERRAIN_TYPES` and update map and inner grid generation logic, rendering, and legend, and specify its effects on movement, resource yield, and development.
- **Expanding Nation Behaviors:** Implement new AI behaviors or diplomatic actions by extending the nation decision-making functions, ensuring logs and UI reflect new actions.
- **Modular Expansion:** When adding new features, encapsulate logic in separate functions or modules to maintain code clarity and facilitate testing.

---

## 14. Security: Data Validation & Input Sanitization

- **Input Validation:** All user interactions (e.g., clickable coordinates, UI controls) must validate input data types and ranges before processing. When assigning to `terrain`, `development`, or `orders`, check that the value is in the corresponding allowed list; otherwise, raise an error or log a warning.
- **Input Sanitization:** Any user-supplied or dynamic data rendered in the UI (including logs and coordinate links) must be sanitized to prevent injection or XSS vulnerabilities.
- **Safe Event Handling:** Ensure that event handlers for clickable elements do not expose the application to code injection or unintended script execution.
- **Review:** Regularly review and test input handling code for security vulnerabilities.

---

---

### Encapsulated Classes