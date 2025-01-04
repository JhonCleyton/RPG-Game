Esta pasta contém os mapas do jogo.

Mapas necessários:
- village.json - Mapa da vila inicial
- fields.json - Mapa dos campos ao redor da vila
- dungeon.json - Mapa da primeira dungeon

Formato do mapa:
{
    "name": "Nome do Mapa",
    "width": 32,
    "height": 32,
    "tileSize": 32,
    "layers": [
        {
            "name": "ground",
            "data": [...] // Array de IDs dos tiles
        },
        {
            "name": "objects",
            "data": [...] // Array de IDs dos objetos
        },
        {
            "name": "collision",
            "data": [...] // Array de 0s e 1s (0 = passável, 1 = colisão)
        }
    ],
    "entities": [
        {
            "type": "npc",
            "id": "villager1",
            "x": 320,
            "y": 320,
            "properties": {
                "name": "João",
                "dialog": "Bem-vindo à vila!"
            }
        }
    ],
    "triggers": [
        {
            "x": 0,
            "y": 0,
            "width": 32,
            "height": 32,
            "type": "transition",
            "properties": {
                "targetMap": "fields",
                "targetX": 960,
                "targetY": 320
            }
        }
    ]
}
