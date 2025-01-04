import json
from typing import Dict, List, Optional, Callable
from enum import Enum
import pygame

class QuestStatus(Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class QuestObjective:
    def __init__(self, description: str, target_amount: int = 1):
        self.description = description
        self.target_amount = target_amount
        self.current_amount = 0
        self.completed = False
        
    def update(self, amount: int = 1) -> bool:
        """Update progress towards objective. Returns True if newly completed."""
        if self.completed:
            return False
            
        self.current_amount = min(self.current_amount + amount, self.target_amount)
        if self.current_amount >= self.target_amount:
            self.completed = True
            return True
        return False
        
    def get_progress(self) -> float:
        """Get progress as a percentage."""
        return self.current_amount / self.target_amount

class Quest:
    def __init__(self, quest_id: str, title: str, description: str):
        self.id = quest_id
        self.title = title
        self.description = description
        self.objectives: Dict[str, QuestObjective] = {}
        self.rewards: Dict[str, int] = {}
        self.status = QuestStatus.NOT_STARTED
        self.on_complete: Optional[Callable] = None
        self.on_fail: Optional[Callable] = None
        
    def add_objective(self, objective_id: str, description: str, target_amount: int = 1):
        """Add a new objective to the quest."""
        self.objectives[objective_id] = QuestObjective(description, target_amount)
        
    def add_reward(self, reward_type: str, amount: int):
        """Add a reward for completing the quest."""
        self.rewards[reward_type] = amount
        
    def update_objective(self, objective_id: str, amount: int = 1) -> bool:
        """Update progress of an objective. Returns True if quest is completed."""
        if objective_id not in self.objectives:
            return False
            
        if self.objectives[objective_id].update(amount):
            # Check if all objectives are complete
            if all(obj.completed for obj in self.objectives.values()):
                self.complete()
                return True
        return False
        
    def start(self):
        """Start the quest."""
        if self.status == QuestStatus.NOT_STARTED:
            self.status = QuestStatus.IN_PROGRESS
            
    def complete(self):
        """Complete the quest."""
        if self.status == QuestStatus.IN_PROGRESS:
            self.status = QuestStatus.COMPLETED
            if self.on_complete:
                self.on_complete()
                
    def fail(self):
        """Fail the quest."""
        if self.status == QuestStatus.IN_PROGRESS:
            self.status = QuestStatus.FAILED
            if self.on_fail:
                self.on_fail()
                
    def is_completed(self) -> bool:
        """Check if quest is completed."""
        return self.status == QuestStatus.COMPLETED
        
    def get_progress(self) -> float:
        """Get overall quest progress as a percentage."""
        if not self.objectives:
            return 0.0
        return sum(obj.get_progress() for obj in self.objectives.values()) / len(self.objectives)

class QuestSystem:
    def __init__(self, quest_file: Optional[str] = None):
        self.quests: Dict[str, Quest] = {}
        self.active_quests: List[Quest] = []
        self.completed_quests: List[Quest] = []
        self.quest_log_visible = False
        if quest_file:
            self._load_quests(quest_file)
        
    def _load_quests(self, filepath: str):
        """Load quest data from JSON file."""
        try:
            with open(filepath, 'r') as f:
                quest_data = json.load(f)
                
            for quest_id, data in quest_data.items():
                quest = Quest(quest_id, data['title'], data['description'])
                
                # Add objectives
                for obj_id, obj_data in data.get('objectives', {}).items():
                    quest.add_objective(obj_id, obj_data['description'], 
                                     obj_data.get('target_amount', 1))
                    
                # Add rewards
                for reward_type, amount in data.get('rewards', {}).items():
                    quest.add_reward(reward_type, amount)
                    
                self.quests[quest_id] = quest
                
        except Exception as e:
            print(f"Error loading quest file: {e}")
            
    def start_quest(self, quest_id: str) -> bool:
        """Start a quest by its ID."""
        if quest_id not in self.quests:
            return False
            
        quest = self.quests[quest_id]
        if quest.status == QuestStatus.NOT_STARTED:
            quest.start()
            self.active_quests.append(quest)
            return True
        return False
        
    def complete_quest(self, quest_id: str) -> bool:
        """Complete a quest by its ID."""
        if quest_id not in self.quests:
            return False
            
        quest = self.quests[quest_id]
        if quest.status == QuestStatus.IN_PROGRESS:
            quest.complete()
            self.active_quests.remove(quest)
            self.completed_quests.append(quest)
            return True
        return False
        
    def fail_quest(self, quest_id: str) -> bool:
        """Fail a quest by its ID."""
        if quest_id not in self.quests:
            return False
            
        quest = self.quests[quest_id]
        if quest.status == QuestStatus.IN_PROGRESS:
            quest.fail()
            self.active_quests.remove(quest)
            return True
        return False
        
    def update_objective(self, quest_id: str, objective_id: str, amount: int = 1) -> bool:
        """Update progress of a quest objective."""
        if quest_id not in self.quests:
            return False
            
        return self.quests[quest_id].update_objective(objective_id, amount)
        
    def get_quest(self, quest_id: str) -> Optional[Quest]:
        """Get a quest by its ID."""
        return self.quests.get(quest_id)
        
    def get_active_quests(self) -> List[Quest]:
        """Get list of active quests."""
        return self.active_quests
        
    def get_completed_quests(self) -> List[Quest]:
        """Get list of completed quests."""
        return self.completed_quests
        
    def toggle_quest_log(self):
        """Toggle visibility of quest log."""
        self.quest_log_visible = not self.quest_log_visible
        
    def update(self, delta_time: float):
        """Atualiza o sistema de quests."""
        pass  # Por enquanto não precisamos atualizar nada
        
    def draw(self, screen: pygame.Surface):
        """Desenha o quest log."""
        if not self.quest_log_visible:
            return
            
        # Configurações do quest log
        padding = 20
        line_spacing = 10
        font = pygame.font.Font(None, 32)
        text_color = (255, 255, 255)
        title_color = (255, 255, 0)
        background_color = (0, 0, 0, 200)
        
        # Calcula dimensões
        screen_width = screen.get_width()
        screen_height = screen.get_height()
        log_width = min(400, screen_width - 2 * padding)
        
        # Prepara o texto
        lines = []
        lines.append(("QUEST LOG", title_color))
        lines.append(("", text_color))  # Espaço
        
        # Quests ativas
        lines.append(("Active Quests:", title_color))
        for quest in self.active_quests:
            lines.append((f"- {quest.title}", text_color))
            lines.append((f"  Progress: {quest.get_progress():.0%}", text_color))
            for obj in quest.objectives.values():
                lines.append((f"  • {obj.description}: {obj.current_amount}/{obj.target_amount}", 
                            text_color))
            lines.append(("", text_color))  # Espaço entre quests
            
        # Quests completadas
        if self.completed_quests:
            lines.append(("Completed Quests:", title_color))
            for quest in self.completed_quests:
                lines.append((f"- {quest.title}", text_color))
            
        # Calcula altura total
        log_height = len(lines) * (font.get_height() + line_spacing) + 2 * padding
        
        # Cria superfície do quest log com alpha
        log_surface = pygame.Surface((log_width, log_height), pygame.SRCALPHA)
        pygame.draw.rect(log_surface, background_color, (0, 0, log_width, log_height))
        
        # Desenha o texto
        y = padding
        for text, color in lines:
            if text:  # Não renderiza linhas vazias
                text_surface = font.render(text, True, color)
                log_surface.blit(text_surface, (padding, y))
            y += font.get_height() + line_spacing
            
        # Posiciona o quest log no canto superior direito
        log_x = screen_width - log_width - padding
        log_y = padding
        
        # Desenha na tela
        screen.blit(log_surface, (log_x, log_y))
