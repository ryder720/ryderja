# Word Maze Challenge

A browser-based maze game where you collect letters to unlock doors with words.

## How to Play

1.  **Open `index.html`:** Open the `index.html` file in your web browser.
2.  **Select Difficulty:** Choose a difficulty level (Easy, Medium, or Hard) from the dropdown menu.
3.  **Start Game:** Click the "Start Game" button.
4.  **Navigate the Maze:** Use the arrow keys (Up, Down, Left, Right) to move your player (a colored square) through the maze.
5.  **Collect Letters:** Move over letters scattered in the maze to collect them. Your collected letters will appear on the right panel.
6.  **Unlock Doors:** Doors are marked with a different color and will have a word associated with them (though the word is initially hidden).
    *   When you approach a door, if you have collected all the letters that form the door's word, the door will open automatically.
    *   The word required for each door is one of the words listed in the "Possible Words" list on the right.
7.  **Win Condition:** The goal is to successfully unlock all doors in the maze.
8.  **Line of Sight:** You can only see the portion of the maze that is within your player's line of sight.
9.  **Timer:** A timer will track how long it takes you to complete the level.
10. **Leaderboard:** After successfully completing a level, your time will be recorded on the local leaderboard for the selected difficulty.

## Game Features

*   **Randomly Generated Mazes:** Each level is unique.
*   **Three Difficulty Levels:** Affects maze size, word length, and the number of words.
*   **Line of Sight Mechanic:** Adds to the challenge of exploration.
*   **Word Puzzles:** Collect letters to form words and open doors.
*   **Win by Unlocking All Doors:** The objective is to open every door in the level.
*   **Timer & Local Leaderboard:** Track your best times for each difficulty.

## Files

*   `index.html`: The main game page.
*   `style.css`: Styles for the game's appearance.
*   `script.js`: Contains all the game logic (maze generation, player movement, game state, etc.).
*   `words.js`: Stores the word lists for different difficulties.

## Future Development Ideas (Optional)

*   More complex maze generation algorithms.
*   Different types of collectibles or power-ups.
*   Sound effects and music.
*   Animated player and environment.
*   Global leaderboard (requires a backend).
*   More varied door mechanics. 