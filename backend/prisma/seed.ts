import { PrismaClient, UserRole, SellerStatus, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding KarigarCo. database...');

  // ─── CATEGORIES ───────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'pottery-ceramics' },
      update: {},
      create: {
        name: 'Pottery & Ceramics',
        slug: 'pottery-ceramics',
        description: 'Hand-thrown pottery, ceramic vessels, and earthenware from across India',
        imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'wooden-crafts' },
      update: {},
      create: {
        name: 'Wooden Crafts',
        slug: 'wooden-crafts',
        description: 'Carved wooden artefacts, furniture accents, and decorative woodwork',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'metal-crafts' },
      update: {},
      create: {
        name: 'Brass & Metal Crafts',
        slug: 'metal-crafts',
        description: 'Brass, copper, and bronze crafts from traditional Indian metalwork traditions',
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'home-decor' },
      update: {},
      create: {
        name: 'Home Décor',
        slug: 'home-decor',
        description: 'Handmade decorative pieces for your living spaces',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'handwoven' },
      update: {},
      create: {
        name: 'Handwoven Products',
        slug: 'handwoven',
        description: 'Naturally woven baskets, trays, and home accessories',
        imageUrl: 'https://images.unsplash.com/photo-1588436706487-9d55d73a39e3?w=800',
        sortOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'art-wall-decor' },
      update: {
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
      },
      create: {
        name: 'Art & Wall Décor',
        slug: 'art-wall-decor',
        description: 'Regional paintings, prints, and wall hangings by Indian artists',
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
        sortOrder: 6,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'lifestyle-accessories' },
      update: {},
      create: {
        name: 'Lifestyle Accessories',
        slug: 'lifestyle-accessories',
        description: 'Handmade accessories for everyday living',
        imageUrl: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',
        sortOrder: 7,
      },
    }),
  ]);

  console.log('✅ Categories created');

  // ─── ADMIN USER ───────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@karigarco.in' },
    update: {},
    create: {
      email: 'admin@karigarco.in',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'KarigarCo.',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Admin user created: admin@karigarco.in / Admin@123456');

  // ─── SELLER 1 ─────────────────────────────────────────────────
  const seller1PasswordHash = await bcrypt.hash('Seller@123456', 12);
  const seller1User = await prisma.user.upsert({
    where: { email: 'meera.pottery@karigarco.in' },
    update: {},
    create: {
      email: 'meera.pottery@karigarco.in',
      passwordHash: seller1PasswordHash,
      firstName: 'Meera',
      lastName: 'Sharma',
      role: UserRole.SELLER,
      isEmailVerified: true,
      isActive: true,
    },
  });

  const seller1Profile = await prisma.sellerProfile.upsert({
    where: { userId: seller1User.id },
    update: {},
    create: {
      userId: seller1User.id,
      shopName: "Meera's Pottery Studio",
      slug: 'meeras-pottery-studio',
      description: "Meera's Pottery Studio brings you handcrafted ceramics from the heartland of Rajasthan. Each piece is wheel-thrown and hand-painted using traditional techniques passed down through generations.",
      artisanStory: "I learnt pottery from my grandmother in Jaipur. Every piece I create carries a little piece of that heritage — the earthy smell of clay, the spinning wheel, and the patience to let the fire do its work.",
      craftSpecialization: 'Blue Pottery, Terracotta, Ceramic Art',
      city: 'Jaipur',
      state: 'Rajasthan',
      pinCode: '302001',
      businessAddress: '12, Pottery Lane, Sanganer',
      phone: '9876543210',
      status: SellerStatus.APPROVED,
      isVerified: true,
      commissionRate: 10,
      approvedAt: new Date(),
    },
  });
  console.log('✅ Seller 1 created: meera.pottery@karigarco.in / Seller@123456');

  // ─── SELLER 2 ─────────────────────────────────────────────────
  const seller2PasswordHash = await bcrypt.hash('Seller@123456', 12);
  const seller2User = await prisma.user.upsert({
    where: { email: 'raju.woodcraft@karigarco.in' },
    update: {},
    create: {
      email: 'raju.woodcraft@karigarco.in',
      passwordHash: seller2PasswordHash,
      firstName: 'Raju',
      lastName: 'Verma',
      role: UserRole.SELLER,
      isEmailVerified: true,
      isActive: true,
    },
  });

  const seller2Profile = await prisma.sellerProfile.upsert({
    where: { userId: seller2User.id },
    update: {},
    create: {
      userId: seller2User.id,
      shopName: 'Verma Wood Crafts',
      slug: 'verma-wood-crafts',
      description: 'Verma Wood Crafts specializes in intricate woodwork from the forests of Bastar, Chhattisgarh. We use sustainably sourced local wood to create pieces that tell stories of the land.',
      artisanStory: "My father taught me to carve when I was seven years old. I use the same tools he used, and I hope my son will carry this forward. Each carving takes days — sometimes weeks — but the result is something that will last a lifetime.",
      craftSpecialization: 'Bastar Tribal Woodcraft, Wooden Sculptures',
      city: 'Jagdalpur',
      state: 'Chhattisgarh',
      pinCode: '494001',
      businessAddress: '45, Craft Village, Bastar',
      phone: '9765432109',
      status: SellerStatus.APPROVED,
      isVerified: true,
      commissionRate: 10,
      approvedAt: new Date(),
    },
  });
  console.log('✅ Seller 2 created: raju.woodcraft@karigarco.in / Seller@123456');

  // ─── CUSTOMER ─────────────────────────────────────────────────
  const customerPasswordHash = await bcrypt.hash('Customer@123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'priya@example.com' },
    update: {},
    create: {
      email: 'priya@example.com',
      passwordHash: customerPasswordHash,
      firstName: 'Priya',
      lastName: 'Nair',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Customer created: priya@example.com / Customer@123');

  // ─── PRODUCTS ─────────────────────────────────────────────────
  const potteryCategory = categories.find((c) => c.slug === 'pottery-ceramics')!;
  const woodenCategory = categories.find((c) => c.slug === 'wooden-crafts')!;
  const homeDecorCategory = categories.find((c) => c.slug === 'home-decor')!;
  const artCategory = categories.find((c) => c.slug === 'art-wall-decor')!;

  // Products for Meera's Pottery
  const products1 = [
    {
      name: 'Blue Pottery Vase — Jaipur',
      slug: 'blue-pottery-vase-jaipur',
      description: 'A stunning blue pottery vase handcrafted in Jaipur using the traditional Persian-influenced blue pottery technique. Each vase features intricate floral motifs hand-painted by skilled artisans. The characteristic quartz-based clay gives it a distinctive translucent quality.',
      shortDescription: 'Traditional Jaipur blue pottery vase with hand-painted floral motifs',
      price: 1850,
      comparePrice: 2200,
      materials: 'Quartz clay, natural dyes, copper oxide glazes',
      dimensions: '12cm H × 8cm W',
      craftOrigin: 'Jaipur, Rajasthan',
      tags: ['pottery', 'blue pottery', 'vase', 'Jaipur', 'handmade'],
      categoryId: potteryCategory.id,
      imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
    },
    {
      name: 'Terracotta Planter Set — Set of 3',
      slug: 'terracotta-planter-set',
      description: 'A beautiful set of three hand-thrown terracotta planters, each slightly different — celebrating the organic beauty of handmade ware. Perfect for succulents, herbs, and small indoor plants. The natural terracotta breathes, keeping roots healthy.',
      shortDescription: 'Hand-thrown terracotta planters, set of 3 graduated sizes',
      price: 1200,
      materials: 'Natural terracotta clay, iron oxide',
      dimensions: 'Large: 15cm H, Medium: 11cm H, Small: 8cm H',
      craftOrigin: 'Sanganer, Rajasthan',
      tags: ['terracotta', 'planter', 'garden', 'handmade', 'set'],
      categoryId: potteryCategory.id,
      imageUrl: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=800',
    },
    {
      name: 'Ceramic Chai Cup Set — 6 Cups',
      slug: 'ceramic-chai-cup-set',
      description: 'Start your mornings with chai in these beautiful hand-thrown ceramic cups. Each cup in this set of six has a slight variation in glaze — a natural consequence of the kiln-firing process and a hallmark of authenticity. Microwave and dishwasher safe.',
      shortDescription: 'Set of 6 handmade ceramic chai cups with earthy glaze',
      price: 2400,
      materials: 'Stoneware clay, food-safe glazes',
      dimensions: '7cm H, 180ml capacity',
      craftOrigin: 'Jaipur, Rajasthan',
      tags: ['ceramic', 'chai', 'cups', 'kitchenware', 'set', 'handmade'],
      categoryId: potteryCategory.id,
      imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    },
  ];

  // Products for Verma Wood Crafts
  const products2 = [
    {
      name: 'Bastar Tribal Owl Sculpture',
      slug: 'bastar-tribal-owl-sculpture',
      description: 'A magnificent hand-carved wooden owl sculpture in the distinctive Bastar tribal art style. This piece is carved from a single block of shisham wood by master craftsman Raju Verma. The intricate geometric patterns on the feathers are characteristic of Bastar folk art, drawing from the visual vocabulary of the indigenous tribes of Chhattisgarh.',
      shortDescription: 'Hand-carved Bastar tribal owl in shisham wood',
      price: 3500,
      comparePrice: 4200,
      materials: 'Shisham wood, natural beeswax finish',
      dimensions: '25cm H × 15cm W',
      craftOrigin: 'Jagdalpur, Chhattisgarh',
      tags: ['bastar', 'tribal', 'wood carving', 'owl', 'sculpture', 'folk art'],
      categoryId: woodenCategory.id,
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    },
    {
      name: 'Hand-Carved Wooden Fruit Bowl',
      slug: 'hand-carved-wooden-fruit-bowl',
      description: 'A generous hand-carved fruit bowl in solid mango wood, finished with food-safe oils. The natural grain of the mango wood creates a unique surface pattern on every piece. The slight rustic finish gives it warmth and character. Perfect as a centrepiece for your dining table.',
      shortDescription: 'Solid mango wood fruit bowl with natural finish',
      price: 2200,
      materials: 'Solid mango wood, food-safe linseed oil finish',
      dimensions: '10cm H × 32cm diameter',
      craftOrigin: 'Jagdalpur, Chhattisgarh',
      tags: ['wooden', 'bowl', 'fruit bowl', 'mango wood', 'handcarved'],
      categoryId: homeDecorCategory.id,
      imageUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800',
    },
    {
      name: 'Warli Art Wooden Wall Panel',
      slug: 'warli-art-wooden-wall-panel',
      description: 'An exquisite wall panel featuring traditional Warli art painted on reclaimed wood. Warli is one of India\'s oldest tribal art forms, using simple geometric shapes to narrate scenes of community life, nature, and celebration. This panel celebrates a harvest festival with dancing figures surrounded by nature.',
      shortDescription: 'Traditional Warli painting on reclaimed wooden panel',
      price: 4800,
      comparePrice: 5500,
      materials: 'Reclaimed teak wood, natural white pigment',
      dimensions: '60cm × 40cm',
      craftOrigin: 'Jagdalpur, Chhattisgarh',
      tags: ['warli', 'wall art', 'tribal art', 'wood panel', 'traditional'],
      categoryId: artCategory.id,
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
    },
  ];

  for (const p of products1) {
    const { imageUrl, ...productData } = p;
    const existing = await prisma.product.findUnique({ where: { slug: productData.slug } });
    if (!existing) {
      const product = await prisma.product.create({
        data: {
          ...productData,
          sellerId: seller1Profile.id,
          status: ProductStatus.PUBLISHED,
          approvedAt: new Date(),
          isFeatured: true,
        },
      });
      await prisma.productImage.create({
        data: { productId: product.id, url: imageUrl, isPrimary: true, sortOrder: 0 },
      });
      await prisma.inventory.create({
        data: { productId: product.id, quantity: 15, lowStockAlert: 3 },
      });
    }
  }

  for (const p of products2) {
    const { imageUrl, ...productData } = p;
    const existing = await prisma.product.findUnique({ where: { slug: productData.slug } });
    if (!existing) {
      const product = await prisma.product.create({
        data: {
          ...productData,
          sellerId: seller2Profile.id,
          status: ProductStatus.PUBLISHED,
          approvedAt: new Date(),
          isFeatured: true,
        },
      });
      await prisma.productImage.create({
        data: { productId: product.id, url: imageUrl, isPrimary: true, sortOrder: 0 },
      });
      await prisma.inventory.create({
        data: { productId: product.id, quantity: 10, lowStockAlert: 2 },
      });
    }
  }

  console.log('✅ Products created');

  // ─── SAMPLE COUPON ────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off on your first order',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscount: 300,
      isActive: true,
    },
  });
  console.log('✅ Sample coupon created: WELCOME10');

  // ─── HOMEPAGE BANNERS ─────────────────────────────────────────
  await prisma.homepageBanner.upsert({
    where: { id: 'banner-1' },
    update: {},
    create: {
      id: 'banner-1',
      title: 'Tradition, Crafted for Today.',
      subtitle: "Discover India's finest handmade products from artisans who have perfected their craft over generations.",
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920',
      ctaText: 'Explore Collection',
      ctaUrl: '/shop',
      sortOrder: 1,
      isActive: true,
    },
  });

  console.log('✅ Homepage banners created');

  console.log('\n🎉 Seeding complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('📧 Admin:    admin@karigarco.in       / Admin@123456');
  console.log('📧 Seller 1: meera.pottery@karigarco.in / Seller@123456');
  console.log('📧 Seller 2: raju.woodcraft@karigarco.in / Seller@123456');
  console.log('📧 Customer: priya@example.com        / Customer@123');
  console.log('🏷️  Coupon:   WELCOME10 (10% off, min ₹500)');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
