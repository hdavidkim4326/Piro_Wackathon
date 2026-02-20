"""
그리드 계산 유틸리티
──────────────────
위도(lat)·경도(lng) 좌표를 약 30m × 30m 크기의 그리드 ID로 변환하고,
해당 그리드의 네 꼭짓점(polygon) 좌표를 반환한다.

PostGIS 같은 GIS 라이브러리 없이 단순 수학 연산만 사용한다.
"""

import math

# ─── 그리드 크기 상수 (도 단위) ──────────────────────────────
# 위도 1도 ≈ 111km → 30m ≈ 0.00027도
# 경도 1도 ≈ 88km (한국 위도 기준) → 30m ≈ 0.00034도
LAT_STEP = 0.00027
LNG_STEP = 0.00034


def to_grid_id(lat: float, lng: float) -> str:
    """
    위도·경도를 받아서 해당 좌표가 속하는 그리드의 고유 ID를 반환한다.

    Args:
        lat: 위도 (예: 37.5665)
        lng: 경도 (예: 126.9780)

    Returns:
        "grid_{row}_{col}" 형태의 문자열 (예: "grid_139131_373471")
    """
    row = math.floor(lat / LAT_STEP)
    col = math.floor(lng / LNG_STEP)
    return f"grid_{row}_{col}"


def grid_polygon(grid_id: str) -> list[dict[str, float]]:
    """
    그리드 ID로부터 네 꼭짓점(polygon) 좌표를 계산해 반환한다.
    카카오맵 폴리곤 렌더링에 사용된다.

    Args:
        grid_id: "grid_{row}_{col}" 형태의 문자열

    Returns:
        [SW, NW, NE, SE] 순서의 좌표 리스트.
        각 항목은 {"lat": float, "lng": float} 딕셔너리.
    """
    # "grid_139131_373471" → row=139131, col=373471
    parts = grid_id.split("_")
    row = int(parts[1])
    col = int(parts[2])

    # 그리드 좌하단(SW) 좌표 = row * LAT_STEP, col * LNG_STEP
    south = row * LAT_STEP
    north = south + LAT_STEP
    west = col * LNG_STEP
    east = west + LNG_STEP

    return [
        {"lat": south, "lng": west},   # SW (좌하단)
        {"lat": north, "lng": west},   # NW (좌상단)
        {"lat": north, "lng": east},   # NE (우상단)
        {"lat": south, "lng": east},   # SE (우하단)
    ]


def get_viewport_grid_ids(
    min_lat: float, max_lat: float, min_lng: float, max_lng: float
) -> list[str]:
    """
    지도 뷰포트(화면에 보이는 영역) 안에 포함되는 모든 그리드 ID를 반환한다.

    Args:
        min_lat: 뷰포트 남쪽 경계 위도
        max_lat: 뷰포트 북쪽 경계 위도
        min_lng: 뷰포트 서쪽 경계 경도
        max_lng: 뷰포트 동쪽 경계 경도

    Returns:
        뷰포트 안에 있는 그리드 ID 리스트
    """
    row_start = math.floor(min_lat / LAT_STEP)
    row_end = math.floor(max_lat / LAT_STEP)
    col_start = math.floor(min_lng / LNG_STEP)
    col_end = math.floor(max_lng / LNG_STEP)

    grid_ids = []
    for r in range(row_start, row_end + 1):
        for c in range(col_start, col_end + 1):
            grid_ids.append(f"grid_{r}_{c}")

    return grid_ids
