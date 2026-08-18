export default async function handler(req, res) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'TMDB_API_KEY가 설정되지 않았어요.' });
    return;
  }

  const { id } = req.query;
  try {
    const r = await fetch(`https://api.themoviedb.org/3/movie/${encodeURIComponent(id)}?api_key=${apiKey}&language=ko-KR&append_to_response=watch/providers`);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: '영화 정보를 불러오지 못했어요.' });
  }
}
