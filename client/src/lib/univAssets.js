/**
 * lib/univAssets.js
 * ─────────────────
 * 대학교별 로고 URL · 브랜드 컬러 레지스트리
 *
 * ── 확장 방법 ──────────────────────────────────────────────────
 * UNIV_ASSETS['도메인'] = { name, color, logo }
 *   · name  : 표시할 학교명
 *   · color : 브랜드 컬러 HEX (헤더 배경에 사용)
 *   · logo  : 이미지 URL (null이면 이니셜 아바타로 자동 대체)
 *
 * ── 백엔드 연동 ────────────────────────────────────────────────
 * Organization.org_img (models.py) 값이 있으면 logo를 override합니다.
 * → getUnivAsset(email, orgImgFromServer)
 */

export const UNIV_ASSETS = {
  // ── 주요 국내 대학 ──────────────────────────────────────────
  'snu.ac.kr': {
    name:  '서울대학교',
    color: '#003478',
    logo:  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Seoul_National_University_emblem.svg/240px-Seoul_National_University_emblem.svg.png',
  },
  'yonsei.ac.kr': {
    name:  '연세대학교',
    color: '#00205B',
    logo:  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Yonsei_University_Emblem.svg/240px-Yonsei_University_Emblem.svg.png',
  },
  'korea.ac.kr': {
    name:  '고려대학교',
    color: '#8B0029',
    logo:  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Korea_University_seal.svg/240px-Korea_University_seal.svg.png',
  },
  'kaist.ac.kr': {
    name:  'KAIST',
    color: '#003865',
    logo:  null,
  },
  'postech.ac.kr': {
    name:  '포스텍',
    color: '#002060',
    logo:  null,
  },
  'hanyang.ac.kr': {
    name:  '한양대학교',
    color: '#C8102E',
    logo:  null,
  },
  'skku.edu': {
    name:  '성균관대학교',
    color: '#003087',
    logo:  null,
  },
  'sogang.ac.kr': {
    name:  '서강대학교',
    color: '#003DA5',
    logo:  null,
  },
  'ewha.ac.kr': {
    name:  '이화여자대학교',
    color: '#004B87',
    logo:  null,
  },
  'sookmyung.ac.kr': {
    name:  '숙명여자대학교',
    color: '#003087',
    logo:  null,
  },
  'cau.ac.kr': {
    name:  '중앙대학교',
    color: '#C8102E',
    logo:  null,
  },
  'khu.ac.kr': {
    name:  '경희대학교',
    color: '#005F86',
    logo:  null,
  },
  'hongik.ac.kr': {
    name:  '홍익대학교',
    color: '#002855',
    logo:  null,
  },
  'inha.ac.kr': {
    name:  '인하대학교',
    color: '#00275E',
    logo:  null,
  },
  'uos.ac.kr': {
    name:  '서울시립대학교',
    color: '#005BAC',
    logo:  null,
  },
  'konkuk.ac.kr': {
    name:  '건국대학교',
    color: '#004A97',
    logo:  null,
  },
  'dongguk.edu': {
    name:  '동국대학교',
    color: '#6E2C8C',
    logo:  null,
  },
  'hufs.ac.kr': {
    name:  '한국외국어대학교',
    color: '#00338D',
    logo:  null,
  },
  'ajou.ac.kr': {
    name:  '아주대학교',
    color: '#003087',
    logo:  null,
  },
  // ── 더 추가하려면 아래에 이어서 작성하세요 ─────────────────────
  // 'myuniv.ac.kr': {
  //   name:  '내 학교',
  //   color: '#123456',
  //   logo:  '/assets/logos/myuniv.png',  // public 폴더에 넣으면 됩니다
  // },
}

/**
 * getUnivAsset(email, serverLogoUrl?)
 * ─────────────────────────────────────
 * 이메일 도메인으로 대학 에셋을 반환합니다.
 * serverLogoUrl: 백엔드 Organization.org_img 값 (우선순위 높음)
 *
 * @returns { name, color, logo }
 */
export function getUnivAsset(email = '', serverLogoUrl = null) {
  const domain = email.split('@')[1] || ''
  const preset = UNIV_ASSETS[domain]

  return {
    name: preset?.name ?? (domain.replace(/\.(ac\.kr|edu)$/, '') || '내 학교'),
    color: preset?.color ?? '#EBB865',
    // 서버에서 내려온 로고가 있으면 그걸 우선 사용
    logo: serverLogoUrl ?? preset?.logo ?? null,
  }
}

/**
 * 대학 이름 이니셜 (최대 2자, 로고 없을 때 아바타 대체용)
 * 예: '서울대학교' → '서울' / 'KAIST' → 'KA'
 */
export function getUnivInitials(name = '') {
  if (!name) return '?'
  return /^[A-Za-z]/.test(name) ? name.slice(0, 2).toUpperCase() : name.slice(0, 2)
}

/**
 * 대학교 이름으로 브랜드 컬러를 반환합니다.
 */
export function getUnivColor(universityName = '') {
  const target = String(universityName || '').trim()
  if (!target) return '#EBB865'

  const found = Object.values(UNIV_ASSETS).find((item) => item.name === target)
  return found?.color || '#EBB865'
}
