import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Gizlilik Politikası – Erzurum Üniversiteli Gençler SK',
}

export default function GizlilikPage() {
  return (
    <>
      <Header />
      <main>
        <div className="bg-primary text-white py-10">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-2">Gizlilik Politikası</h1>
            <p className="text-gray-300">Son güncelleme: Ocak 2025</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Ana sayfaya dön
          </Link>

          <div className="prose max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-bold text-primary mb-3">1. Toplanan Bilgiler</h2>
              <p className="text-gray-600 leading-relaxed">
                Erzurum Üniversiteli Gençler Spor Kulübü olarak, sitemizi ziyaret ettiğinizde veya üye olduğunuzda bazı kişisel verilerinizi toplayabiliriz. Bu veriler; ad-soyad, e-posta adresi, telefon numarası ve üyelik bilgilerini kapsamaktadır. Toplanan bilgiler yalnızca kulüp hizmetlerinin yürütülmesi amacıyla kullanılmaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">2. Bilgilerin Kullanımı</h2>
              <p className="text-gray-600 leading-relaxed">
                Kişisel bilgileriniz; üyelik işlemlerinin yönetimi, kulüp faaliyetleri hakkında bilgilendirme, etkinlik duyuruları ve site hizmetlerinin iyileştirilmesi amacıyla kullanılmaktadır. Verileriniz üçüncü taraflarla paylaşılmamakta veya satılmamaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">3. Veri Güvenliği</h2>
              <p className="text-gray-600 leading-relaxed">
                Kişisel verilerinizin güvenliği için gerekli teknik ve idari önlemler alınmaktadır. Şifreleriniz şifrelenmiş olarak saklanmakta, yetkisiz erişime karşı sistemlerimiz korunmaktadır. Bununla birlikte, internet üzerinden veri iletiminin tam güvenliğini garanti etmek mümkün değildir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">4. Çerezler</h2>
              <p className="text-gray-600 leading-relaxed">
                Sitemiz, kullanıcı deneyimini geliştirmek amacıyla çerezler kullanmaktadır. Çerezler, oturum yönetimi ve site tercihlerinizin hatırlanması için kullanılmaktadır. Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz; ancak bu durumda bazı site özelliklerinin çalışmayabileceğini belirtmek isteriz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">5. Haklarınız</h2>
              <p className="text-gray-600 leading-relaxed">
                6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında; kişisel verilerinize erişim, düzeltme, silme veya işlemeyi kısıtlama haklarına sahipsiniz. Bu haklarınızı kullanmak için aşağıdaki iletişim bilgileri üzerinden bizimle iletişime geçebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-primary mb-3">6. İletişim</h2>
              <p className="text-gray-600 leading-relaxed">
                Gizlilik politikamız hakkında sorularınız için{' '}
                <a href="mailto:info@erzurumuniversiteligenclersk.org" className="text-primary hover:underline">
                  info@erzurumuniversiteligenclersk.org
                </a>{' '}
                adresine e-posta gönderebilir ya da{' '}
                <Link href="/iletisim" className="text-primary hover:underline">iletişim sayfamızı</Link>{' '}
                ziyaret edebilirsiniz.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
