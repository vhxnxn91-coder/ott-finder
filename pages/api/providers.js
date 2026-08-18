export default async function handler(req, res) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'TMDB_API_KEY가 설정되지 않았어요.' });
    return;
  }
  try {
    const r = await fetch(`https://api.themoviedb.org/3/watch/providers/movie?api_key=${apiKey}&watch_region=KR&language=ko-KR`);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'OTT 목록을 불러오지 못했어요.' });
  }
}
