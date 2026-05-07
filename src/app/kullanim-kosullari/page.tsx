import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Kullanım Koşulları – Erzurum Üniversiteli Gençler SK',
}

export default function KullanimKosullariPage() {
  return (
    <>
      <Header />
      <main>
        <div className="bg-primary text-white py-10">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-2">Kullanım Koşulları</h1>
            <p className="text-gray-300">Son güncelleme: Ocak 2025</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Ana sayfaya dön
          </Link>

          <div className="prose max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-bold text-primary mb-3">1. Kabul Koşulları</h2>
              <p className="text-gray-600 leading-relaxed">
                Bu web sitesini kullanarak veya üyelik kaydı oluşturarak aşağıdaki kullanım koşullarını kabul etmiş olursunuz. Bu koşulları kabul etmiyorsanız lütfen siteyi kullanmayınız.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">2. Üyelik</h2>
              <p className="text-gray-600 leading-relaxed">
                Üyelik kaydı oluşturmak için geçerli bir e-posta adresi ve telefon numarası sağlamanız gerekmektedir. Hesap bilgilerinizin güvenliğinden siz sorumlusunuz. Hesabınızda gerçekleşen tüm faaliyetlerden sorumlu olduğunuzu kabul etmektesiniz. Sahte veya yanıltıcı bilgi veren üyelikler silinebilir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">3. Kullanım Kuralları</h2>
              <p className="text-gray-600 leading-relaxed">
                Siteyi kullanırken yasalara aykırı, hakaret içeren veya zararlı içerik paylaşmak yasaktır. Sisteme yetkisiz erişim girişiminde bulunmak, siteyi kötüye kullanmak veya başkalarının haklarını ihlal etmek yasaktır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">4. İçerik Hakları</h2>
              <p className="text-gray-600 leading-relaxed">
                Sitede yayınlanan haberler, fotoğraflar ve diğer tüm içerikler Erzurum Üniversiteli Gençler Spor Kulübü'ne aittir. İzin alınmadan içerik kopyalanamaz veya dağıtılamaz. Kulübün adı ve logosu izinsiz kullanılamaz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">5. Sorumluluk Sınırlaması</h2>
              <p className="text-gray-600 leading-relaxed">
                Kulüp, site içeriklerinin doğruluğu, eksiksizliği veya güncelliği konusunda garanti vermemektedir. Teknik sorunlar, bakım çalışmaları veya mücbir sebepler nedeniyle hizmet kesintisi yaşanabilir. Bu durumlardan doğan zararlardan kulüp sorumlu tutulamaz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">6. Değişiklikler</h2>
              <p className="text-gray-600 leading-relaxed">
                Bu kullanım koşulları önceden haber verilmeksizin değiştirilebilir. Değişiklikler sitede yayınlandığı tarihten itibaren geçerli olur. Siteyi kullanmaya devam etmeniz, güncel koşulları kabul ettiğiniz anlamına gelir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">7. İletişim</h2>
              <p className="text-gray-600 leading-relaxed">
                Kullanım koşullarıyla ilgili sorularınız için{' '}
                <a href="mailto:info@erzurumuniversiteligenclersk.org" className="text-primary hover:underline">
                  info@erzurumuniversiteligenclersk.org
                </a>{' '}
                adresine ulaşabilirsiniz.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
