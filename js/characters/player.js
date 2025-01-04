class Player {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        
        // Dimensões
        this.width = 32;
        this.height = 48;
        
        // Movimento
        this.speed = 200;
        this.velocity = { x: 0, y: 0 };
        this.direction = 'down';
        this.moving = false;
        
        // Status
        this.stats = {
            level: 1,
            exp: 0,
            expNext: 100,
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            attack: 10,
            defense: 5,
            magic: 8,
            speed: 10
        };
        
        // Equipamento
        this.equipment = {
            weapon: null,
            armor: null,
            accessory1: null,
            accessory2: null
        };
        
        // Animações
        this.animations = {
            idle: {
                down: game.animationSystem.play('player_idle_down', this),
                up: game.animationSystem.play('player_idle_up', this),
                left: game.animationSystem.play('player_idle_left', this),
                right: game.animationSystem.play('player_idle_right', this)
            },
            walk: {
                down: game.animationSystem.play('player_walk_down', this),
                up: game.animationSystem.play('player_walk_up', this),
                left: game.animationSystem.play('player_walk_left', this),
                right: game.animationSystem.play('player_walk_right', this)
            }
        };
        
        // Estado atual
        this.currentAnimation = this.animations.idle.down;
    }

    update(deltaTime) {
        // Movimento
        this.updateMovement(deltaTime);
        
        // Animações
        this.updateAnimation(deltaTime);
        
        // Regeneração
        this.updateRegeneration(deltaTime);
    }

    updateMovement(deltaTime) {
        const input = this.game.inputSystem;
        
        // Resetar velocidade
        this.velocity.x = 0;
        this.velocity.y = 0;
        
        // Movimento horizontal
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('a')) {
            this.velocity.x = -this.speed;
            this.direction = 'left';
        } else if (input.isKeyDown('ArrowRight') || input.isKeyDown('d')) {
            this.velocity.x = this.speed;
            this.direction = 'right';
        }
        
        // Movimento vertical
        if (input.isKeyDown('ArrowUp') || input.isKeyDown('w')) {
            this.velocity.y = -this.speed;
            this.direction = 'up';
        } else if (input.isKeyDown('ArrowDown') || input.isKeyDown('s')) {
            this.velocity.y = this.speed;
            this.direction = 'down';
        }
        
        // Normalizar movimento diagonal
        if (this.velocity.x !== 0 && this.velocity.y !== 0) {
            const length = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            this.velocity.x = (this.velocity.x / length) * this.speed;
            this.velocity.y = (this.velocity.y / length) * this.speed;
        }
        
        // Atualizar posição
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Atualizar estado de movimento
        this.moving = this.velocity.x !== 0 || this.velocity.y !== 0;
    }

    updateAnimation(deltaTime) {
        // Selecionar animação baseado no estado
        const animationSet = this.moving ? this.animations.walk : this.animations.idle;
        const newAnimation = animationSet[this.direction];
        
        // Trocar animação se necessário
        if (newAnimation !== this.currentAnimation) {
            this.currentAnimation = newAnimation;
        }
    }

    updateRegeneration(deltaTime) {
        // Regenerar HP e MP fora de combate
        if (!this.game.combatSystem.active) {
            this.stats.hp = Math.min(this.stats.hp + 1 * deltaTime, this.stats.maxHp);
            this.stats.mp = Math.min(this.stats.mp + 0.5 * deltaTime, this.stats.maxMp);
        }
    }

    draw(ctx) {
        // Desenhar sombra
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width / 2,
            this.y + this.height - 5,
            this.width / 3,
            this.width / 6,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
        
        // Desenhar animação atual
        if (this.currentAnimation) {
            this.currentAnimation.draw(ctx);
        }
    }

    takeDamage(amount) {
        // Aplicar dano considerando defesa
        const damage = Math.max(1, amount - this.stats.defense);
        this.stats.hp = Math.max(0, this.stats.hp - damage);
        
        // Efeitos visuais
        this.game.particleSystem.emit('hit_impact', {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        });
        
        // Som de dano
        this.game.soundSystem.playSound('player_hurt');
        
        return damage;
    }

    heal(amount) {
        const oldHp = this.stats.hp;
        this.stats.hp = Math.min(this.stats.hp + amount, this.stats.maxHp);
        
        // Efeitos visuais
        this.game.particleSystem.emit('heal_effect', {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        });
        
        // Som de cura
        this.game.soundSystem.playSound('heal');
        
        return this.stats.hp - oldHp;
    }

    addExperience(amount) {
        this.stats.exp += amount;
        
        // Verificar level up
        while (this.stats.exp >= this.stats.expNext) {
            this.levelUp();
        }
    }

    levelUp() {
        this.stats.level++;
        this.stats.exp -= this.stats.expNext;
        this.stats.expNext = Math.floor(this.stats.expNext * 1.5);
        
        // Aumentar status
        this.stats.maxHp += 10;
        this.stats.maxMp += 5;
        this.stats.attack += 2;
        this.stats.defense += 1;
        this.stats.magic += 2;
        this.stats.speed += 1;
        
        // Recuperar HP e MP
        this.stats.hp = this.stats.maxHp;
        this.stats.mp = this.stats.maxMp;
        
        // Efeitos
        this.game.particleSystem.emit('level_up', {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        });
        
        // Som
        this.game.soundSystem.playSound('level_up');
        
        // Notificar
        this.game.ui.showMessage(`Level Up! Nível ${this.stats.level}`);
    }

    addEquipmentBonus(stat, value) {
        this.stats[stat] += value;
    }

    removeEquipmentBonus(stat, value) {
        this.stats[stat] -= value;
    }

    canAct() {
        return this.stats.hp > 0;
    }

    isAlive() {
        return this.stats.hp > 0;
    }

    getAvailableActions() {
        const actions = [
            {
                name: 'Atacar',
                type: 'attack',
                damage: this.stats.attack,
                cost: 0
            }
        ];
        
        // Adicionar habilidades baseadas no equipamento
        if (this.equipment.weapon && this.equipment.weapon.skills) {
            actions.push(...this.equipment.weapon.skills);
        }
        
        return actions;
    }

    canUseAction(action) {
        return this.stats.mp >= action.cost;
    }

    payActionCost(action) {
        this.stats.mp -= action.cost;
    }

    save() {
        return {
            position: { x: this.x, y: this.y },
            stats: { ...this.stats },
            equipment: { ...this.equipment }
        };
    }

    load(data) {
        this.x = data.position.x;
        this.y = data.position.y;
        this.stats = { ...data.stats };
        this.equipment = { ...data.equipment };
    }
}
