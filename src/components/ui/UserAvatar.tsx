import { useState } from 'react'

interface UserAvatarProps {
  url?: string
  name: string
  className?: string
}

export default function UserAvatar({ url, name, className = '' }: UserAvatarProps) {
  const [error, setError] = useState(false)

  if (error || !url || url.includes('demo')) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-800 text-white font-black rounded-full shadow-inner ${className}`}
      >
        {name ? name.charAt(0).toUpperCase() : '?'}
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={name}
      onError={() => setError(true)}
      className={`object-cover rounded-full ${className}`}
    />
  )
}
