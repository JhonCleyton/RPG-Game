class GameMap {
    constructor(mapData) {
        this.tiles = mapData.tiles;
        this.width = mapData.width;
        this.height = mapData.height;
        this.tileSize = 32;
        this.collisionMap = mapData.collision;
        this.events = mapData.events || [];
        this.npcs = [];
        this.objects = [];
        this.triggers = [];
        
        // Camadas do mapa
        this.layers = {
            ground: mapData.layers.ground,
            decoration: mapData.layers.decoration,
            overlay: mapData.layers.overlay
        };
        
        // Carrega os tiles
        this.tilesets = new Map();
        this.loadTilesets(mapData.tilesets);
        
        // Música de fundo
        this.bgm = mapData.bgm;
        
        // Pontos de spawn
        this.spawnPoints = mapData.spawnPoints || {};
        
        // Áreas especiais
        this.areas = mapData.areas || [];
        
        this.setupEvents();
    }

    loadTilesets(tilesets) {
        tilesets.forEach(tileset => {
            const img = new Image();
            img.src = tileset.image;
            this.tilesets.set(tileset.name, {
                image: img,
                firstGid: tileset.firstGid,
                tileWidth: tileset.tileWidth,
                tileHeight: tileset.tileHeight
            });
        });
    }

    setupEvents() {
        this.events.forEach(event => {
            switch(event.type) {
                case 'trigger':
                    this.triggers.push(new TriggerEvent(event));
                    break;
                case 'npc':
                    this.npcs.push(new NPC(event));
                    break;
                case 'object':
                    this.objects.push(new MapObject(event));
                    break;
            }
        });
    }

    update() {
        // Atualizar NPCs
        this.npcs.forEach(npc => npc.update());
        
        // Atualizar objetos
        this.objects.forEach(obj => obj.update());
        
        // Verificar triggers
        this.checkTriggers();
    }

    checkTriggers() {
        this.triggers.forEach(trigger => {
            if (trigger.checkCondition()) {
                trigger.activate();
            }
        });
    }

    draw(ctx, camera) {
        // Desenhar camada do chão
        this.drawLayer(ctx, this.layers.ground, camera);
        
        // Desenhar camada de decoração
        this.drawLayer(ctx, this.layers.decoration, camera);
        
        // Desenhar NPCs e objetos
        this.drawEntities(ctx, camera);
        
        // Desenhar camada de sobreposição
        this.drawLayer(ctx, this.layers.overlay, camera);
    }

    drawLayer(ctx, layer, camera) {
        const startCol = Math.floor(camera.x / this.tileSize);
        const endCol = startCol + Math.ceil(camera.width / this.tileSize);
        const startRow = Math.floor(camera.y / this.tileSize);
        const endRow = startRow + Math.ceil(camera.height / this.tileSize);

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (row >= 0 && row < this.height && col >= 0 && col < this.width) {
                    const tile = layer[row][col];
                    if (tile !== 0) { // 0 representa tile vazio
                        const tileset = this.getTilesetForTile(tile);
                        const tilePos = this.getTilePosition(tile, tileset);
                        
                        ctx.drawImage(
                            tileset.image,
                            tilePos.x,
                            tilePos.y,
                            tileset.tileWidth,
                            tileset.tileHeight,
                            col * this.tileSize - camera.x,
                            row * this.tileSize - camera.y,
                            this.tileSize,
                            this.tileSize
                        );
                    }
                }
            }
        }
    }

    drawEntities(ctx, camera) {
        // Ordenar entidades por posição Y para correto layering
        const entities = [...this.npcs, ...this.objects].sort((a, b) => a.y - b.y);
        
        entities.forEach(entity => {
            if (this.isInCamera(entity, camera)) {
                entity.draw(ctx, camera);
            }
        });
    }

    isInCamera(entity, camera) {
        return entity.x + entity.width > camera.x &&
               entity.x < camera.x + camera.width &&
               entity.y + entity.height > camera.y &&
               entity.y < camera.y + camera.height;
    }

    getTilesetForTile(tileId) {
        for (let [_, tileset] of this.tilesets) {
            if (tileId >= tileset.firstGid && tileId < tileset.firstGid + tileset.tileCount) {
                return tileset;
            }
        }
        return null;
    }

    getTilePosition(tileId, tileset) {
        const localId = tileId - tileset.firstGid;
        const tilesPerRow = Math.floor(tileset.image.width / tileset.tileWidth);
        return {
            x: (localId % tilesPerRow) * tileset.tileWidth,
            y: Math.floor(localId / tilesPerRow) * tileset.tileHeight
        };
    }

    getCollisionAt(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return true; // Colisão com limites do mapa
        }
        
        return this.collisionMap[tileY][tileX] === 1;
    }

    getSpawnPoint(name) {
        return this.spawnPoints[name] || { x: 0, y: 0 };
    }

    findPath(start, end) {
        // Implementar pathfinding A* aqui
        return [];
    }

    getAreaAt(x, y) {
        return this.areas.find(area => {
            return x >= area.x &&
                   x < area.x + area.width &&
                   y >= area.y &&
                   y < area.y + area.height;
        });
    }

    addNPC(npc) {
        this.npcs.push(npc);
    }

    removeNPC(npc) {
        const index = this.npcs.indexOf(npc);
        if (index !== -1) {
            this.npcs.splice(index, 1);
        }
    }

    addObject(object) {
        this.objects.push(object);
    }

    removeObject(object) {
        const index = this.objects.indexOf(object);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
    }

    save() {
        // Retornar dados do mapa para salvamento
        return {
            npcs: this.npcs.map(npc => npc.save()),
            objects: this.objects.map(obj => obj.save()),
            triggers: this.triggers.map(trigger => trigger.save())
        };
    }

    load(data) {
        // Carregar dados salvos do mapa
        this.npcs = data.npcs.map(npcData => new NPC(npcData));
        this.objects = data.objects.map(objData => new MapObject(objData));
        this.triggers = data.triggers.map(triggerData => new TriggerEvent(triggerData));
    }
}

class TriggerEvent {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width;
        this.height = config.height;
        this.condition = config.condition;
        this.action = config.action;
        this.oneTime = config.oneTime || false;
        this.triggered = false;
    }

    checkCondition() {
        if (this.oneTime && this.triggered) return false;
        return this.condition();
    }

    activate() {
        this.action();
        if (this.oneTime) {
            this.triggered = true;
        }
    }

    save() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            triggered: this.triggered
        };
    }
}

class MapObject {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width;
        this.height = config.height;
        this.sprite = config.sprite;
        this.interaction = config.interaction;
        this.solid = config.solid || false;
    }

    update() {
        // Atualizar animações ou estados do objeto
    }

    draw(ctx, camera) {
        // Desenhar o objeto
        if (this.sprite) {
            ctx.drawImage(
                this.sprite,
                this.x - camera.x,
                this.y - camera.y,
                this.width,
                this.height
            );
        }
    }

    interact() {
        if (this.interaction) {
            this.interaction();
        }
    }

    save() {
        return {
            x: this.x,
            y: this.y,
            solid: this.solid
        };
    }
}

// Exemplo de mapa
const SampleMap = {
    width: 50,
    height: 50,
    tileSize: 32,
    layers: {
        ground: [], // Matriz 50x50 com IDs dos tiles
        decoration: [],
        overlay: []
    },
    collision: [], // Matriz 50x50 com 0s e 1s
    tilesets: [
        {
            name: 'main',
            image: 'assets/tilesets/main.png',
            firstGid: 1,
            tileWidth: 32,
            tileHeight: 32,
            tileCount: 100
        }
    ],
    spawnPoints: {
        start: { x: 5, y: 5 },
        boss: { x: 45, y: 45 }
    },
    events: [
        {
            type: 'trigger',
            x: 10,
            y: 10,
            width: 2,
            height: 2,
            oneTime: true,
            condition: () => true,
            action: () => console.log('Trigger ativado!')
        }
    ],
    areas: [
        {
            name: 'safe_zone',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            properties: {
                noCombat: true
            }
        }
    ],
    bgm: 'assets/music/field.mp3'
};
