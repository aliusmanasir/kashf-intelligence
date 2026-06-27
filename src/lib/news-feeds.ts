export type NewsFeed = {
  id: string;
  publisher: string;
  url: string;
  region: string;
  defaultCategory: string;
};

// Curated Gulf + global financial RSS feeds. All publicly published RSS.
export const NEWS_FEEDS: NewsFeed[] = [
  {
    id: "thenational-business",
    publisher: "The National",
    url: "https://www.thenationalnews.com/rss/business",
    region: "UAE",
    defaultCategory: "Business",
  },
  {
    id: "arabnews-business",
    publisher: "Arab News",
    url: "https://www.arabnews.com/rss.xml",
    region: "Saudi Arabia",
    defaultCategory: "Business",
  },
  {
    id: "gulfnews-business",
    publisher: "Gulf News",
    url: "https://gulfnews.com/business/rss",
    region: "UAE",
    defaultCategory: "Business",
  },
  {
    id: "khaleejtimes-business",
    publisher: "Khaleej Times",
    url: "https://www.khaleejtimes.com/rss/business",
    region: "UAE",
    defaultCategory: "Business",
  },
  {
    id: "alarabiya-business",
    publisher: "Al Arabiya",
    url: "https://english.alarabiya.net/.mrss/en/business.xml",
    region: "Arab World",
    defaultCategory: "Business",
  },
  {
    id: "google-gulf-finance",
    publisher: "Google News",
    url: "https://news.google.com/rss/search?q=(saudi+OR+uae+OR+gulf+OR+qatar+OR+bahrain+OR+kuwait+OR+oman)+(finance+OR+markets+OR+economy+OR+oil+OR+aramco+OR+adnoc)&hl=en-US&gl=US&ceid=US:en",
    region: "Gulf",
    defaultCategory: "Markets",
  },
  {
    id: "google-mena-tech",
    publisher: "Google News",
    url: "https://news.google.com/rss/search?q=(saudi+OR+uae+OR+mena+OR+gulf)+(AI+OR+startup+OR+venture+OR+technology)&hl=en-US&gl=US&ceid=US:en",
    region: "Gulf",
    defaultCategory: "Tech & VC",
  },
];