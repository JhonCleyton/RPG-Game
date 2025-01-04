class GameUI {
    constructor(game) {
        this.game = game;
        
        // Elementos da UI
        this.elements = new Map();
        
        // Sistema de notificações
        this.notifications = [];
        
        // Criar elementos da UI
        this.createUI();
    }

    createUI() {
        // HUD do jogador
        this.createPlayerHUD();
        
        // Minimapa
        this.createMinimap();
        
        // Barra de ações rápidas
        this.createActionBar();
        
        // Indicadores de quest
        this.createQuestIndicators();
    }

    createPlayerHUD() {
        const hud = document.createElement('div');
        hud.className = 'player-hud';
        hud.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        
        // Barras de status
        const statusBars = document.createElement('div');
        statusBars.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 5px;
        `;
        
        // HP Bar
        const hpBar = this.createStatusBar('hp', '#ff0000', 'HP');
        statusBars.appendChild(hpBar);
        
        // MP Bar
        const mpBar = this.createStatusBar('mp', '#0000ff', 'MP');
        statusBars.appendChild(mpBar);
        
        // XP Bar
        const xpBar = this.createStatusBar('xp', '#ffff00', 'XP');
        statusBars.appendChild(xpBar);
        
        hud.appendChild(statusBars);
        
        // Info do personagem
        const charInfo = document.createElement('div');
        charInfo.className = 'char-info';
        charInfo.style.cssText = `
            color: #fff;
            font-family: 'MedievalFont', serif;
            text-shadow: 2px 2px 2px #000;
        `;
        
        const levelInfo = document.createElement('div');
        levelInfo.id = 'level-info';
        charInfo.appendChild(levelInfo);
        
        const goldInfo = document.createElement('div');
        goldInfo.id = 'gold-info';
        charInfo.appendChild(goldInfo);
        
        hud.appendChild(charInfo);
        
        document.body.appendChild(hud);
        this.elements.set('playerHUD', hud);
    }

    createStatusBar(type, color, label) {
        const container = document.createElement('div');
        container.className = `status-bar ${type}-bar`;
        container.style.cssText = `
            width: 200px;
            height: 20px;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #fff;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        `;
        
        const fill = document.createElement('div');
        fill.className = `${type}-fill`;
        fill.style.cssText = `
            width: 100%;
            height: 100%;
            background: ${color};
            transition: width 0.3s;
        `;
        
        const text = document.createElement('div');
        text.className = `${type}-text`;
        text.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            font-size: 12px;
            text-shadow: 1px 1px 1px #000;
        `;
        
        container.appendChild(fill);
        container.appendChild(text);
        
        return container;
    }

    createMinimap() {
        const minimap = document.createElement('div');
        minimap.className = 'minimap';
        minimap.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 200px;
            height: 200px;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #fff;
            border-radius: 5px;
        `;
        
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        minimap.appendChild(canvas);
        
        document.body.appendChild(minimap);
        this.elements.set('minimap', minimap);
    }

    createActionBar() {
        const actionBar = document.createElement('div');
        actionBar.className = 'action-bar';
        actionBar.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
        `;
        
        // Criar slots de ação
        for (let i = 0; i < 8; i++) {
            const slot = document.createElement('div');
            slot.className = 'action-slot';
            slot.style.cssText = `
                width: 50px;
                height: 50px;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid #fff;
                border-radius: 5px;
                display: flex;
                justify-content: center;
                align-items: center;
                color: #fff;
                font-size: 12px;
            `;
            
            const keybind = document.createElement('div');
            keybind.className = 'keybind';
            keybind.style.cssText = `
                position: absolute;
                bottom: 2px;
                right: 2px;
                font-size: 10px;
            `;
            keybind.textContent = (i + 1).toString();
            
            slot.appendChild(keybind);
            actionBar.appendChild(slot);
        }
        
        document.body.appendChild(actionBar);
        this.elements.set('actionBar', actionBar);
    }

    createQuestIndicators() {
        const questLog = document.createElement('div');
        questLog.className = 'quest-log';
        questLog.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        
        document.body.appendChild(questLog);
        this.elements.set('questLog', questLog);
    }

    update() {
        this.updateStatusBars();
        this.updateCharInfo();
        this.updateMinimap();
        this.updateQuestIndicators();
        this.updateNotifications();
    }

    updateStatusBars() {
        const player = this.game.player;
        
        // HP Bar
        const hpFill = document.querySelector('.hp-fill');
        const hpText = document.querySelector('.hp-text');
        const hpPercent = (player.stats.hp / player.stats.maxHp) * 100;
        hpFill.style.width = `${hpPercent}%`;
        hpText.textContent = `${Math.ceil(player.stats.hp)}/${player.stats.maxHp}`;
        
        // MP Bar
        const mpFill = document.querySelector('.mp-fill');
        const mpText = document.querySelector('.mp-text');
        const mpPercent = (player.stats.mp / player.stats.maxMp) * 100;
        mpFill.style.width = `${mpPercent}%`;
        mpText.textContent = `${Math.ceil(player.stats.mp)}/${player.stats.maxMp}`;
        
        // XP Bar
        const xpFill = document.querySelector('.xp-fill');
        const xpText = document.querySelector('.xp-text');
        const xpPercent = (player.stats.exp / player.stats.expNext) * 100;
        xpFill.style.width = `${xpPercent}%`;
        xpText.textContent = `${player.stats.exp}/${player.stats.expNext}`;
    }

    updateCharInfo() {
        const player = this.game.player;
        
        // Level
        document.getElementById('level-info').textContent = 
            `Nível ${player.stats.level}`;
        
        // Gold
        document.getElementById('gold-info').textContent = 
            `${this.game.inventorySystem.gold} G`;
    }

    updateMinimap() {
        const minimap = this.elements.get('minimap');
        const ctx = minimap.querySelector('canvas').getContext('2d');
        
        // Limpar minimap
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 200, 200);
        
        // Desenhar elementos do mapa
        // ... (implementar lógica do minimap)
    }

    updateQuestIndicators() {
        const questLog = this.elements.get('questLog');
        questLog.innerHTML = '';
        
        // Adicionar indicadores para quests ativas
        this.game.questSystem.getActiveQuests().forEach(quest => {
            const indicator = document.createElement('div');
            indicator.className = 'quest-indicator';
            indicator.style.cssText = `
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid #fff;
                border-radius: 5px;
                padding: 10px;
                color: #fff;
                font-size: 14px;
                max-width: 300px;
            `;
            
            const title = document.createElement('div');
            title.textContent = quest.title;
            title.style.color = '#ffd700';
            
            const objective = document.createElement('div');
            const currentObjective = quest.objectives[0];
            objective.textContent = `${currentObjective.description} (${currentObjective.current}/${currentObjective.required})`;
            
            indicator.appendChild(title);
            indicator.appendChild(objective);
            questLog.appendChild(indicator);
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 16px;
            transition: top 0.3s;
        `;
        
        switch (type) {
            case 'success':
                notification.style.borderLeft = '4px solid #4CAF50';
                break;
            case 'error':
                notification.style.borderLeft = '4px solid #f44336';
                break;
            case 'warning':
                notification.style.borderLeft = '4px solid #ff9800';
                break;
            default:
                notification.style.borderLeft = '4px solid #2196F3';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.top = '20px';
        }, 100);
        
        // Remover após delay
        setTimeout(() => {
            notification.style.top = '-50px';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    showDamage(amount, position) {
        const damageText = document.createElement('div');
        damageText.className = 'damage-text';
        damageText.style.cssText = `
            position: fixed;
            color: #ff0000;
            font-size: 20px;
            font-weight: bold;
            text-shadow: 2px 2px 2px #000;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
        `;
        
        damageText.textContent = amount;
        damageText.style.left = `${position.x}px`;
        damageText.style.top = `${position.y}px`;
        
        document.body.appendChild(damageText);
        
        // Remover após animação
        setTimeout(() => {
            damageText.remove();
        }, 1000);
    }

    showHealing(amount, position) {
        const healText = document.createElement('div');
        healText.className = 'heal-text';
        healText.style.cssText = `
            position: fixed;
            color: #00ff00;
            font-size: 20px;
            font-weight: bold;
            text-shadow: 2px 2px 2px #000;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
        `;
        
        healText.textContent = '+' + amount;
        healText.style.left = `${position.x}px`;
        healText.style.top = `${position.y}px`;
        
        document.body.appendChild(healText);
        
        // Remover após animação
        setTimeout(() => {
            healText.remove();
        }, 1000);
    }

    showEffect(effectName, position) {
        const effectText = document.createElement('div');
        effectText.className = 'effect-text';
        effectText.style.cssText = `
            position: fixed;
            color: #ffff00;
            font-size: 16px;
            font-weight: bold;
            text-shadow: 2px 2px 2px #000;
            pointer-events: none;
            animation: fadeOut 1s ease-out forwards;
        `;
        
        effectText.textContent = effectName;
        effectText.style.left = `${position.x}px`;
        effectText.style.top = `${position.y}px`;
        
        document.body.appendChild(effectText);
        
        // Remover após animação
        setTimeout(() => {
            effectText.remove();
        }, 1000);
    }

    showRewards(exp, gold) {
        const rewardsContainer = document.createElement('div');
        rewardsContainer.className = 'rewards-container';
        rewardsContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #ffd700;
            border-radius: 10px;
            padding: 20px;
            color: #fff;
            font-size: 18px;
            text-align: center;
            animation: fadeIn 0.5s ease-out;
        `;
        
        rewardsContainer.innerHTML = `
            <div style="color: #ffd700; font-size: 24px; margin-bottom: 10px;">
                Recompensas
            </div>
            <div style="color: #4CAF50;">
                +${exp} EXP
            </div>
            <div style="color: #ffd700;">
                +${gold} G
            </div>
        `;
        
        document.body.appendChild(rewardsContainer);
        
        // Remover após delay
        setTimeout(() => {
            rewardsContainer.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => {
                rewardsContainer.remove();
            }, 500);
        }, 2000);
    }
}
