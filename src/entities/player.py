from typing import Optional, Dict, List
import pygame
from .entity import Entity

class Player(Entity):
    def __init__(self, x: float, y: float, width: int, height: int, 
                 sprite_path: Optional[str] = None):
        super().__init__(x, y, width, height, sprite_path)
        
        # Identificador de jogador
        self.is_player = True
        
        # Stats específicos do jogador
        self.exp = 0
        self.next_level_exp = 100
        self.gold = 0
        
        # Inventário e equipamento
        self.inventory = None  # Será definido pelo InventorySystem
        self.equipment_slots = {
            'weapon': None,
            'armor': None,
            'accessory': None
        }
        
        # Quests
        self.active_quests = []
        self.completed_quests = []
        
        # Configurações de movimento
        self.movement_speed = 8  # Velocidade base mais alta para o jogador
        self.diagonal_speed_multiplier = 0.7071  # sqrt(2)/2 para movimento diagonal consistente
        
    def gain_exp(self, amount: int):
        """Ganha experiência e sobe de nível se necessário."""
        self.exp += amount
        
        while self.exp >= self.next_level_exp:
            self.level_up()
            
    def level_up(self):
        """Sobe de nível e aumenta os stats."""
        self.level += 1
        self.exp -= self.next_level_exp
        self.next_level_exp = int(self.next_level_exp * 1.5)
        
        # Aumenta os stats base
        self.max_health += 20
        self.health = self.max_health
        self.max_mana += 10
        self.mana = self.max_mana
        self.strength += 2
        self.defense += 2
        self.magic += 2
        self.speed += 1
        
    def equip_item(self, slot: str, item) -> bool:
        """Equipa um item no slot especificado."""
        if slot not in self.equipment_slots:
            return False
            
        # Remove o item atual se houver
        current_item = self.equipment_slots[slot]
        if current_item:
            current_item.unequip(self)
            
        # Equipa o novo item
        if item.equip(self):
            self.equipment_slots[slot] = item
            return True
            
        return False
        
    def unequip_item(self, slot: str) -> bool:
        """Remove o item equipado no slot especificado."""
        if slot not in self.equipment_slots:
            return False
            
        item = self.equipment_slots[slot]
        if item and item.unequip(self):
            self.equipment_slots[slot] = None
            return True
            
        return False
        
    def get_total_stats(self) -> Dict[str, int]:
        """Retorna os stats totais incluindo equipamentos."""
        total_stats = {
            'health': self.max_health,
            'mana': self.max_mana,
            'strength': self.strength,
            'defense': self.defense,
            'magic': self.magic,
            'speed': self.speed
        }
        
        # Adiciona os stats dos equipamentos
        for item in self.equipment_slots.values():
            if item:
                for stat, value in item.stats.items():
                    if stat in total_stats:
                        total_stats[stat] += value
                        
        return total_stats
        
    def handle_input(self, keys: Dict[int, bool], entities: List[Entity]):
        """Processa input do jogador."""
        dx = 0
        dy = 0
        
        # Movimento com WASD ou setas
        if keys.get(pygame.K_LEFT) or keys.get(pygame.K_a):
            dx = -1
        elif keys.get(pygame.K_RIGHT) or keys.get(pygame.K_d):
            dx = 1
            
        if keys.get(pygame.K_UP) or keys.get(pygame.K_w):
            dy = -1
        elif keys.get(pygame.K_DOWN) or keys.get(pygame.K_s):
            dy = 1
            
        # Move o jogador se houver input de movimento
        if dx != 0 or dy != 0:
            # Aplica multiplicador de velocidade diagonal
            if dx != 0 and dy != 0:
                dx *= self.diagonal_speed_multiplier
                dy *= self.diagonal_speed_multiplier
                
            # Tenta mover o jogador
            self.move(dx, dy, entities)
            
    def update(self, delta_time: float):
        """Atualiza o jogador."""
        super().update(delta_time)
        
        # Atualiza quests ativas
        for quest in self.active_quests:
            quest.update(self)
            
    def draw(self, screen: pygame.Surface, camera_x: int = 0, camera_y: int = 0):
        """Desenha o jogador na tela."""
        super().draw(screen, camera_x, camera_y)
        
        # Desenha barra de vida sobre o jogador
        health_percent = self.health / self.max_health
        bar_width = self.width
        bar_height = 4
        bar_x = self.x - camera_x
        bar_y = self.y - camera_y - 10
        
        # Fundo da barra
        pygame.draw.rect(screen, (255, 0, 0), 
                        (bar_x, bar_y, bar_width, bar_height))
        # Barra de vida atual
        pygame.draw.rect(screen, (0, 255, 0), 
                        (bar_x, bar_y, bar_width * health_percent, bar_height))
            
    def draw_ui(self, screen: pygame.Surface):
        """Desenha a interface do jogador."""
        # Configurações das barras
        bar_width = 200
        bar_height = 20
        bar_x = 10
        bar_spacing = 25
        
        # Barra de vida
        health_percent = self.health / self.max_health
        pygame.draw.rect(screen, (100, 0, 0), (bar_x, bar_x, bar_width, bar_height))
        pygame.draw.rect(screen, (255, 0, 0), 
                        (bar_x, bar_x, bar_width * health_percent, bar_height))
        
        # Barra de mana
        mana_percent = self.mana / self.max_mana
        mana_y = bar_x + bar_spacing
        pygame.draw.rect(screen, (0, 0, 100), (bar_x, mana_y, bar_width, bar_height))
        pygame.draw.rect(screen, (0, 0, 255), 
                        (bar_x, mana_y, bar_width * mana_percent, bar_height))
        
        # Barra de experiência
        exp_percent = self.exp / self.next_level_exp
        exp_y = mana_y + bar_spacing
        exp_height = 10
        pygame.draw.rect(screen, (64, 64, 64), (bar_x, exp_y, bar_width, exp_height))
        pygame.draw.rect(screen, (255, 255, 0), 
                        (bar_x, exp_y, bar_width * exp_percent, exp_height))
        
        # Texto de status
        if hasattr(pygame.font, 'Font'):
            font = pygame.font.Font(None, 24)
            
            # Nível
            level_text = f"Level {self.level}"
            text = font.render(level_text, True, (255, 255, 255))
            screen.blit(text, (bar_x + bar_width + 10, bar_x))
            
            # Ouro
            gold_text = f"Gold: {self.gold}"
            text = font.render(gold_text, True, (255, 215, 0))
            screen.blit(text, (bar_x + bar_width + 10, mana_y))
            
            # Experiência
            exp_text = f"EXP: {self.exp}/{self.next_level_exp}"
            text = font.render(exp_text, True, (255, 255, 255))
            screen.blit(text, (bar_x + bar_width + 10, exp_y))
