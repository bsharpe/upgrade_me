# Upgrade Me - Space Shooter Game

A browser-based space shooter where you upgrade your ship as you progress through increasingly challenging levels.

## Gameplay

- Use arrow keys to move left/right
- Spacebar to shoot
- Survive waves of enemies and choose upgrades between levels
- Each level gets progressively harder with more challenging enemies

### Enemy Types

- Regular enemies (10 points)
- Fast enemies (20 points) - Smaller and quicker, more common in higher levels
- Wave motion enemies (30 points) - Fast enemies that move in sine waves (requires Graphics Level 3)

### Upgrades

After completing each level, choose one free upgrade:
- Speed - Increases ship movement speed
- Guns - Improves weapon system (up to level 4)
  - Levels 2-3: 10% faster fire rate
  - Level 4: Double bullets
- Graphics - Enhances visual effects (up to level 3)
  - Level 2: Adds rotation, explosions, and enhanced ship design
  - Level 3: Adds energy fields, engine effects, and wave motion enemies

### Difficulty Scaling

- Each level adds 5 more enemies
- Fast enemy chance increases by 2% per level (max 50%)
- Wave motion chance increases by 5% per level for fast enemies (max 80%)

## Technical Details

Built using vanilla JavaScript and HTML5 Canvas. 