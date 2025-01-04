from typing import Dict, Optional, List
from .item import Item

class Effect:
    def __init__(self, stat: str, value: int, duration: float = 0):
        self.stat = stat
        self.value = value
        self.duration = duration  # Em segundos, 0 para efeito instantâneo
        self.remaining_time = duration
        
    def apply(self, target):
        """Aplica o efeito ao alvo."""
        if hasattr(target, self.stat):
            current_value = getattr(target, self.stat)
            setattr(target, self.stat, current_value + self.value)
            
    def remove(self, target):
        """Remove o efeito do alvo."""
        if hasattr(target, self.stat):
            current_value = getattr(target, self.stat)
            setattr(target, self.stat, current_value - self.value)
            
    def update(self, target, delta_time: float) -> bool:
        """Atualiza o efeito. Retorna True se o efeito ainda está ativo."""
        if self.duration > 0:
            self.remaining_time -= delta_time
            return self.remaining_time > 0
        return False

class Consumable(Item):
    def __init__(self, item_id: str, name: str, description: str, 
                 effects: List[Dict], sprite_path: Optional[str] = None):
        super().__init__(item_id, name, description, sprite_path)
        self.effects: List[Effect] = []
        self.stackable = True
        self.max_stack = 99
        
        # Cria os efeitos a partir dos dados
        for effect_data in effects:
            effect = Effect(
                effect_data['stat'],
                effect_data['value'],
                effect_data.get('duration', 0)
            )
            self.effects.append(effect)
            
    def use(self, target) -> bool:
        """Usa o item no alvo, aplicando seus efeitos."""
        if not target:
            return False
            
        # Aplica todos os efeitos
        for effect in self.effects:
            if effect.duration > 0:
                # Adiciona o efeito à lista de efeitos ativos do alvo
                if hasattr(target, 'active_effects'):
                    target.active_effects.append(effect)
            else:
                # Aplica o efeito instantaneamente
                effect.apply(target)
                
        return True
        
    def get_tooltip(self) -> str:
        """Retorna a descrição detalhada do item consumível."""
        tooltip = super().get_tooltip()
        
        if self.effects:
            tooltip += "\nEfeitos:"
            for effect in self.effects:
                prefix = "+" if effect.value > 0 else ""
                effect_text = f"\n{prefix}{effect.value} {effect.stat.capitalize()}"
                if effect.duration > 0:
                    effect_text += f" (por {effect.duration}s)"
                tooltip += effect_text
                
        return tooltip

class HealthPotion(Consumable):
    def __init__(self, item_id: str, name: str, description: str, 
                 heal_amount: int, sprite_path: Optional[str] = None):
        effects = [{'stat': 'health', 'value': heal_amount}]
        super().__init__(item_id, name, description, effects, sprite_path)

class ManaPotion(Consumable):
    def __init__(self, item_id: str, name: str, description: str, 
                 mana_amount: int, sprite_path: Optional[str] = None):
        effects = [{'stat': 'mana', 'value': mana_amount}]
        super().__init__(item_id, name, description, effects, sprite_path)

class StatBoostPotion(Consumable):
    def __init__(self, item_id: str, name: str, description: str, 
                 stat: str, boost_amount: int, duration: float,
                 sprite_path: Optional[str] = None):
        effects = [{'stat': stat, 'value': boost_amount, 'duration': duration}]
        super().__init__(item_id, name, description, effects, sprite_path)
