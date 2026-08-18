export default async function handler(req, res) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'TMDB_API_KEY가 설정되지 않았어요.' });
    return;
  }

  const {
    query = '',
    page = '1',
    genre = '',
    providers = '',
    flatrateOnly = '',
    sort = 'popularity',
    minRating = '0',
    year = '',
  } = req.query;

  let url;
  if (query) {
    url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=ko-KR&query=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}&region=KR`;
  } else {
    let sortBy = 'popularity.desc';
    if (sort === 'rating') sortBy = 'vote_average.desc';
    if (sort === 'latest') sortBy = 'primary_release_date.desc';

    url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=ko-KR&region=KR&watch_region=KR&sort_by=${sortBy}&page=${encodeURIComponent(page)}`;
    if (genre) url += `&with_genres=${encodeURIComponent(genre)}`;
    if (providers) url += `&with_watch_providers=${encodeURIComponent(providers)}`;
    if (flatrateOnly === 'true') url += `&watch_monetization_types=flatrate`;

    const minRatingNum = parseFloat(minRating);
    if (minRatingNum > 0) {
      url += `&vote_average.gte=${minRatingNum}&vote_count.gte=50`;
    } else if (sort === 'rating') {
      url += `&vote_count.gte=50`;
    }
    if (year) url += `&primary_release_year=${encodeURIComponent(year)}`;
  }

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: '영화 목록을 불러오지 못했어요.' });
  }
}
