export const B2B_SOURCES = [
  {
    id: 'dinamik_oto',
    name: 'Dinamik Oto',
    country: 'TR',
    authType: 'dinamik_oto',
    fields: [
      { key: 'customerCode', label: 'Müşteri Kodu', placeholder: 'Ör: DA345400' },
      { key: 'username',     label: 'Kullanıcı Adı', placeholder: 'kullanici' },
      { key: 'password',     label: 'Şifre', placeholder: '••••••••', secret: true },
    ],
  },
  {
    id: 'martas',
    name: 'Martaş',
    country: 'TR',
    authType: 'generic',
    fields: [
      { key: 'systemId',  label: 'Sistem ID',     placeholder: 'Ör: FIRM001' },
      { key: 'username',  label: 'Kullanıcı Adı', placeholder: 'kullanici' },
      { key: 'password',  label: 'Şifre',         placeholder: '••••••••', secret: true },
    ],
  },
]

const BRANDS = ['Bosch','ATE','Febi','LuK','SKF','Continental','Valeo','Sachs','TRW','Brembo','Gates','FAG','INA','NGK','Denso','Delphi','Hella','Mann','Mahle','Knecht']
const CATEGORIES = ['Fren Sistemi','Süspansiyon','Filtreler','Motor','Elektrik','Aktarma','Soğutma','Yakıt','Aydınlatma','Egzoz']
const DESCS = [
  'Fren Diski Ön Takım','Balata Seti Ön','Amortisör Ön Sol','Rotil Dış','Hidrolik Pompa',
  'Yağ Filtresi','Hava Filtresi','Bujisi Seti','Krank Kasnağı','Triger Seti','Polen Filtresi',
  'Yakıt Filtresi','Alternatör','Marş Motoru','Radyatör','Su Pompası','Termostat','Egzoz Manifoldu'
]

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randCode(q) {
  const clean = q.replace(/\s/g, '').toUpperCase()
  const variants = [
    clean,
    pick(BRANDS).substring(0,3).toUpperCase() + '-' + rand(10000,99999),
    'OEM' + rand(100000,999999),
    clean.substring(0, Math.min(8, clean.length)) + '-' + rand(100,999),
  ]
  return pick(variants)
}

// Simulates one B2B adapter call with realistic delay
export function queryAdapter(source, query) {
  return new Promise((resolve) => {
    const delay = rand(300, 3200)
    setTimeout(() => {
      // 15% chance source returns nothing
      if (Math.random() < 0.15) { resolve([]); return }

      const count = rand(1, 4)
      const items = []
      const basePrice = rand(150, 6500)
      const stockPool = ['in','in','in','in','in','low','low','out']

      for (let i = 0; i < count; i++) {
        const stock = pick(stockPool)
        const priceVariance = basePrice * (0.85 + Math.random() * 0.4)
        items.push({
          id: source.id + '_' + i + '_' + Date.now(),
          sourceId: source.id,
          sourceName: source.name,
          sourceCountry: source.country,
          partCode: randCode(query),
          oemCode: rand(1000000000, 9999999999).toString(),
          brand: pick(BRANDS),
          category: pick(CATEGORIES),
          description: pick(DESCS),
          price: Math.round(priceVariance),
          currency: 'TRY',
          stock,
          qty: stock === 'out' ? 0 : stock === 'low' ? rand(1,5) : rand(6,500),
          url: 'https://' + source.id.replace('_','-') + '.example.com/part/' + rand(1000,9999),
          leadDays: stock === 'out' ? rand(7,21) : 0,
        })
      }
      resolve(items)
    }, delay)
  })
}

export async function searchAllSources(query, onSourceDone) {
  const promises = B2B_SOURCES.map(async (source) => {
    const results = await queryAdapter(source, query)
    onSourceDone(source, results)
    return results
  })
  const all = await Promise.all(promises)
  return all.flat()
}
