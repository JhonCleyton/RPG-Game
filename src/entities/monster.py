from typing import Optional, Dict, List
import random
from .entity import Entity

class Monster(Entity):
    def __init__(self, x: float, y: float, width: int, height: int, 
                 monster_data: Dict, sprite_path: Optional[str] = None):
        super().__init__(x, y, width, height, sprite_path)
        
        # Carrega os dados do monstro
        self.name = monster_data.get('name', 'Unknown Monster')
        self.level = monster_data.get('level', 1)
        self.max_health = monster_data.get('health', 50)
        self.health = self.max_health
        self.strength = monster_data.get('strength', 5)
        self.defense = monster_data.get('defense', 3)
        self.magic = monster_data.get('magic', 2)
        self.speed = monster_data.get('speed', 3)
        self.exp_reward = monster_data.get('exp_reward', 10)
        self.gold_reward = monster_data.get('gold_reward', 5)
        
        # Comportamento
        self.aggro_range = monster_data.get('aggro_range', 200)
        self.attack_range = monster_data.get('attack_range', 50)
        self.attack_cooldown = monster_data.get('attack_cooldown', 1.0)
        self.current_cooldown = 0
        self.target = None
        
    def update(self, delta_time: float, entities: List[Entity]):
        """Atualiza o comportamento do monstro."""
        super().update(delta_time)
        
        if not self.is_alive():
            return
            
        # Atualiza cooldown de ataque
        if self.current_cooldown > 0:
            self.current_cooldown = max(0, self.current_cooldown - delta_time)
            
        # Procura por um jogador na lista de entidades
        player = None
        for entity in entities:
            if isinstance(entity, Entity) and hasattr(entity, 'is_player') and entity.is_player:
                player = entity
                break
                
        if not player:
            return
            
        # Verifica distância até o jogador
        distance_to_player = self.get_distance_to(player)
        
        # Se o jogador estiver no alcance de aggro
        if distance_to_player <= self.aggro_range:
            self.target = player
            
            # Se estiver no alcance de ataque
            if distance_to_player <= self.attack_range:
                if self.current_cooldown <= 0:
                    self.attack(player)
            else:
                # Move em direção ao jogador
                dx = player.x - self.x
                dy = player.y - self.y
                length = (dx * dx + dy * dy) ** 0.5
                if length > 0:
                    dx = dx / length
                    dy = dy / length
                    self.move(dx, dy, entities)
        else:
            self.target = None
            
    def attack(self, target: Entity):
        """Ataca o alvo."""
        damage = random.randint(
            int(self.strength * 0.8),
            int(self.strength * 1.2)
        )
        
        actual_damage = target.take_damage(damage, self)
        self.current_cooldown = self.attack_cooldown
        
        return actual_damage
        
    def die(self):
        """Chamado quando o monstro morre."""
        # Pode ser expandido para dropar itens, tocar sons, etc.
        pass
