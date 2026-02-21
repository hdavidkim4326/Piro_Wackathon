from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GridPoint:
    row: int
    col: int


SPECIAL_3X3_INTERVAL = 18
SPECIAL_3X3_ROW_OFFSET = 4
SPECIAL_3X3_COL_OFFSET = 9

SPECIAL_5X5_INTERVAL = 30
SPECIAL_5X5_ROW_OFFSET = 12
SPECIAL_5X5_COL_OFFSET = 3


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


def _is_periodic_center(
    point: GridPoint,
    interval: int,
    row_offset: int,
    col_offset: int,
) -> bool:
    return (
        (point.row - row_offset) % interval == 0
        and (point.col - col_offset) % interval == 0
    )


def is_5x5_special_center(grid_id: str) -> bool:
    point = parse_grid_id(grid_id)
    if not point:
        return False
    return _is_periodic_center(
        point,
        interval=SPECIAL_5X5_INTERVAL,
        row_offset=SPECIAL_5X5_ROW_OFFSET,
        col_offset=SPECIAL_5X5_COL_OFFSET,
    )


def is_3x3_special_center(grid_id: str) -> bool:
    point = parse_grid_id(grid_id)
    if not point:
        return False
    return _is_periodic_center(
        point,
        interval=SPECIAL_3X3_INTERVAL,
        row_offset=SPECIAL_3X3_ROW_OFFSET,
        col_offset=SPECIAL_3X3_COL_OFFSET,
    )


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


def _candidate_centers(
    point: GridPoint,
    interval: int,
    row_offset: int,
    col_offset: int,
) -> list[GridPoint]:
    base_row_k = (point.row - row_offset) // interval
    base_col_k = (point.col - col_offset) // interval

    centers: list[GridPoint] = []
    for row_k in (base_row_k - 1, base_row_k, base_row_k + 1):
        center_row = row_offset + row_k * interval
        for col_k in (base_col_k - 1, base_col_k, base_col_k + 1):
            center_col = col_offset + col_k * interval
            centers.append(GridPoint(row=center_row, col=center_col))
    return centers


def _in_3x3_cross(point: GridPoint, center: GridPoint) -> bool:
    return abs(point.row - center.row) + abs(point.col - center.col) <= 1


def _in_5x5_diamond(point: GridPoint, center: GridPoint) -> bool:
    return abs(point.row - center.row) + abs(point.col - center.col) <= 2


def _find_zone_center(
    point: GridPoint,
    interval: int,
    row_offset: int,
    col_offset: int,
    zone_contains,
) -> GridPoint | None:
    best_center: GridPoint | None = None
    best_distance: int | None = None

    for center in _candidate_centers(point, interval, row_offset, col_offset):
        if not zone_contains(point, center):
            continue

        distance = abs(point.row - center.row) + abs(point.col - center.col)
        if best_center is None or distance < (best_distance or 0):
            best_center = center
            best_distance = distance

    return best_center


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

    center_5x5 = _find_zone_center(
        point,
        interval=SPECIAL_5X5_INTERVAL,
        row_offset=SPECIAL_5X5_ROW_OFFSET,
        col_offset=SPECIAL_5X5_COL_OFFSET,
        zone_contains=_in_5x5_diamond,
    )
    if center_5x5:
        return {
            "in_special_zone": True,
            "special_zone_type": "5x5",
            "is_special_center": False,
            "special_center_grid_id": _to_grid_id(center_5x5),
        }

    center_3x3 = _find_zone_center(
        point,
        interval=SPECIAL_3X3_INTERVAL,
        row_offset=SPECIAL_3X3_ROW_OFFSET,
        col_offset=SPECIAL_3X3_COL_OFFSET,
        zone_contains=_in_3x3_cross,
    )
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
