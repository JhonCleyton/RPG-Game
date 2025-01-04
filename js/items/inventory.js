class Inventory {
    constructor(maxSize = 20) {
        this.items = [];
        this.maxSize = maxSize;
        this.gold = 0;
        this.equipped = {
            weapon: null,
            armor: null,
            accessory: null
        };
    }

    addItem(item) {
        if (this.items.length >= this.maxSize) {
            return false;
        }

        // Se o item é empilhável e já existe no inventário
        if (item.stackable) {
            const existingItem = this.items.find(i => i.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
                return true;
            }
        }

        this.items.push(item);
        return true;
    }

    removeItem(item, quantity = 1) {
        const index = this.items.findIndex(i => i.id === item.id);
        if (index === -1) return false;

        if (this.items[index].stackable) {
            this.items[index].quantity -= quantity;
            if (this.items[index].quantity <= 0) {
                this.items.splice(index, 1);
            }
        } else {
            this.items.splice(index, 1);
        }

        return true;
    }

    useItem(item, target) {
        if (!this.hasItem(item)) return false;

        const success = item.use(target);
        if (success) {
            this.removeItem(item);
        }
        return success;
    }

    hasItem(item) {
        return this.items.some(i => i.id === item.id);
    }

    equipItem(item) {
        if (!this.hasItem(item)) return false;

        const slot = item.type;
        if (!this.equipped.hasOwnProperty(slot)) return false;

        // Desequipar item atual
        if (this.equipped[slot]) {
            this.unequipItem(slot);
        }

        // Equipar novo item
        this.equipped[slot] = item;
        this.removeItem(item);

        return true;
    }

    unequipItem(slot) {
        if (!this.equipped[slot]) return false;

        const item = this.equipped[slot];
        if (this.addItem(item)) {
            this.equipped[slot] = null;
            return true;
        }

        return false;
    }

    getEquippedStats() {
        let stats = {
            attack: 0,
            defense: 0,
            magic: 0,
            speed: 0
        };

        // Somar stats de todos os itens equipados
        Object.values(this.equipped).forEach(item => {
            if (item) {
                Object.keys(stats).forEach(stat => {
                    if (item.stats && item.stats[stat]) {
                        stats[stat] += item.stats[stat];
                    }
                });
            }
        });

        return stats;
    }

    sort() {
        this.items.sort((a, b) => {
            // Primeiro por tipo
            if (a.type !== b.type) {
                return a.type.localeCompare(b.type);
            }
            // Depois por raridade
            if (a.rarity !== b.rarity) {
                return b.rarity - a.rarity;
            }
            // Por fim, por nome
            return a.name.localeCompare(b.name);
        });
    }

    getItemsByType(type) {
        return this.items.filter(item => item.type === type);
    }

    isFull() {
        return this.items.length >= this.maxSize;
    }

    clear() {
        this.items = [];
        this.equipped = {
            weapon: null,
            armor: null,
            accessory: null
        };
    }
}

class Item {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.type = config.type;
        this.description = config.description;
        this.rarity = config.rarity || 1;
        this.value = config.value || 0;
        this.stackable = config.stackable || false;
        this.quantity = config.quantity || 1;
        this.icon = config.icon;
        this.usable = config.usable || false;
        this.stats = config.stats || {};
    }

    use(target) {
        if (!this.usable) return false;
        return true;
    }

    getDescription() {
        let desc = this.description;
        
        // Adicionar informações de stats se existirem
        if (Object.keys(this.stats).length > 0) {
            desc += '\n\nAtributos:';
            for (let [stat, value] of Object.entries(this.stats)) {
                desc += `\n${stat}: ${value > 0 ? '+' : ''}${value}`;
            }
        }

        return desc;
    }
}

class ConsumableItem extends Item {
    constructor(config) {
        super({...config, type: 'consumable', usable: true});
        this.effect = config.effect;
        this.power = config.power || 0;
    }

    use(target) {
        if (!target) return false;

        switch(this.effect) {
            case 'heal':
                target.hp = Math.min(target.maxHp, target.hp + this.power);
                break;
            case 'mana':
                target.mp = Math.min(target.maxMp, target.mp + this.power);
                break;
            case 'status':
                target.removeStatusEffect(this.statusEffect);
                break;
            default:
                return false;
        }

        return true;
    }
}

class EquipmentItem extends Item {
    constructor(config) {
        super({...config, stackable: false});
        this.durability = config.durability || 100;
        this.maxDurability = config.durability || 100;
        this.requirements = config.requirements || {};
    }

    canEquip(character) {
        // Verificar requisitos de nível, classe, etc.
        for (let [req, value] of Object.entries(this.requirements)) {
            if (character[req] < value) return false;
        }
        return true;
    }

    repair() {
        this.durability = this.maxDurability;
    }

    takeDamage(amount) {
        this.durability = Math.max(0, this.durability - amount);
        return this.durability > 0;
    }
}

class WeaponItem extends EquipmentItem {
    constructor(config) {
        super({...config, type: 'weapon'});
        this.damageType = config.damageType || 'physical';
        this.range = config.range || 1;
    }
}

class ArmorItem extends EquipmentItem {
    constructor(config) {
        super({...config, type: 'armor'});
        this.armorType = config.armorType || 'light';
    }
}

class QuestItem extends Item {
    constructor(config) {
        super({...config, type: 'quest', stackable: false});
        this.questId = config.questId;
    }
}

// Definir itens do jogo
const GameItems = {
    // Consumíveis
    healthPotion: {
        id: 'healthPotion',
        name: 'Poção de Vida',
        description: 'Restaura 50 pontos de vida',
        icon: 'potion_red.png',
        effect: 'heal',
        power: 50,
        value: 50,
        stackable: true
    },
    manaPotion: {
        id: 'manaPotion',
        name: 'Poção de Mana',
        description: 'Restaura 30 pontos de mana',
        icon: 'potion_blue.png',
        effect: 'mana',
        power: 30,
        value: 40,
        stackable: true
    },

    // Armas
    woodenSword: {
        id: 'woodenSword',
        name: 'Espada de Madeira',
        description: 'Uma espada básica de madeira',
        type: 'weapon',
        icon: 'sword_wooden.png',
        stats: {
            attack: 5
        },
        value: 100
    },
    
    // Armaduras
    leatherArmor: {
        id: 'leatherArmor',
        name: 'Armadura de Couro',
        description: 'Armadura básica de couro',
        type: 'armor',
        icon: 'armor_leather.png',
        stats: {
            defense: 3
        },
        value: 150
    }
};
