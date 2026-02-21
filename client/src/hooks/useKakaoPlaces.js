import { useMemo, useRef, useState } from "react";

export default function useKakaoPlaces(kakaoReady) {
  const psRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (keyword) => {
    if (!kakaoReady) return;
    const kakao = window.kakao;
    if (!psRef.current) psRef.current = new kakao.maps.services.Places();

    setLoading(true);

    return new Promise((resolve) => {
      psRef.current.keywordSearch(keyword, (data, status) => {
        setLoading(false);

        if (status === kakao.maps.services.Status.OK) {
          setItems(data);
          resolve(data);
        } else {
          setItems([]);
          resolve([]);
        }
      });
    });
  };

  const clear = () => setItems([]);

  const normalized = useMemo(
    () =>
      items.map((d) => ({
        id: d.id,
        name: d.place_name,
        address: d.road_address_name || d.address_name,
        lat: Number(d.y),
        lng: Number(d.x),
        category: d.category_name,
      })),
    [items]
  );

  return { loading, results: normalized, search, clear };
}