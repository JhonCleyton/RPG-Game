from typing import Dict, List, Optional
import pygame
import random
from src.entities.entity import Entity
from src.entities.monster import Monster
from src.entities.player import Player

class CombatSystem:
    def __init__(self):
        self.active_combats: List[Combat] = []
        
    def start_combat(self, attacker: Entity, defender: Entity) -> Optional['Combat']:
        """Inicia um combate entre duas entidades."""
        if not attacker.is_alive() or not defender.is_alive():
            return None
            
        # Verifica se já existe um combate entre essas entidades
        for combat in self.active_combats:
            if (combat.attacker == attacker and combat.defender == defender) or \
               (combat.attacker == defender and combat.defender == attacker):
                return combat
                
        # Cria um novo combate
        combat = Combat(attacker, defender)
        self.active_combats.append(combat)
        return combat
        
    def update(self, delta_time: float):
        """Atualiza todos os combates ativos."""
        # Remove combates finalizados
        self.active_combats = [combat for combat in self.active_combats 
                             if not combat.is_finished()]
                             
        # Atualiza os combates restantes
        for combat in self.active_combats:
            combat.update(delta_time)
            
    def draw(self, screen: pygame.Surface):
        """Desenha a interface de combate."""
        # Por enquanto não precisamos desenhar nada
        pass

class Combat:
    def __init__(self, attacker: Entity, defender: Entity):
        self.attacker = attacker
        self.defender = defender
        self.turn_timer = 0
        self.turn_duration = 1.0  # 1 segundo por turno
        self.finished = False
        
    def update(self, delta_time: float):
        """Atualiza o combate."""
        if self.is_finished():
            return
            
        self.turn_timer += delta_time
        
        # Quando o timer atinge a duração do turno
        if self.turn_timer >= self.turn_duration:
            self.execute_turn()
            self.turn_timer = 0
            
    def execute_turn(self):
        """Executa um turno de combate."""
        if not self.attacker.is_alive() or not self.defender.is_alive():
            self.finished = True
            return
            
        # Calcula o dano base
        damage = random.randint(
            int(self.attacker.strength * 0.8),
            int(self.attacker.strength * 1.2)
        )
        
        # Aplica o dano
        actual_damage = self.defender.take_damage(damage, self.attacker)
        
        # Se o defensor morreu
        if not self.defender.is_alive():
            self.handle_death()
            
        # Troca os papéis para o próximo turno
        self.attacker, self.defender = self.defender, self.attacker
        
    def handle_death(self):
        """Lida com a morte de uma entidade no combate."""
        self.finished = True
        
        # Se o jogador matou um monstro
        if isinstance(self.attacker, Player) and isinstance(self.defender, Monster):
            player = self.attacker
            monster = self.defender
            
            # Dá experiência ao jogador
            exp_gain = monster.exp_reward * (1 + random.random() * 0.2)  # ±20% random
            player.gain_exp(int(exp_gain))
            
            # Dá ouro ao jogador
            if hasattr(player, 'gold'):
                gold_gain = monster.gold_reward * (1 + random.random() * 0.2)  # ±20% random
                player.gold += int(gold_gain)
                
    def is_finished(self) -> bool:
        """Verifica se o combate terminou."""
        return self.finished or \
               not self.attacker.is_alive() or \
               not self.defender.is_alive()
