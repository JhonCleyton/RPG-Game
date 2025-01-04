from typing import Dict, Optional
from .item import Item

class Equipment(Item):
    def __init__(self, item_id: str, name: str, description: str, 
                 slot: str, stats: Dict[str, int], 
                 sprite_path: Optional[str] = None):
        super().__init__(item_id, name, description, sprite_path)
        self.slot = slot  # weapon, armor, accessory
        self.stats = stats
        self.equipped = False
        
    def equip(self, character) -> bool:
        """Equipa o item no personagem."""
        if not self.equipped:
            # Aplica os stats ao personagem
            for stat, value in self.stats.items():
                if hasattr(character, stat):
                    setattr(character, stat, getattr(character, stat) + value)
            self.equipped = True
            return True
        return False
        
    def unequip(self, character) -> bool:
        """Remove o equipamento do personagem."""
        if self.equipped:
            # Remove os stats do personagem
            for stat, value in self.stats.items():
                if hasattr(character, stat):
                    setattr(character, stat, getattr(character, stat) - value)
            self.equipped = False
            return True
        return False
        
    def use(self, character) -> bool:
        """Tenta equipar o item quando usado."""
        return self.equip(character)
        
    def get_tooltip(self) -> str:
        """Retorna a descrição detalhada do equipamento."""
        tooltip = super().get_tooltip()
        tooltip += f"\nSlot: {self.slot.capitalize()}"
        
        if self.stats:
            tooltip += "\nStats:"
            for stat, value in self.stats.items():
                prefix = "+" if value > 0 else ""
                tooltip += f"\n{prefix}{value} {stat.capitalize()}"
                
        return tooltip

class Weapon(Equipment):
    def __init__(self, item_id: str, name: str, description: str, 
                 slot: str, stats: Dict[str, int], 
                 sprite_path: Optional[str] = None):
        super().__init__(item_id, name, description, slot, stats, sprite_path)
        self.damage_type = 'physical'  # physical, magical, true
        self.range = 1
        self.attack_speed = 1.0
    
    def calculate_damage(self, attacker, target):
        base_damage = self.stats.get('damage', 0)
        if self.damage_type == 'physical':
            damage = base_damage * (1 + attacker.strength / 100)
            damage = damage * (100 / (100 + target.defense))
        elif self.damage_type == 'magical':
            damage = base_damage * (1 + attacker.intelligence / 100)
            damage = damage * (100 / (100 + target.magic_resist))
        else:  # true damage
            damage = base_damage
        return max(1, int(damage))

class Armor(Equipment):
    def __init__(self, item_id: str, name: str, description: str, 
                 slot: str, stats: Dict[str, int], 
                 sprite_path: Optional[str] = None):
        super().__init__(item_id, name, description, slot, stats, sprite_path)
        self.armor_type = 'light'  # light, medium, heavy
    
    def calculate_defense(self, wearer):
        base_defense = self.stats.get('defense', 0)
        if self.armor_type == 'light':
            return base_defense * (1 + wearer.agility / 200)
        elif self.armor_type == 'medium':
            return base_defense * (1 + wearer.strength / 200)
        else:  # heavy
            return base_defense * (1 + wearer.strength / 100)

class Accessory(Equipment):
    def __init__(self, item_id: str, name: str, description: str, 
                 slot: str, stats: Dict[str, int], 
                 sprite_path: Optional[str] = None):
        super().__init__(item_id, name, description, slot, stats, sprite_path)
        self.effects = []  # Special effects granted by the accessory
    
    def update(self, wearer, delta_time):
        # Apply continuous effects
        for effect in self.effects:
            effect.update(wearer, delta_time)
