import pygame
from typing import Dict, List, Optional, Tuple
import math

class Entity:
    def __init__(self, x: float, y: float, width: int, height: int, sprite_path: Optional[str] = None):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.sprite = None
        self.direction = "down"  # down, up, left, right
        self.moving = False
        self.movement_speed = 5  # Velocidade base de movimento
        
        # Stats básicos
        self.level = 1
        self.max_health = 100
        self.health = self.max_health
        self.max_mana = 50
        self.mana = self.max_mana
        self.strength = 10
        self.defense = 5
        self.magic = 5
        self.speed = 5  # Atributo de velocidade (diferente da velocidade de movimento)
        
        # Efeitos ativos
        self.active_effects: List[Dict] = []
        
        # Retângulo de colisão
        self.collision_rect = pygame.Rect(x, y, width, height)
        
        if sprite_path:
            self.load_sprite(sprite_path)
            
    def load_sprite(self, sprite_path: str):
        """Carrega o sprite da entidade."""
        try:
            self.sprite = pygame.image.load(sprite_path).convert_alpha()
        except Exception as e:
            print(f"Erro ao carregar sprite: {e}")
            # Cria um retângulo colorido como sprite padrão
            self.sprite = pygame.Surface((self.width, self.height))
            self.sprite.fill((255, 0, 0))  # Vermelho para entidades sem sprite
            
    def move(self, dx: float, dy: float, entities: List['Entity']) -> bool:
        """Move a entidade, considerando colisões."""
        if dx == 0 and dy == 0:
            self.moving = False
            return True
            
        # Normaliza o vetor de movimento
        length = math.sqrt(dx * dx + dy * dy)
        if length > 0:
            dx = dx / length
            dy = dy / length
            
        # Calcula nova posição
        new_x = self.x + dx * self.movement_speed
        new_y = self.y + dy * self.movement_speed
        
        # Tenta mover em X e Y separadamente para permitir deslizar ao longo das paredes
        moved = False
        
        # Tenta mover em X
        if dx != 0:
            if not self.check_collision(new_x, self.y, entities):
                self.x = new_x
                moved = True
                
        # Tenta mover em Y
        if dy != 0:
            if not self.check_collision(self.x, new_y, entities):
                self.y = new_y
                moved = True
                
        # Atualiza estado de movimento
        self.moving = moved
        
        # Atualiza direção
        if abs(dx) > abs(dy):
            self.direction = "right" if dx > 0 else "left"
        else:
            self.direction = "down" if dy > 0 else "up"
            
        # Atualiza retângulo de colisão
        self.collision_rect.x = self.x
        self.collision_rect.y = self.y
        
        return moved
        
    def check_collision(self, x: float, y: float, entities: List['Entity']) -> bool:
        """Verifica colisão com outras entidades."""
        # Atualiza temporariamente o retângulo de colisão para a nova posição
        temp_rect = self.collision_rect.copy()
        temp_rect.x = x
        temp_rect.y = y
        
        for entity in entities:
            if entity != self:
                if temp_rect.colliderect(entity.collision_rect):
                    return True
        return False
        
    def get_distance_to(self, other: 'Entity') -> float:
        """Calcula a distância até outra entidade."""
        dx = other.x - self.x
        dy = other.y - self.y
        return math.sqrt(dx * dx + dy * dy)
        
    def is_alive(self) -> bool:
        """Verifica se a entidade está viva."""
        return self.health > 0
        
    def take_damage(self, amount: int, attacker: Optional['Entity'] = None) -> int:
        """Recebe dano de um atacante."""
        if not self.is_alive():
            return 0
            
        # Aplica defesa
        damage = max(1, amount - self.defense)
        self.health = max(0, self.health - damage)
        
        if not self.is_alive():
            self.die()
            
        return damage
        
    def heal(self, amount: int) -> int:
        """Recupera vida."""
        if not self.is_alive():
            return 0
            
        old_health = self.health
        self.health = min(self.max_health, self.health + amount)
        return self.health - old_health
        
    def use_mana(self, amount: int) -> bool:
        """Usa mana. Retorna True se tinha mana suficiente."""
        if self.mana >= amount:
            self.mana -= amount
            return True
        return False
        
    def restore_mana(self, amount: int) -> int:
        """Recupera mana."""
        old_mana = self.mana
        self.mana = min(self.max_mana, self.mana + amount)
        return self.mana - old_mana
        
    def update(self, delta_time: float):
        """Atualiza a entidade."""
        # Atualiza efeitos ativos
        for effect in self.active_effects[:]:  # Copia a lista para permitir remoção
            effect['duration'] -= delta_time
            if effect['duration'] <= 0:
                self.active_effects.remove(effect)
                
    def draw(self, screen: pygame.Surface, camera_x: int = 0, camera_y: int = 0):
        """Desenha a entidade na tela."""
        if self.sprite:
            screen.blit(self.sprite, (self.x - camera_x, self.y - camera_y))
        else:
            # Desenha um retângulo se não tiver sprite
            pygame.draw.rect(screen, (255, 0, 0), 
                           (self.x - camera_x, self.y - camera_y, self.width, self.height))
            
    def die(self):
        """Chamado quando a entidade morre."""
        pass
