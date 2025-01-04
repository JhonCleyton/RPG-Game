class InventorySystem {
    constructor(game) {
        this.game = game;
        this.items = new Map();
        this.maxSlots = 50;
        this.gold = 0;
        
        // Equipamento
        this.equipment = {
            weapon: null,
            armor: null,
            accessory1: null,
            accessory2: null
        };
        
        // Interface
        this.ui = new InventoryUI(this);
        
        // Carregar banco de dados de itens
        this.loadItems();
    }

    loadItems() {
        // Carregar itens do banco de dados
        ItemDatabase.forEach((itemData, itemId) => {
            this.items.set(itemId, new Item(itemData));
        });
    }

    addItem(itemId, quantity = 1) {
        const item = this.items.get(itemId);
        if (!item) return false;
        
        // Verificar espaço no inventário
        if (this.getUsedSlots() + quantity > this.maxSlots) {
            this.game.ui.showMessage('Inventário cheio!');
            return false;
        }
        
        // Adicionar item
        if (item.stackable) {
            const existingStack = Array.from(this.items.values())
                .find(i => i.id === itemId && i.quantity < i.maxStack);
            
            if (existingStack) {
                const spaceInStack = existingStack.maxStack - existingStack.quantity;
                const amountToAdd = Math.min(quantity, spaceInStack);
                
                existingStack.quantity += amountToAdd;
                quantity -= amountToAdd;
                
                if (quantity <= 0) {
                    this.ui.update();
                    return true;
                }
            }
        }
        
        // Criar nova pilha
        const newItem = new Item({
            ...item,
            quantity: Math.min(quantity, item.maxStack)
        });
        
        this.items.set(this.getNextEmptySlot(), newItem);
        this.ui.update();
        
        return true;
    }

    removeItem(slot, quantity = 1) {
        const item = this.items.get(slot);
        if (!item) return false;
        
        if (item.quantity <= quantity) {
            this.items.delete(slot);
        } else {
            item.quantity -= quantity;
        }
        
        this.ui.update();
        return true;
    }

    useItem(slot) {
        const item = this.items.get(slot);
        if (!item || !item.usable) return false;
        
        // Verificar condições de uso
        if (!this.canUseItem(item)) {
            this.game.ui.showMessage('Não pode usar este item agora!');
            return false;
        }
        
        // Aplicar efeitos do item
        const success = item.use(this.game.player);
        
        if (success) {
            // Remover item após uso
            this.removeItem(slot, 1);
            
            // Efeitos sonoros e visuais
            this.game.soundSystem.playSound(item.useSound || 'item_use');
            this.game.particleSystem.playEffect(item.useEffect || 'item_sparkle');
            
            return true;
        }
        
        return false;
    }

    canUseItem(item) {
        // Verificar condições específicas
        switch (item.type) {
            case 'potion':
                return this.game.player.stats.hp < this.game.player.stats.maxHp;
            case 'scroll':
                return !this.game.combatSystem.active;
            default:
                return true;
        }
    }

    equipItem(slot) {
        const item = this.items.get(slot);
        if (!item || !item.equippable) return false;
        
        // Desequipar item atual
        const currentEquipped = this.equipment[item.equipSlot];
        if (currentEquipped) {
            this.unequipItem(item.equipSlot);
        }
        
        // Equipar novo item
        this.equipment[item.equipSlot] = item;
        this.items.delete(slot);
        
        // Aplicar status do item
        this.applyEquipmentStats(item);
        
        // Atualizar UI
        this.ui.update();
        
        // Efeitos
        this.game.soundSystem.playSound('equip');
        this.game.particleSystem.playEffect('equip_flash');
        
        return true;
    }

    unequipItem(slot) {
        const item = this.equipment[slot];
        if (!item) return false;
        
        // Verificar espaço no inventário
        if (this.getUsedSlots() >= this.maxSlots) {
            this.game.ui.showMessage('Inventário cheio!');
            return false;
        }
        
        // Remover status do item
        this.removeEquipmentStats(item);
        
        // Mover para inventário
        this.equipment[slot] = null;
        this.items.set(this.getNextEmptySlot(), item);
        
        // Atualizar UI
        this.ui.update();
        
        // Efeitos
        this.game.soundSystem.playSound('unequip');
        
        return true;
    }

    applyEquipmentStats(item) {
        Object.entries(item.stats).forEach(([stat, value]) => {
            this.game.player.addEquipmentBonus(stat, value);
        });
    }

    removeEquipmentStats(item) {
        Object.entries(item.stats).forEach(([stat, value]) => {
            this.game.player.removeEquipmentBonus(stat, value);
        });
    }

    getNextEmptySlot() {
        for (let i = 0; i < this.maxSlots; i++) {
            if (!this.items.has(i)) return i;
        }
        return null;
    }

    getUsedSlots() {
        return this.items.size;
    }

    addGold(amount) {
        this.gold += amount;
        this.ui.update();
    }

    removeGold(amount) {
        if (this.gold < amount) return false;
        this.gold -= amount;
        this.ui.update();
        return true;
    }

    save() {
        return {
            items: Array.from(this.items.entries()).map(([slot, item]) => ({
                slot,
                id: item.id,
                quantity: item.quantity
            })),
            equipment: Object.entries(this.equipment)
                .filter(([_, item]) => item !== null)
                .map(([slot, item]) => ({
                    slot,
                    id: item.id
                })),
            gold: this.gold
        };
    }

    load(data) {
        // Limpar inventário atual
        this.items.clear();
        Object.keys(this.equipment).forEach(slot => {
            this.equipment[slot] = null;
        });
        
        // Carregar itens
        data.items.forEach(({slot, id, quantity}) => {
            const item = new Item({
                ...ItemDatabase.get(id),
                quantity
            });
            this.items.set(slot, item);
        });
        
        // Carregar equipamento
        data.equipment.forEach(({slot, id}) => {
            const item = new Item(ItemDatabase.get(id));
            this.equipment[slot] = item;
        });
        
        // Carregar gold
        this.gold = data.gold;
        
        // Atualizar UI
        this.ui.update();
    }
}

class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.type = data.type;
        this.rarity = data.rarity || 'common';
        this.icon = data.icon;
        
        // Propriedades de stack
        this.stackable = data.stackable || false;
        this.quantity = data.quantity || 1;
        this.maxStack = data.maxStack || 99;
        
        // Propriedades de equipamento
        this.equippable = data.equippable || false;
        this.equipSlot = data.equipSlot;
        this.stats = data.stats || {};
        
        // Propriedades de uso
        this.usable = data.usable || false;
        this.useEffect = data.useEffect;
        this.useSound = data.useSound;
        
        // Valor
        this.value = data.value || 0;
    }

    use(target) {
        if (!this.usable) return false;
        
        switch (this.type) {
            case 'potion':
                return this.usePotion(target);
            case 'scroll':
                return this.useScroll(target);
            default:
                return false;
        }
    }

    usePotion(target) {
        switch (this.id) {
            case 'health_potion':
                target.heal(50);
                return true;
            case 'mana_potion':
                target.restoreMana(30);
                return true;
            default:
                return false;
        }
    }

    useScroll(target) {
        switch (this.id) {
            case 'teleport_scroll':
                // Implementar teleporte
                return true;
            case 'identify_scroll':
                // Implementar identificação
                return true;
            default:
                return false;
        }
    }

    getTooltip() {
        let tooltip = `${this.name}\n${this.description}`;
        
        if (this.equippable) {
            tooltip += '\n\nStatus:';
            Object.entries(this.stats).forEach(([stat, value]) => {
                tooltip += `\n${stat}: ${value > 0 ? '+' : ''}${value}`;
            });
        }
        
        if (this.value > 0) {
            tooltip += `\n\nValor: ${this.value} gold`;
        }
        
        return tooltip;
    }
}

class InventoryUI {
    constructor(inventory) {
        this.inventory = inventory;
        this.createUI();
    }

    createUI() {
        // Container principal
        this.container = document.createElement('div');
        this.container.className = 'inventory-container';
        this.container.style.cssText = `
            position: fixed;
            right: -400px;
            top: 50%;
            transform: translateY(-50%);
            width: 380px;
            height: 600px;
            background: linear-gradient(to bottom, #2c1810, #1a0f0a);
            border: 5px solid #c0a080;
            border-radius: 15px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            transition: right 0.3s;
            z-index: 1000;
        `;

        // Cabeçalho
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 2px solid #c0a080;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Inventário';
        title.style.cssText = `
            color: #daa520;
            margin: 0;
        `;

        this.goldDisplay = document.createElement('div');
        this.goldDisplay.style.cssText = `
            color: #ffd700;
            font-size: 18px;
        `;

        header.appendChild(title);
        header.appendChild(this.goldDisplay);

        // Grade de equipamento
        this.equipmentGrid = document.createElement('div');
        this.equipmentGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
        `;

        // Grade de itens
        this.itemGrid = document.createElement('div');
        this.itemGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 5px;
            flex-grow: 1;
            overflow-y: auto;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
        `;

        // Adicionar elementos ao container
        this.container.appendChild(header);
        this.container.appendChild(this.equipmentGrid);
        this.container.appendChild(this.itemGrid);
        document.body.appendChild(this.container);

        // Criar slots
        this.createEquipmentSlots();
        this.createItemSlots();
    }

    createEquipmentSlots() {
        const slots = ['weapon', 'armor', 'accessory1', 'accessory2'];
        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'equipment-slot';
            slotElement.dataset.slot = slot;
            slotElement.style.cssText = `
                width: 60px;
                height: 60px;
                border: 2px solid #c0a080;
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
            `;
            
            const icon = document.createElement('div');
            icon.className = 'slot-icon';
            icon.style.cssText = `
                width: 32px;
                height: 32px;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            `;
            
            slotElement.appendChild(icon);
            this.equipmentGrid.appendChild(slotElement);
            
            // Eventos
            this.setupSlotEvents(slotElement, true);
        });
    }

    createItemSlots() {
        for (let i = 0; i < this.inventory.maxSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            slot.style.cssText = `
                width: 50px;
                height: 50px;
                border: 2px solid #8b4513;
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                cursor: pointer;
            `;
            
            const icon = document.createElement('div');
            icon.className = 'slot-icon';
            icon.style.cssText = `
                width: 32px;
                height: 32px;
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            `;
            
            const quantity = document.createElement('div');
            quantity.className = 'slot-quantity';
            quantity.style.cssText = `
                position: absolute;
                bottom: 2px;
                right: 2px;
                font-size: 12px;
                color: white;
                background: rgba(0, 0, 0, 0.7);
                padding: 1px 4px;
                border-radius: 4px;
                display: none;
            `;
            
            slot.appendChild(icon);
            slot.appendChild(quantity);
            this.itemGrid.appendChild(slot);
            
            // Eventos
            this.setupSlotEvents(slot, false);
        }
    }

    setupSlotEvents(slot, isEquipment) {
        // Mouse enter - mostrar tooltip
        slot.addEventListener('mouseenter', () => {
            const item = isEquipment
                ? this.inventory.equipment[slot.dataset.slot]
                : this.inventory.items.get(parseInt(slot.dataset.slot));
            
            if (item) {
                this.showTooltip(item, slot);
            }
        });
        
        // Mouse leave - esconder tooltip
        slot.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        // Click - usar/equipar item
        slot.addEventListener('click', () => {
            if (isEquipment) {
                this.inventory.unequipItem(slot.dataset.slot);
            } else {
                const item = this.inventory.items.get(parseInt(slot.dataset.slot));
                if (item) {
                    if (item.equippable) {
                        this.inventory.equipItem(parseInt(slot.dataset.slot));
                    } else if (item.usable) {
                        this.inventory.useItem(parseInt(slot.dataset.slot));
                    }
                }
            }
        });
    }

    showTooltip(item, slot) {
        const tooltip = document.createElement('div');
        tooltip.className = 'item-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #c0a080;
            border-radius: 8px;
            padding: 10px;
            color: white;
            font-size: 14px;
            pointer-events: none;
            z-index: 1100;
            max-width: 200px;
            white-space: pre-wrap;
        `;
        
        tooltip.textContent = item.getTooltip();
        
        const rect = slot.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;
        
        document.body.appendChild(tooltip);
    }

    hideTooltip() {
        const tooltip = document.querySelector('.item-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    update() {
        // Atualizar gold
        this.goldDisplay.textContent = `${this.inventory.gold} G`;
        
        // Atualizar slots de equipamento
        const equipmentSlots = this.equipmentGrid.querySelectorAll('.equipment-slot');
        equipmentSlots.forEach(slot => {
            const item = this.inventory.equipment[slot.dataset.slot];
            const icon = slot.querySelector('.slot-icon');
            
            if (item) {
                icon.style.backgroundImage = `url(${item.icon})`;
            } else {
                icon.style.backgroundImage = 'none';
            }
        });
        
        // Atualizar slots de inventário
        const itemSlots = this.itemGrid.querySelectorAll('.inventory-slot');
        itemSlots.forEach(slot => {
            const item = this.inventory.items.get(parseInt(slot.dataset.slot));
            const icon = slot.querySelector('.slot-icon');
            const quantity = slot.querySelector('.slot-quantity');
            
            if (item) {
                icon.style.backgroundImage = `url(${item.icon})`;
                if (item.stackable && item.quantity > 1) {
                    quantity.textContent = item.quantity;
                    quantity.style.display = 'block';
                } else {
                    quantity.style.display = 'none';
                }
            } else {
                icon.style.backgroundImage = 'none';
                quantity.style.display = 'none';
            }
        });
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

// Banco de Dados de Itens
const ItemDatabase = new Map([
    ['health_potion', {
        id: 'health_potion',
        name: 'Poção de Vida',
        description: 'Restaura 50 pontos de vida.',
        type: 'potion',
        icon: 'assets/items/health_potion.png',
        stackable: true,
        maxStack: 99,
        usable: true,
        value: 50
    }],
    
    ['iron_sword', {
        id: 'iron_sword',
        name: 'Espada de Ferro',
        description: 'Uma espada básica mas confiável.',
        type: 'weapon',
        icon: 'assets/items/iron_sword.png',
        equippable: true,
        equipSlot: 'weapon',
        stats: {
            attack: 5,
            speed: 2
        },
        value: 100
    }],
    
    ['leather_armor', {
        id: 'leather_armor',
        name: 'Armadura de Couro',
        description: 'Oferece proteção básica.',
        type: 'armor',
        icon: 'assets/items/leather_armor.png',
        equippable: true,
        equipSlot: 'armor',
        stats: {
            defense: 3,
            speed: 1
        },
        value: 80
    }]
]);
