# AI NPC Route Learning Science Fair Project

Research question: can an AI NPC learn a player's escape route and become better at chasing the player?

This project is a browser-based maze experiment. The player escapes through a 15 x 11 maze while an NPC tries to catch them. The experiment compares two NPC strategies:

- Baseline: uses BFS shortest path to chase the player's current position.
- Learned: uses shortest path plus learned route heat and movement transition memory.

## Hypothesis

If the NPC records which cells the player visits often and which direction the player tends to choose from each cell, then the learned NPC should catch the player in fewer steps than the baseline NPC.

## How to Play

Open `index.html` in a browser.

1. Choose `Baseline` or `Learned`.
2. Press `Start Round`.
3. Move the player with WASD, arrow keys, or the on-screen mobile direction pad.
4. Try to survive for 60 steps.
5. Compare the result metrics after several rounds.

## Suggested Experiment

1. Run 5 baseline rounds and record the average capture steps.
2. Run 10 learned rounds so the NPC can collect route memory.
3. Run 5 more learned rounds and compare the average capture steps against baseline.

Success is shown if the learned NPC lowers the average capture steps or lowers the player's escape success rate.

## Learning Model

The game stores:

- `cellVisits[y][x]`: how often the player has visited each maze cell.
- `transitionCounts[fromCell][direction]`: which direction the player usually chooses from a cell.
- `roundResults[]`: mode, outcome, and steps for each round.

The learned NPC scores each possible next move using:

- shortest-path distance to the predicted player position,
- player route heat from visited cells,
- transition bias from nearby movement habits,
- distance to the player's current position.

No external AI API is used. The model is intentionally explainable for a science fair.

## Project Structure

```text
.
|-- index.html
|-- src/
|   |-- app.js
|   `-- styles.css
`-- README.md
```
