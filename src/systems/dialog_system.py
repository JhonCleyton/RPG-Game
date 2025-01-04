import json
import os
import pygame
from typing import Dict, Optional, List, Callable

class DialogSystem:
    def __init__(self, dialog_file: Optional[str] = None, quest_system = None):
        self.dialogs = {}
        if dialog_file:
            self.dialogs = self._load_dialogs(dialog_file)
        self.current_dialog = None
        self.current_node = None
        self.selected_option = 0
        self.quest_system = quest_system
        self.visible = False
        
        # Carrega as fontes
        font_path = os.path.join("assets", "fonts", "PixeloidSans.ttf")
        try:
            self.font = pygame.font.Font(font_path, 32)
            self.option_font = pygame.font.Font(font_path, 24)
        except:
            print("Erro ao carregar fonte personalizada. Usando fonte padrão.")
            self.font = pygame.font.Font(None, 32)
            self.option_font = pygame.font.Font(None, 24)
        
        # UI properties
        self.text_color = (255, 255, 255)
        self.selected_color = (255, 255, 0)
        self.background_color = (0, 0, 0, 200)
        self.padding = 20
        self.line_spacing = 10
        self.max_width = 800
        self.max_lines = 4
        
    def _load_dialogs(self, filepath: str) -> Dict:
        """Carrega diálogos do arquivo JSON."""
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                return json.load(file)
        except Exception as e:
            print(f"Erro ao carregar diálogos: {e}")
            return {}
            
    def start_dialog(self, dialog_id: str, npc=None, player=None) -> bool:
        """Inicia um diálogo."""
        if dialog_id not in self.dialogs:
            return False
            
        self.current_dialog = self.dialogs[dialog_id]
        self.current_node = self.current_dialog.get('start', None)
        self.selected_option = 0
        self.visible = True
        return True
        
    def end_dialog(self):
        """Encerra o diálogo atual."""
        self.current_dialog = None
        self.current_node = None
        self.selected_option = 0
        self.visible = False
        
    def select_option(self, option_index: int):
        """Seleciona uma opção de diálogo."""
        if not self.current_node or 'options' not in self.current_node:
            return
            
        options = self.current_node['options']
        if 0 <= option_index < len(options):
            option = options[option_index]
            next_node = option.get('next', None)
            
            # Executa ações associadas à opção
            if 'actions' in option:
                for action in option['actions']:
                    self._execute_action(action)
                    
            # Vai para o próximo nó
            if next_node:
                self.current_node = self.current_dialog[next_node]
            else:
                self.end_dialog()
                
    def _execute_action(self, action: Dict):
        """Executa uma ação do diálogo."""
        action_type = action.get('type', '')
        
        if action_type == 'give_quest' and self.quest_system:
            quest_id = action.get('quest_id', '')
            self.quest_system.start_quest(quest_id)
            
        elif action_type == 'give_item':
            # Implementar sistema de inventário
            pass
            
    def update(self, delta_time: float):
        """Atualiza o sistema de diálogo."""
        if not self.visible:
            return
            
        # Processa input
        keys = pygame.key.get_pressed()
        
        if keys[pygame.K_UP]:
            self.selected_option = max(0, self.selected_option - 1)
        elif keys[pygame.K_DOWN]:
            if self.current_node and 'options' in self.current_node:
                self.selected_option = min(
                    len(self.current_node['options']) - 1,
                    self.selected_option + 1
                )
                
        elif keys[pygame.K_RETURN]:
            if self.current_node and 'options' in self.current_node:
                self.select_option(self.selected_option)
                
        elif keys[pygame.K_ESCAPE]:
            self.end_dialog()
            
    def draw(self, screen: pygame.Surface):
        """Desenha a interface de diálogo."""
        if not self.visible or not self.current_node:
            return
            
        # Desenha o fundo do diálogo
        dialog_surface = pygame.Surface((screen.get_width(), 200))
        dialog_surface.set_alpha(200)
        dialog_surface.fill((0, 0, 0))
        screen.blit(dialog_surface, (0, screen.get_height() - 200))
        
        # Desenha o texto principal
        text = self.current_node.get('text', '')
        text_surface = self.font.render(text, True, self.text_color)
        screen.blit(text_surface, (self.padding, screen.get_height() - 180))
        
        # Desenha as opções
        if 'options' in self.current_node:
            y = screen.get_height() - 140
            for i, option in enumerate(self.current_node['options']):
                color = self.selected_color if i == self.selected_option else self.text_color
                option_surface = self.option_font.render(option['text'], True, color)
                screen.blit(option_surface, (self.padding + 20, y))
                y += 30
