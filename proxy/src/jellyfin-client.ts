import { Jellyfin } from '@jellyfin/sdk'
import type { Api } from '@jellyfin/sdk'

const jellyfin = new Jellyfin({
  clientInfo: { name: 'FinScope', version: '1.0.0' },
  deviceInfo: { name: 'FinScope Proxy', id: 'finscope-proxy-v1' },
})

export function createApi(serverUrl: string, apiKey: string): Api {
  return jellyfin.createApi(serverUrl, apiKey)
}

export { jellyfin }
