const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const pageContents = [
  {
    slug: 'hakkimizda',
    content: `
      <!-- ABOUT_HERO_START -->
      <h1 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900 text-center">Hakkımızda</h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed text-center">
          Haberfoni, 2025 yılında kurulmuş, tarafsız ve doğru habercilik ilkesiyle yayın yapan Türkiye'nin yeni nesil haber platformudur.
      </p>
      <!-- ABOUT_HERO_END -->

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 my-16">
          <div class="text-center">
              <h3 class="text-xl font-bold mb-4">Misyonumuz</h3>
              <p class="text-gray-600">Okuyucularımıza en güncel haberleri, en hızlı ve en doğru şekilde, tarafsızlık ilkesinden ödün vermeden ulaştırmak.</p>
          </div>
          <div class="text-center">
              <h3 class="text-xl font-bold mb-4">Vizyonumuz</h3>
              <p class="text-gray-600">Dijital habercilikte güvenilirliğin ve kalitenin adresi olarak, Türkiye'nin en çok takip edilen haber kaynağı olmak.</p>
          </div>
          <div class="text-center">
              <h3 class="text-xl font-bold mb-4">Değerlerimiz</h3>
              <p class="text-gray-600">Doğruluk, tarafsızlık, insan haklarına saygı ve basın meslek ilkelerine bağlılık temel değerlerimizdir.</p>
          </div>
      </div>

      <!-- ABOUT_TEAM_START -->
      <h2 class="text-3xl font-bold text-center mb-12">Yönetim Ekibimiz</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="text-center">
              <h4 class="text-lg font-bold text-gray-900">Ahmet Yılmaz</h4>
              <p class="text-primary font-medium">Genel Yayın Yönetmeni</p>
          </div>
          <div class="text-center">
              <h4 class="text-lg font-bold text-gray-900">Ayşe Demir</h4>
              <p class="text-primary font-medium">Yazı İşleri Müdürü</p>
          </div>
          <div class="text-center">
              <h4 class="text-lg font-bold text-gray-900">Mehmet Kaya</h4>
              <p class="text-primary font-medium">Teknoloji Editörü</p>
          </div>
          <div class="text-center">
              <h4 class="text-lg font-bold text-gray-900">Zeynep Çelik</h4>
              <p class="text-primary font-medium">Ekonomi Editörü</p>
          </div>
      </div>
      <!-- ABOUT_TEAM_END -->

      <!-- ABOUT_CI_START -->
      <div class="text-center border-t border-gray-200 pt-12 mt-16">
          <h2 class="text-2xl font-bold mb-6">Kurumsal Kimlik</h2>
          <p class="text-gray-600 mb-8 max-w-2xl mx-auto">
              Logomuz, renklerimiz ve diğer kurumsal kimlik öğelerimize aşağıdaki bağlantıdan ulaşabilirsiniz.
          </p>
          <a href="/kurumsal-kimlik.html" target="_blank" class="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-primary transition-colors">
              Kurumsal Kimlik Dosyasını Görüntüle
          </a>
      </div>
      <!-- ABOUT_CI_END -->
    `,
    content_en: `
      <!-- ABOUT_HERO_START -->
      <h1 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900 text-center">About Us</h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed text-center">
          Haberfoni, established in 2025, is Turkey's next-generation news platform broadcasting with the principle of impartial and accurate journalism.
      </p>
      <!-- ABOUT_HERO_END -->

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 my-16">
          <div class="text-center">
              <h3 class="text-xl font-bold mb-4">Our Mission</h3>
              <p class="text-gray-600">To deliver the most up-to-date news to our readers in the fastest and most accurate way, without compromising the principle of impartiality.</p>
          </div>
          <div class="text-center">
              <h3 class="text-xl font-bold mb-4">Our Vision</h3>
              <p class="text-gray-600">To be Turkey's most followed news source as the address for reliability and quality in digital journalism.</p>
          </div>
          <div class="text-center">
              <h3 class="text-xl font-bold mb-4">Our Values</h3>
              <p class="text-gray-600">Accuracy, impartiality, respect for human rights, and commitment to professional principles of the press are our core values.</p>
          </div>
      </div>

      <!-- ABOUT_TEAM_START -->
      <h2 class="text-3xl font-bold text-center mb-12">Leadership Team</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="text-center">
              <h4 class="text-lg font-bold text-gray-900">Ahmet Yılmaz</h4>
              <p class="text-primary font-medium">Editor-in-Chief</p>
          </div>
          <div class="text-center">
              <h4 class="text-lg font-bold text-gray-900">Ayşe Demir</h4>
              <p class="text-primary font-medium">Managing Editor</p>
          </div>
          <div class="text-center">
              <h4 class="text-lg font-bold text-gray-900">Mehmet Kaya</h4>
              <p class="text-primary font-medium">Technology Editor</p>
          </div>
          <div class="text-center">
              <h4 class="text-lg font-bold text-gray-900">Zeynep Çelik</h4>
              <p class="text-primary font-medium">Economy Editor</p>
          </div>
      </div>
      <!-- ABOUT_TEAM_END -->

      <!-- ABOUT_CI_START -->
      <div class="text-center border-t border-gray-200 pt-12 mt-16">
          <h2 class="text-2xl font-bold mb-6">Corporate Identity</h2>
          <p class="text-gray-600 mb-8 max-w-2xl mx-auto">
              You can access our logo, colors, and other corporate identity elements via the link below.
          </p>
          <a href="/kurumsal-kimlik.html" target="_blank" class="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-primary transition-colors">
              View Corporate Identity File
          </a>
      </div>
      <!-- ABOUT_CI_END -->
    `
  },
  {
    slug: 'kunye',
    content: `
      <h1 class="text-4xl font-bold mb-10 text-center">Künye</h1>
      <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
              <h2 class="text-primary font-bold text-lg mb-4 uppercase tracking-wider border-b pb-2">İmtiyaz Sahibi</h2>
              <p class="font-semibold text-lg text-gray-900">Haberfoni Medya A.Ş.</p>
              <p class="text-gray-600 text-sm">Adına: Ahmet Yılmaz</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
              <h2 class="text-primary font-bold text-lg mb-4 uppercase tracking-wider border-b pb-2">Genel Yayın Yönetmeni</h2>
              <p class="font-semibold text-lg text-gray-900">Ahmet Yılmaz</p>
              <p class="text-gray-500 text-xs mt-0.5">ahmet@haberportalim.com</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
              <h2 class="text-primary font-bold text-lg mb-4 uppercase tracking-wider border-b pb-2">Sorumlu Yazı İşleri</h2>
              <p class="font-semibold text-lg text-gray-900">Ayşe Demir</p>
              <p class="text-gray-500 text-xs mt-0.5">ayse@haberportalim.com</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
              <h2 class="text-primary font-bold text-lg mb-4 uppercase tracking-wider border-b pb-2">Adres</h2>
              <p class="font-semibold text-lg text-gray-900">Maslak Mah. Büyükdere Cad. No:123 Sarıyer / İstanbul</p>
              <p class="text-gray-600 text-sm">Tel: +90 212 123 45 67</p>
          </div>
      </div>
    `,
    content_en: `
      <h1 class="text-4xl font-bold mb-10 text-center">Imprint</h1>
      <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
              <h2 class="text-primary font-bold text-lg mb-4 uppercase tracking-wider border-b pb-2">Owner</h2>
              <p class="font-semibold text-lg text-gray-900">Haberfoni Medya A.Ş.</p>
              <p class="text-gray-600 text-sm">On Behalf: Ahmet Yılmaz</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
              <h2 class="text-primary font-bold text-lg mb-4 uppercase tracking-wider border-b pb-2">Editor-in-Chief</h2>
              <p class="font-semibold text-lg text-gray-900">Ahmet Yılmaz</p>
              <p class="text-gray-500 text-xs mt-0.5">ahmet@haberportalim.com</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
              <h2 class="text-primary font-bold text-lg mb-4 uppercase tracking-wider border-b pb-2">Managing Editor</h2>
              <p class="font-semibold text-lg text-gray-900">Ayşe Demir</p>
              <p class="text-gray-500 text-xs mt-0.5">ayse@haberportalim.com</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-full">
              <h2 class="text-primary font-bold text-lg mb-4 uppercase tracking-wider border-b pb-2">Address</h2>
              <p class="font-semibold text-lg text-gray-900">Maslak Mah. Büyükdere Cad. No:123 Sarıyer / İstanbul</p>
              <p class="text-gray-600 text-sm">Tel: +90 212 123 45 67</p>
          </div>
      </div>
    `
  },
  {
    slug: 'iletisim',
    content: `
      <h1 class="text-4xl font-bold mb-4 text-center">İletişim</h1>
      <p class="text-gray-600 max-w-2xl mx-auto text-center mb-12">
          Görüşleriniz bizim için değerli. Bizimle iletişime geçin.
      </p>
      
      <!-- INFO_COL_START -->
      <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h3 class="text-xl font-bold mb-6 text-gray-900">İletişim Bilgileri</h3>
          <div class="space-y-6">
              <div>
                  <h4 class="font-semibold text-gray-900">E-posta</h4>
                  <p class="text-gray-600">info@haberportalim.com</p>
              </div>
              <div>
                  <h4 class="font-semibold text-gray-900">Telefon</h4>
                  <p class="text-gray-600">+90 212 123 45 67</p>
              </div>
              <div>
                  <h4 class="font-semibold text-gray-900">Adres</h4>
                  <p class="text-gray-600">Maslak Mah. Büyükdere Cad. No:123 Sarıyer İstanbul</p>
              </div>
          </div>
      </div>
      <!-- INFO_COL_END -->

      <!-- EXTRA_HTML_START -->
      <div class="rounded-xl overflow-hidden h-64 w-full shadow-sm border border-gray-100 my-8">
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.9633698339308!2d28.97798637668573!3d41.04799747134533!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab7650656bd63%3A0x8ca058b28c20b6c3!2zVGFrc2ltIE1leWRhbsSxLCBHw7xtw7zFKnN1eXUsIDM0NDM3IEJleW_En2x1L8Swc3RhbmJ1bA!5e0!3m2!1str!2str!4v1709669647062!5m2!1str!2str" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
      </div>
      <!-- EXTRA_HTML_END -->
    `,
    content_en: `
      <h1 class="text-4xl font-bold mb-4 text-center">Contact</h1>
      <p class="text-gray-600 max-w-2xl mx-auto text-center mb-12">
          Your feedback is valuable to us. Get in touch with us.
      </p>
      
      <!-- INFO_COL_START -->
      <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h3 class="text-xl font-bold mb-6 text-gray-900">Contact Information</h3>
          <div class="space-y-6">
              <div>
                  <h4 class="font-semibold text-gray-900">Email</h4>
                  <p class="text-gray-600">info@haberportalim.com</p>
              </div>
              <div>
                  <h4 class="font-semibold text-gray-900">Phone</h4>
                  <p class="text-gray-600">+90 212 123 45 67</p>
              </div>
              <div>
                  <h4 class="font-semibold text-gray-900">Address</h4>
                  <p class="text-gray-600">Maslak Mah. Büyükdere Cad. No:123 Sarıyer Istanbul</p>
              </div>
          </div>
      </div>
      <!-- INFO_COL_END -->

      <!-- EXTRA_HTML_START -->
      <div class="rounded-xl overflow-hidden h-64 w-full shadow-sm border border-gray-100 my-8">
          <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.9633698339308!2d28.97798637668573!3d41.04799747134533!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab7650656bd63%3A0x8ca058b28c20b6c3!2zVGFrc2ltIE1leWRhbsSxLCBHw7xtw7zFKnN1eXUsIDM0NDM3IEJleW_En2x1L8Swc3RhbmJ1bA!5e0!3m2!1str!2str!4v1709669647062!5m2!1str!2str" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
      </div>
      <!-- EXTRA_HTML_END -->
    `
  },
  {
    slug: 'kariyer',
    content: `
      <div class="text-center mb-10 md:mb-16">
          <h1 class="text-3xl md:text-4xl font-bold mb-4 md:mb-6">Kariyer Fırsatları</h1>
          <p class="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Geleceğin medyasını birlikte inşa edelim. Dinamik, yaratıcı ve tutkulu ekibimize katılın.
          </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
          <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-xl font-bold mb-4 text-primary">Sürekli Gelişim</h3>
              <p class="text-gray-600">Mesleki gelişiminizi destekliyor, eğitim ve konferans katılımları ile yeteneklerinizi artırmanızı sağlıyoruz.</p>
          </div>
          <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-xl font-bold mb-4 text-primary">Esnek Çalışma</h3>
              <p class="text-gray-600">Hibrit çalışma modeli ile ofis ve uzaktan çalışma dengesini kuruyor, verimliliğinizi önemsiyoruz.</p>
          </div>
          <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-xl font-bold mb-4 text-primary">Modern Teknoloji</h3>
              <p class="text-gray-600">En son medya teknolojileri ve dijital araçlarla çalışarak, sektörün öncüsü olmanızı sağlıyoruz.</p>
          </div>
      </div>
    `,
    content_en: `
      <div class="text-center mb-10 md:mb-16">
          <h1 class="text-3xl md:text-4xl font-bold mb-4 md:mb-6">Career Opportunities</h1>
          <p class="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              Let's build the media of the future together. Join our dynamic, creative and passionate team.
          </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
          <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-xl font-bold mb-4 text-primary">Continuous Improvement</h3>
              <p class="text-gray-600">We support your professional development and enable you to increase your skills through training and conference attendance.</p>
          </div>
          <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-xl font-bold mb-4 text-primary">Flexible Working</h3>
              <p class="text-gray-600">We establish a balance between office and remote work with a hybrid working model and care about your productivity.</p>
          </div>
          <div class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-xl font-bold mb-4 text-primary">Modern Technology</h3>
              <p class="text-gray-600">By working with the latest media technologies and digital tools, we ensure you are a pioneer in the industry.</p>
          </div>
      </div>
    `
  },
  {
    slug: 'kvkk',
    content: `
      <h1 class="text-3xl font-bold mb-8 text-gray-900">KVKK Aydınlatma Metni</h1>
      <p>Haberfoni olarak kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz.</p>
      <h3>1. Veri Sorumlusu</h3>
      <p>6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, kişisel verileriniz Haberfoni Medya A.Ş. tarafından işlenebilecektir.</p>
    `,
    content_en: `
      <h1 class="text-3xl font-bold mb-8 text-gray-900">KVKK Clarification Text</h1>
      <p>As Haberfoni, we show maximum sensitivity to the security of your personal data.</p>
      <h3>1. Data Controller</h3>
      <p>In accordance with the Law on the Protection of Personal Data No. 6698, your personal data may be processed by Haberfoni Medya A.Ş.</p>
    `
  },
  {
    slug: 'cerez-politikasi',
    content: `
      <h1 class="text-3xl font-bold mb-8 text-gray-900">Çerez Politikası</h1>
      <p>Haberfoni olarak, kullanıcılarımızın deneyimini geliştirmek amacıyla çerezler kullanmaktayız.</p>
    `,
    content_en: `
      <h1 class="text-3xl font-bold mb-8 text-gray-900">Cookie Policy</h1>
      <p>As Haberfoni, we use cookies to improve our users' experience.</p>
    `
  }
];

async function main() {
  for (const page of pageContents) {
    const existing = await prisma.page.findUnique({ where: { slug: page.slug } });
    if (existing) {
      await prisma.page.update({
        where: { id: existing.id },
        data: {
          content: page.content.trim(),
          content_en: page.content_en.trim()
        }
      });
      console.log(`Updated content for: ${page.slug}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
