from .quest import Quest

def create_initial_quests():
    quests = {}
    
    # Tutorial Quest
    tutorial = Quest('tutorial', 'Welcome to Adventure', 'Learn the basics of the game', 1)
    tutorial.add_objective('move', 'Learn to move around', 1)
    tutorial.add_objective('talk', 'Talk to the Village Elder', 1)
    tutorial.add_objective('combat', 'Defeat a training dummy', 1)
    tutorial.add_reward('xp', 100)
    tutorial.add_reward('gold', 50)
    quests[tutorial.id] = tutorial
    
    # First Combat Quest
    rats = Quest('rats', 'Rat Problem', 'Clear the rats from the village cellar', 2)
    rats.add_objective('kill_rats', 'Defeat rats', 5)
    rats.add_objective('find_source', 'Find the source of rats', 1)
    rats.add_reward('xp', 200)
    rats.add_reward('gold', 100)
    rats.add_reward('item', 'basic_sword')
    rats.prerequisites.append(tutorial)
    quests[rats.id] = rats
    
    # Gathering Quest
    herbs = Quest('herbs', 'Medicinal Herbs', 'Collect herbs for the village healer', 2)
    herbs.add_objective('collect_herbs', 'Collect healing herbs', 5)
    herbs.add_objective('deliver_herbs', 'Deliver herbs to the healer', 1)
    herbs.add_reward('xp', 150)
    herbs.add_reward('gold', 75)
    herbs.add_reward('item', 'health_potion')
    herbs.prerequisites.append(tutorial)
    quests[herbs.id] = herbs
    
    # First Dungeon Quest
    dungeon = Quest('dungeon', 'The Old Ruins', 'Explore the ruins outside the village', 5)
    dungeon.add_objective('explore', 'Find the entrance to the ruins', 1)
    dungeon.add_objective('clear_enemies', 'Defeat the monsters inside', 10)
    dungeon.add_objective('find_artifact', 'Recover the ancient artifact', 1)
    dungeon.add_reward('xp', 500)
    dungeon.add_reward('gold', 250)
    dungeon.add_reward('item', 'magic_ring')
    dungeon.prerequisites.extend([rats, herbs])
    quests[dungeon.id] = dungeon
    
    return quests
