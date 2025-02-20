const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let player = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  width: 20,
  height: 30,
  speed: 3,
  lives: 3,
  fireRate: 500,
  lastShot: 0,
  gunLevel: 1
};
let bullets = [];
let enemies = [];
let points = 0;
let level = 1;
let enemyCount = 15;
let spawnedEnemies = 0;
let spawnInterval = 1000; // 1 second between spawns
let nextSpawnTime = Date.now();
let gameOver = false;
let upgradeMenuActive = false;
let graphicsLevel = 1;
let explosions = [];
let gameOverSequence = false; // Different from gameOver to handle the sequence

// Add after the game state variables
let stars = {
  static: Array(30).fill().map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2,
    twinkleSpeed: 0.02 + Math.random() * 0.05,
    brightness: Math.random()
  })),
  slow: Array(20).fill().map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.5 + 0.5
  })),
  fast: Array(15).fill().map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.2 + 0.3
  }))
};

// Controls
let keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Spawn a single enemy
function spawnEnemy() {
  // Increase fast enemy chance with level (15% base + 2% per level, max 50%)
  const fastEnemyChance = Math.min(0.15 + (level - 1) * 0.02, 0.5);
  const isFastEnemy = Math.random() < fastEnemyChance;

  // Increase wave motion chance with level (50% base + 5% per level for fast enemies, max 80%)
  const waveMotionChance = Math.min(0.5 + (level - 1) * 0.05, 0.8);
  const hasWaveMotion = isFastEnemy && graphicsLevel === 3 && Math.random() < waveMotionChance;

  enemies.push({
    x: Math.random() * (canvas.width - 20),
    y: -20,
    width: isFastEnemy ? 16 : 20,
    height: isFastEnemy ? 16 : 20,
    speed: (1 + level * 0.5) * (isFastEnemy ? 1.8 : 1),
    rotationAngle: 0,
    rotationSpeed: (Math.random() - 0.5) * (isFastEnemy ? 0.15 : 0.1),
    isFastEnemy: isFastEnemy,
    hasWaveMotion: hasWaveMotion,
    waveAmplitude: hasWaveMotion ? 30 + Math.random() * 20 : 0,
    waveFrequency: hasWaveMotion ? 0.05 + Math.random() * 0.03 : 0,
    initialX: Math.random() * (canvas.width - 20),
    distanceTraveled: 0,
    // Points value based on enemy type
    pointValue: hasWaveMotion ? 30 : isFastEnemy ? 20 : 10
  });
  spawnedEnemies++;
}

// Drawing functions
function drawBackground() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Static twinkling stars
  stars.static.forEach(star => {
    star.brightness += star.twinkleSpeed;
    if (star.brightness > 1 || star.brightness < 0) star.twinkleSpeed *= -1;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + star.brightness * 0.7})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Slow moving stars
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  stars.slow.forEach(star => {
    star.y = (star.y + 0.1) % canvas.height;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Fast moving stars
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  stars.fast.forEach(star => {
    star.y = (star.y + 0.3) % canvas.height;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer() {
  if (graphicsLevel === 1) {
    // Basic triangle ship
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();
  } else if (graphicsLevel >= 2) {  // Changed from else if to handle both level 2 and 3
    // Enhanced ship base
    ctx.fillStyle = graphicsLevel === 2 ? 'cyan' : '#00ffff';

    // Main body
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.height / 2);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.closePath();
    ctx.fill();

    // Wings
    ctx.beginPath();
    ctx.moveTo(player.x - player.width / 2, player.y);
    ctx.lineTo(player.x - player.width, player.y + player.height / 3);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2);
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height / 3);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.strokeStyle = graphicsLevel === 2 ? 'blue' : '#0088ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Engine glow
    const glowColor = graphicsLevel === 2 ?
      'rgba(0, 255, 255, 0.5)' :
      'rgba(0, 255, 255, 0.7)';
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(player.x, player.y + player.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    if (graphicsLevel === 3) {
      // Additional level 3 details
      // Cockpit
      ctx.fillStyle = '#0088ff';
      ctx.beginPath();
      ctx.arc(player.x, player.y - player.height / 4, 4, 0, Math.PI * 2);
      ctx.fill();

      // Energy field effect
      ctx.strokeStyle = 'rgba(0, 136, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.height * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // Additional engine effects
      const engineGlow = Date.now() % 1000 / 1000; // Pulsing effect
      ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + engineGlow * 0.2})`;
      ctx.beginPath();
      ctx.arc(player.x, player.y + player.height / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBullets() {
  ctx.fillStyle = 'red';
  bullets.forEach(bullet => ctx.fillRect(bullet.x - 2, bullet.y - 5, 4, 10));
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    if (graphicsLevel >= 2) {
      ctx.rotate(enemy.rotationAngle);
    }

    // Different colors for fast enemies
    const color = graphicsLevel === 1 ? (enemy.isFastEnemy ? '#ff6666' : 'red') :
      graphicsLevel === 2 ? (enemy.isFastEnemy ? '#ffd700' : 'orange') :
        (enemy.isFastEnemy ? '#ff00ff' : 'purple');
    ctx.fillStyle = color;
    ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);

    ctx.restore();
  });
}

function drawExplosions() {
  if (graphicsLevel === 1) {
    // For level 1, show "BOOM!" text that fades from yellow to red
    explosions = explosions.filter(exp => exp.frame < exp.maxFrames);
    explosions.forEach(exp => {
      const progress = exp.frame / exp.maxFrames;
      // Start with yellow (255,255,0) and transition to red (255,0,0)
      const green = Math.floor(255 * (1 - progress));
      const opacity = 1 - progress;
      ctx.fillStyle = `rgba(255, ${green}, 0, ${opacity})`;
      ctx.font = 'bold 16px Arial';  // Made it bold for better visibility
      ctx.textAlign = 'center';
      ctx.fillText('BOOM!', exp.x, exp.y);
      exp.frame++;
    });
    return;
  }

  explosions = explosions.filter(exp => exp.frame < exp.maxFrames);

  explosions.forEach(exp => {
    const opacity = 1 - (exp.frame / exp.maxFrames);
    const scale = exp.scale || 1;

    if (graphicsLevel === 2) {
      // Orange/yellow explosion with multiple circles
      const colors = exp.isFinal ?
        [`rgba(255, 200, 0, ${opacity})`, `rgba(255, 100, 0, ${opacity})`, `rgba(255, 50, 0, ${opacity})`] :
        [`rgba(255, 200, 0, ${opacity})`, `rgba(255, 100, 0, ${opacity})`];

      colors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        const radius = Math.max(0, exp.frame * 2 - i * 3) * scale;
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Complex particle-based explosion
      const particles = exp.isFinal ? 12 : 8;
      const angle = (Math.PI * 2) / particles;
      ctx.fillStyle = `rgba(255, ${100 + exp.frame * 10}, 0, ${opacity})`;

      for (let i = 0; i < particles; i++) {
        const radius = exp.frame * 2 * scale;
        const particleX = exp.x + Math.cos(angle * i) * radius;
        const particleY = exp.y + Math.sin(angle * i) * radius;

        ctx.beginPath();
        ctx.arc(particleX, particleY, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    exp.frame++;
  });
}

function drawUI() {
  // Points and level at the top
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';

  // Score in top left
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${String(points).padStart(2, '0')}`, 10, 20);

  // Level in top right
  ctx.textAlign = 'right';
  ctx.fillText(`Level: ${level}`, canvas.width - 10, 20);

  // Draw lives as ships in bottom left
  const shipSpacing = 30;
  const bottomMargin = 30;
  for (let i = 0; i < player.lives; i++) {
    // Draw a smaller version of the player ship
    ctx.fillStyle = graphicsLevel === 1 ? 'white' : graphicsLevel === 2 ? 'cyan' : '#00ffff';
    ctx.beginPath();
    ctx.moveTo(20 + i * shipSpacing, canvas.height - bottomMargin);
    ctx.lineTo(10 + i * shipSpacing, canvas.height - bottomMargin + 15);
    ctx.lineTo(30 + i * shipSpacing, canvas.height - bottomMargin + 15);
    ctx.closePath();
    ctx.fill();

    if (graphicsLevel >= 2) {
      ctx.strokeStyle = graphicsLevel === 2 ? 'blue' : '#0088ff';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (graphicsLevel === 3) {
        ctx.fillStyle = '#0088ff';
        ctx.beginPath();
        ctx.arc(20 + i * shipSpacing, canvas.height - bottomMargin + 5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw progress bar in bottom right
  const barWidth = 150;
  const barHeight = 15;
  const barX = canvas.width - barWidth - 20;
  const barY = canvas.height - bottomMargin;

  // Draw background of bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Calculate and draw progress
  const defeatedEnemies = spawnedEnemies - enemies.length;
  const progress = defeatedEnemies / enemyCount;
  const progressWidth = barWidth * Math.min(progress, 1);
  ctx.fillStyle = 'goldenrod';
  ctx.fillRect(barX, barY, progressWidth, barHeight);

  // Draw border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Draw centered percentage text
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  const percentage = Math.floor(progress * 100);
  ctx.fillText(`${Math.min(percentage, 100)}%`, barX + barWidth / 2, barY + barHeight - 2);

  // Draw upgrade menu if active
  if (upgradeMenuActive) {
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height / 2 - 100, canvas.width, 160);  // Moved up and centered

    // Level Complete text
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Level Complete!', canvas.width / 2, canvas.height / 2 - 60);

    // Score
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${points}`, canvas.width / 2, canvas.height / 2 - 30);

    // Upgrade options
    ctx.fillText('Choose one upgrade:', canvas.width / 2, canvas.height / 2);

    // Draw upgrade buttons
    const buttonY = canvas.height / 2 + 30;  // Adjusted button position
    const buttonSpacing = 120;
    drawUpgradeButton('Speed +1', canvas.width / 2 - buttonSpacing, buttonY, () => upgradeSpeed());
    drawUpgradeButton(`Guns ${player.gunLevel}/4`, canvas.width / 2, buttonY, () => upgradeGuns());
    drawUpgradeButton('Graphics', canvas.width / 2 + buttonSpacing, buttonY, () => upgradeGraphics());
  }
}

function drawUpgradeButton(text, x, y, action) {
  const buttonWidth = 100;
  const buttonHeight = 30;
  const isHovered =
    mouseX > x - buttonWidth / 2 &&
    mouseX < x + buttonWidth / 2 &&
    mouseY > y - buttonHeight / 2 &&
    mouseY < y + buttonHeight / 2;

  // Button background
  ctx.fillStyle = isHovered ? '#a76fbf' : '#8a5d9e';
  ctx.fillRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);

  // Button text
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Arial';
  ctx.fillText(text, x, y + 6);

  // Store button data for click handling
  buttons.push({ x, y, width: buttonWidth, height: buttonHeight, action });
}

// Add these variables at the top with other game state
let buttons = [];
let mouseX = 0;
let mouseY = 0;

// Add these event listeners after other event listeners
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  buttons.forEach(button => {
    if (clickX > button.x - button.width / 2 &&
      clickX < button.x + button.width / 2 &&
      clickY > button.y - button.height / 2 &&
      clickY < button.y + button.height / 2) {
      button.action();
    }
  });
});

function showLevelNotification() {
  ctx.save();
  ctx.fillStyle = 'rgba(224, 224, 224, ' + (1 - levelFadeProgress) + ')';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Level ${level}`, canvas.width / 2, canvas.height / 2);
  ctx.restore();

  if (levelFadeProgress < 1) {
    levelFadeProgress += 0.01; // Changed from 0.02 to make it fade over ~3 seconds (at 60fps)
  }
}

// Add to game state variables at top
let levelFadeProgress = 0;

function startNextLevel() {
  level++;
  levelFadeProgress = 0;  // Reset fade progress
  enemyCount += 5;
  enemies = [];
  spawnedEnemies = 0;
  nextSpawnTime = Date.now();
  upgradeMenuActive = false;
  buttons = []; // Clear buttons
}

// Update game state
function update() {
  if (gameOver || upgradeMenuActive) {
    // Handle enemy movement during game over sequence
    if (gameOverSequence) {
      enemies.forEach(enemy => {
        // Update existing dramatic exit velocities
        enemy.x += enemy.xSpeed;
        enemy.y += enemy.ySpeed;
        enemy.ySpeed += 0.2; // Gravity effect
        enemy.rotationAngle = (enemy.rotationAngle || 0) + enemy.rotation;

        // Also add upward movement
        enemy.y -= 3; // Consistent upward movement
      });

      // Remove enemies that are off screen
      enemies = enemies.filter(enemy =>
        enemy.y > -100 && // Changed to allow upward exit
        enemy.x > -100 &&
        enemy.x < canvas.width + 100
      );

      if (enemies.length === 0) {
        gameOverSequence = false;
      }
    }
    return;
  }

  // Spawn enemies over time
  if (spawnedEnemies < enemyCount && Date.now() >= nextSpawnTime) {
    spawnEnemy();
    nextSpawnTime = Date.now() + spawnInterval;
  }

  // Player movement and shooting
  if (keys['ArrowLeft'] && player.x > player.width / 2) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x < canvas.width - player.width / 2) player.x += player.speed;
  if (keys[' '] && Date.now() - player.lastShot > player.fireRate) {
    if (player.gunLevel < 4) {
      // Single bullet
      bullets.push({ x: player.x, y: player.y - player.height / 2 });
    } else {
      // Double bullets
      bullets.push({ x: player.x - 5, y: player.y - player.height / 2 });
      bullets.push({ x: player.x + 5, y: player.y - player.height / 2 });
    }
    player.lastShot = Date.now();
  }

  // Bullet movement
  bullets = bullets.filter(b => b.y > 0);
  bullets.forEach(b => b.y -= 5);

  // Enemy movement and rotation
  enemies.forEach(e => {
    e.y += e.speed;
    if (graphicsLevel >= 2) {
      e.rotationAngle = (e.rotationAngle + e.rotationSpeed) % (Math.PI * 2);
    }

    // Add wave motion for eligible enemies
    if (e.hasWaveMotion) {
      e.distanceTraveled += e.speed;
      e.x = e.initialX + Math.sin(e.distanceTraveled * e.waveFrequency) * e.waveAmplitude;

      // Keep within screen bounds
      e.x = Math.max(e.width, Math.min(canvas.width - e.width, e.x));
    }
  });
  enemies = enemies.filter(e => e.y < canvas.height + e.height);

  // Collision detection
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (bullet.x > enemy.x - enemy.width / 2 && bullet.x < enemy.x + enemy.width / 2 &&
        bullet.y > enemy.y - enemy.height / 2 && bullet.y < enemy.y + enemy.height / 2) {
        explosions.push({
          x: enemy.x,
          y: enemy.y,
          frame: 0,
          maxFrames: graphicsLevel === 1 ? 30 : graphicsLevel === 2 ? 15 : 20
        });

        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);
        points += enemy.pointValue;
      }
    });
  });

  enemies.forEach(enemy => {
    if (enemy.x > player.x - player.width / 2 && enemy.x < player.x + player.width / 2 &&
      enemy.y > player.y - player.height / 2 && enemy.y < player.y + player.height / 2) {
      // Make final explosion bigger and longer
      explosions.push({
        x: player.x,
        y: player.y,
        frame: 0,
        maxFrames: graphicsLevel === 1 ? 45 : graphicsLevel === 2 ? 30 : 40,
        isFinal: true,
        scale: 2
      });

      enemies.splice(enemies.indexOf(enemy), 1);
      player.lives--;
      if (player.lives <= 0) {
        gameOver = true;
        gameOverSequence = true;
        player.destroyed = true; // Mark player as destroyed
        // Set up dramatic exit velocities for ALL enemies
        enemies.forEach(enemy => {
          enemy.xSpeed = (Math.random() - 0.5) * 10;
          enemy.ySpeed = -Math.random() * 5 - 3;
          enemy.rotation = (Math.random() - 0.5) * 0.2;
          enemy.rotationAngle = 0;
        });
      }
    }
  });

  // Level completion
  if (spawnedEnemies === enemyCount && enemies.length === 0 && !upgradeMenuActive) {
    upgradeMenuActive = true;
    buttons = []; // Clear any existing buttons
  }
}

// Render loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  if (!gameOver || gameOverSequence) {
    if (!player.destroyed) {
      drawPlayer();
    }
    drawBullets();
    drawEnemies();
    drawExplosions();
  }

  // Always draw UI unless game is completely over
  if (!gameOver || gameOverSequence) {
    drawUI();
  }

  // Show game over screen only after sequence is complete
  if (gameOver && !gameOverSequence) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);

    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);

    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`Final Score: ${points}`, canvas.width / 2, canvas.height / 2 + 40);

    ctx.textAlign = 'left';
  }

  if (levelFadeProgress < 1) {
    showLevelNotification();
  }

  update();
  requestAnimationFrame(gameLoop);
}

// Upgrade functions
function upgradeSpeed() {
  if (!upgradeMenuActive) return;

  player.speed += 1;
  finishUpgrade();
}

function upgradeGuns() {
  if (!upgradeMenuActive || player.gunLevel >= 4) return;

  player.gunLevel++;
  if (player.gunLevel < 4) {
    // 10% faster fire rate for levels 2 and 3
    player.fireRate = Math.floor(player.fireRate * 0.9);
  }

  finishUpgrade();
}

function upgradeGraphics() {
  if (!upgradeMenuActive || graphicsLevel >= 3) return;

  graphicsLevel++;
  document.body.classList.add('graphics-level-1');
  finishUpgrade();
}

function finishUpgrade() {
  startNextLevel();
}

// Initialize first level
enemies = [];
spawnedEnemies = 0;
nextSpawnTime = Date.now();
gameLoop();