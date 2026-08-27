const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clean slate
  console.log('Clearing existing data...');
  await prisma.favorite.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create users
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'sobittest@gmail.com',
      password: hashedPassword,
      firstName: 'Sobit',
      lastName: 'Admin',
      phone: '555-0100',
      role: 'ADMIN',
    },
  });

  const agent = await prisma.user.create({
    data: {
      email: 'bitbysobit@gmail.com',
      password: hashedPassword,
      firstName: 'Sobit',
      lastName: 'Agent',
      phone: '555-0101',
      role: 'AGENT',
    },
  });

  console.log(`  Admin: ${admin.email} (${admin.id})`);
  console.log(`  Agent: ${agent.email} (${agent.id})`);

  // Create properties for the agent
  console.log('Creating properties...');
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        title: 'Modern Downtown Loft',
        description: 'Stunning open-concept loft in the heart of downtown with floor-to-ceiling windows, exposed brick walls, and premium finishes throughout.',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        price: 425000,
        area: 1200,
        bedrooms: 2,
        bathrooms: 2,
        address: '350 5th Avenue, Apt 12B',
        city: 'New York',
        state: 'NY',
        zipCode: '10118',
        latitude: 40.7484,
        longitude: -73.9857,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
        amenities: ['Doorman', 'Gym', 'Rooftop Deck', 'In-Unit Laundry'],
        yearBuilt: 2019,
        agentId: agent.id,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Spacious Family Home with Pool',
        description: 'Beautiful 4-bedroom family home featuring a large backyard with heated pool, updated kitchen with granite countertops, and a two-car garage.',
        type: 'HOUSE',
        status: 'AVAILABLE',
        price: 875000,
        area: 3200,
        bedrooms: 4,
        bathrooms: 3,
        address: '742 Evergreen Terrace',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        latitude: 30.2672,
        longitude: -97.7431,
        images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
        amenities: ['Pool', 'Garage', 'Central AC', 'Hardwood Floors', 'Fireplace'],
        yearBuilt: 2015,
        agentId: agent.id,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Luxury Beachfront Condo',
        description: 'Wake up to ocean views every morning in this fully renovated 3-bedroom condo. Steps from the beach with resort-style amenities.',
        type: 'CONDO',
        status: 'AVAILABLE',
        price: 1250000,
        area: 2100,
        bedrooms: 3,
        bathrooms: 2,
        address: '1000 Ocean Drive, Unit 8A',
        city: 'Miami',
        state: 'FL',
        zipCode: '33139',
        latitude: 25.7617,
        longitude: -80.1918,
        images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
        amenities: ['Ocean View', 'Pool', 'Spa', 'Valet Parking', 'Concierge'],
        yearBuilt: 2021,
        agentId: agent.id,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Charming Victorian Townhouse',
        description: 'Beautifully restored Victorian townhouse with original hardwood floors, crown molding, and a private garden patio in a historic neighborhood.',
        type: 'TOWNHOUSE',
        status: 'PENDING',
        price: 695000,
        area: 2400,
        bedrooms: 3,
        bathrooms: 2,
        address: '1847 Pacific Heights Blvd',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94115',
        latitude: 37.7749,
        longitude: -122.4194,
        images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800'],
        amenities: ['Garden', 'Hardwood Floors', 'Crown Molding', 'Wine Cellar'],
        yearBuilt: 1898,
        agentId: agent.id,
      },
    }),
    prisma.property.create({
      data: {
        title: 'Prime Commercial Space',
        description: 'Turn-key commercial space perfect for retail or office use. High foot traffic location with ample parking and modern HVAC system.',
        type: 'COMMERCIAL',
        status: 'AVAILABLE',
        price: 550000,
        area: 4500,
        bedrooms: 0,
        bathrooms: 2,
        address: '200 Commerce Street',
        city: 'Denver',
        state: 'CO',
        zipCode: '80202',
        latitude: 39.7392,
        longitude: -104.9903,
        images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
        amenities: ['Parking Lot', 'Central HVAC', 'Loading Dock', 'Security System'],
        yearBuilt: 2010,
        agentId: agent.id,
      },
    }),
  ]);

  console.log(`  Created ${properties.length} properties`);

  console.log('\n========================================');
  console.log('  Seeding complete!');
  console.log('========================================');
  console.log(`  Users:      2 (1 admin, 1 agent)`);
  console.log(`  Properties: ${properties.length}`);
  console.log(`  Password:   Password123!`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
