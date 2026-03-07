require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const { Post, Lesson, Announcement } = require('../models/index');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/motogrup';

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('🔗 MongoDB bağlandı');

  // Drop entire database for clean slate
  await mongoose.connection.db.dropDatabase();
  console.log('🗑️  Veritabanı tamamen temizlendi');

  // Admin
  const admin = await User.create({
    email: 'admin@motogrup.com',
    password: 'Admin123!',
    firstName: 'Mehmet',
    lastName: 'Yılmaz',
    nickname: 'TURBO',
    role: 'admin',
    birthDate: new Date('1985-06-15'),
    phone: '0532 111 2233',
    bloodType: 'A+',
    motorcycle: { brand: 'Harley-Davidson', model: 'Fat Boy', plate: '34 TRB 01', year: 2020, type: 'Cruiser' },
    experienceLevel: 'Uzman',
    interests: ['Tur', 'Cruise', 'Modifikasyon'],
    stats: { totalKm: 45000, totalEvents: 87, totalPhotos: 234, totalBadges: 8 },
    badges: [
      { badgeId: 'first-tour' }, { badgeId: 'km-100' }, { badgeId: 'km-500' },
      { badgeId: 'km-1000' }, { badgeId: 'photographer' }, { badgeId: 'event-lover' },
      { badgeId: 'star-member' }, { badgeId: 'hot-member' }
    ]
  });

  const mod = await User.create({
    email: 'mod@motogrup.com',
    password: 'Mod123!',
    firstName: 'Ayşe',
    lastName: 'Kaya',
    nickname: 'FALCON',
    role: 'moderator',
    birthDate: new Date('1990-03-22'),
    bloodType: 'B+',
    motorcycle: { brand: 'BMW', model: 'R 1250 GS', plate: '06 BMW 22', year: 2022, type: 'Adventure' },
    experienceLevel: 'İleri',
    interests: ['Tur', 'Off-road'],
    stats: { totalKm: 28000, totalEvents: 43, totalPhotos: 89, totalBadges: 6 }
  });

  const member1 = await User.create({
    email: 'ali@example.com', password: 'User123!',
    firstName: 'Ali', lastName: 'Demir', nickname: 'THUNDER',
    birthDate: new Date('1992-08-10'), bloodType: '0+',
    motorcycle: { brand: 'Kawasaki', model: 'Z900', plate: '34 ALI 92', year: 2021, type: 'Naked' },
    experienceLevel: 'Orta', interests: ['Yarış', 'Tur'],
    stats: { totalKm: 12000, totalEvents: 15, totalPhotos: 45, totalBadges: 3 }
  });

  const member2 = await User.create({
    email: 'fatma@example.com', password: 'User123!',
    firstName: 'Fatma', lastName: 'Şahin', nickname: 'EAGLE',
    birthDate: new Date('1995-12-05'), bloodType: 'AB+',
    motorcycle: { brand: 'Honda', model: 'CB650R', plate: '35 FTM 95', year: 2023, type: 'Naked' },
    experienceLevel: 'Orta', interests: ['Tur', 'Cruise'],
    stats: { totalKm: 8500, totalEvents: 11, totalPhotos: 67, totalBadges: 2 }
  });

  const member3 = await User.create({
    email: 'can@example.com', password: 'User123!',
    firstName: 'Can', lastName: 'Arslan', nickname: 'VIPER',
    birthDate: new Date('1988-04-18'), bloodType: 'A-',
    motorcycle: { brand: 'Ducati', model: 'Monster 937', plate: '34 CAN 88', year: 2022, type: 'Naked' },
    experienceLevel: 'İleri', interests: ['Yarış', 'Modifikasyon'],
    stats: { totalKm: 31000, totalEvents: 38, totalPhotos: 112, totalBadges: 5 }
  });

  const members = [member1, member2, member3];

  // Events
  const events = await Event.create([
    {
      title: '🏔️ Uludağ Zirvesi Turu',
      description: 'Bursa\'nın muhteşem Uludağ dağını zirveye kadar çıkacağız. Nefes kesen manzaralar ve eşsiz virajlarla dolu bir rota sizi bekliyor!',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startPoint: 'Bursa - Osmangazi Meydanı',
      distance: 120,
      estimatedDuration: '4 saat',
      difficulty: 'Orta',
      capacity: 30,
      createdBy: admin._id,
      isApproved: true,
      isFeatured: true,
      tags: ['dağ', 'tur', 'manzara']
    },
    {
      title: '🌅 Ege Sahil Sürüşü',
      description: 'İzmir\'den Çeşme\'ye uzanan muhteşem Ege sahil yolunda gün batımı turu. Deniz kokusu ve yel değirmenleri eşliğinde unutulmaz bir deneyim.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      startPoint: 'İzmir - Kordon',
      distance: 200,
      estimatedDuration: '6 saat',
      difficulty: 'Kolay',
      capacity: 50,
      createdBy: mod._id,
      isApproved: true,
      tags: ['sahil', 'ege', 'gün batımı']
    },
    {
      title: '🏁 Kapadokya Macera Turu',
      description: '3 günlük Kapadokya turu! Peri bacaları, yeraltı şehirleri ve balon uçuşu. Motosikletle Kapadokya\'yı keşfetmeye hazır mısınız?',
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      startPoint: 'Ankara - AŞTİ',
      distance: 450,
      estimatedDuration: '3 gün',
      difficulty: 'Orta',
      capacity: 20,
      createdBy: admin._id,
      isApproved: true,
      isFeatured: true,
      tags: ['kapadokya', 'macera', '3 gün']
    }
  ]);

  // Posts
  await Post.create([
    {
      author: admin._id,
      content: '🏍️ Bugün sabah turu harika geçti! Uludağ\'ın sisli yamaçlarında sürmek bambaşka bir his. Grubumuzla harika anlar yaşadık. Bir sonraki turda görüşmek üzere! #MotoGrup #Uludağ #MotorTuru',
      type: 'post',
      likes: [members[0]._id, members[1]._id, mod._id]
    },
    {
      author: members[0]._id,
      content: '⚡ Kawasaki Z900 ile ilk uzun turu tamamladım! 450 km, 6 saat... Bacaklarım tutmuyor ama gönlüm tam 🔥 MotoGrup ailesi teşekkürler!',
      type: 'post',
      likes: [admin._id, members[1]._id]
    },
    {
      author: members[2]._id,
      content: '🔧 Ducati bakımdan çıktı, rögar kapakları sıfırlandı. Artık hazırız! Kapadokya turuna kadar 500 km ısınma gerekiyor 😄',
      type: 'post',
      likes: [admin._id, mod._id, members[0]._id]
    }
  ]);

  // Academy Lessons
  await Lesson.create([
    {
      title: 'Viraj Alma Teknikleri',
      description: 'Güvenli ve verimli viraj alma tekniklerini öğrenin. Counter-steering, lean angle ve vücut pozisyonu hakkında detaylı bilgiler.',
      category: 'sürüş-teknikleri',
      youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '18:32',
      difficulty: 'Orta',
      instructor: 'Mehmet Yılmaz',
      views: 245,
      order: 1,
      tags: ['viraj', 'teknik', 'güvenlik']
    },
    {
      title: 'Güvenli Frenaj ve Mesafe',
      description: 'Emergency braking, trail braking ve güvenli takip mesafesi hesaplama. Acil durumlarda nasıl fren yapılır öğrenin.',
      category: 'sürüş-teknikleri',
      youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '22:15',
      difficulty: 'Kolay',
      instructor: 'Ayşe Kaya',
      views: 312,
      order: 2,
      tags: ['fren', 'güvenlik', 'mesafe']
    },
    {
      title: 'El İşaretleri ve Anlamları',
      description: 'Grup sürüşünde kullanılan standart el işaretlerinin tam listesi ve açıklamaları. İletişim hayat kurtarır!',
      category: 'grup-kuralları',
      youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '12:45',
      difficulty: 'Kolay',
      instructor: 'Mehmet Yılmaz',
      views: 189,
      order: 1,
      tags: ['el işaretleri', 'grup', 'iletişim']
    },
    {
      title: 'Adım Adım Yağ Değişimi',
      description: 'Motosiklet yağ değişimini kendiniz nasıl yaparsınız? Gerekli malzemeler ve adımlar. Kendin yap, tasarruf et!',
      category: 'motor-bakımı',
      youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '28:10',
      difficulty: 'Kolay',
      instructor: 'Can Arslan',
      views: 428,
      order: 1,
      tags: ['yağ', 'bakım', 'kendin yap']
    },
    {
      title: 'Kaza Anında Yapılacaklar',
      description: 'Trafik kazası sonrasında hayat kurtaracak bilgiler. İlk müdahale, kask çıkarma ve acil arama prosedürleri.',
      category: 'ilk-yardım',
      youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '35:20',
      difficulty: 'Orta',
      instructor: 'Dr. Fatma Şahin',
      views: 567,
      order: 1,
      tags: ['kaza', 'ilk yardım', 'güvenlik', 'acil']
    }
  ]);

  // Announcement
  await Announcement.create({
    title: '🎉 MotoGrup\'a Hoş Geldiniz!',
    content: 'Türkiye\'nin en büyük motorcu topluluğuna katıldığınız için teşekkürler. Birlikte daha güçlüyüz!',
    type: 'success',
    isEmergency: false,
    isActive: true,
    createdBy: admin._id
  });

  console.log('✅ Seed data yüklendi!');
  console.log('👤 Admin: admin@motogrup.com / Admin123!');
  console.log('👤 Mod: mod@motogrup.com / Mod123!');
  console.log('👤 Üye: ali@example.com / User123!');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
