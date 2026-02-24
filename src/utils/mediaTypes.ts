import { Film, Tv, Music } from 'lucide-react'
import type { MediaTypeConfig } from '../types/app'

export const getMediaTypeConfig = (type: string | undefined): MediaTypeConfig => {
  switch (type) {
    case 'Audio':
    case 'MusicAlbum':
      return {
        icon: Music,
        label: 'Musik',
        color: 'text-pink-400',
        bg: 'bg-pink-400/20',
        border: 'border-pink-400/30',
      }
    case 'Episode':
    case 'Series':
      return {
        icon: Tv,
        label: 'Serie',
        color: 'text-purple-400',
        bg: 'bg-purple-400/20',
        border: 'border-purple-400/30',
      }
    case 'Movie':
    default:
      return {
        icon: Film,
        label: 'Film',
        color: 'text-blue-400',
        bg: 'bg-blue-400/20',
        border: 'border-blue-400/30',
      }
  }
}
