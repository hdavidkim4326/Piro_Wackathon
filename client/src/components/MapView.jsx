/**
 * 카카오맵 컴포넌트 (색상 버그 완벽 수정본)
 * ─────────────────────────────────────────
 * [버그 수정 내역]
 *   1. fillColor를 rgba → hex로 변경 (카카오맵 API 호환)
 *   2. getUnivColor에 trim() 적용 + unknown 대학 눈에 띄는 색상 추가
 *   3. drawPolygonsRef 패턴으로 idle handler stale closure 버그 해결
 *   4. 디버깅용 console.log 추가
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { useTiles } from '../hooks/useTiles';

const MotionDiv = motion.div

// ─── 그리드 크기 상수 (도 단위, ~30m) ───────────────────────
const LAT_STEP = 0.00027;
const LNG_STEP = 0.00034;
const MAX_VISIBLE_TILES = 1200;

// ─── 대학교별 폴리곤 색상 (hex만 사용, 카카오맵 호환) ───────
const UNIV_COLORS = {
  서울대학교: { fill: '#3b82f6', stroke: '#2563eb', opacity: 0.40 },
  연세대학교: { fill: '#38bdf8', stroke: '#0ea5e9', opacity: 0.40 },
  고려대학교: { fill: '#ef4444', stroke: '#dc2626', opacity: 0.40 },
  우리대학교: { fill: '#a855f7', stroke: '#7c3aed', opacity: 0.40 },
  _unknown:  { fill: '#f97316', stroke: '#ea580c', opacity: 0.40 },
  _empty:    { fill: '#cbd5e1', stroke: '#94a3b8', opacity: 0.04 },
};

/** @param {string|null} univ */
function getUnivColor(univ) {
  if (!univ) return UNIV_COLORS._empty;
  const trimmed = univ.trim();
  return UNIV_COLORS[trimmed] || UNIV_COLORS._unknown;
}

/** 뷰포트 bounds로부터 클라이언트에서 뼈대 격자를 계산한다. */
function buildViewportTiles(bounds) {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const minLat = sw.getLat();
  const maxLat = ne.getLat();
  const minLng = sw.getLng();
  const maxLng = ne.getLng();

  const rowStart = Math.floor(minLat / LAT_STEP);
  const rowEnd = Math.floor(maxLat / LAT_STEP);
  const tiles = [];

  for (let row = rowStart; row <= rowEnd; row += 1) {
    const south = row * LAT_STEP;
    const north = south + LAT_STEP;
    const colStart = Math.floor(minLng / LNG_STEP);
    const colEnd = Math.floor(maxLng / LNG_STEP);

    for (let col = colStart; col <= colEnd; col += 1) {
      const west = col * LNG_STEP;
      const east = west + LNG_STEP;
      tiles.push({
        grid_id: `grid_${row}_${col}`,
        owner_univ: null,
        level: 0,
        polygon: [
          { lat: south, lng: west },
          { lat: north, lng: west },
          { lat: north, lng: east },
          { lat: south, lng: east },
        ],
      });
      if (tiles.length >= MAX_VISIBLE_TILES) return tiles;
    }
  }
  return tiles;
}

export default function MapView({ center }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const idleHandlerRef = useRef(null);
  const markerRef = useRef(null);
  const drawPolygonsRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [tileCount, setTileCount] = useState(0);

  const setMapBounds = useGameStore((s) => s.setMapBounds);
  const setSelectedTile = useGameStore((s) => s.setSelectedTile);

  const { data: serverTiles } = useTiles();

  /** 기존 폴리곤 오버레이 전부 제거 */
  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((p) => p.setMap(null));
    overlaysRef.current = [];
  }, []);

  /**
   * 빈 격자 + 서버 데이터를 합쳐서 폴리곤을 그린다.
   * fillColor는 반드시 hex 문자열을 써야 카카오맵이 인식한다.
   */
  const drawPolygons = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const bounds = mapRef.current.getBounds();
    if (!bounds) return;

    const baseGrid = buildViewportTiles(bounds);

    // 서버 데이터를 O(1) 룩업용 Map으로 변환
    const serverMap = new Map();
    if (serverTiles && serverTiles.length > 0) {
      serverTiles.forEach((t) => { serverMap.set(t.grid_id, t); });
    }

    const mergedTiles = baseGrid.map((baseTile) => {
      const real = serverMap.get(baseTile.grid_id);
      return real
        ? { ...baseTile, owner_univ: real.owner_univ, level: real.level }
        : baseTile;
    });

    // 디버깅: 점령된 타일이 있는지 콘솔에 출력
    const owned = mergedTiles.filter((t) => t.owner_univ);
    if (owned.length > 0) {
      console.log('[MapView] 서버가 준 점령 타일:', owned);
    }

    clearOverlays();

    const overlays = mergedTiles.map((tile) => {
      const isOwned = !!tile.owner_univ;
      const color = getUnivColor(tile.owner_univ);
      const path = tile.polygon.map(
        (p) => new window.kakao.maps.LatLng(p.lat, p.lng)
      );

      const polygon = new window.kakao.maps.Polygon({
        map: mapRef.current,
        path,
        strokeWeight: isOwned ? 2 : 1,
        strokeColor: color.stroke,
        strokeOpacity: isOwned ? 0.9 : 0.3,
        fillColor: color.fill,
        fillOpacity: isOwned ? color.opacity : UNIV_COLORS._empty.opacity,
      });

      window.kakao.maps.event.addListener(polygon, 'click', () => {
        setSelectedTile(tile);
      });

      return polygon;
    });

    overlaysRef.current = overlays;
    setTileCount(mergedTiles.length);
  }, [clearOverlays, setSelectedTile, serverTiles]);

  // drawPolygonsRef를 항상 최신으로 유지 → idle handler가 stale closure에 빠지지 않음
  useEffect(() => {
    drawPolygonsRef.current = drawPolygons;
  }, [drawPolygons]);

  /** 지도 idle 시 bounds 갱신 + 즉시 렌더 (ref를 통해 항상 최신 drawPolygons 호출) */
  const handleIdle = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    setMapBounds({
      minLat: sw.getLat(),
      maxLat: ne.getLat(),
      minLng: sw.getLng(),
      maxLng: ne.getLng(),
    });

    drawPolygonsRef.current?.();
  }, [setMapBounds]);

  // 서버 타일이 갱신되면 즉시 다시 그린다
  useEffect(() => {
    if (mapReady) {
      drawPolygons();
    }
  }, [mapReady, serverTiles, drawPolygons]);

  // ─── 카카오맵 SDK 초기화 ────────────────────────────────────
  useEffect(() => {
    const checkKakaoReady = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
        clearInterval(checkKakaoReady);

        window.kakao.maps.load(() => {
          if (mapRef.current) return;

          const map = new window.kakao.maps.Map(mapContainerRef.current, {
            center: new window.kakao.maps.LatLng(center.lat, center.lng),
            level: 3,
          });

          mapRef.current = map;
          markerRef.current = new window.kakao.maps.Marker({
            map,
            position: new window.kakao.maps.LatLng(center.lat, center.lng),
          });

          window.kakao.maps.event.addListener(map, 'idle', handleIdle);

          handleIdle();
          setMapReady(true);
        });
      }
    }, 100);

    return () => clearInterval(checkKakaoReady);
  }, []);

  // ─── 내 위치 갱신 시 지도 중심 이동 ────────────────────────
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const currentCenter = mapRef.current.getCenter();
    if (Math.abs(currentCenter.getLat() - center.lat) > 0.0001 ||
        Math.abs(currentCenter.getLng() - center.lng) > 0.0001) {
      const position = new window.kakao.maps.LatLng(center.lat, center.lng);
      mapRef.current.setCenter(position);
      markerRef.current?.setPosition(position);
    }
  }, [center.lat, center.lng]);

  // ─── 언마운트 시 리소스 정리 ────────────────────────────────
  useEffect(() => {
    return () => {
      if (mapRef.current && window.kakao?.maps?.event) {
        window.kakao.maps.event.removeListener(mapRef.current, 'idle', handleIdle);
      }
      markerRef.current?.setMap(null);
      clearOverlays();
    };
  }, [handleIdle, clearOverlays]);

  const sdkMissing = !mapReady && !window.kakao?.maps;

  return (
    <div className="absolute inset-0">
      <div ref={mapContainerRef} className="h-full w-full" />

      {tileCount > 0 && (
        <div className="absolute right-4 top-20 z-20 bg-white/80 backdrop-blur-md rounded-xl px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm border border-white/60">
          30m grid: {tileCount.toLocaleString()} cells
        </div>
      )}

      {sdkMissing && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          <MotionDiv
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, delay: 0.2 }}
            className="relative z-10 text-center px-8"
          >
            <MotionDiv
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-white/80 backdrop-blur-sm shadow-lg shadow-indigo-500/10 border border-white/60 flex items-center justify-center text-4xl"
            >
              🗺️
            </MotionDiv>

            <h2 className="text-xl font-extrabold text-slate-700 tracking-tight mb-2">
              지도 로딩 대기중
            </h2>
            <p className="text-sm text-slate-400 font-medium max-w-[260px] mx-auto leading-relaxed">
              카카오맵 연결을 준비하고 있습니다.
            </p>

            {center && (
              <div className="mt-5 inline-flex flex-col gap-1 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 text-[11px] font-medium text-slate-400">
                <span>📍 {center.lat.toFixed(6)}, {center.lng.toFixed(6)}</span>
              </div>
            )}
          </MotionDiv>
        </div>
      )}
    </div>
  );
}
