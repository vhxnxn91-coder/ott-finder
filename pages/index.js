import { useState, useEffect, useRef, useCallback } from 'react';

const IMG_POSTER = 'https://image.tmdb.org/t/p/w342';
const IMG_LOGO = 'https://image.tmdb.org/t/p/w92';

const SORT_OPTIONS = [
  { value: 'popularity', label: '인기순' },
  { value: 'rating', label: '평점 높은순' },
  { value: 'latest', label: '최신순' },
];
const RATING_OPTIONS = [0, 6, 7, 8, 9];
const YEAR_OPTIONS = ['', '2026', '2025', '2024', '2023'];
const TYPE_OPTIONS = [
  { value: 'movie', label: '영화' },
  { value: 'tv', label: '드라마' },
  { value: 'documentary', label: '다큐멘터리' },
];

function Sprockets() {
  const holes = new Array(28).fill(0);
  return (
    <div className="sprockets">
      {holes.map((_, i) => <span key={i} />)}
    </div>
  );
}

function HomeMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="var(--marquee)" strokeWidth="2" />
      <path d="M10 8.2v7.6L16 12l-6-3.8z" fill="var(--marquee)" />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

function ProviderChip({ p, active, onClick }) {
  return (
    <button onClick={onClick} title={p.provider_name} className={`provider-chip${active ? ' active' : ''}`}>
      {p.logo_path ? <img src={IMG_LOGO + p.logo_path} alt={p.provider_name} /> : null}
    </button>
  );
}

function MovieCard({ movie, onClick }) {
  const year = (movie.release_date || '').slice(0, 4);
  return (
    <button onClick={onClick} className="movie-card">
      <div className="poster-wrap">
        {movie.poster_path
          ? <img src={IMG_POSTER + movie.poster_path} alt={movie.title} />
          : <div className="poster-empty">포스터 없음</div>}
        <div className="badge-row">
          {movie.paymentBadge === 'paid' && <span className="paid-tag">개별구매</span>}
          {movie.vote_average > 0 && <span className="rating-badge">{movie.vote_average.toFixed(1)}</span>}
        </div>
      </div>
      <div className="movie-info">
        <div className="movie-title">{movie.title}</div>
        <div className="movie-year">{year || '연도 미상'}</div>
      </div>
    </button>
  );
}

function ProviderGroup({ label, items, tone }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="provider-group">
      <div className="provider-group-label" style={{ color: tone === 'included' ? 'var(--mint)' : 'var(--crimson)' }}>{label}</div>
      <div className="provider-list">
        {items.map((p) => (
          <div key={p.provider_id} className="provider-item">
            {p.logo_path ? <img src={IMG_LOGO + p.logo_path} alt={p.provider_name} /> : null}
            <span className="provider-item-name">{p.provider_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MovieModal({ movieId, mediaType, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch(`/api/movie/${movieId}?type=${mediaType}`)
      .then((r) => { if (!r.ok) throw new Error('fail'); return r.json(); })
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch(() => { if (!cancelled) setError('정보를 불러오지 못했어요.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [movieId, mediaType]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const kr = detail && detail['watch/providers'] && detail['watch/providers'].results && detail['watch/providers'].results.KR;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {loading && <Spinner />}
        {error && <div style={{ padding: 24, fontSize: 14, color: 'var(--crimson)' }}>{error}</div>}
        {detail && !loading && (
          <div>
            <div className="modal-header">
              <div className="modal-poster">
                {detail.poster_path ? <img src={IMG_POSTER + detail.poster_path} alt={detail.title} /> : null}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="modal-title">{detail.title}</div>
                <div className="modal-meta">{(detail.release_date || '').slice(0, 4)} · {(detail.genres || []).map((g) => g.name).join(', ')}</div>
                {detail.vote_average > 0 && <div className="modal-rating">★ {detail.vote_average.toFixed(1)}</div>}
              </div>
              <button onClick={onClose} className="modal-close" aria-label="닫기">✕</button>
            </div>

            {detail.overview && <p className="modal-overview">{detail.overview}</p>}

            <div className="modal-section">
              <div className="modal-section-title">어디서 볼 수 있나요</div>
              {!kr && <div className="modal-note">국내 OTT에서 제공 정보를 찾지 못했어요.</div>}
              {kr && (
                <>
                  <ProviderGroup label="구독으로 시청 가능" items={kr.flatrate} tone="included" />
                  <ProviderGroup label="대여 — 별도 결제 필요" items={kr.rent} tone="paid" />
                  <ProviderGroup label="구매 — 별도 결제 필요" items={kr.buy} tone="paid" />
                  {!kr.flatrate && !kr.rent && !kr.buy && <div className="modal-note">국내 OTT에서 제공 정보를 찾지 못했어요.</div>}
                  <p className="modal-note">정확한 요금은 표시되지 않아요. 각 서비스에서 직접 확인해주세요.</p>
                  {kr.link && <a href={kr.link} target="_blank" rel="noreferrer" className="modal-link">JustWatch에서 자세히 보기</a>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterDrawer({
  open, onClose, genres, selectedGenre, setSelectedGenre,
  sortBy, setSortBy, minRating, setMinRating, releaseYear, setReleaseYear,
  flatrateOnly, setFlatrateOnly, contentType, setContentType,
  onAcclaimed, onClearAll,
}) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">필터</div>
          <button onClick={onClose} className="drawer-close" aria-label="닫기">✕</button>
        </div>

        <button onClick={onAcclaimed} className="acclaimed-btn">⭐ 극찬받은 작품만 보기</button>

        <div className="drawer-section">
          <div className="drawer-section-title">종류</div>
          <div className="drawer-chip-row">
            {TYPE_OPTIONS.map((t) => (
              <button key={t.value} onClick={() => setContentType(t.value)} className={`drawer-chip${contentType === t.value ? ' active' : ''}`}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">정렬</div>
          <div className="drawer-chip-row">
            {SORT_OPTIONS.map((s) => (
              <button key={s.value} onClick={() => setSortBy(s.value)} className={`drawer-chip${sortBy === s.value ? ' active' : ''}`}>{s.label}</button>
            ))}
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">평점</div>
          <div className="drawer-chip-row">
            {RATING_OPTIONS.map((r) => (
              <button key={r} onClick={() => setMinRating(r)} className={`drawer-chip${minRating === r ? ' active' : ''}`}>{r === 0 ? '전체' : `${r}+`}</button>
            ))}
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">개봉년도</div>
          <div className="drawer-chip-row">
            {YEAR_OPTIONS.map((y) => (
              <button key={y || 'all'} onClick={() => setReleaseYear(y)} className={`drawer-chip${releaseYear === y ? ' active' : ''}`}>{y || '전체'}</button>
            ))}
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">보기 옵션</div>
          <label className="checkbox-label">
            <input type="checkbox" checked={flatrateOnly} onChange={(e) => setFlatrateOnly(e.target.checked)} />
            구독으로 볼 수 있는 것만
          </label>
        </div>

        {contentType !== 'documentary' && (
          <div className="drawer-section">
            <div className="drawer-section-title">장르</div>
            <div className="drawer-genre-list">
              <button onClick={() => setSelectedGenre('')} className={`drawer-genre-item${!selectedGenre ? ' active' : ''}`}>전체</button>
              {genres.map((g) => (
                <button key={g.id} onClick={() => setSelectedGenre(String(g.id))} className={`drawer-genre-item${String(selectedGenre) === String(g.id) ? ' active' : ''}`}>{g.name}</button>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClearAll} className="drawer-clear-btn">필터 초기화</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [contentType, setContentType] = useState('movie');
  const [movieGenres, setMovieGenres] = useState([]);
  const [tvGenres, setTvGenres] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [flatrateOnly, setFlatrateOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');
  const [minRating, setMinRating] = useState(0);
  const [releaseYear, setReleaseYear] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');

  const [openMovie, setOpenMovie] = useState(null);

  const requestSeq = useRef(0);
  const genres = contentType === 'tv' ? tvGenres : movieGenres;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 450);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    fetch('/api/genres?type=movie').then((r) => r.json()).then((d) => setMovieGenres(d.genres || [])).catch(() => {});
    fetch('/api/genres?type=tv').then((r) => r.json()).then((d) => setTvGenres(d.genres || [])).catch(() => {});
    fetch('/api/providers').then((r) => r.json()).then((d) => {
      const list = (d.results || []).slice().sort((a, b) => {
        const pa = (a.display_priorities && a.display_priorities.KR) ?? 999;
        const pb = (b.display_priorities && b.display_priorities.KR) ?? 999;
        return pa - pb;
      }).slice(0, 14);
      setProviders(list);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedGenre('');
  }, [contentType]);

  const fetchPage = useCallback((pageNum, replace) => {
    const mySeq = ++requestSeq.current;
    setLoadingList(true);
    setListError('');
    const params = new URLSearchParams();
    params.set('page', String(pageNum));
    params.set('type', contentType);
    if (debouncedQuery) {
      params.set('query', debouncedQuery);
    } else {
      if (selectedGenre) params.set('genre', selectedGenre);
      const providersParam = selectedProvider ? String(selectedProvider) : providers.map((p) => p.provider_id).join('|');
      if (providersParam) params.set('providers', providersParam);
      if (flatrateOnly) params.set('flatrateOnly', 'true');
      if (sortBy !== 'popularity') params.set('sort', sortBy);
      if (minRating > 0) params.set('minRating', String(minRating));
      if (releaseYear) params.set('year', releaseYear);
    }
    fetch(`/api/movies?${params.toString()}`)
      .then((r) => { if (!r.ok) throw new Error('fail'); return r.json(); })
      .then((d) => {
        if (mySeq !== requestSeq.current) return;
        setTotalPages(d.total_pages || 1);
        setMovies((prev) => (replace ? (d.results || []) : [...prev, ...(d.results || [])]));
        setPage(pageNum);
      })
      .catch(() => { if (mySeq === requestSeq.current) setListError('목록을 불러오지 못했어요.'); })
      .finally(() => { if (mySeq === requestSeq.current) setLoadingList(false); });
  }, [debouncedQuery, selectedGenre, selectedProvider, providers, flatrateOnly, sortBy, minRating, releaseYear, contentType]);

  useEffect(() => {
    if (!debouncedQuery && providers.length === 0) return;
    setMovies([]);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, selectedGenre, selectedProvider, providers.length, flatrateOnly, sortBy, minRating, releaseYear, contentType]);

  const filtersDisabled = !!debouncedQuery;

  function applyAcclaimed() {
    setSortBy('rating');
    setMinRating(8);
    setDrawerOpen(false);
  }
  function clearAllFilters() {
    setSelectedGenre('');
    setSortBy('popularity');
    setMinRating(0);
    setReleaseYear('');
    setFlatrateOnly(false);
    setContentType('movie');
  }
  function goHome() {
    setQuery('');
    setSelectedProvider(null);
    clearAllFilters();
    setDrawerOpen(false);
    setOpenMovie(null);
  }

  const activeFilters = [];
  if (contentType !== 'movie') {
    const t = TYPE_OPTIONS.find((x) => x.value === contentType);
    activeFilters.push({ label: t ? t.label : contentType, clear: () => setContentType('movie') });
  }
  if (selectedGenre) {
    const g = genres.find((x) => String(x.id) === String(selectedGenre));
    activeFilters.push({ label: g ? g.name : '장르', clear: () => setSelectedGenre('') });
  }
  if (sortBy !== 'popularity') {
    const s = SORT_OPTIONS.find((x) => x.value === sortBy);
    activeFilters.push({ label: s ? s.label : sortBy, clear: () => setSortBy('popularity') });
  }
  if (minRating > 0) {
    activeFilters.push({ label: `평점 ${minRating}+`, clear: () => setMinRating(0) });
  }
  if (releaseYear) {
    activeFilters.push({ label: `${releaseYear}년`, clear: () => setReleaseYear('') });
  }
  if (flatrateOnly) {
    activeFilters.push({ label: '구독 포함만', clear: () => setFlatrateOnly(false) });
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40 }}>
      <Sprockets />

      <div className="header">
        <div className="header-top">
          <button onClick={goHome} className="logo-btn" aria-label="홈으로">
            <HomeMark />
            <span className="eyebrow">OTT FINDER</span>
          </button>
          <button onClick={() => setDrawerOpen(true)} className="hamburger-btn" aria-label="필터 메뉴">☰</button>
        </div>
        <h1 className="title">어디서 볼 수 있을까?</h1>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목으로 검색"
          className="search-input"
        />

        <div className={`filters${filtersDisabled ? ' disabled' : ''}`}>
          <div className="provider-row">
            <button onClick={() => setSelectedProvider(null)} className={`provider-all${!selectedProvider ? ' active' : ''}`}>전체</button>
            {providers.map((p) => (
              <ProviderChip key={p.provider_id} p={p} active={selectedProvider === p.provider_id} onClick={() => setSelectedProvider(p.provider_id)} />
            ))}
          </div>

          {activeFilters.length > 0 && (
            <div className="filter-chips">
              {activeFilters.map((f, i) => (
                <span key={i} className="filter-chip">
                  {f.label}
                  <button onClick={f.clear} aria-label="필터 제거">✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
        {filtersDisabled && <div className="hint">검색 중에는 필터가 적용되지 않아요.</div>}
      </div>

      <div className="content">
        {listError && (
          <div className="error-banner">
            <div style={{ fontSize: 14 }}>{listError}</div>
            <button onClick={() => fetchPage(1, true)} className="retry-btn">다시 시도</button>
          </div>
        )}

        {movies.length === 0 && !loadingList && !listError && (
          <div className="empty-state">결과가 없어요. 다른 조건으로 찾아보세요.</div>
        )}

        <div className="movie-grid">
          {movies.map((m, i) => (
            <MovieCard key={`${m.id}-${i}`} movie={m} onClick={() => setOpenMovie({ id: m.id, type: contentType === 'tv' ? 'tv' : 'movie' })} />
          ))}
        </div>

        {loadingList && <Spinner />}

        {!loadingList && page < totalPages && movies.length > 0 && (
          <div className="load-more-wrap">
            <button onClick={() => fetchPage(page + 1, false)} className="load-more-btn">더 보기</button>
          </div>
        )}
      </div>

      <div className="footer">영화 데이터 제공: TMDB · OTT 이용 정보 제공: JustWatch</div>

      {openMovie && <MovieModal movieId={openMovie.id} mediaType={openMovie.type} onClose={() => setOpenMovie(null)} />}

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        genres={genres}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        sortBy={sortBy}
        setSortBy={setSortBy}
        minRating={minRating}
        setMinRating={setMinRating}
        releaseYear={releaseYear}
        setReleaseYear={setReleaseYear}
        flatrateOnly={flatrateOnly}
        setFlatrateOnly={setFlatrateOnly}
        contentType={contentType}
        setContentType={setContentType}
        onAcclaimed={applyAcclaimed}
        onClearAll={clearAllFilters}
      />
    </div>
  );
}
