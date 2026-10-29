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
    let selectedCharacter = 'mario';
    let score = 0;
    let isPlaying = false;
    let gameLoop = null;
    let scoreLoop = null;

    // Esconde o título grande da tela inicial enquanto o menu de personagens está aberto
    function setCardHeaderVisible(visible) {
        const header = document.querySelector('#name-card .modal-header');
        if (header) header.style.display = visible ? '' : 'none';
    }

    // Recupera último nome utilizado caso exista no localStorage
    const savedName = localStorage.getItem('mario_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    // Botão INICIAR JOGO / Envio do Formulário
    const startGameBtn = document.getElementById('start-game-btn');
    const chooseCharacterBtn = document.getElementById('choose-character-btn');
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

    const characterSelection = document.getElementById('character-selection');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');

    if (chooseCharacterBtn) {
        chooseCharacterBtn.addEventListener('click', () => {
            startForm.style.display = 'none';
            characterSelection.style.display = 'block';
            setCardHeaderVisible(false);
        });
    }

    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            characterSelection.style.display = 'none';
            setCardHeaderVisible(true);
            startForm.style.display = 'flex';
        });
    }

    document.querySelectorAll('.character-option').forEach((button) => {
        button.addEventListener('click', () => {
            selectedCharacter = button.dataset.character;

            document.querySelectorAll('.character-option').forEach((option) => {
                option.classList.remove('selected');
            });

            button.classList.add('selected');

            // Volta à tela inicial após escolher
            characterSelection.style.display = 'none';
            setCardHeaderVisible(true);
            startForm.style.display = 'flex';
        });
    });


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

        // Aplica a velocidade inicial logo de cara (sem esperar o primeiro tick)
        updateDifficulty();

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
        }, 5000);
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
            mario.src = `assets/${selectedCharacter}.gif`;
            mario.alt = selectedCharacter;

            if (selectedCharacter === 'luigi' || selectedCharacter === 'yoshi') {
                mario.style.width = '110px';
            } else {
                mario.style.width = '150px';
            }

            mario.style.height = 'auto';
            mario.style.marginLeft = '0';
            mario.style.animation = '';
            mario.style.bottom = '0px';
            mario.classList.remove('jump');
        }


        if (jumpTip) jumpTip.style.opacity = '1';
    }

    function updateDifficulty() {
        if (!gameBoard) return;

        gameBoard.classList.remove('stage-1', 'stage-2', 'stage-3', 'stage-4');
        // Velocidade do cano: mudamos a "taxa de reprodução" da animação em vez de
        // trocar a duração no CSS. Trocar a duração no meio do caminho faz o cano
        // pular de posição (bug dos 500/1000/1500 pontos). A taxa muda de forma suave.
        // Tempo (em segundos) que o cano leva para cruzar a tela: quanto menor, mais rápido.
        // Começa em PIPE_START_TIME, diminui PIPE_STEP a cada 500 pontos e nunca passa de PIPE_MIN_TIME.
        const PIPE_START_TIME = 2.0;
        const PIPE_STEP = 0.2;
        const PIPE_MIN_TIME = 1.1;
        const pipeSpeed = Math.max(PIPE_MIN_TIME, PIPE_START_TIME - Math.floor(score / 500) * PIPE_STEP);
        const pipeRate = 2.4 / pipeSpeed; // 2.4s é a duração base definida no CSS

        if (pipe) {
            const pipeAnim = pipe.getAnimations().find(a => a.animationName === 'pipe-animation');
            if (pipeAnim && Math.abs(pipeAnim.playbackRate - pipeRate) > 0.001) {
                pipeAnim.playbackRate = pipeRate;
            }
        }

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

        mario.classList.remove('jump');
        void mario.offsetWidth;
        mario.classList.add('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '0';
        }

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

    // Imagem (e tamanho) da tela de game over de cada personagem
    const gameOverSprites = {
        mario: { src: 'assets/game-over.png',  width: '75px',  marginLeft: '50px' },
        luigi: { src: 'assets/game-overL.png', width: '105px', marginLeft: '30px' },
        yoshi: { src: 'assets/game-overY.png', width: '130px', marginLeft: '20px' }
    };

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
            const over = gameOverSprites[selectedCharacter] || gameOverSprites.mario;
            mario.src = over.src;
            mario.style.width = over.width;
            mario.style.marginLeft = over.marginLeft;
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


    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            gameoverModal.classList.remove('active');
            startModal.classList.remove('active');
            startGame();
        });
    }

    if (btnChangePlayer) {
        btnChangePlayer.addEventListener('click', () => {
            isPlaying = false;
            clearInterval(gameLoop);
            clearInterval(scoreLoop);

            if (gameBoard) {
                gameBoard.classList.remove('running');
            }

            gameoverModal.classList.remove('active');
            startModal.classList.add('active');

            startForm.style.display = 'flex';

            const characterSelection =
                document.getElementById('character-selection');

            if (characterSelection) {
                characterSelection.style.display = 'none';
            setCardHeaderVisible(true);
            }

            playerInput.value = '';
            currentPlayer = '';
            playerInput.focus();
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