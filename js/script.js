/**
 * Super Mario Jump - Lógica do Jogo e Integração com Ranking MySQL
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do Jogo
    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const gameBoard = document.getElementById('game-board');
    const hudPlayerName = document.getElementById('hud-player-name');
    const scoreDisplay = document.getElementById('score-display');
    const jumpTip = document.getElementById('jump-tip');
    const coin = document.getElementById('coin');
    const pointsPopup = document.getElementById('points-popup');

    let coinCollected = false;

    // Modais
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');

    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const saveStatusMsg = document.getElementById('save-status-msg');
    const rankingBody = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');

    // Variáveis de Estado
    let currentPlayer = '';
    let score = 0;
    let isPlaying = false;
    let gameLoop = null;
    let scoreLoop = null;

    // Recupera último nome utilizado caso exista no localStorage
    const savedName = localStorage.getItem('mario_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    // Botão INICIAR JOGO / Envio do Formulário
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const nameValue = playerInput ? playerInput.value.trim() : '';
            if (!nameValue) {
                if (playerInput) playerInput.focus();
                alert('Por favor, digite seu nome antes de iniciar!');
                return;
            }

            currentPlayer = nameValue;
            localStorage.setItem('mario_jump_player', currentPlayer);

            if (startModal) startModal.classList.remove('active');
            startGame();
        });
    }

    if (startForm) {
        startForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (startGameBtn) startGameBtn.click();
        });
    }

    // Botão VER RANKING
    const rankingBtn = document.getElementById('ranking-btn');
    if (rankingBtn) {
        rankingBtn.addEventListener('click', () => {
            fetchRanking();
            if (finalScoreValue) finalScoreValue.textContent = '---';
            if (saveStatusMsg) saveStatusMsg.textContent = '';
            if (startModal) startModal.classList.remove('active');
            if (gameoverModal) gameoverModal.classList.add('active');
        });
    }

    // Botão ESCOLHER NOVO PERSONAGEM
    const chooseCharacterBtn = document.getElementById('choose-character-btn');
    if (chooseCharacterBtn) {
        chooseCharacterBtn.addEventListener('click', () => {
            alert('A tela de escolha de personagens ainda precisa ser criada.');
        });
    }

    /* Inicia uma nova rodada */
    function startGame() {
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        resetElements();

        isPlaying = true;
        score = 0;
        if (scoreDisplay) scoreDisplay.textContent = '0';

        if (gameBoard) {
            gameBoard.classList.remove('stage-1', 'stage-2', 'stage-3', 'stage-4');
            gameBoard.style.setProperty('--pipe-speed', '2.4s');
            gameBoard.classList.add('running');
        }

        if (hudPlayerName) hudPlayerName.textContent = currentPlayer || 'Jogador';

        scoreLoop = setInterval(() => {
            if (isPlaying) {
                score += 1;
                if (scoreDisplay) scoreDisplay.textContent = score;
                updateDifficulty();
            }
        }, 100);

        coinCollected = false;
        if (coin) coin.style.display = 'block';
        if (pointsPopup) pointsPopup.classList.remove('show');

        gameLoop = setInterval(() => {
            checkCollision();
            checkCoinCollision();
        }, 10);

        if (window.coinSpawnInterval) {
            clearInterval(window.coinSpawnInterval);
        }

        window.coinSpawnInterval = setInterval(() => {
            if (isPlaying) {
                criarMoeda();
            }
        }, 4000);
    }

    function respawnCoin() {
        if (!coin) return;
        coin.style.animation = 'none';
        coin.style.display = 'block';
        coin.style.left = '100%';

        void coin.offsetWidth;

        coin.style.animation = '';
        coinCollected = false;
    }

    function checkCoinCollision() {
        if (!isPlaying || coinCollected || !coin || !mario) return;

        const marioRect = mario.getBoundingClientRect();
        const coinRect = coin.getBoundingClientRect();

        const touching =
            marioRect.right > coinRect.left &&
            marioRect.left < coinRect.right &&
            marioRect.bottom > coinRect.top &&
            marioRect.top < coinRect.bottom;

        if (touching) {
            coinCollected = true;
            score += 25;
            if (scoreDisplay) scoreDisplay.textContent = score;

            if (pointsPopup) {
                pointsPopup.classList.remove('show');
                void pointsPopup.offsetWidth;
                pointsPopup.classList.add('show');
            }

            coin.style.display = 'none';
            updateDifficulty();

            setTimeout(() => {
                if (isPlaying) respawnCoin();
            }, 700);
        }
    }

    function resetElements() {
        if (pipe) {
            pipe.style.animation = '';
            pipe.style.left = '';
        }

        if (mario) {
            mario.src = 'assets/mario.gif';
            mario.style.animation = '';
            mario.style.bottom = '0px';
            mario.style.width = '';
            mario.style.marginLeft = '';
            mario.classList.remove('jump');
        }

        if (jumpTip) jumpTip.style.opacity = '1';
    }

    function updateDifficulty() {
        if (!gameBoard) return;

        gameBoard.classList.remove('stage-1', 'stage-2', 'stage-3', 'stage-4');
        gameBoard.style.setProperty(
            '--pipe-speed',
            Math.max(1.2, 2.4 - Math.floor(score / 500) * 0.25) + 's'
        );

        if (score >= 3000) gameBoard.classList.add('stage-4');
        else if (score >= 2000) gameBoard.classList.add('stage-3');
        else if (score >= 1000) gameBoard.classList.add('stage-2');
        else if (score >= 500) gameBoard.classList.add('stage-1');
    }

    function criarMoeda() {
        if (!isPlaying || !coin || !gameBoard) return;

        const novaMoeda = document.createElement('img');
        novaMoeda.src = coin.src;
        novaMoeda.className = 'coin';
        novaMoeda.style.animation = 'none';
        novaMoeda.style.left = '100%';
        novaMoeda.style.bottom = (40 + Math.random() * 100) + 'px';

        gameBoard.appendChild(novaMoeda);

        void novaMoeda.offsetWidth;
        novaMoeda.style.animation = 'coin-move 4s linear forwards';

        const verificar = setInterval(() => {
            if (!isPlaying || !novaMoeda.isConnected || !mario) {
                clearInterval(verificar);
                return;
            }

            const marioRect = mario.getBoundingClientRect();
            const moedaRect = novaMoeda.getBoundingClientRect();

            const tocou =
                marioRect.right > moedaRect.left &&
                marioRect.left < moedaRect.right &&
                marioRect.bottom > moedaRect.top &&
                marioRect.top < moedaRect.bottom;

            if (tocou) {
                score += 25;
                if (scoreDisplay) scoreDisplay.textContent = score;
                updateDifficulty();

                if (pointsPopup) {
                    pointsPopup.classList.remove('show');
                    void pointsPopup.offsetWidth;
                    pointsPopup.classList.add('show');
                }

                novaMoeda.remove();
                clearInterval(verificar);
            }
        }, 10);

        novaMoeda.addEventListener('animationend', () => {
            novaMoeda.remove();
            clearInterval(verificar);
        });
    }

    function jump() {
        if (!isPlaying || !mario) return;
        if (mario.classList.contains('jump')) return;

        mario.classList.add('jump');

        if (jumpTip) jumpTip.style.opacity = '0';

        setTimeout(() => {
            mario.classList.remove('jump');
        }, 900);
    }

    function checkCollision() {
        if (!isPlaying || !pipe || !mario) return;

        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

        if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {
            triggerGameOver(pipePosition, marioPosition);
        }
    }

    function triggerGameOver(pipePosition, marioPosition) {
        isPlaying = false;
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        if (gameBoard) gameBoard.classList.remove('running');

        if (pipe) {
            pipe.style.animation = 'none';
            pipe.style.left = `${pipePosition}px`;
        }

        if (mario) {
            mario.style.animation = 'none';
            mario.style.bottom = `${marioPosition}px`;
            mario.src = 'assets/game-over.png';
            mario.style.width = '75px';
            mario.style.marginLeft = '50px';
        }

        if (finalScoreValue) finalScoreValue.textContent = score;
        if (saveStatusMsg) {
            saveStatusMsg.textContent = 'Salvando pontuação no banco...';
            saveStatusMsg.style.color = '#ffcc00';
        }

        if (gameoverModal) gameoverModal.classList.add('active');
        saveScore(currentPlayer, score);
    }

    function saveScore(playerName, finalScore) {
        fetch('salvar_ranking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: playerName,
                ponto: Number(finalScore)
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    if (saveStatusMsg) {
                        saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                        saveStatusMsg.style.color = '#10b981';
                    }
                    if (data.ranking) renderRanking(data.ranking, playerName, finalScore);
                } else {
                    if (saveStatusMsg) {
                        saveStatusMsg.textContent = '⚠️ ' + (data.message || 'Erro ao registrar.');
                        saveStatusMsg.style.color = '#ef4444';
                    }
                }
            })
            .catch(err => {
                console.error('Erro na requisição:', err);
                if (saveStatusMsg) {
                    saveStatusMsg.textContent = '⚠️ Erro ao conectar ao servidor.';
                    saveStatusMsg.style.color = '#ef4444';
                }
            });
    }

    function fetchRanking() {
        fetch('obter_ranking.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.ranking) {
                    renderRanking(data.ranking);
                }
            })
            .catch(err => console.error('Erro ao buscar ranking:', err));
    }

    function renderRanking(list, highlightName = null, highlightScore = null) {
        if (!rankingBody) return;
        rankingBody.innerHTML = '';

        if (!list || list.length === 0) {
            rankingBody.innerHTML = '<tr><td colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda. Jogue para ser o 1º!</td></tr>';
            return;
        }

        let highlighted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            if (!highlighted && highlightName && item.nome === highlightName && Number(item.ponto ?? item.points ?? item.score) === highlightScore) {
                tr.classList.add('highlight-current');
                highlighted = true;
            }

            let medal = `${index + 1}º`;
            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            const ponto = Number(item.ponto ?? item.points ?? item.score);

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${Number.isFinite(ponto) ? ponto : 0} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Botão JOGAR NOVAMENTE
    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            if (gameoverModal) gameoverModal.classList.remove('active');
            if (!currentPlayer) {
                if (startModal) startModal.classList.add('active');
                if (playerInput) playerInput.focus();
            } else {
                startGame();
            }
        });
    }

    // Botão TROCAR JOGADOR
    if (btnChangePlayer) {
        btnChangePlayer.addEventListener('click', () => {
            if (gameoverModal) gameoverModal.classList.remove('active');
            resetElements();
            if (startModal) startModal.classList.add('active');
            if (playerInput) {
                playerInput.value = '';
                playerInput.focus();
            }
        });
    }

    // Ações para Pular (Clique na tela ou Espaço/Seta Cima)
    if (gameBoard) gameBoard.addEventListener('click', jump);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
            if (isPlaying) {
                e.preventDefault();
                jump();
            }
        }
    });
});