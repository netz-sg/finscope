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
  const dbAnalytics = useRef<{ historyMap: Record<string, number>; peakHours: number[] } | null>(
    null,
  )

  // Reset flags when status changes away from success
  useEffect(() => {
    if (status !== 'success') {
      historySynced.current = false
      heroFetched.current = false
      extraDataFetched.current = false
      serverInfoFetched.current = false
      dbAnalytics.current = null
    }
  }, [status])

  // Demo mode setup
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

  // Live polling: sessions, users, counts, library (every 10s)
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

          // Compute clients from live sessions
          const clients: Record<string, number> = {}
          activeSessions.forEach((s) => {
            if (s.Client) clients[s.Client] = (clients[s.Client] || 0) + 1
          })

          // Merge DB analytics (historyMap/peakHours) with live client data
          if (dbAnalytics.current) {
            setAnalyticsData({ ...dbAnalytics.current, clients })
          }

          // ONE-TIME: Fetch real server info (Version, OS, Architecture)
          if (!serverInfoFetched.current) {
            serverInfoFetched.current = true
            JellyfinAPI.connect(config.url, config.apiKey)
              .then((info) => setServerInfo(info))
              .catch(() => {})
          }

          // ONE-TIME: Fetch random hero items (Movies + Series)
          if (!heroFetched.current) {
            heroFetched.current = true
            JellyfinAPI.getRandomHeroItems(config.url, config.apiKey, adminUser.Id)
              .then((items) => { if (items.length > 0) setHeroItems(items) })
              .catch(() => {})
          }

          // ONE-TIME: Sync history to SQLite, then load analytics
          if (!historySynced.current) {
            historySynced.current = true
            ;(async () => {
              try {
                let result = await JellyfinAPI.syncHistory()
                console.log(`History sync: +${result.newEntries} (${result.totalEntries} total)`)

                // If DB is empty after normal sync, force a full re-sync (clears stale sync_meta)
                if (result.totalEntries === 0) {
                  console.log('DB empty after sync — forcing full re-sync…')
                  result = await JellyfinAPI.syncHistory(true)
                  console.log(`Force sync: +${result.newEntries} (${result.totalEntries} total)`)
                }

                const analytics = await JellyfinAPI.getStoredAnalytics()
                dbAnalytics.current = {
                  historyMap: analytics.historyMap,
                  peakHours: analytics.peakHours,
                }
                setAnalyticsData({ ...dbAnalytics.current, clients })
              } catch (err) {
                console.error('History sync failed:', err)
              }
            })()
          }

          // ONE-TIME: Fetch genre distribution + pulse stats
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
