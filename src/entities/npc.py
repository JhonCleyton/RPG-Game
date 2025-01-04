from typing import Optional, Dict, List
import pygame
from .entity import Entity

class NPC(Entity):
    def __init__(self, x: float, y: float, width: int, height: int, 
                 npc_data: Dict, sprite_path: Optional[str] = None):
        super().__init__(x, y, width, height, sprite_path)
        
        # Dados básicos do NPC
        self.name = npc_data.get('name', 'Unknown NPC')
        self.role = npc_data.get('role', 'villager')  # merchant, quest_giver, etc
        self.dialog_id = npc_data.get('dialog_id', None)
        self.shop_items = npc_data.get('shop_items', [])
        self.available_quests = npc_data.get('quests', [])
        
        # Estado do NPC
        self.current_dialog = None
        self.interaction_range = 50
        self.facing_direction = 'down'
        self.movement_pattern = npc_data.get('movement_pattern', 'static')
        self.waypoints = npc_data.get('waypoints', [])
        self.current_waypoint = 0
        self.wait_time = 0
        
    def can_interact(self, player: Entity) -> bool:
        """Verifica se o jogador está próximo o suficiente para interagir."""
        return self.get_distance_to(player) <= self.interaction_range
        
    def interact(self, player: Entity, dialog_system=None) -> bool:
        """Interage com o jogador."""
        if not self.can_interact(player):
            return False
            
        # Se for um comerciante, abre a loja
        if self.role == 'merchant' and self.shop_items:
            return self.open_shop(player)
            
        # Se tiver diálogos disponíveis
        elif self.dialog_id and dialog_system:
            return dialog_system.start_dialog(self.dialog_id, self, player)
            
        return False
        
    def open_shop(self, player: Entity) -> bool:
        """Abre a interface da loja."""
        # Será implementado pelo sistema de UI
        return True
        
    def update(self, delta_time: float, entities: List[Entity]):
        """Atualiza o NPC."""
        super().update(delta_time)
        
        if self.movement_pattern == 'static':
            return
            
        # Atualiza o tempo de espera
        if self.wait_time > 0:
            self.wait_time -= delta_time
            return
            
        # Move para o próximo waypoint
        if self.waypoints:
            target = self.waypoints[self.current_waypoint]
            dx = target[0] - self.x
            dy = target[1] - self.y
            
            # Se chegou ao waypoint
            if abs(dx) < 5 and abs(dy) < 5:
                self.current_waypoint = (self.current_waypoint + 1) % len(self.waypoints)
                self.wait_time = 2.0  # Espera 2 segundos antes de continuar
                return
                
            # Move em direção ao waypoint
            length = (dx * dx + dy * dy) ** 0.5
            if length > 0:
                dx = dx / length
                dy = dy / length
                self.move(dx, dy, entities)
                
    def draw(self, screen: pygame.Surface, camera_x: int = 0, camera_y: int = 0):
        """Desenha o NPC e seu nome."""
        super().draw(screen, camera_x, camera_y)
        
        # Desenha o nome do NPC
        if hasattr(pygame.font, 'Font'):
            font = pygame.font.Font(None, 24)
            text = font.render(self.name, True, (255, 255, 255))
            text_rect = text.get_rect()
            text_rect.centerx = self.x - camera_x + self.width // 2
            text_rect.bottom = self.y - camera_y - 5
            screen.blit(text, text_rect)
            
        # Desenha um ícone de interação se tiver diálogo ou for comerciante
        if self.dialog_id or self.role == 'merchant':
            icon_color = (255, 255, 0)  # Amarelo para diálogo
            if self.role == 'merchant':
                icon_color = (0, 255, 0)  # Verde para comerciante
                
            pygame.draw.polygon(screen, icon_color, [
                (self.x - camera_x + self.width // 2, self.y - camera_y - 25),
                (self.x - camera_x + self.width // 2 - 5, self.y - camera_y - 35),
                (self.x - camera_x + self.width // 2 + 5, self.y - camera_y - 35)
            ])
