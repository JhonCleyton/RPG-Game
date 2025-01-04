class QuestSystem {
    constructor(game) {
        this.game = game;
        this.quests = new Map();
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        
        this.loadQuests();
    }

    loadQuests() {
        // Carregar todas as quests disponíveis no jogo
        GameQuests.forEach(quest => {
            this.quests.set(quest.id, quest);
        });
    }

    startQuest(questId) {
        if (this.isQuestActive(questId) || this.isQuestCompleted(questId)) {
            return false;
        }

        const quest = this.quests.get(questId);
        if (!quest) return false;

        // Verificar pré-requisitos
        if (!this.checkPrerequisites(quest)) {
            return false;
        }

        // Iniciar quest
        const activeQuest = new ActiveQuest(quest);
        this.activeQuests.set(questId, activeQuest);
        
        // Notificar o jogador
        this.game.ui.showNotification(`Nova missão: ${quest.title}`);
        
        return true;
    }

    checkPrerequisites(quest) {
        if (!quest.prerequisites) return true;

        return quest.prerequisites.every(prereq => {
            switch(prereq.type) {
                case 'level':
                    return this.game.player.level >= prereq.value;
                case 'quest':
                    return this.isQuestCompleted(prereq.value);
                case 'item':
                    return this.game.player.inventory.hasItem(prereq.value);
                default:
                    return false;
            }
        });
    }

    updateQuest(questId, action, value) {
        const activeQuest = this.activeQuests.get(questId);
        if (!activeQuest) return;

        activeQuest.update(action, value);
        
        // Verificar se a quest foi completada
        if (activeQuest.isComplete()) {
            this.completeQuest(questId);
        }
    }

    completeQuest(questId) {
        const activeQuest = this.activeQuests.get(questId);
        if (!activeQuest) return;

        // Dar recompensas
        this.giveRewards(activeQuest.quest.rewards);
        
        // Mover para quests completadas
        this.completedQuests.add(questId);
        this.activeQuests.delete(questId);
        
        // Notificar o jogador
        this.game.ui.showNotification(`Missão completa: ${activeQuest.quest.title}`);
        
        // Verificar por quests encadeadas
        if (activeQuest.quest.nextQuest) {
            this.startQuest(activeQuest.quest.nextQuest);
        }
    }

    giveRewards(rewards) {
        if (rewards.exp) {
            this.game.player.gainExp(rewards.exp);
        }
        
        if (rewards.gold) {
            this.game.player.gold += rewards.gold;
        }
        
        if (rewards.items) {
            rewards.items.forEach(item => {
                this.game.player.inventory.addItem(item);
            });
        }
    }

    isQuestActive(questId) {
        return this.activeQuests.has(questId);
    }

    isQuestCompleted(questId) {
        return this.completedQuests.has(questId);
    }

    getQuestProgress(questId) {
        const activeQuest = this.activeQuests.get(questId);
        return activeQuest ? activeQuest.progress : null;
    }

    save() {
        return {
            activeQuests: Array.from(this.activeQuests.entries()).map(([id, quest]) => ({
                id,
                progress: quest.progress
            })),
            completedQuests: Array.from(this.completedQuests)
        };
    }

    load(data) {
        this.activeQuests.clear();
        this.completedQuests.clear();
        
        data.activeQuests.forEach(questData => {
            const quest = this.quests.get(questData.id);
            if (quest) {
                const activeQuest = new ActiveQuest(quest);
                activeQuest.progress = questData.progress;
                this.activeQuests.set(questData.id, activeQuest);
            }
        });
        
        data.completedQuests.forEach(questId => {
            this.completedQuests.add(questId);
        });
    }
}

class ActiveQuest {
    constructor(quest) {
        this.quest = quest;
        this.progress = {};
        this.initializeProgress();
    }

    initializeProgress() {
        this.quest.objectives.forEach(objective => {
            this.progress[objective.id] = {
                current: 0,
                required: objective.required,
                completed: false
            };
        });
    }

    update(action, value) {
        this.quest.objectives.forEach(objective => {
            if (objective.action === action) {
                const progress = this.progress[objective.id];
                if (!progress.completed) {
                    progress.current += value;
                    if (progress.current >= progress.required) {
                        progress.completed = true;
                    }
                }
            }
        });
    }

    isComplete() {
        return Object.values(this.progress).every(p => p.completed);
    }
}

// Definição de Quests do Jogo
const GameQuests = [
    {
        id: 'tutorial',
        title: 'Primeiros Passos',
        description: 'Aprenda o básico sobre o jogo.',
        objectives: [
            {
                id: 'move',
                description: 'Mova-se usando WASD',
                action: 'move',
                required: 1
            },
            {
                id: 'talk',
                description: 'Fale com o Velho Sábio',
                action: 'talk',
                required: 1
            }
        ],
        rewards: {
            exp: 100,
            gold: 50,
            items: ['woodenSword']
        }
    },
    {
        id: 'bandits',
        title: 'Problema com Bandidos',
        description: 'Derrote os bandidos que estão aterrorizando a vila.',
        prerequisites: [
            {
                type: 'quest',
                value: 'tutorial'
            },
            {
                type: 'level',
                value: 2
            }
        ],
        objectives: [
            {
                id: 'defeat_bandits',
                description: 'Derrote 5 bandidos',
                action: 'defeat',
                target: 'bandit',
                required: 5
            },
            {
                id: 'find_hideout',
                description: 'Encontre o esconderijo dos bandidos',
                action: 'discover',
                target: 'bandit_hideout',
                required: 1
            }
        ],
        rewards: {
            exp: 300,
            gold: 200,
            items: ['leatherArmor']
        },
        nextQuest: 'bandit_leader'
    }
];

// Sistema de Charadas
class RiddleSystem {
    constructor(game) {
        this.game = game;
        this.currentRiddle = null;
        this.solvedRiddles = new Set();
        this.attempts = 0;
        this.maxAttempts = 3;
    }

    startRiddle(riddleId) {
        if (this.solvedRiddles.has(riddleId)) {
            return false;
        }

        const riddle = GameRiddles[riddleId];
        if (!riddle) return false;

        this.currentRiddle = riddle;
        this.attempts = 0;
        
        // Mostrar a charada
        this.game.dialog.startDialog({
            lines: [
                {
                    speaker: riddle.speaker,
                    text: riddle.question
                }
            ]
        });

        return true;
    }

    checkAnswer(answer) {
        if (!this.currentRiddle) return false;

        this.attempts++;
        
        const isCorrect = this.currentRiddle.checkAnswer(answer);
        
        if (isCorrect) {
            this.solvedRiddles.add(this.currentRiddle.id);
            this.giveRiddleReward(this.currentRiddle);
            this.currentRiddle = null;
            return true;
        }
        
        if (this.attempts >= this.maxAttempts) {
            this.currentRiddle = null;
        }
        
        return false;
    }

    giveRiddleReward(riddle) {
        if (riddle.reward) {
            this.game.player.inventory.addItem(riddle.reward);
        }
    }

    getHint() {
        if (!this.currentRiddle || !this.currentRiddle.hint) return null;
        return this.currentRiddle.hint;
    }
}

// Definição de Charadas do Jogo
const GameRiddles = {
    ancient_door: {
        id: 'ancient_door',
        speaker: 'Porta Antiga',
        question: 'Quanto mais você tira, maior eu fico. O que sou eu?',
        answer: 'buraco',
        hint: 'Pense em algo que cresce quando você remove algo dele...',
        checkAnswer: function(answer) {
            return answer.toLowerCase().trim() === this.answer;
        },
        reward: {
            id: 'ancient_key',
            name: 'Chave Antiga',
            type: 'key',
            description: 'Uma chave misteriosa e antiga'
        }
    },
    wise_tree: {
        id: 'wise_tree',
        speaker: 'Árvore Sábia',
        question: 'Tenho cidades, mas não tenho casas. Tenho montanhas, mas não tenho árvores. Tenho água, mas não tenho peixes. Tenho estradas, mas não tenho carros. O que sou eu?',
        answer: 'mapa',
        hint: 'Sou algo que te ajuda a navegar...',
        checkAnswer: function(answer) {
            return answer.toLowerCase().trim() === this.answer;
        },
        reward: {
            id: 'magic_compass',
            name: 'Bússola Mágica',
            type: 'accessory',
            description: 'Uma bússola que aponta para tesouros próximos'
        }
    }
};
