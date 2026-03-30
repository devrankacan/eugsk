import Image from 'next/image'

interface Sponsor {
  id: string
  name: string
  logo: string
  website?: string
}

interface SponsorsSectionProps {
  sponsors: Sponsor[]
}

export default function SponsorsSection({ sponsors }: SponsorsSectionProps) {
  if (!sponsors.length) return null

  return (
    <section className="py-12 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="section-title">Sponsorlarımız</h2>
          <p className="text-gray-400 text-sm">Bizi destekleyen kurum ve kuruluşlara teşekkür ederiz</p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-6">
          {sponsors.map(sponsor => (
            <a
              key={sponsor.id}
              href={sponsor.website || '#'}
              target={sponsor.website ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="group flex items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all bg-gray-50 hover:bg-white"
              style={{ width: '150px', height: '80px' }}
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
    </section>
  )
}
