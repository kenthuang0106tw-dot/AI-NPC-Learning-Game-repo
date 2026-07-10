# Flappy Skill Lab

This is a Flappy Bird-style web game for an elementary science fair experiment.

The goal is not only to make a game. The goal is to collect clean player data so students can study:

1. Why are strong players better?
2. Can AI predict the player's next click in a future stage?
3. How does game speed change human control?

Stage 1 MVP includes the game, data collection, CSV export, and a game-over dashboard. It does not include AI prediction yet.

## How to Play

Open `index.html` in a browser, or use the GitHub Pages link.

1. Choose a speed level: `Slow`, `Normal`, or `Fast`.
2. Enter the player's name.
3. Press `Start`, or tap the game screen.
4. Press `Space`, click the mouse, or tap the phone screen to make the bird fly upward.
5. Avoid the pipes and the ground.
6. After game over, read the dashboard or export CSV.

Player name is required each time the page is opened. During the same page session, the name stays in the input so the player can play multiple rounds.

The game is designed so a new player can understand it in less than 10 seconds.

Visual upgrades are feedback only. Background color changes, bird skins, animations, and achievements do not change gravity, pipe speed, pipe gap, pipe distance, collision size, or jump force.

Moment-to-moment feedback also includes optional procedural sound effects, mobile vibration, an on-screen score-milestone meter, and live record/achievement celebrations. The `音效` toggle controls both sound and vibration and is remembered on the device. These effects are motivational feedback only and do not change gameplay or research variables.

The dashboard also keeps each player's best score and unlocked achievements in browser `localStorage`.

## Data Collected

To keep the Google Sheet small, the game records one row every 5 frames. Click frames, pipe-pass frames, and death frames are always recorded, even if they are not on a 5-frame sample.

Original columns are preserved:

`game_id`, `player_name`, `player_play_count`, `device_id`, `time`, `frame`, `speed_level`, `flap_power`, `bird_y`, `bird_vy`, `pipe_x`, `pipe_gap_center`, `pipe_gap_size`, `next_pipe_distance`, `score`, `is_click`, `is_dead`, `death_reason`, `click_interval`, `error_to_center`, `sample_type`, `bird_skin_level`, `player_rank`, `is_personal_best`, `stability_score`, `control_score`, `rhythm_score`

New research columns are appended at the end:

- `pipe_id`: pipe group number for the current next pipe.
- `pipe_result`: `pending`, `pass`, or `fail`.
- `is_panic_click`: `1` when a click happens less than 0.3 seconds after the previous click.
- `click_timing_type`: `early`, `optimal`, `late`, or `none`.
- `before_error`: absolute pipe-center error at the moment of a click.
- `after_error`: absolute pipe-center error 0.5 seconds after that click, or at death if the game ends first.
- `correction_efficiency`: `before_error - after_error`.
- `last_3s_avg_error`: average height error during the last 3 seconds before death.
- `last_3s_error_std`: standard deviation of height error during the last 3 seconds before death.
- `last_3s_click_rate`: clicks per second during the last 3 seconds before death.
- `last_3s_panic_click_rate`: panic clicks per second during the last 3 seconds before death.

`player_play_count` is the main experience indicator. Use it to compare early rounds and later rounds instead of asking players to self-label skill.

`flap_power` is fixed at `normal` so the main experimental variables are speed level and player practice count.

Visual upgrades and achievements are feedback only. They do not change bird size, collision, physics, speed, jump force, pipe gap, or score.

## Export CSV

Press `Export CSV` to download all historical game data from this browser.

The CSV can be opened in Excel, Google Sheets, or Python.

Press `Clear Data` only when you want to delete all saved experiment data.

## Upload Data From Different Devices

Local storage stays on one device, but this project also uploads completed games to a shared Google Sheet.

Players do not need to paste an upload URL. The game uses the project default Google Apps Script endpoint and automatically uploads after death. The final row in each round contains `is_dead = 1` and the correct `death_reason`.

For setup or redeployment, use the full script in `google-apps-script.js`. It includes the latest headers, chunk tracking, duplicate protection, and verification support.

If duplicate rows appear during testing, remove duplicates during analysis by comparing `game_id` and `frame`.

## Game Over Dashboard

After each game, the dashboard shows:

- survival time
- score
- average clicks per second
- average height control error: `average(abs(error_to_center))`
- death reason
- bird height variation
- upload result
- short encouragement and analysis
- visual achievements earned that round

These metrics help compare different playing styles.

The achievement system has 50 achievements. Achievements are only feedback and motivation; they never change score, speed, collision, gravity, pipe layout, or jump force.

## Research Questions

### 1. Why are strong players better?

Compare high-score and low-score games:

- Are stronger players clicking less often?
- Is their average height error smaller?
- Is their bird height variation lower?
- Do they click earlier before the next pipe?

Also compare by play count:

- Round 1-3: beginner stage
- Round 4-7: practice stage
- Round 8+: experienced stage

This avoids defining "expert" only by score.

Use the new research fields to study how players learn:

- `is_panic_click`: does panic clicking decrease as `player_play_count` increases?
- `correction_efficiency`: do later rounds show more clicks with positive correction efficiency?
- `click_timing_type`: do players move from `late` clicks toward `early` or `optimal` clicks?
- `pipe_id` and `pipe_result`: which pipe units are passed or failed most often?
- `last_3s_avg_error`, `last_3s_error_std`, `last_3s_click_rate`, `last_3s_panic_click_rate`: can the last 3 seconds predict failure?

### 2. Can AI predict the player's next click?

This MVP does not train AI yet.

However, the exported sampled frame data already includes player state and `is_click`, so a future AI model can try to predict whether the next recorded sample will be a click.

Useful features could include:

- `bird_y`
- `bird_vy`
- `next_pipe_distance`
- `pipe_gap_center`
- `speed_level`

### 3. How does speed affect human reaction?

Compare the same player across `Slow`, `Normal`, and `Fast`:

- Does click frequency increase?
- Does height error get larger?
- Does survival time drop?
- Does death reason change?

## Project Structure

```text
.
|-- index.html
|-- src/
|   |-- app.js
|   `-- styles.css
`-- README.md
```
