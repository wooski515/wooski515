const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startGameButton = document.getElementById('startGameButton');

let brickImage = new Image();
let paddleImage = new Image();
let brickImageLoaded = false;
let paddleImageLoaded = false;
let gameStarted = false;

const brickImagePath = 'кирпичи.png';
const paddleImagePath = 'платформа.png';

// --- Параметры игры ---
let ballRadius = 8;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2.5;
let dy = -2.5;

// Игровая высота и ширина платформы (для логики отскока и управления)
let PADDLE_LOGIC_HEIGHT = 15; // Константа для логической высоты платформы
let paddleWidth = 90;        // Игровая ширина платформы
let paddleX = (canvas.width - paddleWidth) / 2;

// НОВОЕ: Переменная для хранения рассчитанной высоты отрисовки платформы
let renderedPaddleHeight = PADDLE_LOGIC_HEIGHT; // По умолчанию равна логической высоте

let brickRowCount = 4;
let brickColumnCount = 6;
let brickWidth = 65;    // Ширина кирпича для отрисовки и логики
let brickHeight = 20;   // Высота кирпича для отрисовки и логики
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft = 30;

let bricks = [];
let score = 0;
let lives = 3;

// --- Загрузка изображений ---
function loadImages() {
    let imagesToLoad = 2;
    let imagesLoadedCount = 0;

    function onImageLoad(imageType) { // Добавим тип для определения, какое изображение загружено
        imagesLoadedCount++;

        if (imageType === 'paddle' && paddleImage.complete && paddleImage.naturalWidth > 0) {
            // ИЗМЕНЕНО: Рассчитываем renderedPaddleHeight после загрузки изображения платформы
            // Сохраняем пропорции: новая высота = старая высота * (новая ширина / старая ширина)
            renderedPaddleHeight = paddleImage.naturalHeight * (paddleWidth / paddleImage.naturalWidth);
            // Ограничим максимальную высоту, чтобы платформа не стала слишком большой (опционально)
            // renderedPaddleHeight = Math.min(renderedPaddleHeight, canvas.height / 4);
        }


        if (imagesLoadedCount === imagesToLoad) {
            brickImageLoaded = true;
            paddleImageLoaded = true;
            startGameButton.disabled = false;
            startGameButton.textContent = "Начать игру";
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Изображения загружены. Нажмите 'Начать игру'", canvas.width/2, canvas.height/2);
        } else if (brickImage.complete && !paddleImage.complete && imagesToLoad - imagesLoadedCount > 0) { // Уточнил условие
             startGameButton.textContent = "Загрузка платформы...";
        } else if (!brickImage.complete && paddleImage.complete && imagesToLoad - imagesLoadedCount > 0) {
            startGameButton.textContent = "Загрузка кирпичей...";
        }
    }

    function onImageError(imageName) {
        console.error(`Ошибка загрузки изображения: ${imageName}`);
        startGameButton.textContent = `Ошибка: ${imageName} не найден`;
        startGameButton.disabled = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "red";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Ошибка: Файл "${imageName}" не найден.`, canvas.width/2, canvas.height/2 - 10);
        ctx.fillText(`Поместите его в папку с игрой.`, canvas.width/2, canvas.height/2 + 10);
    }

    brickImage.onload = () => onImageLoad('brick');
    brickImage.onerror = () => onImageError('кирпичи.png');
    brickImage.src = brickImagePath;

    paddleImage.onload = () => onImageLoad('paddle');
    paddleImage.onerror = () => onImageError('платформа.png');
    paddleImage.src = paddleImagePath;

    // Проверка на кеш
    let tempLoadedCount = 0;
    if (brickImage.complete) tempLoadedCount++;
    if (paddleImage.complete) tempLoadedCount++;

    if (tempLoadedCount > imagesLoadedCount && imagesToLoad > 0) {
        imagesLoadedCount = 0; // сбросить
        if (brickImage.complete) onImageLoad('brick');
        if (paddleImage.complete) onImageLoad('paddle');
    }
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
    // ИЗМЕНЕНО: Y-координата теперь зависит от renderedPaddleHeight
    // Платформа рисуется так, чтобы ее НИЖНИЙ край был на canvas.height - PADDLE_LOGIC_HEIGHT (для консистентности "хитбокса")
    // а сама картинка поднимается вверх, если она выше PADDLE_LOGIC_HEIGHT
    const paddleDrawY = canvas.height - renderedPaddleHeight; // Верхний край картинки
    // const paddleHitboxTopY = canvas.height - PADDLE_LOGIC_HEIGHT; // Верхний край "хитбокса"

    if (paddleImageLoaded && paddleImage.complete && paddleImage.naturalWidth !== 0) {
        // Рисуем изображение с рассчитанной высотой renderedPaddleHeight
        ctx.drawImage(paddleImage, paddleX, paddleDrawY, paddleWidth, renderedPaddleHeight);
    } else { // Фолбэк
        ctx.beginPath();
        // Фолбэк рисуется с логической высотой и на стандартной позиции
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
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                if (brickImageLoaded && brickImage.complete && brickImage.naturalWidth !== 0) {
                    // Для кирпичей также можно сделать пропорциональное масштабирование, если нужно
                    // Пока оставляем как есть: изображение растягивается/сжимается под brickWidth и brickHeight
                    ctx.drawImage(brickImage, brickX, brickY, brickWidth, brickHeight);
                } else {
                    ctx.beginPath();
                    ctx.rect(brickX, brickY, brickWidth, brickHeight);
                    ctx.fillStyle = "#DD0095";
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Счет: " + score, 8, 20);
}

function drawLives() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Жизни: " + lives, canvas.width - 75, 20);
}

// --- Логика игры ---
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                // Используем brickWidth и brickHeight для столкновений
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score++;
                    if (score === brickRowCount * brickColumnCount) {
                        alert("ПОБЕДА! Поздравляю!");
                        document.location.reload();
                    }
                }
            }
        }
    }
}

function resetBallAndPaddle() {
    x = canvas.width / 2;
    y = canvas.height - 30; // Стандартное положение мяча
    dx = 2.5 * (Math.random() < 0.5 ? 1 : -1);
    dy = -2.5;
    paddleX = (canvas.width - paddleWidth) / 2;
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

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }

    // ИЗМЕНЕНО: Логика отскока от платформы использует PADDLE_LOGIC_HEIGHT
    const paddleHitboxTopY = canvas.height - PADDLE_LOGIC_HEIGHT;

    if (y + dy < ballRadius) { // Отскок от верхней стенки
        dy = -dy;
    } else if (y + dy > paddleHitboxTopY - ballRadius) { // Мяч у уровня "хитбокса" платформы
        // Проверяем, был ли мяч выше "хитбокса" платформы
        if (y < paddleHitboxTopY) {
            // Проверяем, находится ли мяч в горизонтальных границах платформы
            if (x + dx > paddleX && x + dx < paddleX + paddleWidth) {
                // Отскок от платформы
                let collidePoint = (x + dx) - (paddleX + paddleWidth / 2);
                collidePoint = collidePoint / (paddleWidth / 2);
                let angleRad = collidePoint * (Math.PI / 3);

                let currentSpeed = Math.sqrt(dx*dx + dy*dy);
                dx = currentSpeed * Math.sin(angleRad);
                dy = -currentSpeed * Math.cos(angleRad);

                if (dy >= 0) dy = -Math.abs(dy) || -2.5;

                // Коррекция положения, чтобы мяч не "залипал" в "хитбоксе"
                y = paddleHitboxTopY - ballRadius;
            } else {
                // Мяч пролетел мимо платформы по горизонтали, проверяем нижнюю границу
                if (y + dy > canvas.height - ballRadius) { // Мяч коснулся самого низа
                    lives--;
                    if (!lives) {
                        alert("ИГРА ОКОНЧЕНА. Попробуй еще!");
                        document.location.reload();
                    } else {
                        resetBallAndPaddle();
                    }
                }
            }
        } else {
             // Мяч уже был на уровне или ниже "хитбокса" платформы.
             // Если он все еще движется вниз и прошел нижний край канваса
             if (y + dy > canvas.height - ballRadius) {
                lives--;
                if (!lives) {
                    alert("ИГРА ОКОНЧЕНА. Попробуй еще!");
                    document.location.reload();
                } else {
                    resetBallAndPaddle();
                }
            }
        }
    }


    x += dx;
    y += dy;

    requestAnimationFrame(draw);
}

// --- Управление мышью ---
document.addEventListener("mousemove", mouseMoveHandler, false);

function mouseMoveHandler(e) {
    let relativeX = e.clientX - canvas.offsetLeft;
    if (canvas.parentElement) {
        relativeX = e.clientX - canvas.getBoundingClientRect().left;
    }
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

// --- Старт игры ---
startGameButton.addEventListener('click', () => {
    if (brickImageLoaded && paddleImageLoaded) {
        if (!gameStarted) {
            initBricks();
            resetBallAndPaddle();
            score = 0;
            lives = 3;
            gameStarted = true;
            startGameButton.style.display = 'none';
            draw();
        }
    }
});

// --- Инициализация ---
ctx.font = "16px Arial";
ctx.textAlign = "center";
ctx.fillText("Загрузка изображений...", canvas.width/2, canvas.height/2);
loadImages();