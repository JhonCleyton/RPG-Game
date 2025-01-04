// Sistema de Habilidades e Magias
class AbilitySystem {
    constructor(game) {
        this.game = game;
        this.abilities = new Map();
        this.loadAbilities();
    }

    loadAbilities() {
        // Carregar todas as habilidades
        Object.entries(GameAbilities).forEach(([id, ability]) => {
            this.abilities.set(id, ability);
        });
    }

    getAbility(id) {
        return this.abilities.get(id);
    }
}

// Definição de Habilidades
const GameAbilities = {
    // Habilidades do Guerreiro
    slash: {
        id: 'slash',
        name: 'Golpe Cortante',
        type: 'physical',
        power: 30,
        mpCost: 10,
        description: 'Um golpe poderoso que causa dano físico.',
        animation: 'slash_effect',
        level: 1
    },
    whirlwind: {
        id: 'whirlwind',
        name: 'Redemoinho',
        type: 'physical',
        power: 45,
        mpCost: 25,
        description: 'Ataca todos os inimigos com um giro poderoso.',
        animation: 'whirlwind_effect',
        level: 5,
        areaEffect: true
    },
    shield_bash: {
        id: 'shield_bash',
        name: 'Investida com Escudo',
        type: 'physical',
        power: 20,
        mpCost: 15,
        description: 'Atordoa o inimigo por 2 turnos.',
        animation: 'shield_effect',
        level: 3,
        statusEffect: {
            type: 'stun',
            duration: 2
        }
    },

    // Habilidades do Mago
    fireball: {
        id: 'fireball',
        name: 'Bola de Fogo',
        type: 'magic',
        element: 'fire',
        power: 40,
        mpCost: 20,
        description: 'Lança uma poderosa bola de fogo.',
        animation: 'fire_effect',
        level: 1
    },
    ice_storm: {
        id: 'ice_storm',
        name: 'Tempestade de Gelo',
        type: 'magic',
        element: 'ice',
        power: 35,
        mpCost: 30,
        description: 'Causa dano de gelo e reduz a velocidade dos inimigos.',
        animation: 'ice_effect',
        level: 5,
        areaEffect: true,
        statusEffect: {
            type: 'slow',
            duration: 3
        }
    },
    thunder: {
        id: 'thunder',
        name: 'Trovão',
        type: 'magic',
        element: 'lightning',
        power: 50,
        mpCost: 35,
        description: 'Invoca um poderoso raio do céu.',
        animation: 'thunder_effect',
        level: 8
    },
    heal: {
        id: 'heal',
        name: 'Cura',
        type: 'magic',
        element: 'light',
        power: 40,
        mpCost: 25,
        description: 'Restaura HP de um aliado.',
        animation: 'heal_effect',
        level: 3,
        healing: true
    },

    // Habilidades do Arqueiro
    precise_shot: {
        id: 'precise_shot',
        name: 'Tiro Preciso',
        type: 'physical',
        power: 35,
        mpCost: 15,
        description: 'Um tiro com alta chance de acerto crítico.',
        animation: 'arrow_effect',
        level: 1,
        critBonus: 25
    },
    multishot: {
        id: 'multishot',
        name: 'Disparo Múltiplo',
        type: 'physical',
        power: 20,
        mpCost: 25,
        description: 'Atira várias flechas de uma vez.',
        animation: 'multishot_effect',
        level: 5,
        hits: 3
    },
    poison_arrow: {
        id: 'poison_arrow',
        name: 'Flecha Envenenada',
        type: 'physical',
        power: 25,
        mpCost: 20,
        description: 'Causa dano ao longo do tempo.',
        animation: 'poison_effect',
        level: 3,
        statusEffect: {
            type: 'poison',
            duration: 4,
            damage: 10
        }
    },

    // Habilidades Especiais (Desbloqueadas em Eventos)
    dragon_rage: {
        id: 'dragon_rage',
        name: 'Fúria do Dragão',
        type: 'special',
        power: 100,
        mpCost: 50,
        description: 'Um ataque devastador com o poder dos dragões.',
        animation: 'dragon_effect',
        level: 15,
        requirement: 'dragon_scale'
    },
    ancient_magic: {
        id: 'ancient_magic',
        name: 'Magia Antiga',
        type: 'special',
        power: 120,
        mpCost: 60,
        description: 'Uma magia poderosa dos tempos antigos.',
        animation: 'ancient_effect',
        level: 20,
        requirement: 'ancient_tome'
    }
};

// Sistema de Elementos e Fraquezas
const ElementalSystem = {
    elements: ['fire', 'ice', 'lightning', 'earth', 'wind', 'light', 'dark'],
    
    weaknesses: {
        fire: 'ice',
        ice: 'fire',
        lightning: 'earth',
        earth: 'wind',
        wind: 'lightning',
        light: 'dark',
        dark: 'light'
    },
    
    getMultiplier(attackElement, targetElement) {
        if (this.weaknesses[targetElement] === attackElement) {
            return 1.5; // Dano aumentado contra fraqueza
        }
        if (this.weaknesses[attackElement] === targetElement) {
            return 0.5; // Dano reduzido contra resistência
        }
        return 1.0; // Dano normal
    }
};

// Sistema de Status Effects
const StatusEffects = {
    poison: {
        name: 'Envenenado',
        type: 'negative',
        onTurn: (target) => {
            target.hp -= target.maxHp * 0.1;
        }
    },
    burn: {
        name: 'Queimando',
        type: 'negative',
        onTurn: (target) => {
            target.hp -= 15;
        }
    },
    stun: {
        name: 'Atordoado',
        type: 'negative',
        onTurn: (target) => {
            target.canAct = false;
        }
    },
    slow: {
        name: 'Lento',
        type: 'negative',
        onStart: (target) => {
            target.speed *= 0.5;
        },
        onEnd: (target) => {
            target.speed *= 2;
        }
    },
    haste: {
        name: 'Acelerado',
        type: 'positive',
        onStart: (target) => {
            target.speed *= 2;
        },
        onEnd: (target) => {
            target.speed *= 0.5;
        }
    },
    protect: {
        name: 'Protegido',
        type: 'positive',
        onStart: (target) => {
            target.defense *= 1.5;
        },
        onEnd: (target) => {
            target.defense /= 1.5;
        }
    },
    regen: {
        name: 'Regenerando',
        type: 'positive',
        onTurn: (target) => {
            target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.05);
        }
    }
};
