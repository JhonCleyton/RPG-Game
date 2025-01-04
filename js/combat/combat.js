class CombatSystem {
    constructor(game) {
        this.game = game;
        this.inCombat = false;
        this.turn = 'player';
        this.enemies = [];
        this.selectedAction = null;
        this.selectedTarget = null;
        this.actionMenu = {
            visible: false,
            options: ['Atacar', 'Habilidade', 'Item', 'Fugir']
        };
        
        // Animações de combate
        this.animations = [];
        
        // Status effects
        this.statusEffects = new Map();
    }

    startCombat(enemies) {
        this.inCombat = true;
        this.enemies = enemies;
        this.game.currentState = this.game.gameStates.COMBAT;
        this.turn = 'player';
        this.showCombatMenu();
    }

    showCombatMenu() {
        this.actionMenu.visible = true;
        // Mostrar menu de ações do jogador
    }

    async executePlayerTurn(action, target) {
        if (!this.inCombat) return;

        switch(action) {
            case 'Atacar':
                await this.executeAttack(this.game.player, target);
                break;
            case 'Habilidade':
                await this.executeAbility(this.game.player, target);
                break;
            case 'Item':
                await this.useItem(this.game.player);
                break;
            case 'Fugir':
                if (this.tryToFlee()) {
                    this.endCombat();
                    return;
                }
                break;
        }

        // Verificar se o combate terminou
        if (this.checkCombatEnd()) return;

        // Próximo turno
        this.turn = 'enemy';
        await this.executeEnemyTurns();
    }

    async executeEnemyTurns() {
        for (let enemy of this.enemies) {
            if (enemy.hp <= 0) continue;

            await this.executeEnemyAI(enemy);
            
            // Verificar se o jogador morreu
            if (this.game.player.hp <= 0) {
                this.endCombat('defeat');
                return;
            }
        }

        this.turn = 'player';
        this.showCombatMenu();
    }

    async executeAttack(attacker, target) {
        // Calcular dano base
        let damage = attacker.attack - target.defense;
        damage = Math.max(1, damage); // Dano mínimo de 1

        // Crítico
        if (Math.random() < attacker.critChance) {
            damage *= 2;
            this.addAnimation(new CriticalHitAnimation());
        }

        // Aplicar dano
        target.hp -= damage;
        this.addAnimation(new DamageAnimation(damage));

        // Som de ataque
        this.game.audio.playSound('attack');

        await this.waitForAnimations();
    }

    async executeAbility(caster, target) {
        const ability = caster.selectedAbility;
        if (caster.mp < ability.mpCost) {
            this.showMessage("MP insuficiente!");
            return;
        }

        caster.mp -= ability.mpCost;
        
        // Efeitos da habilidade
        switch(ability.type) {
            case 'damage':
                let damage = ability.power * caster.magic;
                target.hp -= damage;
                this.addAnimation(new MagicAnimation(ability));
                break;
            case 'heal':
                let heal = ability.power * caster.magic;
                target.hp = Math.min(target.maxHp, target.hp + heal);
                this.addAnimation(new HealAnimation());
                break;
            case 'buff':
                this.addStatusEffect(target, ability.effect);
                this.addAnimation(new BuffAnimation());
                break;
            case 'debuff':
                this.addStatusEffect(target, ability.effect);
                this.addAnimation(new DebuffAnimation());
                break;
        }

        await this.waitForAnimations();
    }

    addStatusEffect(target, effect) {
        if (!this.statusEffects.has(target)) {
            this.statusEffects.set(target, new Map());
        }
        
        const targetEffects = this.statusEffects.get(target);
        targetEffects.set(effect.name, {
            effect: effect,
            duration: effect.duration,
            strength: effect.strength
        });
    }

    updateStatusEffects() {
        for (let [target, effects] of this.statusEffects) {
            for (let [effectName, effectData] of effects) {
                // Aplicar efeito
                switch(effectData.effect.type) {
                    case 'dot': // Damage over time
                        target.hp -= effectData.strength;
                        break;
                    case 'hot': // Heal over time
                        target.hp = Math.min(target.maxHp, target.hp + effectData.strength);
                        break;
                    case 'stat':
                        // Efeitos já aplicados na adição do status
                        break;
                }

                // Reduzir duração
                effectData.duration--;
                if (effectData.duration <= 0) {
                    // Remover efeito
                    effects.delete(effectName);
                    // Reverter modificadores de status se necessário
                    if (effectData.effect.type === 'stat') {
                        this.revertStatModifier(target, effectData.effect);
                    }
                }
            }
        }
    }

    async useItem(user) {
        const item = user.selectedItem;
        if (!item) return;

        // Usar o item
        switch(item.type) {
            case 'heal':
                user.hp = Math.min(user.maxHp, user.hp + item.power);
                this.addAnimation(new ItemAnimation(item));
                break;
            case 'mana':
                user.mp = Math.min(user.maxMp, user.mp + item.power);
                this.addAnimation(new ItemAnimation(item));
                break;
            case 'buff':
                this.addStatusEffect(user, item.effect);
                this.addAnimation(new BuffAnimation());
                break;
        }

        // Remover item do inventário
        user.inventory.removeItem(item);

        await this.waitForAnimations();
    }

    tryToFlee() {
        // Chance de fuga baseada na agilidade do jogador vs inimigos
        const fleeChance = 0.5 + (this.game.player.agility / 100);
        return Math.random() < fleeChance;
    }

    checkCombatEnd() {
        // Verificar se todos os inimigos foram derrotados
        if (this.enemies.every(enemy => enemy.hp <= 0)) {
            this.endCombat('victory');
            return true;
        }

        // Verificar se o jogador foi derrotado
        if (this.game.player.hp <= 0) {
            this.endCombat('defeat');
            return true;
        }

        return false;
    }

    endCombat(result) {
        this.inCombat = false;
        this.game.currentState = this.game.gameStates.PLAYING;

        if (result === 'victory') {
            this.giveRewards();
        }

        // Limpar status effects
        this.statusEffects.clear();
    }

    giveRewards() {
        let totalExp = 0;
        let totalGold = 0;
        let items = [];

        // Calcular recompensas de todos os inimigos
        this.enemies.forEach(enemy => {
            totalExp += enemy.expValue;
            totalGold += enemy.goldValue;
            
            // Chance de drop de item
            if (Math.random() < enemy.dropChance) {
                items.push(enemy.generateDrop());
            }
        });

        // Dar experiência ao jogador
        this.game.player.gainExp(totalExp);

        // Dar ouro ao jogador
        this.game.player.gold += totalGold;

        // Adicionar itens ao inventário
        items.forEach(item => {
            this.game.player.inventory.addItem(item);
        });

        // Mostrar tela de recompensas
        this.showRewards(totalExp, totalGold, items);
    }

    addAnimation(animation) {
        this.animations.push(animation);
    }

    async waitForAnimations() {
        while (this.animations.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
            this.animations = this.animations.filter(anim => !anim.finished);
        }
    }

    draw(ctx) {
        if (!this.inCombat) return;

        // Desenhar fundo de batalha
        this.drawBackground(ctx);

        // Desenhar inimigos
        this.enemies.forEach(enemy => enemy.draw(ctx));

        // Desenhar jogador
        this.game.player.drawBattle(ctx);

        // Desenhar interface de combate
        this.drawCombatUI(ctx);

        // Desenhar animações
        this.animations.forEach(anim => anim.draw(ctx));
    }

    drawBackground(ctx) {
        // Desenhar fundo de batalha
    }

    drawCombatUI(ctx) {
        // Desenhar menu de ações
        if (this.actionMenu.visible) {
            // Desenhar opções de combate
        }

        // Desenhar barras de HP/MP
        this.drawStatusBars(ctx);
    }

    drawStatusBars(ctx) {
        // Desenhar barras de status do jogador e inimigos
    }
}
