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
  enemies.push({
    x: Math.random() * (canvas.width - 20),
    y: -20,
    width: 20,
    height: 20,
    speed: 1 + level * 0.5
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
  ctx.fillStyle = graphicsLevel === 1 ? 'red' : graphicsLevel === 2 ? 'orange' : 'purple';
  enemies.forEach(enemy => ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height));
}

function drawExplosions() {
  // Only draw explosions if graphics level is above 1
  if (graphicsLevel === 1) return;

  explosions = explosions.filter(exp => exp.frame < exp.maxFrames);

  explosions.forEach(exp => {
    const opacity = 1 - (exp.frame / exp.maxFrames);

    if (graphicsLevel === 2) {
      // Orange/yellow explosion with multiple circles
      const colors = [`rgba(255, 200, 0, ${opacity})`, `rgba(255, 100, 0, ${opacity})`];
      colors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        // Ensure radius is always positive
        const radius = Math.max(0, exp.frame * 2 - i * 3);
        ctx.arc(exp.x, exp.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Complex particle-based explosion
      const particles = 8;
      const angle = (Math.PI * 2) / particles;
      ctx.fillStyle = `rgba(255, ${100 + exp.frame * 10}, 0, ${opacity})`;

      for (let i = 0; i < particles; i++) {
        const radius = exp.frame * 2;
        const particleX = exp.x + Math.cos(angle * i) * radius;
        const particleY = exp.y + Math.sin(angle * i) * radius;

        ctx.beginPath();
        ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
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
  ctx.fillText(`Points: ${points}  Level: ${level}`, 10, 20);

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

  // Calculate and draw progress - now based on defeated enemies
  const defeatedEnemies = spawnedEnemies - enemies.length;
  const progress = defeatedEnemies / enemyCount;
  const progressWidth = barWidth * Math.min(progress, 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(barX, barY, progressWidth, barHeight);

  // Draw border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Draw text
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  const percentage = Math.floor(progress * 100);
  ctx.fillText(`${Math.min(percentage, 100)}%`, barX + barWidth / 2 - 15, barY + barHeight - 2);
}

// Update game state
function update() {
  if (gameOver || upgradeMenuActive) return;

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

  // Enemy movement
  enemies.forEach(e => e.y += e.speed);
  enemies = enemies.filter(e => e.y < canvas.height + e.height);

  // Collision detection
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (bullet.x > enemy.x - enemy.width / 2 && bullet.x < enemy.x + enemy.width / 2 &&
        bullet.y > enemy.y - enemy.height / 2 && bullet.y < enemy.y + enemy.height / 2) {
        // Only add explosion effect if graphics level > 1
        if (graphicsLevel > 1) {
          explosions.push({
            x: enemy.x,
            y: enemy.y,
            frame: 0,
            maxFrames: graphicsLevel === 2 ? 15 : 20
          });
        }

        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);
        points += 10;
      }
    });
  });

  enemies.forEach(enemy => {
    if (enemy.x > player.x - player.width / 2 && enemy.x < player.x + player.width / 2 &&
      enemy.y > player.y - player.height / 2 && enemy.y < player.y + player.height / 2) {
      if (graphicsLevel > 1) {
        explosions.push({
          x: player.x,
          y: player.y,
          frame: 0,
          maxFrames: graphicsLevel === 2 ? 20 : 25
        });
      }

      enemies.splice(enemies.indexOf(enemy), 1);
      player.lives--;
      if (player.lives <= 0) {
        gameOver = true;
        gameOverSequence = true;
        // Assign random horizontal velocities to remaining enemies
        enemies.forEach(e => {
          e.xSpeed = (Math.random() - 0.5) * 8; // Random speed between -4 and 4
          e.ySpeed = -e.speed; // Reverse vertical direction
        });
      }
    }
  });

  // Level completion
  if (spawnedEnemies === enemyCount && enemies.length === 0) {
    upgradeMenuActive = true;
    document.getElementById('upgradeMenu').style.display = 'block';
    document.getElementById('pointsDisplay').textContent = points;
  }

  // Modify the update logic to handle game over sequence
  if (gameOver) {
    // Continue moving bullets until they're off screen
    bullets = bullets.filter(b => b.y > -10);
    bullets.forEach(b => b.y -= 5);

    if (gameOverSequence) {
      // Move remaining enemies off screen
      enemies.forEach(enemy => {
        enemy.x += enemy.xSpeed;
        enemy.y += enemy.ySpeed;
      });

      // Remove enemies that are off screen
      enemies = enemies.filter(enemy =>
        enemy.x > -50 &&
        enemy.x < canvas.width + 50 &&
        enemy.y > -50
      );

      // End sequence when all enemies are gone
      if (enemies.length === 0) {
        gameOverSequence = false;
      }
    }

    return; // Skip rest of normal update logic
  }
}

// Render loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(); // Stars will always move

  if (!gameOver || gameOverSequence) {
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawExplosions();
  }

  drawUI();

  if (gameOver) {
    // Only show game over text after sequence is complete
    if (!gameOverSequence) {
      ctx.fillStyle = 'red';
      ctx.font = '30px Arial';
      ctx.fillText('Game Over', canvas.width / 2 - 70, canvas.height / 2);
    }
  }

  update();
  requestAnimationFrame(gameLoop);
}

// Upgrade functions
function upgradeSpeed() {
  if (points >= 10) {
    points -= 10;
    player.speed += 1;
    updatePointsDisplay();
  }
}

function upgradeGuns() {
  if (points >= 15 && player.gunLevel < 4) {
    points -= 15;
    player.gunLevel++;

    if (player.gunLevel < 4) {
      // 10% faster fire rate for levels 2 and 3
      player.fireRate = Math.floor(player.fireRate * 0.9);
    }

    updatePointsDisplay();

    // Update the button text to show current level
    const gunBtn = document.getElementById('upgradeGunsBtn');
    if (gunBtn) {
      if (player.gunLevel < 4) {
        gunBtn.textContent = `Upgrade Guns (Level ${player.gunLevel}/4) - 15 pts`;
      } else {
        gunBtn.textContent = `Guns Maxed!`;
      }
    }
  }
}

function upgradeGraphics() {
  if (points >= 20 && graphicsLevel < 3) {
    points -= 20;
    graphicsLevel++;
    updatePointsDisplay();
  }
}

function updatePointsDisplay() {
  document.getElementById('pointsDisplay').textContent = points;
}

function startNextLevel() {
  level++;
  enemyCount += 5;
  enemies = [];
  spawnedEnemies = 0;
  nextSpawnTime = Date.now();
  upgradeMenuActive = false;
  document.getElementById('upgradeMenu').style.display = 'none';
}

// Initialize first level
enemies = [];
spawnedEnemies = 0;
nextSpawnTime = Date.now();
gameLoop();