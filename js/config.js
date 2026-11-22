// ============================================================
//  Web ile Sat — TÜM AYARLAR BU DOSYADA
//  (numara, Instagram, Meta Pixel, çark hediyeleri)
// ============================================================
export const AYAR = {
  // WhatsApp sipariş numarası (ülke kodu ile, boşluksuz)
  whatsapp: '905353770663',
  telefonGorunen: '0535 377 06 63',
  instagram: 'webilesat',
  eposta: '',               // istenirse: 'bilgi@webilesat.com.tr'
  sehir: 'Kocaeli',

  // Meta (Facebook/Instagram) Pixel kimliği. Boşsa hiç yüklenmez.
  // Doluysa ziyaretçi onay verince yüklenir (KVKK).
  metaPixel: '',

  // İndirim çarkı: hediyeler ve gelme olasılıkları (ağırlık)
  // Her dilim gerçek bir hediye (boş dilim yok). Pakette zaten olanlar ödül yapılmaz.
  // Bu hediyeleri gerçekten vermeniz gerekir; değiştirmek için burayı düzenleyin.
  cark: [
    { ad: '%5 indirim',          kisa: '%5',        agirlik: 26 },
    { ad: 'Ek 1 sayfa hediye',    kisa: '+1 sayfa',  agirlik: 18 },
    { ad: '%10 indirim',         kisa: '%10',       agirlik: 16 },
    { ad: 'Ek 1 Reels videosu',   kisa: '+1 Reels',  agirlik: 8 },
    { ad: '%7 indirim',          kisa: '%7',        agirlik: 16 },
    { ad: 'Ek dil hediye',        kisa: '+1 dil',    agirlik: 4 },
    { ad: '%15 indirim',         kisa: '%15',       agirlik: 4 },
    { ad: 'Ek 2 sayfa hediye',    kisa: '+2 sayfa',  agirlik: 8 },
  ],
};

export function waLink(mesaj) {
  return `https://wa.me/${AYAR.whatsapp}?text=${encodeURIComponent(mesaj)}`;
}
