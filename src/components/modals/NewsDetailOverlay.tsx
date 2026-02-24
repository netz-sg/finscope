import { X, Newspaper, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '../../store/useUIStore'
import { GLASS_PANEL, GLASS_INNER } from '../../design/tokens'

export default function NewsDetailOverlay() {
  const { t } = useTranslation()
  const { selectedNews, setSelectedNews } = useUIStore()

  if (!selectedNews) return null

  const d = new Date(selectedNews.pubDate)
  const dateStr = !isNaN(d.getTime())
    ? d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Aktuell'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 animate-zoom-in">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-2xl transition-opacity"
        onClick={() => setSelectedNews(null)}
      />

      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto hide-scrollbar rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] ${GLASS_PANEL} flex flex-col`}
      >
        <button
          onClick={() => setSelectedNews(null)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all z-50 shadow-lg"
        >
          <X size={20} />
        </button>

        <div className="w-full h-64 md:h-96 shrink-0 relative">
          <img
            src={selectedNews.thumbnail}
            alt={selectedNews.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/30 to-transparent" />
        </div>

        <div className="p-8 sm:p-12 -mt-20 relative z-10">
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
            <Newspaper size={14} /> {dateStr}
          </p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter leading-tight mb-8 drop-shadow-lg text-balance">
            {selectedNews.title}
          </h2>

          <div className="text-white/80 leading-relaxed text-sm md:text-base font-light text-pretty space-y-4 mb-10">
            <p>{selectedNews.description || selectedNews.content || t('detail.noDescription')}</p>
          </div>

          {selectedNews.link && selectedNews.link !== '#' && (
            <div className="border-t border-white/10 pt-8 flex justify-end">
              <a
                href={selectedNews.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white hover:text-black hover:bg-white transition-all ${GLASS_INNER}`}
              >
                {t('detail.readArticle')} <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
