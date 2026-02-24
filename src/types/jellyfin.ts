export interface PlayState {
  IsPaused: boolean
  PositionTicks: number
  PlayMethod: 'DirectPlay' | 'Transcode'
}

export interface MediaStream {
  Type: string
  Codec: string
}

export interface NowPlayingItem {
  Id: string
  Name: string
  Type: 'Movie' | 'Episode' | 'Series' | 'Audio' | 'MusicAlbum'
  ProductionYear?: number
  RunTimeTicks?: number
  SeriesName?: string
  SeriesId?: string
  IndexNumber?: number
  ParentIndexNumber?: number
  ParentBackdropItemId?: string
  ParentLogoItemId?: string
  Artists?: string[]
  AlbumId?: string
  Album?: string
  AlbumArtist?: string
  MediaStreams?: MediaStream[]
  Overview?: string
  PlayCount?: number
}

export interface Session {
  Id: string
  DeviceName: string
  Client: string
  UserName: string
  UserId: string
  PlayState: PlayState
  NowPlayingItem: NowPlayingItem
}

export interface ItemDetail {
  Id: string
  Name: string
  OriginalTitle?: string
  Overview?: string
  OfficialRating?: string
  CommunityRating?: number
  Genres?: string[]
  Studios?: { Name: string }[]
  Type: string
  ProductionYear?: number
  RunTimeTicks?: number
  Artists?: string[]
  AlbumArtist?: string
  Album?: string
  AlbumId?: string
  ArtistItems?: { Name: string; Id: string }[]
  IndexNumber?: number
  ParentIndexNumber?: number
  ChildCount?: number
}

export interface AlbumTrack {
  Id: string
  Name: string
  IndexNumber?: number
  ParentIndexNumber?: number
  RunTimeTicks?: number
  Artists?: string[]
  ArtistItems?: { Name: string; Id: string }[]
}

export interface JellyfinUser {
  Id: string
  Name: string
  LastActivityDate: string
  Policy: {
    IsAdministrator: boolean
  }
  RecentHistory?: NowPlayingItem[]
  PlayCount?: number
}

export interface ItemCounts {
  MovieCount: number
  SeriesCount: number
  EpisodeCount: number
  SongCount: number
  AlbumCount: number
}

export interface ServerInfo {
  ServerName: string
  Version: string
  OperatingSystem: string
  SystemArchitecture?: string
}

export interface LibraryFolder {
  Id: string
  Name: string
  CollectionType: string
}

export interface GenreCount {
  name: string
  count: number
  pct: number
}

export interface PulseStats {
  dbSizeBytes: number
  totalHistoryEntries: number
  lastSyncTime: string | null
}

export interface NewsItem {
  title: string
  thumbnail: string
  pubDate: string
  link: string
  description: string
  content?: string
}
