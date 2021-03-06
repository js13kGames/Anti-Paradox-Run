/*
 * APRun
 * https://github.com/fatfisz/aprun
 *
 * Copyright (c) 2015 FatFisz
 * Licensed under the MIT license.
 */

'use strict';

var {
  width,
  height,
  statusHeight,
  playerSize,
  bulletWidth,
  bulletHeight,
  bulletFade,
  offscreen,
} = require('../constants');
var state = require('../state');
var { context } = require('../utils');
var clear = require('./clear');
var drawStatus = require('./status');


var playerColor = '#1ef755';
var enemyColor = '#f71e29';
var platformColor = '#aaa';

function drawPlayer([x, y]) {
  context.fillStyle = playerColor;
  context.fillRect(x - playerSize / 2, y, playerSize, playerSize);
}

var xCrackOffset = 13;
var yCrackOffset = 7;
var platformHeight = height / 4;

function drawPlatform([_x, y, _width]) {
  var playerX = state.player.pos[0];
  var x = _x;
  var width = _width;

  if (x - playerX < -offscreen) {
    width -= -offscreen - x + playerX;
    x = -offscreen + playerX;
  }

  if (x + width - playerX > offscreen) {
    width = offscreen - x + playerX;
  }

  if (width <= 0) {
    return;
  }

  var offset = (state.offset - x + y * yCrackOffset) % xCrackOffset;

  context.clearRect(x + 2, y - 2, width - 4, 1);
  context.clearRect(x + 1, y - platformHeight, width - 2, platformHeight - 1);

  context.fillStyle = platformColor;

  for (var crackX = x + 2 + offset;
       crackX <= x + width - 4;
       crackX += xCrackOffset) {
    if (crackX < x + width) {
      context.fillRect(crackX, y - 2, 1, 1);
    }
    context.fillRect(crackX - 1, y - 3, 1, 1);
  }

  context.roundedRect(x + .5, y - platformHeight, x + width - .5, y - .5, 2.75);
  context.strokeStyle = platformColor;
  context.stroke();
}

var enemyParam1 = (playerSize - bulletHeight) / 2 / playerSize;
var enemyParam2 = playerSize - enemyParam1 * (bulletWidth + playerSize / 2);

function drawEnemy([x, y, enemyX]) {
  var height = Math.max(Math.min((enemyX - x) * enemyParam1 + enemyParam2, playerSize), 2);

  context.fillStyle = enemyColor;
  context.fillRect(enemyX - playerSize / 2, y - playerSize / 2, playerSize, height);
}

function drawEnemyBullet([x, y]) {
  context.fillStyle = enemyColor;
  context.fillRect(x, y - bulletHeight / 2, bulletWidth, bulletHeight);
}

function drawBullet(bullet) {
  var playerX = state.player.pos[0];
  var [x, y, enemyX, enemyBullets, hit] = bullet;

  if (!hit &&
      (enemyX === null || enemyX - x >= playerSize / 2)) {
    if (x < playerX) {
      context.globalAlpha = Math.max(1 - (playerX - x) / bulletFade, 0);
    }

    context.fillStyle = playerColor;
    context.fillRect(x, y - bulletHeight / 2, bulletWidth, bulletHeight);

    if (x < playerX) {
      context.globalAlpha = 1;
    }
  }

  if (enemyX !== null) {
    drawEnemy(bullet);
    enemyBullets.forEach((enemyBullet) => {
      if (enemyBullet[0] < enemyX - playerSize / 2) {
        drawEnemyBullet(enemyBullet);
      }
    });
  }
}

var shakeSize = 6;

module.exports = function draw() {
  var {
    player,
    platforms,
    bullets,
    gauge,
  } = state;
  var { pos } = player;
  var offsetX = width / 2 - pos[0] * 2;
  var offsetY = (height + statusHeight) / 2 + pos[1] * 2 + playerSize;
  var { value: gaugeValue } = gauge;

  if (gaugeValue < 1) {
    offsetX += shakeSize * (1 - gaugeValue) * (Math.random() * 2 - 1);
    offsetY += shakeSize * (1 - gaugeValue) * (Math.random() * 2 - 1);
  }

  clear();

  context.setTransform(2, 0, 0, -2, offsetX, offsetY);

  platforms.sort((a, b) => b[1] - a[1]).forEach(drawPlatform);
  bullets.forEach(drawBullet);

  drawPlayer(pos);

  drawStatus();
};
