// ... весь код до функции showLeaderboard без изменений ...
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startGameButton = document.getElementById('startGameButton');
const gameContainer = document.querySelector('.game-container');
const explosionSound = document.getElementById('explosionSound');
const victorySound = document.getElementById('victorySound');
const defeatSound = document.getElementById('defeatSound');
const heartImage = new Image();
const leaderboardButton = document.getElementById('leaderboardButton');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboard = document.getElementById('closeLeaderboard');
const leaderboardList = document.getElementById('leaderboardList');
const nicknamePrompt = document.getElementById('nicknamePrompt');
const promptTitle = document.getElementById('promptTitle');
const finalScoreSpan = document.getElementById('finalScore');
const nicknameInput = document.getElementById('nicknameInput');
const submitScoreButton = document.getElementById('submitScoreButton');
const victoryVideoContainer = document.getElementById('victoryVideoContainer');
const victoryVideo = document.getElementById('victoryVideo');
const victoryMusic = document.getElementById('victoryMusic');
let brickImage = new Image();
let paddleImage = new Image();
let brickImageLoaded = false;
let paddleImageLoaded = false;
let heartImageLoaded = false;
let gameStarted = false;
let animationFrameId;
let ballIsWaiting = false;
const brickImagePath = 'kirpichi.png';
const paddleImagePath = 'platforma.png';
const heartImagePath = 'heart.png';
const BASE_CANVAS_WIDTH = 560; 
const BASE_CANVAS_HEIGHT = 380;
let scaleFactor = 1;
let ballRadius;
let x, y, dx, dy;
let hue = 0;
let PADDLE_LOGIC_HEIGHT;
let paddleWidth;
let paddleX;
let renderedPaddleHeight;
let brickRowCount, brickColumnCount;
let brickWidth, brickHeight;
let brickPadding, brickOffsetTop, brickOffsetLeft;
let bricks = [];
let score = 0;
let lives = 3;
let currentLevel = 0;
let bricksLeft = 0;
const cheatCode = ['KeyZ', 'KeyO', 'KeyV'];
let keySequence = [];
const levels = [
    [
        [0, 1, 1, 1, 1, 1, 1, 0],[1, 1, 1, 1, 1, 1, 1, 1],[1, 1, 1, 1, 1, 1, 1, 1],[0, 1, 1, 1, 1, 1, 1, 0],[0, 0, 1, 1, 1, 1, 0, 0],
    ],
    [
        [1, 1, 0, 1, 1, 0, 1, 1],[1, 1, 0, 1, 1, 0, 1, 1],[0, 0, 0, 0, 0, 0, 0, 0],[1, 1, 1, 1, 1, 1, 1, 1],[1, 0, 1, 1, 1, 1, 0, 1],
    ],
    [
        [1, 1, 1, 1, 1, 1, 1, 1],[1, 0, 1, 0, 0, 1, 0, 1],[1, 1, 1, 0, 0, 1, 1, 1],[1, 0, 1, 0, 0, 1, 0, 1],[1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
        [1, 0, 0, 1, 1, 0, 0, 1],[1, 1, 0, 1, 1, 0, 1, 1],[1, 0, 1, 1, 1, 1, 0, 1],[1, 0, 0, 1, 1, 0, 0, 1],[1, 0, 0, 1, 1, 0, 0, 1],
    ],
    [
        [1, 1, 1, 0, 0, 1, 1, 1],[1, 1, 0, 1, 1, 0, 1, 1],[1, 0, 1, 1, 1, 1, 0, 1],[0, 1, 1, 1, 1, 1, 1, 0],[0, 0, 1, 1, 1, 1, 0, 0],
    ]
];
function setupCanvasAndGameParameters(){let containerWidth=gameContainer.clientWidth;canvas.width=containerWidth;canvas.height=containerWidth*(BASE_CANVAS_HEIGHT/BASE_CANVAS_WIDTH);scaleFactor=canvas.width/BASE_CANVAS_WIDTH;ballRadius=8*scaleFactor;PADDLE_LOGIC_HEIGHT=15*scaleFactor;paddleWidth=100*scaleFactor;renderedPaddleHeight=PADDLE_LOGIC_HEIGHT;brickPadding=8*scaleFactor;brickOffsetTop=30*scaleFactor;brickOffsetLeft=30*scaleFactor;const totalBrickSpaceWidth=canvas.width-2*brickOffsetLeft-(brickColumnCount>1?(brickColumnCount-1)*brickPadding:0);brickWidth=totalBrickSpaceWidth/brickColumnCount;brickHeight=20*scaleFactor;if(paddleImageLoaded)calculateRenderedPaddleHeight()}
function calculateRenderedPaddleHeight(){if(paddleImage.complete&&paddleImage.naturalWidth>0){renderedPaddleHeight=paddleImage.naturalHeight*(paddleWidth/paddleImage.naturalWidth)}else{renderedPaddleHeight=PADDLE_LOGIC_HEIGHT}}
function loadImages(){startGameButton.disabled=true;startGameButton.textContent="Загрузка...";let imagesToLoad=3;let imagesLoadedCount=0;function onImageLoad(imageType){imagesLoadedCount++;if(imageType==='paddle')calculateRenderedPaddleHeight();if(imagesLoadedCount===imagesToLoad){brickImageLoaded=true;paddleImageLoaded=true;heartImageLoaded=true;startGameButton.disabled=false;startGameButton.textContent="Начать игру";drawInitialMessage("Изображения загружены. Нажмите 'Начать игру'")}else{startGameButton.textContent=`Загрузка (${imagesLoadedCount}/${imagesToLoad})...`}}function onImageError(imageName){console.error(`Ошибка загрузки изображения: ${imageName}`);startGameButton.textContent=`Ошибка: ${imageName}`;startGameButton.disabled=true;drawInitialMessage(`Ошибка: Файл "${imageName}" не найден. Проверьте имя и путь.`)}brickImage.onload=()=>onImageLoad('brick');brickImage.onerror=()=>onImageError('kirpichi.png');brickImage.src=brickImagePath;paddleImage.onload=()=>onImageLoad('paddle');paddleImage.onerror=()=>onImageError('platforma.png');paddleImage.src=paddleImagePath;heartImage.onload=()=>onImageLoad('heart');heartImage.onerror=()=>onImageError('heart.png');heartImage.src=heartImagePath;if(brickImage.complete)onImageLoad('brick');if(paddleImage.complete)onImageLoad('paddle');if(heartImage.complete)onImageLoad('heart')}
function drawInitialMessage(message){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.font=`${16*scaleFactor}px Arial`;ctx.fillStyle=message.startsWith("Ошибка:")?"red":"#eee";ctx.textAlign="center";ctx.fillText(message,canvas.width/2,canvas.height/2)}
function loadLevel(level){bricks=[];bricksLeft=0;const levelLayout=levels[level];brickRowCount=levelLayout.length;brickColumnCount=levelLayout[0].length;setupCanvasAndGameParameters();for(let c=0;c<brickColumnCount;c++){bricks[c]=[];for(let r=0;r<brickRowCount;r++){const brickStatus=levelLayout[r][c];bricks[c][r]={x:0,y:0,status:brickStatus};if(brickStatus===1){bricksLeft++}}}}
function createExplosion(x, y) {explosionSound.volume = 0.1; explosionSound.currentTime = 0;explosionSound.play();const explosion = document.createElement('div');explosion.innerHTML = '💥';explosion.className = 'explosion';explosion.style.left = `${x + brickWidth / 2 - (12 * scaleFactor)}px`;explosion.style.top = `${y + brickHeight / 2 - (12 * scaleFactor)}px`;explosion.style.fontSize = `${24 * scaleFactor}px`;gameContainer.appendChild(explosion);setTimeout(() => { explosion.remove(); }, 500);}
function drawBall(){if(ballIsWaiting){x=paddleX+paddleWidth/2;y=canvas.height-renderedPaddleHeight-ballRadius}ctx.beginPath();ctx.arc(x,y,ballRadius,0,Math.PI*2);ctx.fillStyle=`hsl(${hue}, 100%, 50%)`;ctx.shadowColor=`hsl(${hue}, 100%, 50%)`;ctx.shadowBlur=10;ctx.fill();ctx.closePath();ctx.shadowBlur=0}
function drawPaddle(){const paddleDrawY=canvas.height-renderedPaddleHeight;if(paddleImageLoaded&&paddleImage.complete){ctx.drawImage(paddleImage,paddleX,paddleDrawY,paddleWidth,renderedPaddleHeight)}else{ctx.beginPath();ctx.rect(paddleX,canvas.height-PADDLE_LOGIC_HEIGHT,paddleWidth,PADDLE_LOGIC_HEIGHT);ctx.fillStyle="#0095DD";ctx.fill();ctx.closePath()}}
function drawBricks(){for(let c=0;c<brickColumnCount;c++){for(let r=0;r<brickRowCount;r++){if(bricks[c][r].status===1){let currentBrickX=(c*(brickWidth+brickPadding))+brickOffsetLeft;let currentBrickY=(r*(brickHeight+brickPadding))+brickOffsetTop;bricks[c][r].x=currentBrickX;bricks[c][r].y=currentBrickY;if(brickImageLoaded&&brickImage.complete){ctx.drawImage(brickImage,currentBrickX,currentBrickY,brickWidth,brickHeight)}else{ctx.beginPath();ctx.rect(currentBrickX,currentBrickY,brickWidth,brickHeight);ctx.fillStyle="#DD0095";ctx.fill();ctx.closePath()}}}}}
function drawScore(){const text="Счет: "+score;ctx.font=`bold ${16*scaleFactor}px Arial`;ctx.textAlign="left";ctx.strokeStyle='black';ctx.lineWidth=3*scaleFactor;ctx.strokeText(text,8*scaleFactor,20*scaleFactor);ctx.fillStyle="#FFF";ctx.fillText(text,8*scaleFactor,20*scaleFactor)}
function drawLives(){if(heartImageLoaded&&heartImage.complete){const heartSize=20*scaleFactor;const heartPadding=5*scaleFactor;for(let i=0;i<lives;i++){const heartX=canvas.width-(i+1)*(heartSize+heartPadding);const heartY=8*scaleFactor;ctx.drawImage(heartImage,heartX,heartY,heartSize,heartSize)}}else{const text="Жизни: "+lives;ctx.font=`bold ${16*scaleFactor}px Arial`;ctx.textAlign="right";ctx.strokeStyle='black';ctx.lineWidth=3*scaleFactor;ctx.strokeText(text,canvas.width-8*scaleFactor,20*scaleFactor);ctx.fillStyle="#FFF";ctx.fillText(text,canvas.width-8*scaleFactor,20*scaleFactor)}}
function drawLevel(){const text="Уровень: "+(currentLevel+1);ctx.font=`bold ${16*scaleFactor}px Arial`;ctx.textAlign="center";ctx.strokeStyle='black';ctx.lineWidth=3*scaleFactor;ctx.strokeText(text,canvas.width/2,20*scaleFactor);ctx.fillStyle="#FFF";ctx.fillText(text,canvas.width/2,20*scaleFactor)}
function collisionDetection(){for(let c=0;c<brickColumnCount;c++){for(let r=0;r<brickRowCount;r++){let b=bricks[c][r];if(b.status===1){if(x>b.x&&x<b.x+brickWidth&&y>b.y&&y<b.y+brickHeight){dy=-dy;b.status=0;score++;bricksLeft--;createExplosion(b.x,b.y);if(bricksLeft===0){currentLevel++;if(currentLevel>=levels.length){gameOver("ПОБЕДА!",true)}else{levelComplete()}}}}}}}
function resetBallAndPaddle(){paddleX=(canvas.width-paddleWidth)/2;ballIsWaiting=true}
function drawEndGameMessage(message,color,subMessage){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font=`bold ${32*scaleFactor}px Arial`;ctx.fillStyle=color;ctx.textAlign="center";ctx.fillText(message,canvas.width/2,canvas.height/2);ctx.font=`${14*scaleFactor}px Arial`;ctx.fillStyle='#fff';ctx.fillText(subMessage,canvas.width/2,canvas.height/2+40*scaleFactor)}
function gameOver(title, isVictory) {gameStarted = false;ballIsWaiting = false;cancelAnimationFrame(animationFrameId);if (!isVictory) {defeatSound.volume = 0.5;defeatSound.play();}if (isVictory) {victoryMusic.play();setTimeout(() => {victoryVideoContainer.classList.add('visible');victoryVideo.play();}, 5000);}showNicknamePrompt(score, title);startGameButton.textContent = "Играть снова";startGameButton.style.display = 'inline-block';startGameButton.onclick = startGame;}
function levelComplete() {gameStarted = false;ballIsWaiting = false;cancelAnimationFrame(animationFrameId);victorySound.volume = 0.5;victorySound.play();const message = `УРОВЕНЬ ${currentLevel} ПРОЙДЕН!`;const subMessage = `Нажмите кнопку, чтобы начать уровень ${currentLevel + 1}`;drawEndGameMessage(message, "#33ccff", subMessage);startGameButton.textContent = `Уровень ${currentLevel + 1}`;startGameButton.style.display = 'inline-block';startGameButton.onclick = initNextLevel;}
function initNextLevel() {loadLevel(currentLevel);resetBallAndPaddle();gameStarted = true;startGameButton.style.display = 'none';if (animationFrameId) cancelAnimationFrame(animationFrameId);draw();}
function drawLaunchMessage() {ctx.font=`bold ${20*scaleFactor}px Arial`;ctx.fillStyle="rgba(255, 255, 255, 0.8)";ctx.textAlign="center";ctx.fillText("Нажмите ПРОБЕЛ, чтобы запустить мяч",canvas.width/2,canvas.height/2)}
function draw() {if(!gameStarted)return;if(!ballIsWaiting){hue=(hue+1)%360;if(x+dx>canvas.width-ballRadius||x+dx<ballRadius){dx=-dx}if(y+dy<ballRadius){dy=-dy}else if(y+dy>canvas.height-ballRadius-PADDLE_LOGIC_HEIGHT){if(x>paddleX&&x<paddleX+paddleWidth){let collidePoint=x-(paddleX+paddleWidth/2);collidePoint=collidePoint/(paddleWidth/2);let angleRad=collidePoint*(Math.PI/3);let currentSpeed=Math.sqrt(dx*dx+dy*dy);dx=currentSpeed*Math.sin(angleRad);dy=-currentSpeed*Math.cos(angleRad)}}if(y+dy>canvas.height-ballRadius){lives--;if(!lives){gameOver("ИГРА ОКОНЧЕНА",false);return}else{resetBallAndPaddle()}}x+=dx;y+=dy}ctx.clearRect(0,0,canvas.width,canvas.height);drawBricks();drawPaddle();drawScore();drawLives();drawLevel();drawBall();if(!ballIsWaiting){collisionDetection()}if(ballIsWaiting){drawLaunchMessage()}animationFrameId=requestAnimationFrame(draw)}
function movePaddle(clientX) {let rect=canvas.getBoundingClientRect();let relativeX=clientX-rect.left;if(relativeX>0&&relativeX<canvas.width){paddleX=relativeX-paddleWidth/2;if(paddleX<0)paddleX=0;if(paddleX+paddleWidth>canvas.width)paddleX=canvas.width-paddleWidth}}
function launchBall() {if (ballIsWaiting) {ballIsWaiting = false;let initialSpeed = 2.5 * scaleFactor; dx = initialSpeed * (Math.random() < 0.5 ? 1 : -1);dy = -initialSpeed;}}

// --- ИЗМЕНЕНИЯ ЗДЕСЬ ---

// Новая асинхронная функция для загрузки стартовых рекордов
async function loadInitialLeaderboard() {
    // Проверяем, есть ли уже данные в localStorage. Если есть, ничего не делаем.
    if (localStorage.getItem('brickBreakerLeaderboard')) {
        console.log("Таблица лидеров уже существует в localStorage.");
        return;
    }

    try {
        // Пытаемся загрузить файл leaderboard.txt
        const response = await fetch('leaderboard.txt');
        if (!response.ok) {
            // Если файл не найден или есть другая ошибка
            throw new Error('Не удалось загрузить leaderboard.txt');
        }
        const data = await response.json(); // Превращаем текст из файла в объект
        // Сохраняем загруженные данные в localStorage
        localStorage.setItem('brickBreakerLeaderboard', JSON.stringify(data));
        console.log("Стартовая таблица лидеров загружена из файла.");
    } catch (error) {
        console.error("Ошибка при загрузке таблицы лидеров:", error);
        // Если что-то пошло не так, localStorage останется пустым, и игра будет работать как раньше.
    }
}

function showLeaderboard() {
    // Теперь эта функция просто читает из localStorage, куда данные уже могли быть загружены
    const scores = JSON.parse(localStorage.getItem('brickBreakerLeaderboard')) || [];
    scores.sort((a, b) => b.score - a.score);
    leaderboardList.innerHTML = '';
    if (scores.length === 0) {
        leaderboardList.innerHTML = '<li>Рекордов пока нет. Будьте первым!</li>';
    } else {
        scores.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `${entry.name} - ${entry.score}`;
            leaderboardList.appendChild(li);
        });
    }
    leaderboardModal.style.display = 'block';
}

// ... Остальные функции (hideLeaderboard, showNicknamePrompt, saveScore) без изменений ...
function hideLeaderboard() {leaderboardModal.style.display='none'}
function showNicknamePrompt(finalScore, title) {promptTitle.textContent=title;finalScoreSpan.textContent=finalScore;nicknamePrompt.style.display='block'}
function saveScore() {const name=nicknameInput.value||'Аноним';const currentScore={name:name,score:score};let scores=JSON.parse(localStorage.getItem('brickBreakerLeaderboard'))||[];scores.push(currentScore);scores.sort((a,b)=>b.score-a.score);scores=scores.slice(0,10);localStorage.setItem('brickBreakerLeaderboard',JSON.stringify(scores));nicknamePrompt.style.display='none';showLeaderboard()}
document.addEventListener("mousemove", (e) => movePaddle(e.clientX), false);
document.addEventListener("touchmove", (e) => { e.preventDefault(); if (e.touches.length > 0) movePaddle(e.touches[0].clientX); }, { passive: false });
document.addEventListener("keydown", (e) => {if (e.code === 'Space') {launchBall();}if (gameStarted) {const requiredLength = cheatCode.length;keySequence.push(e.code);keySequence = keySequence.slice(-requiredLength);if (keySequence.join('') === cheatCode.join('')) {console.log("Чит-код ZOV активирован!");gameOver("ПОБЕДА! (ЧИТЕР)", true);}}});
document.body.addEventListener("touchstart", () => { if (gameStarted) launchBall(); });
leaderboardButton.addEventListener('click', showLeaderboard);
closeLeaderboard.addEventListener('click', hideLeaderboard);
submitScoreButton.addEventListener('click', saveScore);
window.addEventListener('click', (event) => {if (event.target == leaderboardModal) hideLeaderboard();if (event.target == nicknamePrompt) nicknamePrompt.style.display = 'none';});
function startGame() {if (!brickImageLoaded || !paddleImageLoaded) return;victoryMusic.pause();victoryMusic.currentTime = 0;score = 0;lives = 3;currentLevel = 0;victoryVideoContainer.classList.remove('visible');victoryVideo.pause();victoryVideo.currentTime = 0;loadLevel(currentLevel);resetBallAndPaddle();gameStarted = true;startGameButton.style.display = 'none';if (animationFrameId) cancelAnimationFrame(animationFrameId);draw();}
startGameButton.onclick = startGame;
window.addEventListener('resize', () => {if(gameStarted){gameStarted=false;ballIsWaiting=false;if(animationFrameId)cancelAnimationFrame(animationFrameId);drawInitialMessage("Размер изменен. Нажмите 'Играть снова'");startGameButton.textContent="Играть снова";startGameButton.style.display='inline-block';startGameButton.disabled=false;startGameButton.onclick=startGame}setupCanvasAndGameParameters();if(!gameStarted&&brickImageLoaded&&paddleImageLoaded){drawInitialMessage("Нажмите 'Начать игру'")}else if(!gameStarted&&(!brickImageLoaded||!paddleImageLoaded)){drawInitialMessage("Загрузка...")}});

setupCanvasAndGameParameters();
loadImages();
// --- ИЗМЕНЕНИЕ: Вызываем новую функцию при загрузке страницы ---
loadInitialLeaderboard(); 
drawInitialMessage("Загрузка изображений...");