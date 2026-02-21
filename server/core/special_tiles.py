from __future__ import annotations

import hashlib
import math
import os
from dataclasses import dataclass

from core.grid import LAT_STEP, LNG_STEP


@dataclass(frozen=True)
class GridPoint:
    row: int
    col: int


@dataclass(frozen=True)
class SpawnRule:
    tile_type: str
    block_rows: int
    block_cols: int
    spawn_mod: int
    spawn_threshold: int
    zone_radius: int
    seed_tag: str


SPECIAL_TILE_SEED = os.getenv("SPECIAL_TILE_SEED", "seoul-random-v1")


def _env_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default

# Approximate Seoul metropolitan boundary.
SEOUL_MIN_LAT = 37.4133
SEOUL_MAX_LAT = 37.7151
SEOUL_MIN_LNG = 126.7341
SEOUL_MAX_LNG = 127.2693

RULE_5X5 = SpawnRule(
    tile_type="5x5",
    block_rows=32,
    block_cols=32,
    spawn_mod=10_000,
    spawn_threshold=_env_int("SPECIAL_5X5_SPAWN_THRESHOLD", 260),  # about 2.6% default
    zone_radius=2,  # Manhattan radius -> 13 tiles
    seed_tag="rule_5x5",
)

RULE_3X3 = SpawnRule(
    tile_type="3x3",
    block_rows=24,
    block_cols=24,
    spawn_mod=10_000,
    spawn_threshold=_env_int("SPECIAL_3X3_SPAWN_THRESHOLD", 480),  # about 4.8% default
    zone_radius=1,  # Manhattan radius -> 5 tiles
    seed_tag="rule_3x3",
)


def parse_grid_id(grid_id: str) -> GridPoint | None:
    parts = grid_id.split("_")
    if len(parts) != 3 or parts[0] != "grid":
        return None

    try:
        row = int(parts[1])
        col = int(parts[2])
    except ValueError:
        return None

    return GridPoint(row=row, col=col)


def _to_grid_id(point: GridPoint) -> str:
    return f"grid_{point.row}_{point.col}"


def get_special_capture_grid_ids(center_grid_id: str, special_type: str) -> list[str]:
    """
    Build square capture targets from a special center.

    3x3 -> 9 tiles, 5x5 -> 25 tiles.
    """
    center = parse_grid_id(center_grid_id)
    if not center:
        return []

    radius = 2 if special_type == "5x5" else 1
    grid_ids: list[str] = []

    for row in range(center.row - radius, center.row + radius + 1):
        for col in range(center.col - radius, center.col + radius + 1):
            grid_ids.append(_to_grid_id(GridPoint(row=row, col=col)))

    return grid_ids


def _stable_hash_int(*parts: object) -> int:
    raw = "|".join(str(part) for part in parts).encode("utf-8")
    digest = hashlib.sha256(raw).hexdigest()
    return int(digest[:16], 16)


def _tile_center_lat_lng(point: GridPoint) -> tuple[float, float]:
    lat = (point.row + 0.5) * LAT_STEP
    lng = (point.col + 0.5) * LNG_STEP
    return lat, lng


def _in_seoul(point: GridPoint) -> bool:
    lat, lng = _tile_center_lat_lng(point)
    return (
        SEOUL_MIN_LAT <= lat <= SEOUL_MAX_LAT
        and SEOUL_MIN_LNG <= lng <= SEOUL_MAX_LNG
    )


def _center_for_block(
    block_row: int,
    block_col: int,
    rule: SpawnRule,
) -> GridPoint | None:
    seed_key = f"{SPECIAL_TILE_SEED}:{rule.seed_tag}"
    chance = _stable_hash_int(seed_key, "spawn", block_row, block_col) % rule.spawn_mod
    if chance >= rule.spawn_threshold:
        return None

    row_offset = _stable_hash_int(seed_key, "row", block_row, block_col) % rule.block_rows
    col_offset = _stable_hash_int(seed_key, "col", block_row, block_col) % rule.block_cols
    center = GridPoint(
        row=block_row * rule.block_rows + row_offset,
        col=block_col * rule.block_cols + col_offset,
    )

    if not _in_seoul(center):
        return None
    return center


def _candidate_centers(point: GridPoint, rule: SpawnRule) -> list[GridPoint]:
    base_block_row = point.row // rule.block_rows
    base_block_col = point.col // rule.block_cols
    centers: list[GridPoint] = []

    for block_row in (base_block_row - 1, base_block_row, base_block_row + 1):
        for block_col in (base_block_col - 1, base_block_col, base_block_col + 1):
            center = _center_for_block(block_row, block_col, rule)
            if center:
                centers.append(center)
    return centers


def _manhattan(point: GridPoint, center: GridPoint) -> int:
    return abs(point.row - center.row) + abs(point.col - center.col)


def _find_zone_center(point: GridPoint, rule: SpawnRule) -> GridPoint | None:
    best_center: GridPoint | None = None
    best_distance: int | None = None

    for center in _candidate_centers(point, rule):
        distance = _manhattan(point, center)
        if distance > rule.zone_radius:
            continue

        if best_center is None or distance < (best_distance or 0):
            best_center = center
            best_distance = distance

    return best_center


def is_5x5_special_center(grid_id: str) -> bool:
    point = parse_grid_id(grid_id)
    if not point:
        return False

    center = _find_zone_center(point, RULE_5X5)
    return bool(center and center == point)


def is_3x3_special_center(grid_id: str) -> bool:
    point = parse_grid_id(grid_id)
    if not point:
        return False

    # Prevent 3x3 centers from being placed inside a 5x5 zone.
    center_5x5 = _find_zone_center(point, RULE_5X5)
    if center_5x5 and center_5x5 != point:
        return False

    center_3x3 = _find_zone_center(point, RULE_3X3)
    return bool(center_3x3 and center_3x3 == point)


def classify_special_tile(grid_id: str) -> dict:
    if is_5x5_special_center(grid_id):
        return {
            "is_special": True,
            "pattern": "special_5x5_center",
            "special_type": "5x5",
        }

    if is_3x3_special_center(grid_id):
        return {
            "is_special": True,
            "pattern": "special_3x3_center",
            "special_type": "3x3",
        }

    return {
        "is_special": False,
        "pattern": None,
        "special_type": None,
    }


def get_special_zone_info(grid_id: str) -> dict:
    point = parse_grid_id(grid_id)
    if not point:
        return {
            "in_special_zone": False,
            "special_zone_type": None,
            "is_special_center": False,
            "special_center_grid_id": None,
        }

    classified = classify_special_tile(grid_id)
    if classified["is_special"]:
        return {
            "in_special_zone": True,
            "special_zone_type": classified["special_type"],
            "is_special_center": True,
            "special_center_grid_id": grid_id,
        }

    center_5x5 = _find_zone_center(point, RULE_5X5)
    if center_5x5:
        return {
            "in_special_zone": True,
            "special_zone_type": "5x5",
            "is_special_center": False,
            "special_center_grid_id": _to_grid_id(center_5x5),
        }

    center_3x3 = _find_zone_center(point, RULE_3X3)
    if center_3x3:
        return {
            "in_special_zone": True,
            "special_zone_type": "3x3",
            "is_special_center": False,
            "special_center_grid_id": _to_grid_id(center_3x3),
        }

    return {
        "in_special_zone": False,
        "special_zone_type": None,
        "is_special_center": False,
        "special_center_grid_id": None,
    }


def _grid_bounds(
    min_lat: float,
    max_lat: float,
    min_lng: float,
    max_lng: float,
) -> tuple[int, int, int, int]:
    row_start = math.floor(min_lat / LAT_STEP)
    row_end = math.floor(max_lat / LAT_STEP)
    col_start = math.floor(min_lng / LNG_STEP)
    col_end = math.floor(max_lng / LNG_STEP)
    return row_start, row_end, col_start, col_end


def _center_in_bounds(
    center: GridPoint,
    row_start: int,
    row_end: int,
    col_start: int,
    col_end: int,
) -> bool:
    return (
        row_start <= center.row <= row_end
        and col_start <= center.col <= col_end
    )


def get_special_centers_in_bounds(
    min_lat: float,
    max_lat: float,
    min_lng: float,
    max_lng: float,
) -> list[dict]:
    row_start, row_end, col_start, col_end = _grid_bounds(
        min_lat=min_lat,
        max_lat=max_lat,
        min_lng=min_lng,
        max_lng=max_lng,
    )

    centers: list[dict] = []
    seen: set[str] = set()

    for rule in (RULE_5X5, RULE_3X3):
        block_row_start = math.floor(row_start / rule.block_rows)
        block_row_end = math.floor(row_end / rule.block_rows)
        block_col_start = math.floor(col_start / rule.block_cols)
        block_col_end = math.floor(col_end / rule.block_cols)

        for block_row in range(block_row_start, block_row_end + 1):
            for block_col in range(block_col_start, block_col_end + 1):
                center = _center_for_block(block_row, block_col, rule)
                if not center:
                    continue
                if not _center_in_bounds(center, row_start, row_end, col_start, col_end):
                    continue

                center_grid_id = _to_grid_id(center)
                if center_grid_id in seen:
                    continue

                if rule.tile_type == "3x3" and not is_3x3_special_center(center_grid_id):
                    continue

                lat, lng = _tile_center_lat_lng(center)
                centers.append(
                    {
                        "grid_id": center_grid_id,
                        "special_type": rule.tile_type,
                        "lat": lat,
                        "lng": lng,
                    }
                )
                seen.add(center_grid_id)

    centers.sort(key=lambda item: (item["special_type"], item["grid_id"]))
    return centers
