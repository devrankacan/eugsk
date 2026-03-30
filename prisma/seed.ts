import { PrismaClient, Role, MatchStatus, SponsorTier } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eugsk.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@eugsk.com',
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  })
  console.log('Admin user created:', admin.email)

  // Create site settings
  const settings = await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: 'Erzurum Üniversiteli Gençler SK',
      email: 'info@erzurumuniversiteligenclersk.org',
      phone: '+90 442 000 0000',
      address: 'Atatürk Üniversitesi Kampüsü, Erzurum',
      facebook: 'https://facebook.com/eugsk',
      twitter: 'https://twitter.com/eugsk',
      instagram: 'https://instagram.com/eugsk',
      youtube: 'https://youtube.com/eugsk',
      description: 'Erzurum Üniversiteli Gençler Spor Kulübü - Atatürk Üniversitesi bünyesinde faaliyet gösteren çok branşlı spor kulübü',
      keywords: 'Erzurum, spor kulübü, futbol, basketbol, voleybol, atletizm',
    },
  })
  console.log('Site settings created')

  // Create branches
  const branches = await Promise.all([
    prisma.branch.upsert({
      where: { slug: 'futbol' },
      update: {},
      create: {
        name: 'Futbol',
        slug: 'futbol',
        description: 'Futbol branşımız, üniversite ligi ve bölgesel liglerde mücadele etmektedir.',
        icon: '⚽',
        order: 1,
      },
    }),
    prisma.branch.upsert({
      where: { slug: 'basketbol' },
      update: {},
      create: {
        name: 'Basketbol',
        slug: 'basketbol',
        description: 'Basketbol branşımız, üniversiteler arası turnuvalarda başarıyla temsil edilmektedir.',
        icon: '🏀',
        order: 2,
      },
    }),
    prisma.branch.upsert({
      where: { slug: 'voleybol' },
      update: {},
      create: {
        name: 'Voleybol',
        slug: 'voleybol',
        description: 'Voleybol branşımız hem erkekler hem de bayanlar kategorisinde faaliyet göstermektedir.',
        icon: '🏐',
        order: 3,
      },
    }),
    prisma.branch.upsert({
      where: { slug: 'atletizm' },
      update: {},
      create: {
        name: 'Atletizm',
        slug: 'atletizm',
        description: 'Atletizm branşımız, koşu, atlama ve atma disiplinlerinde sporcular yetiştirmektedir.',
        icon: '🏃',
        order: 4,
      },
    }),
    prisma.branch.upsert({
      where: { slug: 'yuzme' },
      update: {},
      create: {
        name: 'Yüzme',
        slug: 'yuzme',
        description: 'Yüzme branşımız, çeşitli stil ve mesafelerde sporcular yetiştirmektedir.',
        icon: '🏊',
        order: 5,
      },
    }),
  ])
  console.log('Branches created:', branches.length)

  // Create sample news
  const news = await Promise.all([
    prisma.news.upsert({
      where: { slug: 'yeni-sezon-hazirlik-kampi-basladi' },
      update: {},
      create: {
        title: 'Yeni Sezon Hazırlık Kampı Başladı',
        slug: 'yeni-sezon-hazirlik-kampi-basladi',
        content: '<p>Kulübümüz futbol takımı, yeni sezon hazırlıkları kapsamında yoğun bir kamp programına başladı. Teknik direktörümüz yönetiminde gerçekleştirilen kampta, oyuncularımız hem fiziksel hem de teknik açıdan üst düzey bir hazırlık sürecinden geçiyor.</p><p>Kamp boyunca günlük çift antrenman yapan sporcularımız, yeni sezon için tam anlamıyla hazır olacak. Takım kaptanımız ise bu sezon daha iyi sonuçlar elde etmek için büyük bir motivasyonla çalıştıklarını belirtti.</p>',
        excerpt: 'Kulübümüz futbol takımı yeni sezon hazırlıklarına hız kesmeden devam ediyor.',
        category: 'Futbol',
        published: true,
        publishedAt: new Date('2024-01-15'),
        image: null,
      },
    }),
    prisma.news.upsert({
      where: { slug: 'basketbol-takimimiz-turnuvada-sampiyonlugu-kazandi' },
      update: {},
      create: {
        title: 'Basketbol Takımımız Turnuvada Şampiyonluğu Kazandı',
        slug: 'basketbol-takimimiz-turnuvada-sampiyonlugu-kazandi',
        content: '<p>Erzurum Üniversiteli Gençler SK basketbol takımımız, bu hafta sonu düzenlenen bölgesel üniversiteler arası turnuvada şampiyonluğu elde etti. Final maçında rakibimizi 78-65 mağlup eden takımımız, kupayı müzemize taşımayı başardı.</p><p>Turnuva boyunca 5 maç oynayan takımımız, hiç mağlubiyet almadan şampiyonluğa ulaştı. Takımımızın en skorer oyuncusu turnuva boyunca ortalama 18 sayı attı.</p>',
        excerpt: 'Basketbol takımımız bölgesel turnuvada şampiyonluğu elde etti.',
        category: 'Basketbol',
        published: true,
        publishedAt: new Date('2024-01-10'),
        image: null,
      },
    }),
    prisma.news.upsert({
      where: { slug: 'yeni-transfer-doneminde-4-sporcu-kadromuza-katildi' },
      update: {},
      create: {
        title: 'Yeni Transfer Döneminde 4 Sporcu Kadromuza Katıldı',
        slug: 'yeni-transfer-doneminde-4-sporcu-kadromuza-katildi',
        content: '<p>Kulübümüz, yeni transfer döneminde 4 başarılı sporcuyu kadrosuna katmayı başardı. Farklı branşlardan gelen bu sporcular, takımlarımızı daha da güçlendireceği değerlendiriliyor.</p><p>Futbol takımımıza 2, voleybol takımımıza ise 2 sporcu transfer edildi. Yeni transferlerimiz antrenmanlarına hemen başlayarak takıma uyum sağlama sürecine girdi.</p>',
        excerpt: 'Transfer döneminde 4 yeni sporcu kulübümüze katıldı.',
        category: 'Genel',
        published: true,
        publishedAt: new Date('2024-01-05'),
        image: null,
      },
    }),
  ])
  console.log('News created:', news.length)

  // Create sample matches
  const futbolBranch = branches[0]
  const basketbolBranch = branches[1]

  await Promise.all([
    prisma.match.create({
      data: {
        homeTeam: 'Erzurum Üniversiteli Gençler SK',
        awayTeam: 'Palandöken Spor',
        homeScore: 3,
        awayScore: 1,
        date: new Date('2024-01-20T15:00:00'),
        venue: 'Atatürk Üniversitesi Stadyumu',
        league: 'Erzurum Amatör Ligi',
        status: MatchStatus.FINISHED,
        branchId: futbolBranch.id,
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Narman Gençlik',
        awayTeam: 'Erzurum Üniversiteli Gençler SK',
        homeScore: 0,
        awayScore: 2,
        date: new Date('2024-01-14T14:00:00'),
        venue: 'Narman İlçe Stadyumu',
        league: 'Erzurum Amatör Ligi',
        status: MatchStatus.FINISHED,
        branchId: futbolBranch.id,
      },
    }),
    prisma.match.create({
      data: {
        homeTeam: 'Erzurum Üniversiteli Gençler SK',
        awayTeam: 'Oltu Spor',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        venue: 'Atatürk Üniversitesi Spor Salonu',
        league: 'Üniversiteler Arası Basketbol Ligi',
        status: MatchStatus.UPCOMING,
        branchId: basketbolBranch.id,
      },
    }),
  ])
  console.log('Matches created')

  // Create slider items
  await Promise.all([
    prisma.sliderItem.create({
      data: {
        title: 'Erzurum Üniversiteli Gençler Spor Kulübü',
        description: 'Sporda mükemmeliyetin adresi. 1985\'ten bu yana gençleri sporla buluşturuyoruz.',
        image: '/images/slider-placeholder-1.jpg',
        order: 1,
        active: true,
      },
    }),
    prisma.sliderItem.create({
      data: {
        title: 'Yeni Sezon Heyecanı Başlıyor!',
        description: 'Tüm branşlarımızda heyecan dolu bir sezon için hazır mısınız?',
        image: '/images/slider-placeholder-2.jpg',
        order: 2,
        active: true,
      },
    }),
    prisma.sliderItem.create({
      data: {
        title: 'Şampiyonluk Yolunda Yürüyoruz',
        description: 'Basketbol takımımız bölgesel turnuvada şampiyon oldu!',
        image: '/images/slider-placeholder-3.jpg',
        link: '/haberler/basketbol-takimimiz-turnuvada-sampiyonlugu-kazandi',
        order: 3,
        active: true,
      },
    }),
  ])
  console.log('Slider items created')

  // Create sample players
  const players = await Promise.all([
    prisma.player.create({
      data: {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        number: 10,
        position: 'Forvet',
        nationality: 'Türkiye',
        branchId: futbolBranch.id,
        active: true,
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Mehmet',
        lastName: 'Kaya',
        number: 1,
        position: 'Kaleci',
        nationality: 'Türkiye',
        branchId: futbolBranch.id,
        active: true,
      },
    }),
    prisma.player.create({
      data: {
        firstName: 'Can',
        lastName: 'Demir',
        number: 7,
        position: 'Orta Saha',
        nationality: 'Türkiye',
        branchId: futbolBranch.id,
        active: true,
      },
    }),
  ])
  console.log('Players created:', players.length)

  // Create sponsors
  await Promise.all([
    prisma.sponsor.create({
      data: {
        name: 'Atatürk Üniversitesi',
        logo: '/images/sponsor-placeholder.png',
        website: 'https://atauni.edu.tr',
        tier: SponsorTier.MAIN,
        order: 1,
        active: true,
      },
    }),
    prisma.sponsor.create({
      data: {
        name: 'Erzurum Büyükşehir Belediyesi',
        logo: '/images/sponsor-placeholder.png',
        website: 'https://erzurum.bel.tr',
        tier: SponsorTier.GOLD,
        order: 2,
        active: true,
      },
    }),
  ])
  console.log('Sponsors created')

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
