import { useEffect, useRef } from 'react'
import { JellyfinAPI } from '../api/jellyfin'
import { useAppStore } from '../store/useAppStore'
import { useMediaStore } from '../store/useMediaStore'
import {
  DEMO_SESSIONS,
  DEMO_USERS,
  DEMO_COUNTS,
  DEMO_MOST_PLAYED,
  DEMO_LATEST,
  DEMO_LIBRARIES,
  DEMO_NEWS,
  generateDemoHistory,
} from '../utils/demo'

const processDemoAnalytics = (
  historyItems: { DatePlayed?: string }[],
  currentSessions: { Client?: string }[],
) => {
  const historyMap: Record<string, number> = {}
  const peakHours = Array(24).fill(0) as number[]
  const clients: Record<string, number> = {}

  currentSessions.forEach((s) => {
    if (s.Client) clients[s.Client] = (clients[s.Client] || 0) + 1
  })

  historyItems.forEach((item) => {
    if (!item.DatePlayed) return
    const d = new Date(item.DatePlayed)
    const dateKey = d.toISOString().split('T')[0]
    historyMap[dateKey] = (historyMap[dateKey] || 0) + 1
    peakHours[d.getHours()] += 1
  })

  return { historyMap, peakHours, clients }
}

export const useJellyfinPolling = () => {
  const { config, status, isDemoMode, setConfig, setServerInfo } = useAppStore()
  const {
    setSessions, setUsers, setCounts, setLibraryData,
    setAnalyticsData, setGenreData, setPulseStats,
    setNews, setHeroItems,
  } = useMediaStore()

  const historySynced = useRef(false)
  const heroFetched = useRef(false)
  const extraDataFetched = useRef(false)
  const serverInfoFetched = useRef(false)
  const analyticsRefreshCounter = useRef(0)
  const dbAnalytics = useRef<{ historyMap: Record<string, number>; peakHours: number[] } | null>(
    null,
  )

  useEffect(() => {
    if (status !== 'success') {
      historySynced.current = false
      heroFetched.current = false
      extraDataFetched.current = false
      serverInfoFetched.current = false
      dbAnalytics.current = null
    }
  }, [status])

  useEffect(() => {
    if (status !== 'success' || !isDemoMode) return

    setSessions(DEMO_SESSIONS)
    setUsers(DEMO_USERS)
    setCounts(DEMO_COUNTS)
    setLibraryData({ mostPlayed: DEMO_MOST_PLAYED, latest: DEMO_LATEST, libraries: DEMO_LIBRARIES })
    setNews(DEMO_NEWS)
    setAnalyticsData(processDemoAnalytics(generateDemoHistory(), DEMO_SESSIONS))
    setServerInfo({ ServerName: 'FinScope Nexus', Version: '10.8.13', OperatingSystem: 'Docker' })
  }, [status, isDemoMode])

  useEffect(() => {
    if (status !== 'success' || isDemoMode) return

    const fetchData = async () => {
      try {
        const [activeSessions, allUsers, libCounts] = await Promise.all([
          JellyfinAPI.getSessions(config.url, config.apiKey),
          JellyfinAPI.getUsers(config.url, config.apiKey),
          JellyfinAPI.getCounts(config.url, config.apiKey),
        ])

        setSessions(activeSessions)
        if (libCounts) setCounts(libCounts)

        if (allUsers.length > 0) {
          const adminUser =
            allUsers.find((u) => u.Policy?.IsAdministrator) || allUsers[0]
          if (!config.userId) setConfig({ userId: adminUser.Id })

          const [mostPlayed, latest, libraries] = await Promise.all([
            JellyfinAPI.getMostPlayed(config.url, config.apiKey, adminUser.Id),
            JellyfinAPI.getLatestItems(config.url, config.apiKey, adminUser.Id),
            JellyfinAPI.getLibraries(config.url, config.apiKey, adminUser.Id),
          ])
          setLibraryData({ mostPlayed, latest, libraries })

          const clients: Record<string, number> = {}
          activeSessions.forEach((s) => {
            if (s.Client) clients[s.Client] = (clients[s.Client] || 0) + 1
          })

          if (activeSessions.length > 0) {
            const trackable = activeSessions
              .filter((s) => s.NowPlayingItem && !s.PlayState.IsPaused)
              .map((s) => ({
                userId: s.UserId,
                userName: s.UserName,
                itemId: s.NowPlayingItem.Id,
                itemName: s.NowPlayingItem.Name,
                itemType: s.NowPlayingItem.Type,
                client: s.Client || s.DeviceName,
              }))
            JellyfinAPI.trackSessions(trackable)
          }

          analyticsRefreshCounter.current++
          if (dbAnalytics.current && analyticsRefreshCounter.current % 6 === 0) {
            JellyfinAPI.getStoredAnalytics()
              .then((analytics) => {
                if (analytics.totalPlays > 0) {
                  dbAnalytics.current = {
                    historyMap: analytics.historyMap,
                    peakHours: analytics.peakHours,
                  }
                  console.log(`[FinScope] Analytics refreshed: ${analytics.totalPlays} plays`)
                }
                setAnalyticsData({ ...dbAnalytics.current!, clients })
              })
              .catch(() => {})
          } else if (dbAnalytics.current) {
            setAnalyticsData({ ...dbAnalytics.current, clients })
          }

          if (!serverInfoFetched.current) {
            serverInfoFetched.current = true
            JellyfinAPI.connect(config.url, config.apiKey)
              .then((info) => setServerInfo(info))
              .catch(() => {})
          }

          if (!heroFetched.current) {
            heroFetched.current = true
            JellyfinAPI.getRandomHeroItems(config.url, config.apiKey, adminUser.Id)
              .then((items) => { if (items.length > 0) setHeroItems(items) })
              .catch(() => {})
          }

          if (!historySynced.current) {
            historySynced.current = true
            ;(async () => {
              try {
                console.log('[FinScope] Starting history sync…')
                let result = await JellyfinAPI.syncHistory()
                console.log(`[FinScope] History sync: +${result.newEntries} new (${result.totalEntries} total in DB)`)

                if (result.totalEntries === 0) {
                  console.log('[FinScope] DB empty after sync — forcing full re-sync…')
                  result = await JellyfinAPI.syncHistory(true)
                  console.log(`[FinScope] Force sync: +${result.newEntries} new (${result.totalEntries} total in DB)`)
                }

                const analytics = await JellyfinAPI.getStoredAnalytics()
                console.log(`[FinScope] Analytics loaded: ${analytics.totalPlays} plays, ${Object.keys(analytics.historyMap).length} days`)
                dbAnalytics.current = {
                  historyMap: analytics.historyMap,
                  peakHours: analytics.peakHours,
                }
                setAnalyticsData({ ...dbAnalytics.current, clients })
              } catch (err) {
                console.error('[FinScope] History sync failed:', err)
              }
            })()
          }

          if (!extraDataFetched.current) {
            extraDataFetched.current = true
            JellyfinAPI.getGenreDistribution()
              .then((genres) => { if (genres.length > 0) setGenreData(genres) })
              .catch(() => {})
            JellyfinAPI.getPulseStats()
              .then((stats) => setPulseStats(stats))
              .catch(() => {})
          }

          const usersWithHistory = await Promise.all(
            allUsers.map(async (u) => {
              const [history, stats] = await Promise.all([
                JellyfinAPI.getUserHistory(config.url, config.apiKey, u.Id),
                JellyfinAPI.getUserStats(config.url, config.apiKey, u.Id),
              ])
              return { ...u, RecentHistory: history, PlayCount: stats.playCount }
            }),
          )
          setUsers(usersWithHistory)
        }
      } catch (err) {
        console.error('Polling Error:', err)
      }
    }

    const fetchNews = async () => {
      try {
        const res = await fetch(
          'https://api.rss2json.com/v1/api.json?rss_url=https://www.moviepilot.de/news.rss',
        )
        if (!res.ok) throw new Error('RSS unavailable')
        const data = await res.json()
        if (data.status !== 'ok' || !data.items) throw new Error('Invalid RSS')
        setNews(
          data.items.map((item: Record<string, unknown>) => ({
            ...item,
            thumbnail:
              item.thumbnail ||
              (item.enclosure as Record<string, unknown>)?.link ||
              'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600',
            description: item.description || item.content || '',
          })),
        )
      } catch {
        setNews(DEMO_NEWS)
      }
    }

    fetchData()
    fetchNews()
    const interval = setInterval(fetchData, 10_000)
    return () => clearInterval(interval)
  }, [status, config.url, config.apiKey, config.userId, isDemoMode])
}
