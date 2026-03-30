import Image from 'next/image'

interface Sponsor {
  id: string
  name: string
  logo: string
  website?: string
  tier: string
}

interface SponsorsSectionProps {
  sponsors: Sponsor[]
}

const tierLabels: Record<string, string> = {
  MAIN: 'Ana Sponsor',
  GOLD: 'Altın Sponsor',
  SILVER: 'Gümüş Sponsor',
  BRONZE: 'Bronz Sponsor',
}

const tierOrder: Record<string, number> = {
  MAIN: 0,
  GOLD: 1,
  SILVER: 2,
  BRONZE: 3,
}

export default function SponsorsSection({ sponsors }: SponsorsSectionProps) {
  if (!sponsors.length) return null

  const grouped = sponsors.reduce((acc, s) => {
    if (!acc[s.tier]) acc[s.tier] = []
    acc[s.tier].push(s)
    return acc
  }, {} as Record<string, Sponsor[]>)

  const sortedTiers = Object.keys(grouped).sort(
    (a, b) => (tierOrder[a] ?? 99) - (tierOrder[b] ?? 99)
  )

  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="section-title">Sponsorlarımız</h2>
          <p className="text-gray-400 text-sm">Bizi destekleyen kurum ve kuruluşlara teşekkür ederiz</p>
        </div>

        {sortedTiers.map(tier => (
          <div key={tier} className="mb-8">
            <p className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
              {tierLabels[tier] || tier}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6">
              {grouped[tier].map(sponsor => (
                <a
                  key={sponsor.id}
                  href={sponsor.website || '#'}
                  target={sponsor.website ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all bg-gray-50 hover:bg-white"
                  style={{
                    width: tier === 'MAIN' ? '200px' : tier === 'GOLD' ? '160px' : '120px',
                    height: tier === 'MAIN' ? '100px' : tier === 'GOLD' ? '80px' : '70px',
                  }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={sponsor.logo}
                      alt={sponsor.name}
                      fill
                      className="object-contain filter grayscale group-hover:grayscale-0 transition-all"
                    />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
