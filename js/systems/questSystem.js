class QuestSystem {
    constructor(game) {
        this.game = game;
        this.quests = new Map();
        this.activeQuests = new Set();
        this.completedQuests = new Set();
        this.questLog = new QuestLog(this);
        
        // Carregar quests predefinidas
        this.loadQuests();
    }

    loadQuests() {
        // Adicionar quests do jogo
        QuestDatabase.forEach((questData, questId) => {
            this.quests.set(questId, new Quest(questData));
        });
    }

    startQuest(questId) {
        const quest = this.quests.get(questId);
        if (!quest || this.activeQuests.has(questId) || this.completedQuests.has(questId)) {
            return false;
        }

        if (quest.checkPrerequisites(this)) {
            quest.start(this.game);
            this.activeQuests.add(questId);
            this.questLog.update();
            
            // Notificar o jogador
            this.game.ui.showNotification(`Nova missão: ${quest.title}`);
            
            return true;
        }
        
        return false;
    }

    updateQuest(questId, progress) {
        if (!this.activeQuests.has(questId)) return;
        
        const quest = this.quests.get(questId);
        if (quest) {
            quest.updateProgress(progress);
            this.questLog.update();
            
            if (quest.isComplete()) {
                this.completeQuest(questId);
            }
        }
    }

    completeQuest(questId) {
        const quest = this.quests.get(questId);
        if (!quest || !this.activeQuests.has(questId)) return;
        
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        
        // Entregar recompensas
        quest.giveRewards(this.game.player);
        
        // Atualizar UI
        this.questLog.update();
        
        // Notificar o jogador
        this.game.ui.showNotification(`Missão completada: ${quest.title}`);
        
        // Verificar quests dependentes
        this.checkDependentQuests(questId);
    }

    failQuest(questId) {
        const quest = this.quests.get(questId);
        if (!quest || !this.activeQuests.has(questId)) return;
        
        this.activeQuests.delete(questId);
        quest.fail();
        this.questLog.update();
        
        // Notificar o jogador
        this.game.ui.showNotification(`Missão falhou: ${quest.title}`, 'error');
    }

    checkDependentQuests(completedQuestId) {
        this.quests.forEach((quest, questId) => {
            if (!this.activeQuests.has(questId) && !this.completedQuests.has(questId)) {
                if (quest.checkPrerequisites(this)) {
                    // Automaticamente iniciar quests que dependiam desta
                    if (quest.autoStart) {
                        this.startQuest(questId);
                    }
                }
            }
        });
    }

    isQuestActive(questId) {
        return this.activeQuests.has(questId);
    }

    isQuestCompleted(questId) {
        return this.completedQuests.has(questId);
    }

    getQuestProgress(questId) {
        const quest = this.quests.get(questId);
        return quest ? quest.progress : null;
    }

    getActiveQuests() {
        return Array.from(this.activeQuests).map(id => this.quests.get(id));
    }

    getCompletedQuests() {
        return Array.from(this.completedQuests).map(id => this.quests.get(id));
    }

    reset() {
        this.activeQuests.clear();
        this.completedQuests.clear();
        this.quests.forEach(quest => quest.reset());
        this.questLog.update();
    }

    save() {
        return {
            activeQuests: Array.from(this.activeQuests),
            completedQuests: Array.from(this.completedQuests),
            questProgress: Array.from(this.quests.entries()).map(([id, quest]) => ({
                id,
                progress: quest.progress
            }))
        };
    }

    load(data) {
        this.reset();
        
        data.activeQuests.forEach(id => {
            const quest = this.quests.get(id);
            if (quest) {
                this.activeQuests.add(id);
            }
        });
        
        data.completedQuests.forEach(id => {
            this.completedQuests.add(id);
        });
        
        data.questProgress.forEach(({id, progress}) => {
            const quest = this.quests.get(id);
            if (quest) {
                quest.progress = progress;
            }
        });
        
        this.questLog.update();
    }
}

class Quest {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.objectives = data.objectives;
        this.rewards = data.rewards;
        this.prerequisites = data.prerequisites || [];
        this.autoStart = data.autoStart || false;
        this.type = data.type || 'side'; // main, side, daily, etc.
        this.level = data.level || 1;
        
        this.progress = {
            started: false,
            completed: false,
            failed: false,
            objectives: this.objectives.map(obj => ({
                description: obj.description,
                current: 0,
                required: obj.required,
                completed: false
            }))
        };
        
        // Callbacks
        this.onStart = data.onStart;
        this.onComplete = data.onComplete;
        this.onFail = data.onFail;
        this.onProgress = data.onProgress;
    }

    start(game) {
        this.progress.started = true;
        if (this.onStart) {
            this.onStart(game);
        }
    }

    updateProgress(objectiveIndex, amount = 1) {
        const objective = this.progress.objectives[objectiveIndex];
        if (!objective || objective.completed) return;
        
        objective.current = Math.min(objective.current + amount, objective.required);
        objective.completed = objective.current >= objective.required;
        
        if (this.onProgress) {
            this.onProgress(objectiveIndex, objective.current);
        }
    }

    isComplete() {
        return this.progress.objectives.every(obj => obj.completed);
    }

    giveRewards(player) {
        this.rewards.forEach(reward => {
            switch (reward.type) {
                case 'gold':
                    player.addGold(reward.amount);
                    break;
                case 'exp':
                    player.addExperience(reward.amount);
                    break;
                case 'item':
                    player.inventory.addItem(reward.item, reward.amount);
                    break;
                case 'reputation':
                    player.addReputation(reward.faction, reward.amount);
                    break;
            }
        });
        
        if (this.onComplete) {
            this.onComplete(player);
        }
    }

    fail() {
        this.progress.failed = true;
        if (this.onFail) {
            this.onFail();
        }
    }

    reset() {
        this.progress = {
            started: false,
            completed: false,
            failed: false,
            objectives: this.objectives.map(obj => ({
                description: obj.description,
                current: 0,
                required: obj.required,
                completed: false
            }))
        };
    }

    checkPrerequisites(questSystem) {
        return this.prerequisites.every(prereq => {
            switch (prereq.type) {
                case 'quest':
                    return questSystem.isQuestCompleted(prereq.id);
                case 'level':
                    return questSystem.game.player.level >= prereq.level;
                case 'reputation':
                    return questSystem.game.player.getReputation(prereq.faction) >= prereq.amount;
                default:
                    return false;
            }
        });
    }
}

class QuestLog {
    constructor(questSystem) {
        this.questSystem = questSystem;
        this.createUI();
    }

    createUI() {
        // Criar interface do quest log
        this.container = document.createElement('div');
        this.container.className = 'quest-log';
        this.container.style.cssText = `
            position: fixed;
            right: -400px;
            top: 50%;
            transform: translateY(-50%);
            width: 380px;
            max-height: 80vh;
            background: linear-gradient(to bottom, #2c1810, #1a0f0a);
            border: 5px solid #c0a080;
            border-radius: 15px;
            padding: 20px;
            transition: right 0.3s;
            overflow-y: auto;
            color: #e8d5b5;
            font-family: 'MedievalFont', serif;
            z-index: 900;
        `;

        // Título
        const title = document.createElement('h2');
        title.textContent = 'Missões';
        title.style.cssText = `
            color: #daa520;
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #c0a080;
            padding-bottom: 10px;
        `;

        // Lista de quests
        this.questList = document.createElement('div');
        this.questList.className = 'quest-list';

        this.container.appendChild(title);
        this.container.appendChild(this.questList);
        document.body.appendChild(this.container);
    }

    update() {
        this.questList.innerHTML = '';
        
        // Agrupar quests por tipo
        const questGroups = {
            main: [],
            side: [],
            daily: []
        };
        
        // Adicionar quests ativas
        this.questSystem.getActiveQuests().forEach(quest => {
            questGroups[quest.type].push(this.createQuestElement(quest));
        });
        
        // Adicionar grupos ao log
        Object.entries(questGroups).forEach(([type, quests]) => {
            if (quests.length > 0) {
                const groupTitle = document.createElement('h3');
                groupTitle.textContent = this.getGroupTitle(type);
                groupTitle.style.color = this.getGroupColor(type);
                this.questList.appendChild(groupTitle);
                
                quests.forEach(questElement => {
                    this.questList.appendChild(questElement);
                });
            }
        });
    }

    createQuestElement(quest) {
        const element = document.createElement('div');
        element.className = 'quest-entry';
        element.style.cssText = `
            margin-bottom: 15px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
        `;

        const title = document.createElement('h4');
        title.textContent = quest.title;
        title.style.color = '#daa520';

        const description = document.createElement('p');
        description.textContent = quest.description;
        description.style.fontSize = '14px';

        const objectives = document.createElement('ul');
        objectives.style.listStyle = 'none';
        objectives.style.padding = '0';
        
        quest.progress.objectives.forEach(obj => {
            const li = document.createElement('li');
            li.style.cssText = `
                margin: 5px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            const text = document.createElement('span');
            text.textContent = obj.description;
            
            const progress = document.createElement('span');
            progress.textContent = `${obj.current}/${obj.required}`;
            progress.style.color = obj.completed ? '#4CAF50' : '#daa520';
            
            li.appendChild(text);
            li.appendChild(progress);
            objectives.appendChild(li);
        });

        element.appendChild(title);
        element.appendChild(description);
        element.appendChild(objectives);

        return element;
    }

    getGroupTitle(type) {
        switch (type) {
            case 'main': return 'Missões Principais';
            case 'side': return 'Missões Secundárias';
            case 'daily': return 'Missões Diárias';
            default: return 'Outras Missões';
        }
    }

    getGroupColor(type) {
        switch (type) {
            case 'main': return '#ffd700';
            case 'side': return '#c0c0c0';
            case 'daily': return '#87ceeb';
            default: return '#ffffff';
        }
    }

    show() {
        this.container.style.right = '20px';
    }

    hide() {
        this.container.style.right = '-400px';
    }

    toggle() {
        if (this.container.style.right === '20px') {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Banco de Dados de Quests
const QuestDatabase = new Map([
    ['tutorial_quest', {
        id: 'tutorial_quest',
        title: 'Primeiros Passos',
        description: 'Aprenda o básico sobre como jogar.',
        type: 'main',
        level: 1,
        autoStart: true,
        objectives: [
            {
                description: 'Fale com o Velho Sábio',
                required: 1
            },
            {
                description: 'Equipe sua primeira arma',
                required: 1
            },
            {
                description: 'Derrote um boneco de treino',
                required: 1
            }
        ],
        rewards: [
            { type: 'gold', amount: 100 },
            { type: 'exp', amount: 50 },
            { type: 'item', item: 'basic_potion', amount: 3 }
        ]
    }],
    
    ['crystal_quest', {
        id: 'crystal_quest',
        title: 'O Cristal Perdido',
        description: 'Encontre o primeiro fragmento do Cristal de Eldoria.',
        type: 'main',
        level: 2,
        prerequisites: [
            { type: 'quest', id: 'tutorial_quest' }
        ],
        objectives: [
            {
                description: 'Investigue a torre do Velho Sábio',
                required: 1
            },
            {
                description: 'Derrote os inimigos',
                required: 5
            },
            {
                description: 'Recupere o fragmento do cristal',
                required: 1
            }
        ],
        rewards: [
            { type: 'gold', amount: 500 },
            { type: 'exp', amount: 200 },
            { type: 'item', item: 'crystal_fragment', amount: 1 }
        ]
    }]
]);
