const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuration MongoDB
const mongoURL = 'mongodb://localhost:27017';
const dbName = 'cheeseCodeHotel';

let db;

// Connexion à MongoDB
MongoClient.connect(mongoURL)
  .then(client => {
    console.log('✅ Connected to MongoDB');
    db = client.db(dbName);
    
    // Créer les collections si elles n'existent pas
    initializeCollections();
  })
  .catch(error => console.error('MongoDB connection error:', error));

async function initializeCollections() {
  // Vérifier rooms
  const roomsCount = await db.collection('rooms').countDocuments().catch(() => 0);

  if (roomsCount === 0) {
    console.log('Creation of basic rooms...');
    await db.collection('rooms').insertMany([
      {
        name: 'Standard Room',
        type: 'standard',
        description: 'Comfortable room with queen-size bed, personal bathroom and sights on the garden.',
        price: 89,
        maxGuests: 2,
        available: true
      },
      {
        name: 'Premium Room',
        type: 'premium',
        description: 'Vast room with a personal balcony, mini-bar and a breathtaking view on the landscape.',
        price: 149,
        maxGuests: 3,
        available: true
      },
      {
        name: 'Presidential Room',
        type: 'presidential',
        description: 'Luxurious room with a large living room, jacuzzi and butlers available.',
        price: 299,
        maxGuests: 4,
        available: true
      }
    ]);
  }

  // Vérifier users
  const usersCount = await db.collection('users').countDocuments().catch(() => 0);

  if (usersCount === 0) {
    console.log("Creating the 'users' collection (empty)");
    // insertMany([]) interdit
    // On ne met rien, MongoDB crée la collection automatiquement
  }
}

// API Routes

// ========================
// 🔐 USERS AUTH ROUTES
// ========================

// REGISTER
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return res.json({ success: false, error: "Email address already used" });
    }

    const newUser = {
      name,
      email,
      phone,
      password, // à sécuriser plus tard (hash)
      createdAt: new Date()
    };

    await db.collection('users').insertOne(newUser);

    res.json({ success: true, user: newUser });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// LOGIN
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });

    if (!user || user.password !== password) {
      return res.json({ success: false, error: "Incorrect id" });
    }

    res.json({ success: true, user });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// USER BOOKINGS
app.get('/api/users/:email/bookings', async (req, res) => {
  try {
    const bookings = await db.collection('bookings')
      .find({ guestEmail: req.params.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(bookings);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET : Récupérer toutes les chambres
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await db.collection('rooms').find({}).toArray();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET : Rechercher des chambres disponibles
app.get('/api/rooms/search', async (req, res) => {
  try {
    const { checkin, checkout, adults } = req.query;
    
    // Trouver les chambres disponibles pour le nombre d'adultes
    const rooms = await db.collection('rooms').find({
      maxGuests: { $gte: parseInt(adults) },
      available: true
    }).toArray();
    
    // Vérifier les réservations existantes
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    
    const availableRooms = [];
    
    for (const room of rooms) {
      const conflictingBookings = await db.collection('bookings').countDocuments({
        roomId: room._id.toString(),
        $or: [
          {
            checkin: { $lte: checkoutDate },
            checkout: { $gte: checkinDate }
          }
        ]
      });
      
      if (conflictingBookings === 0) {
        availableRooms.push(room);
      }
    }
    
    res.json(availableRooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST : Créer une réservation
app.post('/api/bookings', async (req, res) => {
  try {
    const { roomType, checkin, checkout, adults, guestName, guestEmail, guestPhone } = req.body;
    
    // Trouver la chambre
    const room = await db.collection('rooms').findOne({ type: roomType });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Calculer le nombre de nuits et le prix total
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * room.price;
    
    // Créer la réservation
    const booking = {
      roomId: room._id.toString(),
      roomName: room.name,
      roomType: room.type,
      checkin: checkinDate,
      checkout: checkoutDate,
      nights: nights,
      adults: parseInt(adults),
      guestName,
      guestEmail,
      guestPhone,
      totalPrice,
      status: 'confirmed',
      createdAt: new Date()
    };
    
    const result = await db.collection('bookings').insertOne(booking);
    
    res.json({ 
      success: true, 
      bookingId: result.insertedId,
      booking: { ...booking, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET : Récupérer toutes les réservations
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await db.collection('bookings').find({}).sort({ createdAt: -1 }).toArray();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET : Récupérer une réservation par ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await db.collection('bookings').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE : Annuler une réservation
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const result = await db.collection('bookings').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET : Statistiques
app.get('/api/stats', async (req, res) => {
  try {
    const totalBookings = await db.collection('bookings').countDocuments();
    const totalRevenue = await db.collection('bookings').aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]).toArray();
    
    const roomStats = await db.collection('bookings').aggregate([
      { $group: { 
          _id: '$roomType', 
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        } 
      }
    ]).toArray();
    
    res.json({
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      roomStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log("Cheesecode House server started on http://localhost:${PORT}");
  console.log("Open http://localhost:${PORT} in your browser");
});
