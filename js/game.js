class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Sistemas do jogo
        this.assetLoader = new AssetLoader();
        this.inputSystem = new InputSystem();
        this.soundSystem = new SoundSystem();
        this.dialogSystem = new DialogSystem(this);
        this.questSystem = new QuestSystem(this);
        this.combatSystem = new CombatSystem(this);
        this.inventorySystem = new InventorySystem(this);
        this.tutorialSystem = new TutorialSystem(this);
        this.storySystem = new StorySystem(this);
        this.timeSystem = new TimeSystem();
        
        // Estado do jogo
        this.currentScene = null;
        this.player = null;
        this.npcs = new Map();
        this.gameState = 'MENU'; // MENU, PLAYING, PAUSED
        
        // Configuração do canvas
        this.setupCanvas();
        
        // Iniciar loop do jogo
        this.lastTime = 0;
        this.start();
    }

    setupCanvas() {
        // Configurar tamanho do canvas para tela cheia
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Listener para redimensionamento
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    async start() {
        // Carregar assets
        await this.assetLoader.loadAll();
        
        // Criar player
        this.player = new Player(this);
        
        // Inicializar NPCs
        this.initializeNPCs();
        
        // Iniciar com o menu principal
        this.setScene(new MainMenuScene(this));
        
        // Iniciar loop do jogo
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(timestamp) {
        // Calcular delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Atualizar
        this.update(deltaTime);
        
        // Renderizar
        this.render();
        
        // Próximo frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // Atualizar sistemas
        this.timeSystem.update(deltaTime);
        this.inputSystem.update();
        
        // Atualizar cena atual
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
        
        // Atualizar player
        if (this.gameState === 'PLAYING') {
            this.player.update(deltaTime);
            
            // Atualizar NPCs
            for (const npc of this.npcs.values()) {
                npc.update(deltaTime);
            }
        }
    }

    render() {
        // Limpar canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Renderizar cena atual
        if (this.currentScene) {
            this.currentScene.render(this.ctx);
        }
    }

    setScene(scene) {
        if (this.currentScene) {
            this.currentScene.exit();
        }
        this.currentScene = scene;
        scene.enter();
    }

    startNewGame() {
        // Resetar estado do jogo
        this.player.reset();
        this.questSystem.reset();
        this.inventorySystem.reset();
        
        // Iniciar tutorial
        this.tutorialSystem.start();
        
        // Mostrar primeira cutscene
        this.storySystem.showStory('intro');
        
        // Mudar para a cena do jogo
        this.setScene(new GameScene(this));
        this.gameState = 'PLAYING';
    }

    initializeNPCs() {
        // Criar NPCs do jogo
        for (const [id, config] of Object.entries(GameNPCs)) {
            const npc = new NPC(config);
            this.npcs.set(id, npc);
        }
    }

    pauseGame() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
            this.soundSystem.pauseAll();
        }
    }

    resumeGame() {
        if (this.gameState === 'PAUSED') {
            this.gameState = 'PLAYING';
            this.soundSystem.resumeAll();
        }
    }

    saveGame() {
        const saveData = {
            player: this.player.getSaveData(),
            quests: this.questSystem.getSaveData(),
            inventory: this.inventorySystem.getSaveData(),
            time: this.timeSystem.getCurrentTime(),
            story: this.storySystem.getSaveData()
        };
        
        localStorage.setItem('rpgSave', JSON.stringify(saveData));
    }

    loadGame() {
        const saveData = JSON.parse(localStorage.getItem('rpgSave'));
        if (saveData) {
            this.player.loadSaveData(saveData.player);
            this.questSystem.loadSaveData(saveData.quests);
            this.inventorySystem.loadSaveData(saveData.inventory);
            this.timeSystem.setTime(saveData.time);
            this.storySystem.loadSaveData(saveData.story);
            
            this.setScene(new GameScene(this));
            this.gameState = 'PLAYING';
        }
    }
}

// Iniciar o jogo quando a página carregar
window.addEventListener('load', () => {
    const game = new Game();
});
