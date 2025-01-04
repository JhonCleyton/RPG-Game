class GameScene {
    constructor(game) {
        this.game = game;
        this.camera = {
            x: 0,
            y: 0,
            width: game.canvas.width,
            height: game.canvas.height
        };
        
        // Mapa e colisões
        this.map = null;
        this.collisionMap = [];
        
        // Entidades
        this.entities = new Set();
        this.particles = new Set();
        
        // Interface
        this.ui = new GameUI(this.game);
        
        // Sistema de iluminação
        this.lightSystem = new LightSystem();
        
        // Música ambiente
        this.ambientMusic = null;
    }

    enter() {
        // Carregar mapa
        this.loadMap('village');
        
        // Adicionar player às entidades
        this.entities.add(this.game.player);
        
        // Posicionar NPCs
        this.placeNPCs();
        
        // Iniciar música ambiente
        this.startAmbientMusic();
        
        // Configurar eventos
        this.setupEventListeners();
    }

    exit() {
        // Parar música
        if (this.ambientMusic) {
            this.ambientMusic.stop();
        }
        
        // Limpar eventos
        this.removeEventListeners();
    }

    update(deltaTime) {
        if (this.game.gameState !== 'PLAYING') return;
        
        // Atualizar entidades
        for (const entity of this.entities) {
            entity.update(deltaTime);
        }
        
        // Atualizar partículas
        for (const particle of this.particles) {
            particle.update(deltaTime);
            if (particle.isDead()) {
                this.particles.delete(particle);
            }
        }
        
        // Atualizar câmera
        this.updateCamera();
        
        // Atualizar sistema de iluminação
        this.lightSystem.update(deltaTime);
        
        // Atualizar UI
        this.ui.update(deltaTime);
        
        // Verificar triggers do mapa
        this.checkMapTriggers();
    }

    render(ctx) {
        // Limpar canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        // Salvar contexto
        ctx.save();
        
        // Aplicar transformação da câmera
        ctx.translate(-this.camera.x, -this.camera.y);
        
        // Renderizar mapa
        this.renderMap(ctx);
        
        // Renderizar entidades
        this.renderEntities(ctx);
        
        // Renderizar partículas
        this.renderParticles(ctx);
        
        // Aplicar iluminação
        this.lightSystem.render(ctx);
        
        // Restaurar contexto
        ctx.restore();
        
        // Renderizar UI
        this.ui.render(ctx);
    }

    loadMap(mapName) {
        // Carregar dados do mapa
        const mapData = this.game.assetLoader.getMap(mapName);
        this.map = new GameMap(mapData);
        
        // Configurar colisões
        this.setupCollisions();
        
        // Configurar triggers
        this.setupMapTriggers();
        
        // Ajustar música ambiente
        this.updateAmbientMusic(mapData.music);
    }

    setupCollisions() {
        // Criar grid de colisões baseado no mapa
        this.collisionMap = this.map.createCollisionGrid();
    }

    setupMapTriggers() {
        // Configurar áreas que ativam eventos
        this.mapTriggers = this.map.getTriggers();
    }

    placeNPCs() {
        // Posicionar NPCs no mapa baseado em seus pontos de spawn
        for (const npc of this.game.npcs.values()) {
            const spawnPoint = this.map.getNPCSpawnPoint(npc.id);
            if (spawnPoint) {
                npc.x = spawnPoint.x;
                npc.y = spawnPoint.y;
                this.entities.add(npc);
            }
        }
    }

    updateCamera() {
        // Seguir o player
        const targetX = this.game.player.x - this.camera.width / 2;
        const targetY = this.game.player.y - this.camera.height / 2;
        
        // Limites do mapa
        const maxX = this.map.width - this.camera.width;
        const maxY = this.map.height - this.camera.height;
        
        // Aplicar movimento suave
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // Manter câmera dentro dos limites
        this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
        this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
    }

    startAmbientMusic() {
        if (this.map.music) {
            this.ambientMusic = this.game.soundSystem.getSound(this.map.music);
            this.ambientMusic.play({ loop: true, volume: 0.5 });
        }
    }

    updateAmbientMusic(newMusic) {
        if (this.ambientMusic) {
            if (this.ambientMusic.name !== newMusic) {
                this.ambientMusic.fadeOut(1000);
                this.ambientMusic = this.game.soundSystem.getSound(newMusic);
                this.ambientMusic.fadeIn(1000, { loop: true, volume: 0.5 });
            }
        } else {
            this.startAmbientMusic();
        }
    }

    addParticle(particle) {
        this.particles.add(particle);
    }

    checkMapTriggers() {
        const playerBounds = this.game.player.getBounds();
        
        for (const trigger of this.mapTriggers) {
            if (trigger.bounds.intersects(playerBounds)) {
                if (!trigger.activated) {
                    trigger.activate(this.game);
                }
            } else {
                trigger.activated = false;
            }
        }
    }

    setupEventListeners() {
        // Event listeners para interação
        this.clickHandler = this.handleClick.bind(this);
        this.game.canvas.addEventListener('click', this.clickHandler);
    }

    removeEventListeners() {
        this.game.canvas.removeEventListener('click', this.clickHandler);
    }

    handleClick(event) {
        const rect = this.game.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left + this.camera.x;
        const y = event.clientY - rect.top + this.camera.y;
        
        // Verificar clique em entidades
        for (const entity of this.entities) {
            if (entity.containsPoint(x, y)) {
                entity.onClick();
                return;
            }
        }
    }

    renderMap(ctx) {
        this.map.render(ctx, this.camera);
    }

    renderEntities(ctx) {
        // Ordenar entidades por Y para correto layering
        const sortedEntities = [...this.entities].sort((a, b) => a.y - b.y);
        
        for (const entity of sortedEntities) {
            entity.render(ctx);
        }
    }

    renderParticles(ctx) {
        for (const particle of this.particles) {
            particle.render(ctx);
        }
    }
}
