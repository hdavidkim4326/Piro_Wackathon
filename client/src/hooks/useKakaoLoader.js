import { useEffect, useState } from "react";

export default function useKakaoLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const kakao = window.kakao;
    if (!kakao || !kakao.maps) return;

    // autoload=false 일 때 load 필요
    kakao.maps.load(() => setReady(true));
  }, []);

  return ready;
}