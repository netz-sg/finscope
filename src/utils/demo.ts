import type { Session, JellyfinUser, ItemCounts, NewsItem, NowPlayingItem, LibraryFolder } from '../types/jellyfin'

export const DEMO_SESSIONS: Session[] = [
  {
    Id: 'demo1',
    DeviceName: 'Apple TV 4K',
    Client: 'tvOS',
    UserName: 'Alexander',
    UserId: 'u1',
    PlayState: { IsPaused: false, PositionTicks: 45_000_000_000, PlayMethod: 'DirectPlay' },
    NowPlayingItem: {
      Id: 'demo_item_1',
      Name: 'Dune: Part Two',
      Type: 'Movie',
      ProductionYear: 2024,
      RunTimeTicks: 101_400_000_000,
      Overview: 'Paul Atreides joins Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      MediaStreams: [{ Type: 'Video', Codec: 'hevc' }, { Type: 'Audio', Codec: 'eac3' }],
    },
  },
  {
    Id: 'demo2',
    DeviceName: 'Sonos Arc',
    Client: 'DLNA',
    UserName: 'Sarah',
    UserId: 'u2',
    PlayState: { IsPaused: false, PositionTicks: 1_200_000_000, PlayMethod: 'DirectPlay' },
    NowPlayingItem: {
      Id: 'demo_item_music',
      Name: 'Starboy',
      Artists: ['The Weeknd'],
      Type: 'Audio',
      ProductionYear: 2016,
      RunTimeTicks: 2_300_000_000,
      MediaStreams: [{ Type: 'Audio', Codec: 'flac' }],
    },
  },
  {
    Id: 'demo3',
    DeviceName: 'iPad Pro',
    Client: 'iOS',
    UserName: 'Kids',
    UserId: 'u3',
    PlayState: { IsPaused: true, PositionTicks: 12_000_000_000, PlayMethod: 'Transcode' },
    NowPlayingItem: {
      Id: 'demo_item_episode',
      Name: 'The Ice Cream Truck',
      SeriesName: 'Bluey',
      SeriesId: 'demo_item_2',
      Type: 'Episode',
      IndexNumber: 5,
      ParentIndexNumber: 2,
      ProductionYear: 2021,
      RunTimeTicks: 4_200_000_000,
      Overview: 'Bluey and Bingo play ice cream truck, but suddenly there is a problem with the orders.',
      MediaStreams: [{ Type: 'Video', Codec: 'h264' }, { Type: 'Audio', Codec: 'aac' }],
    },
  },
]

export const DEMO_USERS: JellyfinUser[] = [
  {
    Id: 'u1',
    Name: 'Alexander',
    LastActivityDate: new Date().toISOString(),
    Policy: { IsAdministrator: true },
    PlayCount: 1452,
    RecentHistory: [
      { Id: 'demo_item_1', Name: 'Dune: Part Two', Type: 'Movie', ProductionYear: 2024 },
      { Id: 'h2', Name: 'Breaking Bad', SeriesName: 'Breaking Bad', Type: 'Episode' },
    ],
  },
  {
    Id: 'u2',
    Name: 'Sarah',
    LastActivityDate: new Date(Date.now() - 3_600_000).toISOString(),
    Policy: { IsAdministrator: false },
    PlayCount: 843,
    RecentHistory: [
      { Id: 'demo_item_music', Name: 'Starboy', Artists: ['The Weeknd'], Type: 'Audio' },
      { Id: 'demo_item_2', Name: 'Bluey', SeriesName: 'Bluey', Type: 'Episode' },
    ],
  },
]

export const DEMO_COUNTS: ItemCounts = {
  MovieCount: 1420,
  SeriesCount: 184,
  EpisodeCount: 8402,
  SongCount: 12400,
  AlbumCount: 840,
}

export const DEMO_MOST_PLAYED: NowPlayingItem[] = [
  { Id: 'mp1', Name: 'The Office', Type: 'Series', PlayCount: 342, ProductionYear: 2005 },
  { Id: 'demo_item_1', Name: 'Dune: Part Two', Type: 'Movie', PlayCount: 145, ProductionYear: 2024 },
  { Id: 'demo_item_music', Name: 'Starboy', Artists: ['The Weeknd'], Type: 'Audio', PlayCount: 128 },
  { Id: 'demo_item_2', Name: 'Bluey', Type: 'Series', PlayCount: 110, ProductionYear: 2018 },
  { Id: 'mp5', Name: 'Breaking Bad', Type: 'Series', PlayCount: 95, ProductionYear: 2008 },
]

export const DEMO_LATEST: NowPlayingItem[] = [
  { Id: 'demo_item_1', Name: 'Dune: Part Two', Type: 'Movie', Overview: 'Paul Atreides joins Chani and the Fremen...' },
  { Id: 'l2', Name: 'Shogun', Type: 'Series', Overview: 'An epic tale of war, passion and power in feudal Japan.' },
  { Id: 'l3', Name: 'Fallout', Type: 'Series' },
  { Id: 'l4', Name: 'Civil War', Type: 'Movie' },
  { Id: 'l5', Name: 'Deadpool & Wolverine', Type: 'Movie' },
]

export const DEMO_LIBRARIES: LibraryFolder[] = [
  { Id: 'lib1', Name: 'Movies', CollectionType: 'movies' },
  { Id: 'lib2', Name: 'TV Shows', CollectionType: 'tvshows' },
  { Id: 'lib3', Name: 'Music', CollectionType: 'music' },
  { Id: 'lib4', Name: 'Kids', CollectionType: 'movies' },
]

export const DEMO_NEWS: NewsItem[] = [
  {
    title: 'Dune: Messiah - Denis Villeneuve Confirms Shooting Start for the Grand Sci-Fi Finale',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600',
    pubDate: new Date().toISOString(),
    link: '#',
    description: 'Director Denis Villeneuve has officially confirmed that work on the third part of the epic sci-fi saga will begin sooner than expected.',
  },
  {
    title: 'The Last of Us Season 2: First Images Show Dark Continuation',
    thumbnail: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=600',
    pubDate: new Date(Date.now() - 86_400_000).toISOString(),
    link: '#',
    description: 'HBO has released the first official images from the second season.',
  },
  {
    title: 'New Lord of the Rings Cinema Adventure Announced: Peter Jackson Produces',
    thumbnail: 'https://images.unsplash.com/photo-1462759353907-b04e9f0e2099?auto=format&fit=crop&q=80&w=600',
    pubDate: new Date(Date.now() - 86_400_000 * 2).toISOString(),
    link: '#',
    description: 'Warner Bros. is taking us back to Middle-earth! A new film called "The Hunt for Gollum" is in production.',
  },
]

export const generateDemoHistory = (): { DatePlayed: string; Type: string }[] => {
  const history: { DatePlayed: string; Type: string }[] = []
  const now = new Date()
  for (let i = 0; i < 300; i++) {
    const d = new Date()
    d.setDate(now.getDate() - Math.floor(Math.random() * 180))
    d.setHours(Math.random() > 0.6 ? 20 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 24))
    history.push({ DatePlayed: d.toISOString(), Type: Math.random() > 0.5 ? 'Movie' : 'Episode' })
  }
  return history
}

export const DEMO_DETAIL = {
  Id: 'demo_item_1',
  Name: 'Dune: Part Two',
  OriginalTitle: 'Dune: Part Two',
  ProductionYear: 2024,
  Type: 'Movie',
  OfficialRating: 'PG-13',
  CommunityRating: 8.8,
  RunTimeTicks: 101_400_000_000,
  Genres: ['Sci-Fi', 'Adventure', 'Drama'],
  Overview:
    'Paul Atreides joins Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Faced with a choice between the love of his life and the fate of the known universe, he tries to prevent a terrible future that only he can foresee.',
  Studios: [{ Name: 'Legendary Pictures' }, { Name: 'Warner Bros.' }],
}
