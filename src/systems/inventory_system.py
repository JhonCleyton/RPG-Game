import pygame
from typing import Dict, List, Optional
from src.items.item import Item
from src.items.equipment import Equipment
from src.items.consumable import Consumable

class InventorySlot:
    def __init__(self, item: Optional[Item] = None, quantity: int = 0):
        self.item = item
        self.quantity = quantity
        
    def is_empty(self) -> bool:
        return self.item is None
        
    def can_add(self, item: Item, amount: int = 1) -> bool:
        if self.is_empty():
            return True
        return self.item.id == item.id and self.quantity + amount <= item.max_stack
        
    def add(self, item: Item, amount: int = 1) -> int:
        """Add items to slot. Returns number of items that couldn't be added."""
        if self.is_empty():
            self.item = item
            self.quantity = min(amount, item.max_stack)
            return amount - self.quantity
        elif self.item.id == item.id:
            space_left = self.item.max_stack - self.quantity
            added = min(amount, space_left)
            self.quantity += added
            return amount - added
        return amount
        
    def remove(self, amount: int = 1) -> int:
        """Remove items from slot. Returns number of items actually removed."""
        if self.is_empty():
            return 0
        removed = min(amount, self.quantity)
        self.quantity -= removed
        if self.quantity == 0:
            self.item = None
        return removed

class InventorySystem:
    def __init__(self, size: int = 20):
        self.size = size
        self.slots: List[InventorySlot] = [InventorySlot() for _ in range(size)]
        self.gold = 0
        self.selected_slot = -1
        
        # UI properties
        self.visible = False
        self.slot_size = 40
        self.padding = 10
        self.columns = 5
        
        # Equipment slots
        self.equipment_slots: Dict[str, InventorySlot] = {
            'weapon': InventorySlot(),
            'armor': InventorySlot(),
            'accessory': InventorySlot()
        }
        
    def add_item(self, item: Item, amount: int = 1) -> bool:
        """Add items to inventory. Returns True if all items were added."""
        remaining = amount
        
        # First try to stack with existing items
        for slot in self.slots:
            if not slot.is_empty() and slot.item.id == item.id:
                remaining = slot.add(item, remaining)
                if remaining == 0:
                    return True
                    
        # Then try empty slots
        for slot in self.slots:
            if slot.is_empty():
                remaining = slot.add(item, remaining)
                if remaining == 0:
                    return True
                    
        return remaining == 0
        
    def remove_item(self, item_id: str, amount: int = 1) -> int:
        """Remove items from inventory. Returns number of items actually removed."""
        remaining = amount
        for slot in self.slots:
            if not slot.is_empty() and slot.item.id == item_id:
                removed = slot.remove(remaining)
                remaining -= removed
                if remaining == 0:
                    break
        return amount - remaining
        
    def get_item(self, item_id: str) -> Optional[Item]:
        """Get an item from inventory without removing it."""
        for slot in self.slots:
            if not slot.is_empty() and slot.item.id == item_id:
                return slot.item
        return None
        
    def get_item_count(self, item_id: str) -> int:
        """Get the total count of an item in inventory."""
        total = 0
        for slot in self.slots:
            if not slot.is_empty() and slot.item.id == item_id:
                total += slot.quantity
        return total
        
    def has_space(self) -> bool:
        """Check if inventory has any empty slots."""
        return any(slot.is_empty() for slot in self.slots)
        
    def is_full(self) -> bool:
        """Check if inventory is full."""
        return not self.has_space()
        
    def clear(self):
        """Clear all items from inventory."""
        for slot in self.slots:
            slot.item = None
            slot.quantity = 0
            
    def equip_item(self, slot_index: int) -> bool:
        """Equip an item from inventory."""
        if not 0 <= slot_index < len(self.slots):
            return False
            
        slot = self.slots[slot_index]
        if slot.is_empty() or not isinstance(slot.item, Equipment):
            return False
            
        equipment = slot.item
        equipment_slot = self.equipment_slots.get(equipment.slot)
        if not equipment_slot:
            return False
            
        # Unequip current item if any
        if not equipment_slot.is_empty():
            old_equipment = equipment_slot.item
            if not self.add_item(old_equipment):
                return False  # No space for old equipment
            equipment_slot.item = None
            equipment_slot.quantity = 0
            
        # Equip new item
        equipment_slot.item = equipment
        equipment_slot.quantity = 1
        slot.remove(1)
        
        return True
        
    def unequip_item(self, slot_type: str) -> bool:
        """Unequip an item to inventory."""
        if slot_type not in self.equipment_slots:
            return False
            
        equipment_slot = self.equipment_slots[slot_type]
        if equipment_slot.is_empty():
            return False
            
        # Check if we have space in inventory
        if not self.has_space():
            return False
            
        # Move item to inventory
        item = equipment_slot.item
        if self.add_item(item):
            equipment_slot.item = None
            equipment_slot.quantity = 0
            return True
            
        return False
        
    def use_item(self, slot_index: int, target) -> bool:
        """Use a consumable item."""
        if not 0 <= slot_index < len(self.slots):
            return False
            
        slot = self.slots[slot_index]
        if slot.is_empty() or not isinstance(slot.item, Consumable):
            return False
            
        # Use the item
        if slot.item.use(target):
            slot.remove(1)
            return True
            
        return False
        
    def draw(self, screen: pygame.Surface):
        """Draw the inventory interface."""
        if not self.visible:
            return
            
        # Calculate inventory grid
        rows = (self.size + self.columns - 1) // self.columns
        total_width = self.columns * (self.slot_size + self.padding) + self.padding
        total_height = rows * (self.slot_size + self.padding) + self.padding
        
        # Draw background
        x = (screen.get_width() - total_width) // 2
        y = (screen.get_height() - total_height) // 2
        pygame.draw.rect(screen, (50, 50, 50), (x, y, total_width, total_height))
        
        # Draw slots
        for i, slot in enumerate(self.slots):
            slot_x = x + self.padding + (i % self.columns) * (self.slot_size + self.padding)
            slot_y = y + self.padding + (i // self.columns) * (self.slot_size + self.padding)
            
            # Draw slot background
            color = (100, 100, 100) if i == self.selected_slot else (70, 70, 70)
            pygame.draw.rect(screen, color, (slot_x, slot_y, self.slot_size, self.slot_size))
            
            # Draw item if present
            if not slot.is_empty():
                # Draw item sprite
                if slot.item.sprite:
                    screen.blit(slot.item.sprite, (slot_x, slot_y))
                    
                # Draw quantity
                if slot.quantity > 1:
                    font = pygame.font.Font(None, 20)
                    text = font.render(str(slot.quantity), True, (255, 255, 255))
                    screen.blit(text, (slot_x + self.slot_size - text.get_width() - 2,
                                     slot_y + self.slot_size - text.get_height() - 2))
                                     
        # Draw equipment slots
        equip_x = x + total_width + self.padding
        equip_y = y
        for slot_type, slot in self.equipment_slots.items():
            pygame.draw.rect(screen, (70, 70, 70), 
                           (equip_x, equip_y, self.slot_size, self.slot_size))
            
            if not slot.is_empty():
                if slot.item.sprite:
                    screen.blit(slot.item.sprite, (equip_x, equip_y))
                    
            # Draw slot type label
            font = pygame.font.Font(None, 20)
            text = font.render(slot_type, True, (255, 255, 255))
            screen.blit(text, (equip_x, equip_y - text.get_height() - 2))
            
            equip_y += self.slot_size + self.padding
            
        # Draw gold amount
        font = pygame.font.Font(None, 24)
        text = font.render(f"Gold: {self.gold}", True, (255, 215, 0))
        screen.blit(text, (x + self.padding, y + total_height + self.padding))
        
    def handle_click(self, pos: tuple) -> bool:
        """Handle mouse click in inventory. Returns True if click was handled."""
        if not self.visible:
            return False
            
        # Calculate inventory grid position
        x = (pygame.display.get_surface().get_width() - 
             (self.columns * (self.slot_size + self.padding) + self.padding)) // 2
        y = (pygame.display.get_surface().get_height() - 
             ((self.size // self.columns) * (self.slot_size + self.padding) + self.padding)) // 2
             
        # Check if click is within inventory grid
        for i, slot in enumerate(self.slots):
            slot_x = x + self.padding + (i % self.columns) * (self.slot_size + self.padding)
            slot_y = y + self.padding + (i // self.columns) * (self.slot_size + self.padding)
            
            if (slot_x <= pos[0] <= slot_x + self.slot_size and 
                slot_y <= pos[1] <= slot_y + self.slot_size):
                self.selected_slot = i
                return True
                
        return False
        
    def toggle(self):
        """Toggle inventory visibility."""
        self.visible = not self.visible
        
    def update(self, delta_time: float):
        """Atualiza o sistema de inventário."""
        pass  # Por enquanto não precisamos atualizar nada
        
    def add_gold(self, amount: int):
        """Add gold to inventory."""
        self.gold += amount
        
    def remove_gold(self, amount: int) -> bool:
        """Remove gold from inventory. Returns True if successful."""
        if self.gold >= amount:
            self.gold -= amount
            return True
        return False
