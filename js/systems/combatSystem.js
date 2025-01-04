class CombatSystem {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.participants = new Set();
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.activeEffects = new Map();
        
        // Sistema de combos
        this.currentCombo = 0;
        this.comboTimer = null;
        this.maxCombo = 10;
        
        // Eventos
        this.onCombatStart = new Set();
        this.onCombatEnd = new Set();
        this.onTurnStart = new Set();
        this.onTurnEnd = new Set();
    }

    startCombat(participants) {
        this.active = true;
        this.participants.clear();
        this.activeEffects.clear();
        
        // Adicionar participantes
        participants.forEach(participant => {
            this.participants.add(participant);
            participant.prepareForCombat();
        });
        
        // Determinar ordem dos turnos
        this.determineTurnOrder();
        
        // Iniciar primeiro turno
        this.currentTurnIndex = 0;
        this.startTurn();
        
        // Notificar listeners
        this.onCombatStart.forEach(callback => callback(this.participants));
        
        // Iniciar música de batalha
        this.game.soundSystem.playMusic('battle_theme', { fadeIn: 1000 });
    }

    determineTurnOrder() {
        this.turnOrder = Array.from(this.participants)
            .sort((a, b) => b.stats.speed - a.stats.speed);
    }

    startTurn() {
        const currentParticipant = this.turnOrder[this.currentTurnIndex];
        
        // Processar efeitos ativos
        this.processEffects(currentParticipant);
        
        // Verificar se pode agir
        if (currentParticipant.canAct()) {
            // Notificar início do turno
            this.onTurnStart.forEach(callback => 
                callback(currentParticipant));
            
            // Se for o jogador, aguardar input
            if (currentParticipant === this.game.player) {
                this.enablePlayerControls();
            } else {
                // AI toma decisão
                this.processAITurn(currentParticipant);
            }
        } else {
            // Pular turno se não puder agir
            this.endTurn();
        }
    }

    processAITurn(participant) {
        // Implementar AI básica
        const target = this.selectTarget(participant);
        const action = this.selectAction(participant, target);
        
        // Executar ação com pequeno delay para melhor feedback visual
        setTimeout(() => {
            this.executeAction(participant, action, target);
        }, 500);
    }

    selectTarget(participant) {
        // AI seleciona alvo baseado em prioridades
        const possibleTargets = Array.from(this.participants)
            .filter(p => p.team !== participant.team && p.isAlive());
        
        return possibleTargets.reduce((best, current) => {
            // Priorizar alvos com menos HP
            if (current.stats.hp < best.stats.hp) return current;
            return best;
        }, possibleTargets[0]);
    }

    selectAction(participant, target) {
        // AI seleciona melhor ação disponível
        const actions = participant.getAvailableActions();
        
        return actions.reduce((best, current) => {
            // Calcular valor da ação baseado em vários fatores
            const value = this.evaluateAction(current, participant, target);
            if (value > best.value) {
                return { action: current, value };
            }
            return best;
        }, { action: actions[0], value: 0 }).action;
    }

    evaluateAction(action, user, target) {
        let value = 0;
        
        // Avaliar dano
        if (action.damage) {
            value += action.damage;
            
            // Bônus para fraquezas elementais
            if (target.weaknesses.includes(action.element)) {
                value *= 1.5;
            }
        }
        
        // Avaliar cura
        if (action.healing) {
            const userHpPercent = user.stats.hp / user.stats.maxHp;
            value += action.healing * (1 - userHpPercent);
        }
        
        // Avaliar buffs/debuffs
        if (action.effects) {
            action.effects.forEach(effect => {
                value += effect.power * (effect.duration / 3);
            });
        }
        
        // Considerar custo
        if (action.cost) {
            value -= action.cost * 0.5;
        }
        
        return value;
    }

    executeAction(user, action, target) {
        // Verificar se pode usar a ação
        if (!user.canUseAction(action)) {
            this.endTurn();
            return;
        }
        
        // Aplicar custos
        user.payActionCost(action);
        
        // Calcular e aplicar dano
        if (action.damage) {
            const damage = this.calculateDamage(user, target, action);
            this.applyDamage(target, damage, action.element);
            
            // Atualizar combo
            this.updateCombo(damage);
        }
        
        // Aplicar cura
        if (action.healing) {
            const healing = this.calculateHealing(user, action);
            this.applyHealing(target || user, healing);
        }
        
        // Aplicar efeitos
        if (action.effects) {
            action.effects.forEach(effect => {
                this.addEffect(target || user, effect);
            });
        }
        
        // Efeitos visuais e sonoros
        this.playActionEffects(action, user, target);
        
        // Verificar fim de combate
        if (this.checkCombatEnd()) {
            this.endCombat();
        } else {
            this.endTurn();
        }
    }

    calculateDamage(attacker, defender, action) {
        let damage = action.damage;
        
        // Modificadores de ataque
        damage *= attacker.stats.attack / 100;
        
        // Modificadores elementais
        if (defender.weaknesses.includes(action.element)) {
            damage *= 2;
            this.game.ui.showText('Fraqueza!', defender.position, '#ff0000');
        }
        
        // Defesa do alvo
        damage *= (100 / (100 + defender.stats.defense));
        
        // Variação aleatória (±10%)
        damage *= 0.9 + Math.random() * 0.2;
        
        // Bônus de combo
        damage *= (1 + this.currentCombo * 0.1);
        
        return Math.round(damage);
    }

    calculateHealing(healer, action) {
        let healing = action.healing;
        
        // Modificadores de cura
        healing *= healer.stats.magic / 100;
        
        // Variação aleatória (±10%)
        healing *= 0.9 + Math.random() * 0.2;
        
        return Math.round(healing);
    }

    applyDamage(target, damage, element) {
        target.takeDamage(damage);
        
        // Efeitos visuais
        this.game.ui.showDamage(damage, target.position);
        
        // Som de hit
        this.game.soundSystem.playSound('hit_' + element);
        
        // Shake na câmera
        this.game.camera.shake(5, 200);
    }

    applyHealing(target, healing) {
        target.heal(healing);
        
        // Efeitos visuais
        this.game.ui.showHealing(healing, target.position);
        
        // Som de cura
        this.game.soundSystem.playSound('healing');
    }

    addEffect(target, effect) {
        const activeEffect = {
            ...effect,
            duration: effect.duration,
            onTick: effect.onTick
        };
        
        this.activeEffects.set(target, [
            ...(this.activeEffects.get(target) || []),
            activeEffect
        ]);
        
        // Aplicar efeito inicial
        if (effect.onApply) {
            effect.onApply(target);
        }
        
        // Efeitos visuais
        this.game.ui.showEffect(effect.name, target.position);
    }

    processEffects(participant) {
        const effects = this.activeEffects.get(participant) || [];
        const remainingEffects = [];
        
        effects.forEach(effect => {
            // Aplicar efeito
            if (effect.onTick) {
                effect.onTick(participant);
            }
            
            // Reduzir duração
            effect.duration--;
            
            // Manter efeitos ativos
            if (effect.duration > 0) {
                remainingEffects.push(effect);
            } else {
                // Remover efeito
                if (effect.onRemove) {
                    effect.onRemove(participant);
                }
            }
        });
        
        this.activeEffects.set(participant, remainingEffects);
    }

    updateCombo(damage) {
        // Resetar timer do combo
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
        }
        
        // Incrementar combo
        this.currentCombo = Math.min(this.currentCombo + 1, this.maxCombo);
        
        // Atualizar UI
        this.game.ui.updateCombo(this.currentCombo);
        
        // Definir timer para resetar combo
        this.comboTimer = setTimeout(() => {
            this.currentCombo = 0;
            this.game.ui.updateCombo(0);
        }, 3000);
    }

    playActionEffects(action, user, target) {
        // Animação
        if (action.animation) {
            this.game.particleSystem.playAnimation(
                action.animation,
                target ? target.position : user.position
            );
        }
        
        // Som
        if (action.sound) {
            this.game.soundSystem.playSound(action.sound);
        }
        
        // Shake na câmera
        if (action.screenShake) {
            this.game.camera.shake(
                action.screenShake.intensity,
                action.screenShake.duration
            );
        }
    }

    endTurn() {
        const currentParticipant = this.turnOrder[this.currentTurnIndex];
        
        // Notificar fim do turno
        this.onTurnEnd.forEach(callback => 
            callback(currentParticipant));
        
        // Próximo turno
        this.currentTurnIndex = 
            (this.currentTurnIndex + 1) % this.turnOrder.length;
        
        // Iniciar próximo turno
        this.startTurn();
    }

    checkCombatEnd() {
        // Verificar se todos os membros de um time foram derrotados
        const teams = new Set(
            Array.from(this.participants).map(p => p.team)
        );
        
        return Array.from(teams).some(team => 
            Array.from(this.participants)
                .filter(p => p.team === team)
                .every(p => !p.isAlive())
        );
    }

    endCombat() {
        this.active = false;
        
        // Distribuir experiência e recompensas
        this.distributeRewards();
        
        // Limpar estados
        this.participants.clear();
        this.activeEffects.clear();
        this.currentCombo = 0;
        
        // Notificar listeners
        this.onCombatEnd.forEach(callback => callback());
        
        // Retornar à música anterior
        this.game.soundSystem.stopMusic({ fadeOut: 1000 });
    }

    distributeRewards() {
        const winners = Array.from(this.participants)
            .filter(p => p.isAlive());
        const losers = Array.from(this.participants)
            .filter(p => !p.isAlive());
        
        // Calcular EXP e gold
        const totalExp = losers.reduce((sum, p) => sum + p.expValue, 0);
        const totalGold = losers.reduce((sum, p) => sum + p.goldValue, 0);
        
        // Distribuir entre vencedores
        const expShare = Math.floor(totalExp / winners.length);
        const goldShare = Math.floor(totalGold / winners.length);
        
        winners.forEach(winner => {
            if (winner === this.game.player) {
                this.game.player.addExperience(expShare);
                this.game.player.addGold(goldShare);
                
                // Notificar jogador
                this.game.ui.showRewards(expShare, goldShare);
            }
        });
    }

    enablePlayerControls() {
        // Implementar controles do jogador
        this.game.inputSystem.enableCombatControls();
    }

    disablePlayerControls() {
        this.game.inputSystem.disableCombatControls();
    }
}
