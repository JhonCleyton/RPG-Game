from typing import Optional
import pygame
from .entity import Entity

class Obstacle(Entity):
    def __init__(self, x: float, y: float, width: int, height: int, 
                 obstacle_type: str, sprite_path: Optional[str] = None,
                 breakable: bool = False, health: int = 1):
        super().__init__(x, y, width, height, sprite_path)
        
        self.type = obstacle_type  # tree, rock, fence, etc.
        self.breakable = breakable
        self.max_health = health
        self.health = health
        self.broken = False
        
    def take_damage(self, amount: int, attacker: Optional[Entity] = None) -> int:
        """Recebe dano se for quebrável."""
        if not self.breakable or self.broken:
            return 0
            
        damage = super().take_damage(amount, attacker)
        
        if self.health <= 0:
            self.break_obstacle()
            
        return damage
        
    def break_obstacle(self):
        """Quebra o obstáculo."""
        self.broken = True
        # Aqui poderia spawnar itens, tocar sons, etc.
        
    def draw(self, screen: pygame.Surface, camera_x: int = 0, camera_y: int = 0):
        """Desenha o obstáculo."""
        if self.broken:
            return
            
        screen_x = self.x - camera_x
        screen_y = self.y - camera_y
        
        if self.sprite:
            screen.blit(self.sprite, (screen_x, screen_y))
        else:
            # Desenha um retângulo como placeholder
            color = (139, 69, 19)  # Marrom para árvores/obstáculos
            pygame.draw.rect(screen, color, 
                           (screen_x, screen_y, self.width, self.height))
            
class Tree(Obstacle):
    def __init__(self, x: float, y: float, sprite_path: Optional[str] = None):
        super().__init__(x, y, 48, 64, "tree", sprite_path, breakable=True, health=3)
        
class Rock(Obstacle):
    def __init__(self, x: float, y: float, sprite_path: Optional[str] = None):
        super().__init__(x, y, 32, 32, "rock", sprite_path, breakable=True, health=5)
        
class Fence(Obstacle):
    def __init__(self, x: float, y: float, sprite_path: Optional[str] = None):
        super().__init__(x, y, 32, 16, "fence", sprite_path, breakable=True, health=2)
        
class Wall(Obstacle):
    def __init__(self, x: float, y: float, sprite_path: Optional[str] = None):
        super().__init__(x, y, 32, 32, "wall", sprite_path, breakable=False)
