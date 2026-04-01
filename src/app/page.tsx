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
        take: 3,
      }),
      prisma.match.findMany({
        include: { branch: { select: { name: true, slug: true } } },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      prisma.branch.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      prisma.player.findMany({
        where: { active: true },
        include: { branch: { select: { name: true, slug: true } } },
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
