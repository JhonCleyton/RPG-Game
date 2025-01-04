"""
RPG Game Framework
Desenvolvido por JC Bytes - Soluções em Tecnologia
Website: jcbytes.com.br
Email: contato@jcbytes.com.br
"""

import os
import json
import pygame
from src.systems.inventory_system import InventorySystem
from src.systems.dialog_system import DialogSystem
from src.systems.quest_system import QuestSystem
from src.systems.combat_system import CombatSystem
from src.systems.animation_system import AnimationSystem
from src.systems.particle_system import ParticleSystem
from src.systems.camera import Camera
from src.map.game_map import GameMap
from src.entities.player import Player
from src.entities.npc import NPC
from src.entities.monster import Monster
from src.entities.obstacle import Tree, Rock, Fence, Wall

class Game:
    def __init__(self):
        pygame.init()
        
        # Configurações da janela
        self.screen_width = 800
        self.screen_height = 600
        self.screen = pygame.display.set_mode((self.screen_width, self.screen_height))
        pygame.display.set_caption("RPG Game")
        
        # Clock para controle de FPS
        self.clock = pygame.time.Clock()
        self.fps = 60
        self.running = True
        self.paused = False
        
        # Carrega dados do jogo
        self.load_game_data()
        
        # Cria o mapa
        self.game_map = GameMap(50, 50)  # Mapa 50x50 tiles
        
        # Lista de entidades
        self.entities = []
        
        # Cria o jogador no centro do mapa
        player_x = (self.game_map.width * self.game_map.tile_size) // 2
        player_y = (self.game_map.height * self.game_map.tile_size) // 2
        self.player = Player(player_x, player_y, 32, 32)
        self.entities.append(self.player)
        
        # Cria a câmera
        self.camera = Camera(self.screen_width, self.screen_height)
        
        # Sistemas do jogo
        self.inventory_system = InventorySystem()
        self.dialog_system = DialogSystem(os.path.join("assets", "data", "dialogs.json"))
        self.quest_system = QuestSystem(os.path.join("assets", "data", "quests.json"))
        self.combat_system = CombatSystem()
        self.animation_system = AnimationSystem()
        self.particle_system = ParticleSystem()
        
        # Estado do jogo
        self.keys = {}
        self.delta_time = 0
        
        # Adiciona NPCs
        self.add_npcs()
        
        # Adiciona obstáculos
        self.add_obstacles()
        
        # Adiciona monstros
        self.add_monsters()
        
    def load_game_data(self):
        """Carrega dados do jogo dos arquivos JSON."""
        try:
            # Carrega dados dos itens
            items_path = os.path.join("assets", "data", "items.json")
            with open(items_path, 'r', encoding='utf-8') as f:
                self.items_data = json.load(f)
                
            # Carrega dados dos diálogos
            dialogs_path = os.path.join("assets", "data", "dialogs.json")
            with open(dialogs_path, 'r', encoding='utf-8') as f:
                self.dialogs_data = json.load(f)
                
            # Carrega dados das quests
            quests_path = os.path.join("assets", "data", "quests.json")
            with open(quests_path, 'r', encoding='utf-8') as f:
                self.quests_data = json.load(f)
                
        except Exception as e:
            print(f"Erro ao carregar dados do jogo: {e}")
            self.items_data = {}
            self.dialogs_data = {}
            self.quests_data = {}
        
    def add_npcs(self):
        """Adiciona NPCs ao jogo."""
        # Comerciante
        merchant_data = {
            'name': 'Merchant John',
            'role': 'merchant',
            'dialog_id': 'merchant_dialog',
            'shop_items': ['health_potion', 'mana_potion', 'wooden_sword']
        }
        merchant = NPC(400, 200, 32, 32, merchant_data)
        self.entities.append(merchant)
        
        # Quest Giver
        quest_giver_data = {
            'name': 'Elder Sarah',
            'role': 'quest_giver',
            'dialog_id': 'forest_entrance',
            'quests': ['forest_herbs', 'spider_menace']
        }
        quest_giver = NPC(600, 300, 32, 32, quest_giver_data)
        self.entities.append(quest_giver)
        
    def add_obstacles(self):
        """Adiciona obstáculos ao jogo."""
        # Adiciona algumas árvores
        for i in range(10):
            x = 100 + i * 100
            y = 100
            tree = Tree(x, y)
            self.entities.append(tree)
            
        # Adiciona algumas rochas
        for i in range(5):
            x = 200 + i * 150
            y = 400
            rock = Rock(x, y)
            self.entities.append(rock)
            
        # Adiciona uma cerca
        for i in range(8):
            x = 300 + i * 32
            y = 200
            fence = Fence(x, y)
            self.entities.append(fence)
            
    def add_monsters(self):
        """Adiciona monstros ao jogo."""
        monster_data = {
            'name': 'Goblin',
            'level': 1,
            'health': 50,
            'strength': 5,
            'defense': 3,
            'exp_reward': 10,
            'gold_reward': 5
        }
        
        # Adiciona alguns goblins
        for i in range(5):
            x = 200 + i * 100
            y = 500
            monster = Monster(x, y, 32, 32, monster_data)
            self.entities.append(monster)
        
    def handle_events(self):
        """Processa eventos do pygame."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                
            elif event.type == pygame.KEYDOWN:
                self.keys[event.key] = True
                
                # Teclas especiais
                if event.key == pygame.K_ESCAPE:
                    self.paused = not self.paused
                elif event.key == pygame.K_e:
                    self.inventory_system.toggle()
                elif event.key == pygame.K_TAB:
                    self.quest_system.toggle()
                elif event.key == pygame.K_SPACE:
                    # Tenta interagir com NPCs próximos
                    self.try_interact_with_npc()
                    
            elif event.type == pygame.KEYUP:
                self.keys[event.key] = False
                
    def try_interact_with_npc(self):
        """Tenta interagir com NPCs próximos ao jogador."""
        for entity in self.entities:
            if isinstance(entity, NPC) and entity.can_interact(self.player):
                entity.interact(self.player, self.dialog_system)
                break
                
    def update(self):
        """Atualiza o estado do jogo."""
        if self.paused:
            return
            
        # Calcula delta_time em segundos
        self.delta_time = self.clock.get_time() / 1000.0
        
        # Atualiza o jogador com input
        self.player.handle_input(self.keys, self.entities)
        
        # Atualiza todas as entidades
        for entity in self.entities:
            if isinstance(entity, Player):
                entity.update(self.delta_time)
            elif isinstance(entity, NPC):
                entity.update(self.delta_time, self.entities)
            elif isinstance(entity, Monster):
                entity.update(self.delta_time, self.entities)
                
        # Atualiza a câmera para seguir o jogador
        self.camera.move_to(self.player.x, self.player.y)
        
        # Atualiza todos os sistemas
        self.inventory_system.update(self.delta_time)
        self.dialog_system.update(self.delta_time)
        self.quest_system.update(self.delta_time)
        self.combat_system.update(self.delta_time)
        self.animation_system.update(self.delta_time)
        self.particle_system.update(self.delta_time)
        
    def render(self):
        """Renderiza o jogo."""
        # Limpa a tela
        self.screen.fill((0, 0, 0))
        
        # Renderiza o mapa
        self.game_map.draw(self.screen, int(self.camera.x), int(self.camera.y))
        
        # Renderiza todas as entidades
        # Ordena as entidades por posição Y para correto layering
        sorted_entities = sorted(self.entities, key=lambda e: e.y)
        for entity in sorted_entities:
            screen_pos = self.camera.apply(entity.x, entity.y)
            entity.draw(self.screen, int(screen_pos[0]), int(screen_pos[1]))
        
        # Renderiza todos os sistemas
        self.inventory_system.draw(self.screen)
        self.dialog_system.draw(self.screen)
        self.quest_system.draw(self.screen)
        self.combat_system.draw(self.screen)
        self.animation_system.draw(self.screen)
        self.particle_system.draw(self.screen)
        
        # Atualiza a tela
        pygame.display.flip()
        
    def run(self):
        """Loop principal do jogo."""
        while self.running:
            self.handle_events()
            self.update()
            self.render()
            self.clock.tick(self.fps)
            
        pygame.quit()

if __name__ == "__main__":
    game = Game()
    game.run()
