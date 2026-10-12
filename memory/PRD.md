# Madre: Árvore da Vida — PRD
## Problem
School end-of-year project app about the deforestation (desarborização) of Madre de Deus, Bahia: maps of how tree cover looked 10/20/30 years ago vs. today, plus air quality impact. Name: "Madre: Árvore da Vida".
## User choices
Time-slider vegetation map (1994/2004/2014/2024), no AI, citizen reports with photo + GPS, data/charts + action tips, quiz. Later: Emergent Google sign-in + Apple sign-in.
## Architecture
Expo SDK 57 (expo-router, tabs: Mapa/Dados/Denunciar/Quiz; stack: comparar, nova-denuncia, login). Leaflet map in WebView (iframe on web), Esri satellite/OSM tiles. FastAPI + MongoDB. Emergent Object Storage for photos. Auth: Emergent Google OAuth (/api/auth/session) + Apple (/api/auth/apple, JWKS verify), Bearer session tokens (7 days), root Stack.Protected gate.
## Implemented (2026-06)
- Map with an illustrative vegetation model per year, lost areas, report markers, layer toggle, 30-year animation, Antes x Agora screen
- Dados: KPIs, coverage bars, PM10 line chart, trees per person, tips, sources (MapBiomas, Google Earth Timelapse, IBGE)
- Reports: photo (camera/gallery) + location with a permission flow, categories, list
- Quiz with 10 questions
- Google + Apple login, logout
## Backlog
P1: show real historical satellite imagery (Esri Wayback); report detail/delete UI; class leaderboard for the quiz
P2: PDF export of data for the school presentation; replace the illustrative polygons with MapBiomas-derived data
## Update (2026-06, iteration 2)
- Vegetation patches moved inside the real island outline (OSM); map fits/limits to the island
- Years now 1996/2006/2016/2026 (CURRENT_YEAR=2026)
- Tap a patch -> sheet with real satellite before (Esri Wayback 2014) x after (2026), loss %, cause, Google Maps link, fauna impact
- Dados: "Fauna que sumiu" card (birds -42%, insects -53%, migratory route change); quiz now 12 questions
