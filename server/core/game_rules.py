from __future__ import annotations

from core.special_tiles import get_special_zone_info, parse_grid_id

BASIC_GAME_TYPES = ["basic_tap", "basic_rps", "basic_timing"]


def _basic_seed_from_grid(grid_id: str) -> int:
    point = parse_grid_id(grid_id)
    if point:
        return abs(point.row * 17 + point.col * 31)

    seed = 0
    for ch in grid_id:
        seed = (seed * 31 + ord(ch)) & 0xFFFFFFFF
    return seed


def choose_basic_game_type(grid_id: str) -> str:
    seed = _basic_seed_from_grid(grid_id)
    return BASIC_GAME_TYPES[seed % len(BASIC_GAME_TYPES)]


def _special_rules_by_type(special_type: str) -> tuple[int, dict]:
    if special_type == "5x5":
        return (
            3,
            {
                "boss_hp": 300,
                "damage_per_hit": 1,
                "click_limit_per_user": 40,
                "required_teamplay": True,
            },
        )

    return (
        2,
        {
            "boss_hp": 120,
            "damage_per_hit": 1,
            "click_limit_per_user": 20,
            "required_teamplay": True,
        },
    )


def get_game_config_for_tile(grid_id: str) -> dict:
    zone = get_special_zone_info(grid_id)
    in_special_zone = bool(zone["in_special_zone"])
    special_type = zone["special_zone_type"]
    special_center_grid_id = zone["special_center_grid_id"] or grid_id
    is_special_center = bool(zone["is_special_center"])

    if in_special_zone and special_type:
        level, rules = _special_rules_by_type(special_type)
        return {
            "grid_id": grid_id,
            "mode": "special",
            "pattern": (
                f"special_{special_type}_center"
                if is_special_center
                else f"special_{special_type}_zone"
            ),
            "special_type": special_type,
            "game_type": "boss_click",
            "title": f"Special Boss Tile ({special_type})",
            "level": level,
            "rules": rules,
            # Non-center tiles in the same special zone share one boss state.
            "boss_grid_id": special_center_grid_id,
            "is_special_center": is_special_center,
        }

    game_type = choose_basic_game_type(grid_id)
    return {
        "grid_id": grid_id,
        "mode": "basic",
        "pattern": None,
        "special_type": None,
        "game_type": game_type,
        "title": "Basic Tile Mini Game",
        "level": 1,
        "rules": {
            "target_success": True,
        },
    }
