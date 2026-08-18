function normalizeItems(items, isTv) {
  return (items || []).map((it) => {
    if (isTv) {
      return { ...it, title: it.name, release_date: it.first_air_date };
    }
    return it;
  });
}

async function attachPaymentBadges(items, endpoint, apiKey) {
  const results = await Promise.all(
    items.map(async (item) => {
      try {
        const r = await fetch(`https://api.themoviedb.org/3/${endpoint}/${item.id}/watch/providers?api_key=${apiKey}`);
        const data = await r.json();
        const kr = data && data.results && data.results.KR;
        const included = !!(kr && kr.flatrate && kr.flatrate.length > 0);
        const paidOnly = !included && !!(kr && ((kr.rent && kr.rent.length > 0) || (kr.buy && kr.buy.length > 0)));
        return { ...item, paymentBadge: included ? 'included' : (paidOnly ? 'paid' : null) };
      } catch (e) {
        return { ...item, paymentBadge: null };
      }
    })
  );
  return results;
}

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
    type = 'movie',
  } = req.query;

  const isTv = type === 'tv';
  const isDocumentary = type === 'documentary';
  const endpoint = isTv ? 'tv' : 'movie';

  let url;
  if (query) {
    url = `https://api.themoviedb.org/3/search/${endpoint}?api_key=${apiKey}&language=ko-KR&query=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}&region=KR`;
  } else {
    let sortBy = 'popularity.desc';
    if (sort === 'rating') sortBy = 'vote_average.desc';
    if (sort === 'latest') sortBy = isTv ? 'first_air_date.desc' : 'primary_release_date.desc';

    url = `https://api.themoviedb.org/3/discover/${endpoint}?api_key=${apiKey}&language=ko-KR&region=KR&watch_region=KR&sort_by=${sortBy}&page=${encodeURIComponent(page)}`;

    if (isDocumentary) {
      url += `&with_genres=99`;
    } else if (genre) {
      url += `&with_genres=${encodeURIComponent(genre)}`;
    }

    if (providers) url += `&with_watch_providers=${encodeURIComponent(providers)}`;
    if (flatrateOnly === 'true') url += `&watch_monetization_types=flatrate`;

    const minRatingNum = parseFloat(minRating);
    if (minRatingNum > 0) {
      url += `&vote_average.gte=${minRatingNum}&vote_count.gte=50`;
    } else if (sort === 'rating') {
      url += `&vote_count.gte=50`;
    }
    if (year) {
      url += isTv ? `&first_air_date_year=${encodeURIComponent(year)}` : `&primary_release_year=${encodeURIComponent(year)}`;
    }
  }

  try {
    const r = await fetch(url);
    const data = await r.json();
    if (data && data.results) {
      data.results = normalizeItems(data.results, isTv);
      data.results = await attachPaymentBadges(data.results, endpoint, apiKey);
    }
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: '목록을 불러오지 못했어요.' });
  }
}
