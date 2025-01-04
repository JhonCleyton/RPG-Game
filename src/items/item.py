from typing import Dict, Optional
import pygame

class Item:
    def __init__(self, item_id: str, name: str, description: str, sprite_path: Optional[str] = None):
        self.id = item_id
        self.name = name
        self.description = description
        self.sprite = None
        self.max_stack = 1
        self.stackable = False
        
        if sprite_path:
            self.load_sprite(sprite_path)
            
    def load_sprite(self, sprite_path: str):
        """Carrega o sprite do item."""
        try:
            self.sprite = pygame.image.load(sprite_path).convert_alpha()
        except Exception as e:
            print(f"Erro ao carregar sprite do item {self.name}: {e}")
            
    def use(self, target) -> bool:
        """Função base para usar o item. Deve ser sobrescrita pelas subclasses."""
        return False
    
    def can_use(self, user):
        # Override in subclasses
        return True
    
    def render(self, screen, x, y):
        screen.blit(self.sprite, (x, y))
    
    def get_tooltip(self):
        tooltip = f"{self.name}\n{self.description}"
        if hasattr(self, 'stats') and self.stats:
            tooltip += "\n\nStats:"
            for stat, value in self.stats.items():
                if value > 0:
                    tooltip += f"\n+{value} {stat}"
                else:
                    tooltip += f"\n{value} {stat}"
        return tooltip
