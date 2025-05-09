const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startGameButton = document.getElementById('startGameButton');
// const restartButton = document.getElementById('restartButton'); // Если будете использовать кнопку перезапуска

let brickImage = new Image();
let paddleImage = new Image();
let brickImageLoaded = false;
let paddleImageLoaded = false;
let gameStarted = false;
let animationFrameId; // Для остановки requestAnimationFrame

const brickImagePath = 'kirpichi.png';
const paddleImagePath = 'platforma.png';

// --- Базовые размеры и пропорции (для масштабирования) ---
const BASE_CANVAS_WIDTH = 480;
const BASE_CANVAS_HEIGHT = 320;
let scaleFactor = 1;

// --- Параметры игры (будут масштабироваться) ---
let ballRadius;
let x, y, dx, dy;

let PADDLE_LOGIC_HEIGHT; // Логическая высота платформы
let paddleWidth;        // Игровая ширина платформы
let paddleX;
let renderedPaddleHeight; // Визуальная высота платформы

let brickRowCount, brickColumnCount;
let brickWidth, brickHeight;
let brickPadding, brickOffsetTop, brickOffsetLeft;

let bricks = [];
let score = 0;
let lives = 3;

// --- Функция установки размеров и масштабирования ---
function setupCanvasAndGameParameters() {
    const gameContainer = document.querySelector('.game-container');
    let containerWidth = gameContainer.clientWidth;

    // Устанавливаем ширину и высоту холста, сохраняя пропорции BASE_CANVAS_WIDTH / BASE_CANVAS_HEIGHT
    canvas.width = containerWidth;
    canvas.height = containerWidth * (BASE_CANVAS_HEIGHT / BASE_CANVAS_WIDTH);

    scaleFactor = canvas.width / BASE_CANVAS_WIDTH;

    // Масштабируем игровые параметры
    ballRadius = 8 * scaleFactor;

    PADDLE_LOGIC_HEIGHT = 15 * scaleFactor;
    paddleWidth = 90 * scaleFactor;
    // renderedPaddleHeight будет пересчитан после загрузки изображения, но инициализируем
    renderedPaddleHeight = PADDLE_LOGIC_HEIGHT;


    brickRowCount = 4; // Количество можно оставить фиксированным
    brickColumnCount = 6;
    brickPadding = 10 * scaleFactor;
    brickOffsetTop = 30 * scaleFactor;
    brickOffsetLeft = 30 * scaleFactor;

    // Рассчитываем ширину и высоту кирпича так, чтобы они поместились
    // Общая ширина для кирпичей = canvas.width - 2 * brickOffsetLeft - (brickColumnCount - 1) * brickPadding
    // Ширина одного кирпича = Общая ширина для кирпичей / brickColumnCount
    const totalBrickSpaceWidth = canvas.width - 2 * brickOffsetLeft - (brickColumnCount - 1) * brickPadding;
    brickWidth = totalBrickSpaceWidth / brickColumnCount;
    brickHeight = 20 * scaleFactor; // Можно сделать зависимым от brickWidth для сохранения пропорций

    // Пересчитываем renderedPaddleHeight, если изображение уже загружено
    if (paddleImageLoaded && paddleImage.complete && paddleImage.naturalWidth > 0) {
        calculateRenderedPaddleHeight();
    }

    // Если игра уже идет, нужно переинициализировать элементы с новыми размерами
    // (более сложный сценарий, пока опустим для перезапуска при ресайзе)
    // Для простоты, при ресайзе лучше перезапускать игру или показывать сообщение.
}

function calculateRenderedPaddleHeight() {
    if (paddleImage.complete && paddleImage.naturalWidth > 0) {
        renderedPaddleHeight = paddleImage.naturalHeight * (paddleWidth / paddleImage.naturalWidth);
    } else {
        renderedPaddleHeight = PADDLE_LOGIC_HEIGHT;
    }
}


// --- Загрузка изображений ---
function loadImages() {
    startGameButton.disabled = true;
    startGameButton.textContent = "Загрузка...";
    let imagesToLoad = 2;
    let imagesLoadedCount = 0;

    function onImageLoad(imageType) {
        imagesLoadedCount++;
        if (imageType === 'paddle') {
            calculateRenderedPaddleHeight(); // Рассчитать высоту платформы после загрузки
        }

        if (imagesLoadedCount === imagesToLoad) {
            brickImageLoaded = true;
            paddleImageLoaded = true;
            startGameButton.disabled = false;
            startGameButton.textContent = "Начать игру";
            // Отрисуем начальное состояние, если нужно
            drawInitialMessage("Изображения загружены. Нажмите 'Начать игру'");
        } else {
            startGameButton.textContent = `Загрузка (${imagesLoadedCount}/${imagesToLoad})...`;
        }
    }

    function onImageError(imageName) {
        console.error(`Ошибка загрузки изображения: ${imageName}`);
        startGameButton.textContent = `Ошибка: ${imageName}`;
        startGameButton.disabled = true;
        drawInitialMessage(`Ошибка: Файл "${imageName}" не найден. Проверьте имя и путь.`);
    }

    brickImage.onload = () => onImageLoad('brick');
    brickImage.onerror = () => onImageError('кирпичи.png');
    brickImage.src = brickImagePath; // GitHub Pages чувствителен к регистру! Убедитесь, что имена файлов точные.

    paddleImage.onload = () => onImageLoad('paddle');
    paddleImage.onerror = () => onImageError('платформа.png');
    paddleImage.src = paddleImagePath; // GitHub Pages чувствителен к регистру!

    // Проверка на кеш (упрощенная)
    if (brickImage.complete) onImageLoad('brick');
    if (paddleImage.complete) onImageLoad('paddle');
}

function drawInitialMessage(message) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${16 * scaleFactor}px Arial`;
    ctx.fillStyle = message.startsWith("Ошибка:") ? "red" : "#333";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}


// --- Инициализация кирпичей ---
function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }
}

// --- Отрисовка элементов ---
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    const paddleDrawY = canvas.height - renderedPaddleHeight;

    if (paddleImageLoaded && paddleImage.complete && paddleImage.naturalWidth !== 0) {
        ctx.drawImage(paddleImage, paddleX, paddleDrawY, paddleWidth, renderedPaddleHeight);
    } else {
        ctx.beginPath();
        ctx.rect(paddleX, canvas.height - PADDLE_LOGIC_HEIGHT, paddleWidth, PADDLE_LOGIC_HEIGHT);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let currentBrickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let currentBrickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = currentBrickX;
                bricks[c][r].y = currentBrickY;

                if (brickImageLoaded && brickImage.complete && brickImage.naturalWidth !== 0) {
                    ctx.drawImage(brickImage, currentBrickX, currentBrickY, brickWidth, brickHeight);
                } else {
                    ctx.beginPath();
                    ctx.rect(currentBrickX, currentBrickY, brickWidth, brickHeight);
                    ctx.fillStyle = "#DD0095";
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }
}

function drawScore() {
    ctx.font = `${16 * scaleFactor}px Arial`;
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "left";
    ctx.fillText("Счет: " + score, 8 * scaleFactor, 20 * scaleFactor);
}

function drawLives() {
    ctx.font = `${16 * scaleFactor}px Arial`;
    ctx.fillStyle = "#0095DD";
    ctx.textAlign = "right";
    ctx.fillText("Жизни: " + lives, canvas.width - 8 * scaleFactor, 20 * scaleFactor);
}

// --- Логика игры ---
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score++;
                    if (score === brickRowCount * brickColumnCount) {
                        gameOver("ПОБЕДА! Поздравляю!");
                    }
                }
            }
        }
    }
}

function resetBallAndPaddle() {
    x = canvas.width / 2;
    y = canvas.height - (30 * scaleFactor) - PADDLE_LOGIC_HEIGHT; // Стартуем над логической платформой
    // Если хотите стартовать над визуальной платформой:
    // y = canvas.height - renderedPaddleHeight - ballRadius - (5 * scaleFactor);
    let initialSpeed = 2.5 * scaleFactor;
    dx = initialSpeed * (Math.random() < 0.5 ? 1 : -1);
    dy = -initialSpeed;
    paddleX = (canvas.width - paddleWidth) / 2;
}

function gameOver(message) {
    gameStarted = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    alert(message); // Простое уведомление
    startGameButton.textContent = "Играть снова";
    startGameButton.style.display = 'inline-block';
    startGameButton.disabled = false; // Сделать кнопку снова активной
    // drawInitialMessage(message + " Нажмите 'Играть снова'"); // Альтернатива alert
    // if (restartButton) restartButton.style.display = 'inline-block';
}


function draw() {
    if (!gameStarted) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    drawLives();
    collisionDetection();

    const paddleHitboxTopY = canvas.height - PADDLE_LOGIC_HEIGHT;

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }

    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > paddleHitboxTopY - ballRadius) { // Мяч у уровня "хитбокса" платформы
        if (y < paddleHitboxTopY) { // Мяч был выше "хитбокса"
            if (x + dx > paddleX && x + dx < paddleX + paddleWidth) {
                let collidePoint = (x + dx) - (paddleX + paddleWidth / 2);
                collidePoint = collidePoint / (paddleWidth / 2);
                let angleRad = collidePoint * (Math.PI / 3);

                let currentSpeed = Math.sqrt(dx*dx + dy*dy);
                dx = currentSpeed * Math.sin(angleRad);
                dy = -currentSpeed * Math.cos(angleRad);

                if (dy >= 0) dy = -Math.abs(dy) || -(2.5 * scaleFactor);
                y = paddleHitboxTopY - ballRadius; // Коррекция
            } else { // Пролетел мимо по горизонтали
                if (y + dy > canvas.height - ballRadius) { // Достиг самого низа
                    lives--;
                    if (!lives) {
                        gameOver("ИГРА ОКОНЧЕНА. Попробуй еще!");
                    } else {
                        resetBallAndPaddle();
                    }
                }
            }
        } else { // Мяч уже на уровне или ниже "хитбокса"
            if (y + dy > canvas.height - ballRadius) {
                lives--;
                if (!lives) {
                    gameOver("ИГРА ОКОНЧЕНА. Попробуй еще!");
                } else {
                    resetBallAndPaddle();
                }
            }
        }
    }

    x += dx;
    y += dy;

    animationFrameId = requestAnimationFrame(draw);
}

// --- Управление ---
function movePaddle(clientX) {
    let rect = canvas.getBoundingClientRect();
    let relativeX = clientX - rect.left;

    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
        if (paddleX < 0) {
            paddleX = 0;
        }
        if (paddleX + paddleWidth > canvas.width) {
            paddleX = canvas.width - paddleWidth;
        }
    }
}

document.addEventListener("mousemove", (e) => movePaddle(e.clientX), false);
document.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Предотвратить скроллинг страницы
    if (e.touches.length > 0) {
        movePaddle(e.touches[0].clientX);
    }
}, { passive: false }); // passive: false для preventDefault

// --- Старт/Рестарт игры ---
function startGame() {
    if (!brickImageLoaded || !paddleImageLoaded) {
        alert("Изображения еще не загружены. Пожалуйста, подождите.");
        return;
    }
    if (gameStarted) return; // Не запускать, если уже идет

    setupCanvasAndGameParameters(); // Важно вызвать перед initBricks и resetBallAndPaddle
    initBricks();
    resetBallAndPaddle();
    score = 0;
    lives = 3;
    gameStarted = true;
    startGameButton.style.display = 'none';
    // if (restartButton) restartButton.style.display = 'none';

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    draw();
}

startGameButton.addEventListener('click', startGame);
// if (restartButton) restartButton.addEventListener('click', startGame); // Если есть кнопка рестарта


// --- Инициализация при загрузке и ресайзе ---
window.addEventListener('resize', () => {
    // При ресайзе нужно пересчитать размеры и перерисовать.
    // Простое решение: остановить игру и предложить начать заново.
    if (gameStarted) {
        gameStarted = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        // alert("Размер окна изменен. Для продолжения начните игру заново.");
        drawInitialMessage("Размер изменен. Нажмите 'Играть снова'");
        startGameButton.textContent = "Играть снова";
        startGameButton.style.display = 'inline-block';
        startGameButton.disabled = false;
    }
    // В любом случае обновляем параметры холста для корректного отображения сообщений
    setupCanvasAndGameParameters();
    if (!gameStarted && brickImageLoaded && paddleImageLoaded) { // Если игра не шла, но картинки загружены
        drawInitialMessage("Нажмите 'Начать игру'");
    } else if (!gameStarted && (!brickImageLoaded || !paddleImageLoaded)){
        drawInitialMessage("Загрузка..."); // Или конкретное сообщение об ошибке, если есть
    }
});

// Первоначальная настройка и загрузка
setupCanvasAndGameParameters();
loadImages(); // Загрузка изображений начнется сразу
drawInitialMessage("Загрузка изображений...");
