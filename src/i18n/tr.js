export default {
  // Genel
  common: {
    save: 'Kaydet',
    saved: 'Kaydedildi',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    close: 'Kapat',
    back: 'Geri',
    add: 'Ekle',
    loading: 'Yükleniyor...',
    confirm_delete: 'Bu kaydı silmek istediğinize emin misiniz?',
    all: 'Tümü',
    error: 'Hata',
  },

  // Auth
  auth: {
    username: 'Kullanıcı Adı',
    username_placeholder: 'kullanici',
    password: 'Şifre',
    password_placeholder: '••••••••',
    login: 'Giriş Yap',
    logout: 'Çıkış Yap',
    login_failed: 'Giriş başarısız.',
    username_empty: 'Kullanıcı adı boş olamaz.',
    default_hint: 'İlk giriş:',
    role_admin: 'Yönetici',
    role_user: 'Kullanıcı',
  },

  // Arama
  search: {
    placeholder: 'Parça kodu, OEM numarası veya ürün adı...',
    button: 'Ara',
    subtitle: '{count} B2B kaynaktan anlık fiyat ve stok karşılaştırma',
    examples: {
      oem: 'OEM kodu',
      brand: 'Marka kodu',
      name: 'Parça adı',
      ate: 'ATE kodu',
    },
  },

  // Sonuçlar
  results: {
    new_search: 'Yeni Arama',
    searching: 'Aranıyor...',
    no_results: 'Sonuç bulunamadı',
    no_results_sub: 'Farklı bir arama terimi deneyin.',
    sort_price_asc: 'Fiyat: Düşükten Yükseğe',
    sort_price_desc: 'Fiyat: Yüksekten Düşüğe',
    sort_source: 'Kaynağa Göre',
    filter_all: 'Tümü',
    filter_in_stock: 'Stoklu',
    filter_low_stock: 'Az Kaldı',
    filter_no_stock: 'Stok yok',
    stock_in: 'Stoklu',
    stock_low: 'Az Kaldı',
    stock_out: 'Stok yok',
    unit: 'adet',
    days: 'gün',
    cheapest: 'En Ucuz',
    sources: 'kaynak',
    saving: 'tasarruf',
  },

  // Ayarlar
  settings: {
    title: 'B2B Bağlantı Ayarları',
    dealer_count: '{count} bayi',
    add_dealer: 'Bayi Ekle',
    select_dealer: 'Bayi seçin...',
    dealer_username: 'Bayi Kullanıcı Adı',
    login_username: 'Kullanıcı Adı',
    fill_all: 'Tüm alanları doldurun.',
    remove_dealer: 'Bayiyi kaldır',
    connect: 'Bağlan',
    reconnect: 'Yeniden Bağlan',
    connecting: 'Bağlanıyor...',
    connected: 'Bağlı',
    otp_waiting: 'OTP Bekleniyor',
    otp_title: 'Doğrulama Kodu Gerekiyor',
    otp_verify: 'Doğrula',
    otp_cancel: 'İptal',
    otp_placeholder: '_ _ _ _ _ _',
    no_dealer: 'Tanımlı bayi bulunmuyor. Lütfen admin panelinden bayi ekleyin.',
    credentials_secure: 'Kimlik bilgileri veritabanında güvenli şekilde saklanır.',
  },

  // Admin
  admin: {
    title: 'Admin Paneli',
    users: 'Kullanıcılar',
    add_user: 'Kullanıcı Ekle',
    new_password_placeholder: 'Yeni şifre (değiştirmek için)',
    user_created: 'Kullanıcı oluşturulamadı.',
    confirm_delete_user: 'Bu kullanıcıyı silmek istediğinize emin misiniz?',
  },

  // Menü
  menu: {
    settings: 'B2B Bağlantı Ayarları',
    admin: 'Admin Paneli',
  },
}
