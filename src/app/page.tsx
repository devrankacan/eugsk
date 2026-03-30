import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSlider from '@/components/home/HeroSlider'
import NewsSection from '@/components/home/NewsSection'
import MatchCenter from '@/components/home/MatchCenter'
import TeamsSection from '@/components/home/TeamsSection'
import SponsorsSection from '@/components/home/SponsorsSection'

export const revalidate = 60

async function getData() {
  try {
    const [sliderItems, news, matches, branches, players, sponsors] = await Promise.all([
      prisma.sliderItem.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      prisma.news.findMany({
        where: { published: true },
        orderBy: { publishedAt: 'desc' },
        take: 6,
      }),
      prisma.match.findMany({
        include: { branch: { select: { name: true, icon: true, slug: true } } },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      prisma.branch.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      prisma.player.findMany({
        where: { active: true },
        include: { branch: { select: { name: true, slug: true, icon: true } } },
        take: 20,
        orderBy: { number: 'asc' },
      }),
      prisma.sponsor.findMany({
        where: { active: true },
        orderBy: [{ tier: 'asc' }, { order: 'asc' }],
      }),
    ])

    return { sliderItems, news, matches, branches, players, sponsors }
  } catch (error) {
    console.error('Error loading homepage data:', error)
    return {
      sliderItems: [],
      news: [],
      matches: [],
      branches: [],
      players: [],
      sponsors: [],
    }
  }
}

export default async function HomePage() {
  const { sliderItems, news, matches, branches, players, sponsors } = await getData()

  return (
    <>
      <Header />
      <main>
        <HeroSlider items={sliderItems.map(s => ({
          ...s,
          title: s.title ?? undefined,
          description: s.description ?? undefined,
          link: s.link ?? undefined,
        }))} />

        {/* Stats bar */}
        <div className="bg-primary text-white py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { value: branches.length, label: 'Branş' },
                { value: players.length + '+', label: 'Sporcu' },
                { value: matches.filter(m => m.status === 'FINISHED').length + '+', label: 'Maç' },
                { value: '1985', label: 'Kuruluş' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-black text-secondary">{stat.value}</div>
                  <div className="text-xs text-gray-300 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <NewsSection news={news as any} />
        <MatchCenter matches={matches as any} />
        {branches.length > 0 && players.length > 0 && (
          <TeamsSection
            players={players as any}
            branches={branches.map(b => ({ ...b, icon: b.icon ?? undefined }))}
          />
        )}
        <SponsorsSection sponsors={sponsors.map(s => ({ ...s, website: s.website ?? undefined }))} />
      </main>
      <Footer />
    </>
  )
}
