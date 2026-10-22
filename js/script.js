/**
 * Super Mario Jump - Lógica do Jogo e Integração com Ranking MySQL (Laragon)
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

    // Modais e Telas
    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
    const btnViewRanking = document.getElementById('btn-view-ranking');

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

    // Recupera último nome utilizado caso exista
    const savedName = localStorage.getItem('mario_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }

    const mainMenu = document.getElementById('main-menu');
    const welcomeMessage = document.getElementById('welcome-message');

    document.getElementById('start-game-btn').addEventListener('click', () => {
        mainMenu.style.display = 'none';

        // Inicia usando a função que seu jogo já possui
        startGame();
    });

    document.getElementById('choose-character-btn').addEventListener('click', () => {
        // Troque "character-selection" pelo ID da sua tela de personagens
        const characterScreen = document.getElementById('character-selection');

        if (characterScreen) {
            mainMenu.style.display = 'none';
            characterScreen.style.display = 'block';
        } else {
            alert('A tela de escolha de personagens ainda precisa ser criada.');
        }
    });

    document.getElementById('ranking-btn').addEventListener('click', () => {
        window.location.href = 'ranking.php';
    });

    document.getElementById('company-btn').addEventListener('click', () => {
        // Troque "empresa.php" pelo nome da página da sua empresa
        window.location.href = 'empresa.php';
    });
    mainMenu.style.display = 'block';
    welcomeMessage.textContent = 'Bem-vindo, ' + nomeJogador + '!';
    /**
     * Inicia uma nova rodada
     */
    function startGame() {
        // Limpa loops anteriores se existirem
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        // Reseta posições e visuais
        resetElements();

        isPlaying = true;
        score = 0;
        scoreDisplay.textContent = '0';
        // Reinicia a dificuldade e o cenário
        gameBoard.classList.remove(
            'stage-1',
            'stage-2',
            'stage-3',
            'stage-4'
        );

        gameBoard.style.setProperty('--pipe-speed', '2.4s');
        hudPlayerName.textContent = currentPlayer || 'Jogador';

        // Ativa animações CSS do jogo
        gameBoard.classList.add('running');

        // Pontuação e dificuldade progressiva
        scoreLoop = setInterval(() => {
            if (isPlaying) {
                score += 1;
                scoreDisplay.textContent = score;

                if (score % 500 === 0) {
                    updateDifficulty();
                    gameBoard.style.setProperty(
                        '--pipe-speed',
                        Math.max(1.05, 1.6 - (score / 500) * 0.12) + 's'
                    );
                }
            }
        }, 100);
        scoreLoop = setInterval(() => {
            if (isPlaying) {
                score += 1;
                scoreDisplay.textContent = score;
                updateDifficulty();
            }
        }, 100);

        coinCollected = false;
        coin.style.display = 'block';

        pointsPopup.classList.remove('show');

        // Loop de colisão
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
        coin.style.animation = 'none';
        coin.style.display = 'block';
        coin.style.left = '100%';

        void coin.offsetWidth; // Reinicia a animação

        coin.style.animation = '';
        coinCollected = false;
    }

    function checkCoinCollision() {
        if (!isPlaying || coinCollected) return;

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
            scoreDisplay.textContent = score;

            pointsPopup.classList.remove('show');
            void pointsPopup.offsetWidth;
            pointsPopup.classList.add('show');

            coin.style.display = 'none';

            updateDifficulty();

            setTimeout(() => {
                if (isPlaying) {
                    respawnCoin();
                }
            }, 700);
        }
    }

    function resetElements() {
        // Reseta cano
        pipe.style.animation = '';
        pipe.style.left = '';

        // Reseta Mario
        mario.src = 'assets/mario.gif';
        mario.style.animation = '';
        mario.style.bottom = '0px';
        mario.style.width = '';
        mario.style.marginLeft = '';
        mario.classList.remove('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '1';
        }
    }

    function updateDifficulty() {
        gameBoard.classList.remove(
            'stage-1',
            'stage-2',
            'stage-3',
            'stage-4'
        );

        if (score >= 3000) {
            gameBoard.classList.add('stage-4');
        } else if (score >= 2000) {
            gameBoard.classList.add('stage-3');
        } else if (score >= 1000) {
            gameBoard.classList.add('stage-2');
        } else if (score >= 500) {
            gameBoard.classList.add('stage-1');
        }
    }

    function criarMoeda() {
        if (!isPlaying) return;

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
            if (!isPlaying || !novaMoeda.isConnected) {
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
                scoreDisplay.textContent = score;
                updateDifficulty();

                pointsPopup.classList.remove('show');
                void pointsPopup.offsetWidth;
                pointsPopup.classList.add('show');

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
        if (!isPlaying) return;
        if (mario.classList.contains('jump')) return;

        mario.classList.add('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '0';
        }

        setTimeout(() => {
            mario.classList.remove('jump');
        }, 900);
    }

    function checkCollision() {
        if (!isPlaying) return;

        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

        // Tolerância de colisão: quando o cano está na faixa de contato com o Mario
        if (pipePosition <= 120 && pipePosition > 0 && marioPosition < 80) {
            triggerGameOver(pipePosition, marioPosition);
        }
    }

    function triggerGameOver(pipePosition, marioPosition) {
        isPlaying = false;
        clearInterval(gameLoop);
        clearInterval(scoreLoop);


        gameBoard.classList.remove('running');


        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;

        // Congela o Mario na altura exata e muda para a imagem de Game Over
        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;
        mario.src = 'assets/game-over.png';
        mario.style.width = '75px';
        mario.style.marginLeft = '50px';

        // Atualiza modal de Game Over
        finalScoreValue.textContent = score;
        saveStatusMsg.textContent = 'Salvando pontuação no banco...';
        saveStatusMsg.style.color = '#ffcc00';

        // Abre modal de Game Over
        gameoverModal.classList.add('active');

        // Salva a pontuação no banco MySQL via PHP
        saveScore(currentPlayer, score);
    }


    function saveScore(playerName, finalScore) {
        console.log('Pontuação enviada:', {
            nome: playerName,
            pontos: finalScore,
            tipo: typeof finalScore
        });
        fetch('salvar_ranking.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: playerName,
                ponto: Number(finalScore)
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                    saveStatusMsg.style.color = '#10b981';
                    if (data.ranking) {
                        renderRanking(data.ranking, playerName, finalScore);
                    }
                } else {
                    saveStatusMsg.textContent = '⚠️ ' + (data.message || 'Erro ao registrar.');
                    saveStatusMsg.style.color = '#ef4444';
                }
            })
            .catch(err => {
                console.error('Erro na requisição:', err);
                saveStatusMsg.textContent = '⚠️ Erro ao conectar ao servidor Laragon.';
                saveStatusMsg.style.color = '#ef4444';
            });
    }

    /**
     * Busca o ranking atualizado no banco
     */
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

    /**
     * Atualiza a tabela HTML do ranking
     */
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

            // Destaca a pontuação atual recém-salva se coincidir
            if (!highlighted && highlightName && item.nome === highlightName && Number(item.ponto ?? item.points ?? item.score) === highlightScore) {
                tr.classList.add('highlight-current');
                highlighted = true;
            }

            let medal = `${index + 1}º`;
            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            const ponto = Number(
                item.ponto ?? item.points ?? item.score
            );

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${Number.isFinite(ponto) ? ponto : 0} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    /**
     * Função auxiliar para sanitizar strings no HTML
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Submit do Formulário de Início (INICIAR JOGO)
    startForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        const nameValue = playerInput.value.trim();
        if (!nameValue) {
            playerInput.focus();
            return;
        }

        currentPlayer = nameValue;
        localStorage.setItem('mario_jump_player', currentPlayer);

        // Fecha tela de início e começa o jogo
        startModal.classList.remove('active');
        startGame();
    });

    // Botão "VER RANKING" na tela inicial
    btnViewRanking.addEventListener('click', () => {
        fetchRanking();
        finalScoreValue.textContent = '---';
        saveStatusMsg.textContent = '';
        startModal.classList.remove('active');
        gameoverModal.classList.add('active');
    });

    // Botão "JOGAR NOVAMENTE" no Game Over
    btnRestart.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        if (!currentPlayer) {
            startModal.classList.add('active');
            playerInput.focus();
        } else {
            startGame();
        }
    });

    // 4. Botão "TROCAR JOGADOR" no Game Over
    btnChangePlayer.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        resetElements();
        startModal.classList.add('active');
        playerInput.value = '';
        playerInput.focus();
    });

    // 5. Controle do Pulo por Teclado (Espaço ou Seta para Cima)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
            if (isPlaying) {
                e.preventDefault();
                jump();
            }
        }
    });
});