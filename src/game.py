import pygame
from systems.input_system import InputSystem
from systems.asset_system import AssetSystem
from systems.sound_system import SoundSystem
from systems.time_system import TimeSystem
from systems.dialog_system import DialogSystem
from systems.quest_system import QuestSystem
from systems.combat_system import CombatSystem
from systems.inventory_system import InventorySystem
from systems.animation_system import AnimationSystem
from systems.particle_system import ParticleSystem
from ui.hud import HUD

class Game:
    def __init__(self, screen):
        self.screen = screen
        self.init_systems()
        self.init_ui()
    
    def init_systems(self):
        self.input_system = InputSystem()
        self.asset_system = AssetSystem()
        self.sound_system = SoundSystem()
        self.time_system = TimeSystem()
        self.dialog_system = DialogSystem()
        self.quest_system = QuestSystem()
        self.combat_system = CombatSystem()
        self.inventory_system = InventorySystem()
        self.animation_system = AnimationSystem()
        self.particle_system = ParticleSystem()
    
    def init_ui(self):
        self.hud = HUD(self.screen)
    
    def handle_event(self, event):
        self.input_system.handle_event(event)
    
    def update(self):
        self.time_system.update()
        self.animation_system.update()
        self.particle_system.update()
        self.combat_system.update()
        self.quest_system.update()
    
    def render(self):
        self.screen.fill((0, 0, 0))  # Clear screen
        
        # Render game world
        
        # Render UI
        self.hud.render()
        
        # Render particles
        self.particle_system.render(self.screen)
