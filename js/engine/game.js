class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configurar tamanho do canvas
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Estados do jogo
        this.gameStates = {
            MENU: 'menu',
            CHARACTER_SELECT: 'characterSelect',
            PLAYING: 'playing',
            PAUSED: 'paused',
            COMBAT: 'combat',
            DIALOG: 'dialog'
        };
        
        this.currentState = this.gameStates.MENU;
        
        // Sistema de input
        this.input = new InputHandler(this);
        
        // Sistema de áudio
        this.audio = new AudioManager();
        
        // Jogador
        this.player = null;
        
        // Mapa atual
        this.currentMap = null;
        
        // Lista de NPCs
        this.npcs = [];
        
        // Sistema de combate
        this.combat = null;
        
        // Interface
        this.ui = {
            mainMenu: document.getElementById('main-menu'),
            characterMenu: document.getElementById('character-menu'),
            gameHud: document.getElementById('game-hud'),
            pauseMenu: document.getElementById('pause-menu')
        };
        
        this.setupEventListeners();
        this.gameLoop = this.gameLoop.bind(this);
    }

    init() {
        // Carregar recursos iniciais
        this.loadResources();
        
        // Iniciar o loop do jogo
        requestAnimationFrame(this.gameLoop);
    }

    loadResources() {
        // Carregar sprites, sons, mapas, etc.
    }

    setupEventListeners() {
        // Menu Principal
        document.getElementById('newGame').addEventListener('click', () => {
            this.showCharacterSelect();
        });
        
        document.getElementById('loadGame').addEventListener('click', () => {
            this.loadGame();
        });
        
        // Menu de Seleção de Personagem
        document.getElementById('startGame').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('backToMain').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Seleção de Classe
        const characterOptions = document.querySelectorAll('.character-option');
        characterOptions.forEach(option => {
            option.addEventListener('click', () => {
                characterOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }

    showMainMenu() {
        this.currentState = this.gameStates.MENU;
        this.ui.mainMenu.style.display = 'block';
        this.ui.characterMenu.style.display = 'none';
        this.ui.gameHud.style.display = 'none';
        this.ui.pauseMenu.style.display = 'none';
    }

    showCharacterSelect() {
        this.currentState = this.gameStates.CHARACTER_SELECT;
        this.ui.mainMenu.style.display = 'none';
        this.ui.characterMenu.style.display = 'block';
    }

    startNewGame() {
        const selectedClass = document.querySelector('.character-option.selected');
        if (!selectedClass) {
            alert('Por favor, selecione uma classe!');
            return;
        }

        const characterClass = selectedClass.dataset.class;
        this.player = new Player(characterClass);
        this.currentMap = new GameMap('world'); // Carregar o mapa inicial
        
        this.currentState = this.gameStates.PLAYING;
        this.ui.characterMenu.style.display = 'none';
        this.ui.gameHud.style.display = 'block';
    }

    loadGame() {
        // Implementar carregamento de jogo salvo
        console.log('Carregando jogo...');
    }

    togglePause() {
        if (this.currentState === this.gameStates.PLAYING) {
            this.currentState = this.gameStates.PAUSED;
            this.ui.pauseMenu.style.display = 'block';
        } else if (this.currentState === this.gameStates.PAUSED) {
            this.currentState = this.gameStates.PLAYING;
            this.ui.pauseMenu.style.display = 'none';
        }
    }

    update() {
        if (this.currentState === this.gameStates.PLAYING) {
            // Atualizar posição do jogador
            if (this.player) {
                this.player.update();
            }
            
            // Atualizar NPCs
            this.npcs.forEach(npc => npc.update());
            
            // Verificar colisões
            this.checkCollisions();
            
            // Atualizar mapa
            if (this.currentMap) {
                this.currentMap.update();
            }
        }
    }

    draw() {
        // Limpar o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.currentState === this.gameStates.PLAYING || 
            this.currentState === this.gameStates.PAUSED) {
            // Desenhar mapa
            if (this.currentMap) {
                this.currentMap.draw(this.ctx);
            }
            
            // Desenhar NPCs
            this.npcs.forEach(npc => npc.draw(this.ctx));
            
            // Desenhar jogador
            if (this.player) {
                this.player.draw(this.ctx);
            }
        }
    }

    checkCollisions() {
        if (!this.player) return;
        
        // Colisão com NPCs
        this.npcs.forEach(npc => {
            if (this.checkCollision(this.player, npc)) {
                // Lidar com a colisão
                console.log('Colisão com NPC');
            }
        });
        
        // Colisão com objetos do mapa
        if (this.currentMap) {
            this.currentMap.checkCollisions(this.player);
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    gameLoop(timestamp) {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
}
