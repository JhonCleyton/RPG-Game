class NPC {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.type = config.type;
        this.x = config.x;
        this.y = config.y;
        this.sprite = config.sprite;
        this.direction = 'down';
        this.moving = false;
        this.dialogues = config.dialogues;
        this.currentDialogue = 0;
        this.questsAvailable = config.quests || [];
        this.shop = config.shop;
        this.schedule = config.schedule;
        this.currentBehavior = null;
        this.interactionRadius = 50;
        
        // Estados de animação
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.emotions = new EmotionSystem(this);
        
        // Pathfinding
        this.path = [];
        this.pathIndex = 0;
        
        // Comportamentos
        this.behaviors = {
            idle: this.idle.bind(this),
            patrol: this.patrol.bind(this),
            follow: this.follow.bind(this),
            schedule: this.followSchedule.bind(this)
        };
    }

    update(deltaTime) {
        // Atualizar animações
        this.updateAnimation(deltaTime);
        
        // Atualizar comportamento atual
        if (this.currentBehavior) {
            this.behaviors[this.currentBehavior](deltaTime);
        }
        
        // Atualizar emoções
        this.emotions.update(deltaTime);
        
        // Atualizar agenda
        this.updateSchedule();
    }

    updateAnimation(deltaTime) {
        if (this.moving) {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= 0.1) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = 0;
            }
        }
    }

    idle(deltaTime) {
        // Comportamento padrão: ficar parado
        this.moving = false;
    }

    patrol(deltaTime) {
        // Patrulhar entre pontos definidos
        if (this.path.length === 0) {
            this.calculatePatrolPath();
        }
        
        if (this.pathIndex < this.path.length) {
            const target = this.path[this.pathIndex];
            this.moveTowards(target.x, target.y);
            
            if (this.hasReached(target)) {
                this.pathIndex = (this.pathIndex + 1) % this.path.length;
            }
        }
    }

    follow(target, minDistance = 50) {
        // Seguir um alvo (jogador ou outro NPC)
        const distance = Math.sqrt(
            Math.pow(target.x - this.x, 2) + 
            Math.pow(target.y - this.y, 2)
        );
        
        if (distance > minDistance) {
            this.moveTowards(target.x, target.y);
        } else {
            this.moving = false;
        }
    }

    followSchedule() {
        // Seguir agenda diária
        if (this.schedule) {
            const currentTime = this.getCurrentTime();
            const currentActivity = this.schedule.find(activity => 
                currentTime >= activity.startTime && 
                currentTime < activity.endTime
            );
            
            if (currentActivity) {
                const location = currentActivity.location;
                this.moveTowards(location.x, location.y);
                
                if (this.hasReached(location)) {
                    this.performActivity(currentActivity.action);
                }
            }
        }
    }

    moveTowards(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
            this.moving = true;
            const speed = 2;
            this.x += (dx / distance) * speed;
            this.y += (dy / distance) * speed;
            
            // Atualizar direção
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
        } else {
            this.moving = false;
        }
    }

    interact(player) {
        // Verificar se tem quests disponíveis
        if (this.questsAvailable.length > 0) {
            this.offerQuest(player);
            return;
        }
        
        // Verificar se é um comerciante
        if (this.shop) {
            this.openShop(player);
            return;
        }
        
        // Iniciar diálogo
        this.startDialogue(player);
    }

    startDialogue(player) {
        if (this.dialogues && this.dialogues.length > 0) {
            const dialogue = this.getNextDialogue(player);
            player.game.dialogSystem.startDialog(dialogue);
        }
    }

    getNextDialogue(player) {
        // Lógica para escolher o diálogo apropriado baseado no contexto
        return this.dialogues[this.currentDialogue];
    }

    offerQuest(player) {
        const availableQuest = this.questsAvailable.find(quest => 
            !player.hasCompletedQuest(quest.id) && 
            !player.hasActiveQuest(quest.id)
        );
        
        if (availableQuest) {
            player.game.questSystem.offerQuest(availableQuest, this);
        }
    }

    openShop(player) {
        if (this.shop) {
            player.game.shopSystem.openShop(this.shop);
        }
    }

    hasReached(target) {
        const distance = Math.sqrt(
            Math.pow(target.x - this.x, 2) + 
            Math.pow(target.y - this.y, 2)
        );
        return distance < 5;
    }

    getCurrentTime() {
        // Retorna o tempo atual do jogo em minutos (0-1440)
        return this.game.timeSystem.getCurrentMinutes();
    }

    draw(ctx, camera) {
        // Desenhar sprite do NPC
        if (this.sprite) {
            const spriteX = this.animationFrame * this.sprite.width;
            const spriteY = this.getDirectionFrame() * this.sprite.height;
            
            ctx.drawImage(
                this.sprite,
                spriteX,
                spriteY,
                this.sprite.width,
                this.sprite.height,
                this.x - camera.x,
                this.y - camera.y,
                this.sprite.width,
                this.sprite.height
            );
        }
        
        // Desenhar emoções
        this.emotions.draw(ctx, camera);
        
        // Desenhar indicadores de quest/loja
        this.drawIndicators(ctx, camera);
    }

    drawIndicators(ctx, camera) {
        const indicatorY = this.y - camera.y - 30;
        
        if (this.questsAvailable.length > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '24px Arial';
            ctx.fillText('!', this.x - camera.x, indicatorY);
        }
        
        if (this.shop) {
            ctx.fillStyle = '#00ff00';
            ctx.font = '24px Arial';
            ctx.fillText('$', this.x - camera.x + 20, indicatorY);
        }
    }
}

// Sistema de Emoções para NPCs
class EmotionSystem {
    constructor(npc) {
        this.npc = npc;
        this.currentEmotion = null;
        this.emotionDuration = 0;
        this.emotionTimer = 0;
    }

    showEmotion(emotion, duration = 2000) {
        this.currentEmotion = emotion;
        this.emotionDuration = duration;
        this.emotionTimer = 0;
    }

    update(deltaTime) {
        if (this.currentEmotion) {
            this.emotionTimer += deltaTime;
            if (this.emotionTimer >= this.emotionDuration) {
                this.currentEmotion = null;
            }
        }
    }

    draw(ctx, camera) {
        if (this.currentEmotion) {
            const x = this.npc.x - camera.x;
            const y = this.npc.y - camera.y - 40;
            
            ctx.font = '24px Arial';
            ctx.fillText(this.currentEmotion, x, y);
        }
    }
}

// Definição dos NPCs do Jogo
const GameNPCs = {
    elder_sage: {
        id: 'elder_sage',
        name: 'Velho Sábio',
        type: 'quest_giver',
        sprite: 'assets/sprites/npcs/elder_sage.png',
        dialogues: [
            {
                text: "Ah, jovem aventureiro! Os ventos do destino o trazem até mim.",
                conditions: { firstMeeting: true }
            },
            {
                text: "O Cristal de Eldoria... sua busca é nobre, mas perigosa.",
                conditions: { questActive: 'main_quest_1' }
            }
        ],
        quests: ['tutorial_quest', 'crystal_quest'],
        schedule: [
            {
                startTime: 360, // 6:00
                endTime: 720,   // 12:00
                location: { x: 100, y: 100 },
                action: 'study'
            },
            {
                startTime: 720,
                endTime: 1080,  // 18:00
                location: { x: 200, y: 200 },
                action: 'teach'
            }
        ]
    },

    merchant_anna: {
        id: 'merchant_anna',
        name: 'Anna, a Mercadora',
        type: 'merchant',
        sprite: 'assets/sprites/npcs/merchant.png',
        dialogues: [
            {
                text: "Bem-vindo à minha loja! Tenho itens raros de todas as partes de Eldoria.",
                conditions: { always: true }
            }
        ],
        shop: {
            items: [
                { id: 'health_potion', price: 50 },
                { id: 'mana_potion', price: 75 },
                { id: 'basic_sword', price: 150 }
            ],
            canBuy: true,
            canSell: true
        }
    },

    guard_captain: {
        id: 'guard_captain',
        name: 'Capitão Marcus',
        type: 'quest_giver',
        sprite: 'assets/sprites/npcs/guard.png',
        dialogues: [
            {
                text: "A vila precisa de proteção constante contra as criaturas das sombras.",
                conditions: { always: true }
            }
        ],
        quests: ['guard_duty', 'shadow_threat'],
        behavior: 'patrol'
    },

    forest_elder: {
        id: 'forest_elder',
        name: 'Ancião da Floresta',
        type: 'quest_giver',
        sprite: 'assets/sprites/npcs/elf_elder.png',
        dialogues: [
            {
                text: "As árvores antigas guardam muitos segredos...",
                conditions: { inForest: true }
            }
        ],
        quests: ['forest_trial']
    },

    blacksmith: {
        id: 'blacksmith',
        name: 'Mestre Ferreiro Thor',
        type: 'merchant',
        sprite: 'assets/sprites/npcs/blacksmith.png',
        dialogues: [
            {
                text: "Precisa de uma arma forjada? Você veio ao lugar certo!",
                conditions: { always: true }
            }
        ],
        shop: {
            items: [
                { id: 'iron_sword', price: 200 },
                { id: 'steel_armor', price: 350 },
                { id: 'reinforced_shield', price: 250 }
            ],
            canBuy: true,
            canSell: true
        }
    },

    mystic_teacher: {
        id: 'mystic_teacher',
        name: 'Mestra Lyra',
        type: 'trainer',
        sprite: 'assets/sprites/npcs/mage.png',
        dialogues: [
            {
                text: "A magia é uma arte que requer dedicação e estudo.",
                conditions: { playerClass: 'mage' }
            }
        ],
        training: {
            spells: ['fireball', 'ice_shield', 'lightning_bolt'],
            requirements: {
                level: 5,
                gold: 100
            }
        }
    },

    innkeeper: {
        id: 'innkeeper',
        name: 'Senhora Rosa',
        type: 'service',
        sprite: 'assets/sprites/npcs/innkeeper.png',
        dialogues: [
            {
                text: "Bem-vindo à Pousada do Dragão Dormente! Precisa de um quarto?",
                conditions: { always: true }
            }
        ],
        services: {
            rest: {
                cost: 10,
                healAmount: 100
            },
            meal: {
                cost: 5,
                buffDuration: 300 // 5 minutos
            }
        }
    },

    mysterious_stranger: {
        id: 'mysterious_stranger',
        name: '???',
        type: 'special',
        sprite: 'assets/sprites/npcs/stranger.png',
        dialogues: [
            {
                text: "Os fragmentos do Cristal chamam por você... mas outros também os procuram.",
                conditions: { mainQuestProgress: 2 }
            }
        ],
        behavior: 'follow',
        appears: {
            condition: 'night_time',
            location: 'town_square'
        }
    }
};
