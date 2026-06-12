"""
Adverse media screening via News API.
Searches for negative news mentions (crime, fraud, sanctions, money laundering)
and classifies articles using keyword matching.
"""
import logging
from django.conf import settings

logger = logging.getLogger('services.adverse_media')

NEGATIVE_KEYWORDS = [
    'fraud', 'money laundering', 'bribery', 'corruption', 'embezzlement',
    'sanction', 'arrested', 'convicted', 'indicted', 'terrorism',
    'financial crime', 'tax evasion', 'smuggling', 'drug trafficking',
]


class AdverseMediaEngine:

    def screen(self, name: str) -> dict:
        """
        Search news for adverse mentions of a name.
        Returns {'has_adverse_media': bool, 'articles': list, 'risk_signals': list}
        """
        try:
            import httpx
            api_key = getattr(settings, 'NEWS_API_KEY', '')
            if not api_key:
                return {'has_adverse_media': False, 'articles': [], 'risk_signals': []}

            params = {
                'q': f'"{name}" AND (fraud OR "money laundering" OR sanctions OR corruption)',
                'language': 'en',
                'pageSize': 10,
                'sortBy': 'relevancy',
                'apiKey': api_key,
            }

            with httpx.Client(timeout=15) as client:
                resp = client.get('https://newsapi.org/v2/everything', params=params)
                resp.raise_for_status()
                articles = resp.json().get('articles', [])

            risk_signals = []
            flagged_articles = []

            for article in articles:
                title = (article.get('title') or '').lower()
                description = (article.get('description') or '').lower()
                text = f"{title} {description}"

                found_keywords = [kw for kw in NEGATIVE_KEYWORDS if kw in text]
                if found_keywords:
                    risk_signals.extend(found_keywords)
                    flagged_articles.append({
                        'title': article.get('title'),
                        'url': article.get('url'),
                        'published_at': article.get('publishedAt'),
                        'source': article.get('source', {}).get('name'),
                        'keywords': found_keywords,
                    })

            return {
                'has_adverse_media': bool(flagged_articles),
                'articles': flagged_articles[:5],
                'risk_signals': list(set(risk_signals)),
            }

        except Exception as exc:
            logger.exception('Adverse media screening error for %s: %s', name, exc)
            return {'has_adverse_media': False, 'articles': [], 'risk_signals': [], 'error': str(exc)}
