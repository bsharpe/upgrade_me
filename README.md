# Space Shooter Game

A classic arcade-style space shooter game where you pilot a spaceship, destroy enemies, and upgrade your capabilities between levels.

Made with Cursor and Claude in about 20 minutes.

[Play It Now](https://bsharpe.github.io/upgrade_me/)

## Game Features

- **Progressive Difficulty**: Each level adds more enemies and increases their speed
- **Dynamic Combat**: Maneuver your ship and fire at incoming enemies
- **Lives System**: Three lives to complete your mission
- **Upgrade System**: Spend points between levels to enhance your ship:
  - Speed upgrades
  - Weapon improvements (up to dual guns)
  - Enhanced graphics

## Visual Effects

- Parallax starfield background with three layers:
  - Twinkling static stars
  - Slow-moving stars
  - Fast-moving stars
- Three graphics levels with increasingly detailed ships and effects:
  1. Basic geometric shapes
  2. Enhanced ship design with wings and engine effects
  3. Advanced effects including energy fields and particle explosions

## Controls

- **Left/Right Arrows**: Move ship
- **Spacebar**: Fire weapons
- **Upgrade Menu**: Appears between levels to spend earned points

## Scoring

- 10 points per enemy destroyed
- Points can be spent on upgrades between levels
- Progress bar shows completion status for current level

## Technical Details

Built using vanilla JavaScript and HTML5 Canvas, featuring:
- Collision detection
- Particle effects system
- Dynamic difficulty scaling
- State management for game progression 