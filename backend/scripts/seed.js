// const { MongoClient } = require('mongodb');
// const { faker } = require('@faker-js/faker');

// const uri = 'mongodb://127.0.0.1:27017';
// const dbName = 'reviewlens';

// const NUM_USERS = 500;
// const NUM_BUSINESSES = 1000;
// const NUM_REVIEWS = 5000;

// // Coordinate bounding boxes for our cities
// const cities = [
//   { name: 'Philadelphia', state: 'PA', center: { lat: 39.9526, lng: -75.1652 } },
//   { name: 'Las Vegas', state: 'NV', center: { lat: 36.1699, lng: -115.1398 } },
//   { name: 'Phoenix', state: 'AZ', center: { lat: 33.4484, lng: -112.0740 } },
//   { name: 'Charlotte', state: 'NC', center: { lat: 35.2271, lng: -80.8431 } },
//   { name: 'Pittsburgh', state: 'PA', center: { lat: 40.4406, lng: -79.9959 } }
// ];

// const categoriesList = ['Restaurants', 'Shopping', 'Home Services', 'Beauty & Spas', 'Health & Medical', 'Local Services', 'Automotive', 'Nightlife', 'Bars', 'Event Planning & Services', 'Active Life', 'Coffee & Tea', 'Sandwiches', 'Fast Food', 'American (Traditional)'];

// function generateRandomLocation(centerLat, centerLng, radiusInDegrees = 0.1) {
//   // Rough calculation for bounding box
//   const u = Math.random();
//   const v = Math.random();
//   const w = radiusInDegrees * Math.sqrt(u);
//   const t = 2 * Math.PI * v;
//   const x = w * Math.cos(t);
//   const y = w * Math.sin(t);
  
//   // Note: MongoDB expects Longitude first in Coordinates array [lng, lat]
//   return {
//     type: 'Point',
//     coordinates: [centerLng + x, centerLat + y]
//   };
// }

// async function seed() {
//   const client = new MongoClient(uri);

//   try {
//     await client.connect();
//     console.log('Connected to server');
//     const db = client.db(dbName);

//     const usersCol = db.collection('users');
//     const businessesCol = db.collection('businesses');
//     const reviewsCol = db.collection('reviews');

//     // Generate Users
//     console.log(`Generating ${NUM_USERS} users...`);
//     const users = [];
//     for (let i = 0; i < NUM_USERS; i++) {
//       users.push({
//         user_id: faker.string.uuid(),
//         name: faker.person.fullName(),
//         review_count: faker.number.int({ min: 1, max: 500 }),
//         useful: faker.number.int({ min: 0, max: 1000 }),
//         funny: faker.number.int({ min: 0, max: 500 }),
//         cool: faker.number.int({ min: 0, max: 500 }),
//         elite: faker.datatype.boolean() ? faker.date.past().getFullYear().toString() : '',
//         average_stars: faker.number.float({ min: 1, max: 5, fractionDigits: 2 })
//       });
//     }
//     await usersCol.insertMany(users);

//     // Generate Businesses
//     console.log(`Generating ${NUM_BUSINESSES} businesses...`);
//     const businesses = [];
//     for (let i = 0; i < NUM_BUSINESSES; i++) {
//         const cityObj = faker.helpers.arrayElement(cities);
//         const cats = faker.helpers.arrayElements(categoriesList, faker.number.int({ min: 1, max: 4 }));
        
//         businesses.push({
//             business_id: faker.string.uuid(),
//             name: faker.company.name(),
//             address: faker.location.streetAddress(),
//             city: cityObj.name,
//             state: cityObj.state,
//             postal_code: faker.location.zipCode(),
//             location: generateRandomLocation(cityObj.center.lat, cityObj.center.lng),
//             stars: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
//             review_count: 0, // We will update this later or leave it as baseline
//             is_open: faker.datatype.boolean() ? 1 : 0,
//             categories: cats,
//             attributes: {
//                 "RestaurantsTakeOut": faker.datatype.boolean().toString(),
//                 "BusinessParking": "{'garage': False, 'street': True, 'validated': False, 'lot': False, 'valet': False}"
//             },
//             hours: {
//                 "Monday": "9:0-17:0",
//                 "Tuesday": "9:0-17:0",
//                 "Wednesday": "9:0-17:0",
//                 "Thursday": "9:0-17:0",
//                 "Friday": "9:0-17:0"
//             }
//         });
//     }
//     await businessesCol.insertMany(businesses);

//     // Generate Reviews
//     console.log(`Generating ${NUM_REVIEWS} reviews...`);
//     const reviews = [];
//     // Batch reviews into chunks to avoid running out of memory
//     const BATCH_SIZE = 1000;
    
//     for (let i = 0; i < NUM_REVIEWS; i++) {
//         const user = faker.helpers.arrayElement(users);
//         const business = faker.helpers.arrayElement(businesses);
//         const reviewStars = faker.number.int({ min: 1, max: 5 });
        
//         reviews.push({
//             review_id: faker.string.uuid(),
//             user_id: user.user_id,
//             business_id: business.business_id,
//             stars: reviewStars,
//             useful: faker.number.int({ min: 0, max: 10 }),
//             funny: faker.number.int({ min: 0, max: 10 }),
//             cool: faker.number.int({ min: 0, max: 10 }),
//             text: faker.lorem.paragraph(),
//             date: faker.date.past({ years: 3 }),
//             // Denormalized fields
//             city: business.city,
//             business_name: business.name
//         });

//         if (reviews.length >= BATCH_SIZE) {
//             await reviewsCol.insertMany(reviews);
//             reviews.length = 0; // Clear array
//         }
//     }
    
//     if (reviews.length > 0) {
//         await reviewsCol.insertMany(reviews);
//     }

//     console.log('Database seeded successfully!');

//   } catch (err) {
//     console.error(err);
//   } finally {
//     await client.close();
//   }
// }

// seed();
