/**
 * 카카오맵 컴포넌트 (실시간 서버 연동 완벽 병합본)
 * ────────────────────────────
 * [기능 보완] useTiles 훅 연동, 실시간 서버 데이터 덮어쓰기(Merge), 생명주기 렌더링 버그 수정
 * [기존 로직] 클라이언트 그리드 계산, 마커, idle 이벤트, cleanup 유지
 * [내 디자인] 라이트 글래스모피즘 플레이스홀더, 대학교별 컬러, framer-motion 애니메이션 유지
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { useTiles } from '../hooks/useTiles'; // 🔥 [핵심 1] 서버 데이터를 가져오는 훅 연결

const MotionDiv = motion.div

// ─── 그리드 크기 상수 (도 단위, ~30m) ───────────────────────
const LAT_STEP = 0.00027;
const LNG_STEP = 0.00034;
const MAX_VISIBLE_TILES = 1200;

// ─── 대학교별 폴리곤 색상 ───────────────────────────────────
const UNIV_COLORS = {
  서울대학교: { fill: 'rgba(59, 130, 246, 0.40)', stroke: '#3b82f6' },
  연세대학교: { fill: 'rgba(56, 189, 248, 0.40)', stroke: '#38bdf8' },
  고려대학교: { fill: 'rgba(239, 68, 68, 0.40)', stroke: '#ef4444' },
  default: { fill: 'rgba(107, 114, 128, 0.05)', stroke: '#9ca3af' }, // 빈 땅은 더 연하게
};

/** @param {string|null} univ */
function getUnivColor(univ) {
  if (!univ) return UNIV_COLORS.default;
  return UNIV_COLORS[univ] || UNIV_COLORS.default;
}

/** 뷰포트 bounds로부터 클라이언트에서 뼈대 격자(Grid)를 계산한다. */
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

  const [mapReady, setMapReady] = useState(false);
  const [tileCount, setTileCount] = useState(0);

  const setMapBounds = useGameStore((s) => s.setMapBounds);
  const setSelectedTile = useGameStore((s) => s.setSelectedTile);

  // 🔥 [핵심 2] React Query를 통해 백엔드에서 실시간 타일(땅 주인) 데이터를 가져옴
  const { data: serverTiles } = useTiles();

  /** 기존 폴리곤 오버레이 전부 제거 */
  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((p) => p.setMap(null));
    overlaysRef.current = [];
  }, []);

  /** 🔥 [핵심 3] 빈 격자와 서버 데이터를 합쳐서(Merge) 진짜 지도를 그리는 함수 */
  const drawPolygons = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;

    // 1. 뼈대 격자 만들기
    const baseGrid = buildViewportTiles(bounds);

    // 2. 뼈대 위에 서버 데이터를 덮어씌움
    const mergedTiles = baseGrid.map((baseTile) => {
      // 서버 데이터 중에 현재 격자와 아이디가 같은 땅이 있는지 검색
      const realTile = serverTiles?.find((t) => t.grid_id === baseTile.grid_id);
      return realTile
        ? { ...baseTile, owner_univ: realTile.owner_univ, level: realTile.level }
        : baseTile;
    });

    clearOverlays();

    // 3. 지도 위에 칠하기
    const overlays = mergedTiles.map((tile) => {
      const color = getUnivColor(tile.owner_univ);
      const path = tile.polygon.map(
        (p) => new window.kakao.maps.LatLng(p.lat, p.lng)
      );

      const polygon = new window.kakao.maps.Polygon({
        map: mapRef.current,
        path,
        strokeWeight: tile.owner_univ ? 2 : 1, // 주인이 있으면 테두리를 두껍게
        strokeColor: color.stroke,
        strokeOpacity: tile.owner_univ ? 0.9 : 0.4,
        fillColor: color.fill,
        fillOpacity: tile.owner_univ ? 0.8 : 1,
      });

      // 클릭 시 바텀 시트 띄우기
      window.kakao.maps.event.addListener(polygon, 'click', () => {
        setSelectedTile(tile);
      });

      return polygon;
    });

    overlaysRef.current = overlays;
    setTileCount(mergedTiles.length);
  }, [clearOverlays, setSelectedTile, serverTiles]); // 서버 데이터(serverTiles)가 바뀌면 이 함수가 새로 고침됨

  /** 지도를 움직이고 멈췄을 때 실행 (서버에 새 범위 요청) */
  const handleIdle = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // Zustand 스토어 업데이트 -> useTiles 훅이 감지하고 서버에 GET 요청을 쏨
    setMapBounds({
      minLat: sw.getLat(),
      maxLat: ne.getLat(),
      minLng: sw.getLng(),
      maxLng: ne.getLng(),
    });

    drawPolygons(); // 당장 보이는 빈 땅이라도 먼저 그림
  }, [setMapBounds, drawPolygons]);

  // 🔥 [핵심 4] 서버 데이터가 도착하거나 화면에 돌아왔을 때 지도를 자동으로 다시 그리기
  useEffect(() => {
    if (mapReady) {
      drawPolygons();
    }
  }, [mapReady, serverTiles, drawPolygons]);

  // ─── 카카오맵 초기화 (무한 로딩 버그 완벽 해결) ──────────────────
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

          idleHandlerRef.current = handleIdle;
          window.kakao.maps.event.addListener(map, 'idle', idleHandlerRef.current);

          handleIdle(); // 초기 1회 실행으로 bounds 셋팅
          setMapReady(true);
        });
      }
    }, 100);

    return () => clearInterval(checkKakaoReady);
  }, []); // 마운트 시 한 번만 실행되도록 빈 배열 고정

  // ─── 내 위치 갱신 시 지도 덜덜거림 버그 해결 ────────────────────
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

  // ─── 컴포넌트 언마운트 시 리소스 정리 ─────────────────────
  useEffect(() => {
    return () => {
      if (mapRef.current && idleHandlerRef.current && window.kakao?.maps?.event) {
        window.kakao.maps.event.removeListener(
          mapRef.current,
          'idle',
          idleHandlerRef.current
        );
      }
      markerRef.current?.setMap(null);
      clearOverlays();
    };
  }, [clearOverlays]);

  const sdkMissing = !mapReady && !window.kakao?.maps;

  return (
    <div className="absolute inset-0">
      {/* 카카오맵 컨테이너 */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* 우상단 타일 카운터 뱃지 */}
      {tileCount > 0 && (
        <div className="absolute right-4 top-20 z-20 bg-white/80 backdrop-blur-md rounded-xl px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm border border-white/60">
          30m grid: {tileCount.toLocaleString()} cells
        </div>
      )}

      {/* SDK 미로드 시 라이트 모드 플레이스홀더 */}
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