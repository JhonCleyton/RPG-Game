class Quest:
    def __init__(self, quest_id, title, description, level_requirement=1):
        self.id = quest_id
        self.title = title
        self.description = description
        self.level_requirement = level_requirement
        self.objectives = {}
        self.rewards = {}
        self.prerequisites = []
        self.next_quests = []
        self.active = False
        self.completed = False
        self.failed = False
    
    def add_objective(self, objective_id, description, required_amount, current_amount=0):
        self.objectives[objective_id] = {
            'description': description,
            'required': required_amount,
            'current': current_amount,
            'completed': False
        }
    
    def add_reward(self, reward_type, value):
        if reward_type in self.rewards:
            self.rewards[reward_type] += value
        else:
            self.rewards[reward_type] = value
    
    def update_objective(self, objective_id, amount):
        if objective_id in self.objectives:
            objective = self.objectives[objective_id]
            objective['current'] = min(objective['current'] + amount, objective['required'])
            objective['completed'] = objective['current'] >= objective['required']
            return self.check_completion()
        return False
    
    def check_completion(self):
        if all(obj['completed'] for obj in self.objectives.values()):
            self.completed = True
            return True
        return False
    
    def can_start(self, player):
        if player.level < self.level_requirement:
            return False
        return all(quest.completed for quest in self.prerequisites)
    
    def start(self):
        self.active = True
    
    def complete(self):
        self.active = False
        self.completed = True
    
    def fail(self):
        self.active = False
        self.failed = True
    
    def reset(self):
        self.active = False
        self.completed = False
        self.failed = False
        for objective in self.objectives.values():
            objective['current'] = 0
            objective['completed'] = False
    
    def get_progress(self):
        if not self.objectives:
            return 0
        total_progress = sum(obj['current'] / obj['required'] for obj in self.objectives.values())
        return total_progress / len(self.objectives)
    
    def get_status_text(self):
        if self.completed:
            return "Completed"
        elif self.failed:
            return "Failed"
        elif self.active:
            return f"In Progress ({int(self.get_progress() * 100)}%)"
        else:
            return "Not Started"
    
    def get_objective_text(self, objective_id):
        if objective_id in self.objectives:
            obj = self.objectives[objective_id]
            return f"{obj['description']}: {obj['current']}/{obj['required']}"
        return ""
