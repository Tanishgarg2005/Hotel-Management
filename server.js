const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"]
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('dev'));


app.use(express.static(path.join(__dirname, 'public')));


const ensureUsersFile = () => {
    if (!fs.existsSync('users.json')) {
        fs.writeFileSync('users.json', JSON.stringify([], null, 2));
    }
};

const ensureContactsFile = () => {
    if (!fs.existsSync('contacts.json')) {
        fs.writeFileSync('contacts.json', JSON.stringify([], null, 2));
    }
};


ensureUsersFile();
ensureContactsFile();


const hotelTemplateData = {
  pageTitle: 'Book Your Stay',
  hotelName: 'Ivory Haven',
  pageHeading: 'Book Your Perfect Stay',
  headerImageUrl: '/images/header.jpg',
  formAction: '/process-booking',
  navLinks: [
    { url: '/', text: 'Home' },
    { url: '/', text: 'Rooms' },
    { url: '/', text: 'Dining' },
    { url: '/about', text: 'About' },
    { url: '/contact', text: 'Contact' }
  ],
  services: [
    { id: 'accommodation', name: 'Accommodation', description: 'Luxury rooms and suites' },
    { id: 'meetings', name: 'Meetings & Events', description: 'Business and social events' },
    { id: 'weddings', name: 'Weddings', description: 'Your perfect wedding venue' },
    { id: 'spa', name: 'Spa & Wellness', description: 'Relaxation and rejuvenation' }
  ],
  rooms: [
    { 
      id: 'standard', 
      name: 'Standard Room', 
      price: 1999, 
      description: 'Comfortable room with all essentials', 
      image: '/images/standard-room.jpg',
      features: ['Queen Bed', 'Free Wi-Fi', 'TV']
    },
    { 
      id: 'deluxe', 
      name: 'Deluxe Room', 
      price: 2999, 
      description: 'Spacious room with premium amenities', 
      image: '/images/deluxe-room.jpg',
      features: ['King Bed', 'Free Wi-Fi', 'Mini Bar', 'City View']
    }
  ],
  venues: [
    { 
      id: 'conference', 
      name: 'Conference Room', 
      price: 4999, 
      description: 'Perfect for business meetings and conferences', 
      image: '/images/conference-room.jpg',
      features: ['Capacity: 50 people', 'Projector', 'Sound System']
    },
    { 
      id: 'ballroom', 
      name: 'Grand Ballroom', 
      price: 10999, 
      description: 'Elegant space for weddings and formal events', 
      image: '/images/ballroom.jpg',
      features: ['Capacity: 200 people', 'Dance Floor', 'Stage']
    }
  ],
  addons: [
    { id: 'breakfast', name: 'Breakfast Buffet', price: 999, priceLabel: 'per person' },
    { id: 'parking', name: 'Parking', price: 150, priceLabel: 'per day' },
    { id: 'airport', name: 'Airport Transfer', price: 800, priceLabel: 'one way' }
  ],
  countries: [
    { code: 'In', name: 'India' },
    { code: 'ca', name: 'Canada' },
    { code: 'uk', name: 'United Kingdom' },
    { code: 'au', name: 'Australia' }
  ],
  taxPercentage: 8.5,
  promoCodes: {
    'SUMMER25': 25,
    'WELCOME10': 10
  },
  specialRequestsPlaceholder: 'Let us know if you have any special requests...',
  promoCodePlaceholder: 'Enter promo code',
  promoButtonText: 'Apply',
  submitButtonText: 'Complete Booking',
  currentYear: new Date().getFullYear()
};


app.get(['/', '/welcome'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});


app.route('/register')
    .get((req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'register.html'));
    })
    .post((req, res) => {
        const { username, password } = req.body;
        
        const data = fs.readFileSync('users.json');
        let users = data.length > 0 ? JSON.parse(data) : [];
        
        const existingUser = users.find(user => user.username === username);
        if (existingUser) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Username already exists' 
            });
        }
        
        const newUser = { username, password };
        users.push(newUser);
        
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
        
        res.status(201).json({ 
            status: 'success', 
            message: 'User registered successfully',
            redirectUrl: '/login'
        });
    });

app.route('/login')
    .get((req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    })
    .post((req, res) => {
        const { username, password } = req.body;
        
        const data = fs.readFileSync('users.json');
        const users = JSON.parse(data);

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            return res.status(200).json({ 
                status: 'success', 
                message: 'Login successful',
                redirectUrl: '/dashboard'
            });
        } else {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Invalid credentials',
                redirectUrl: '/register'
            });
        }
    });

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});


app.get('/about', (req, res) => {
    res.render("about.ejs");  
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});


app.get('/booking', (req, res) => {
    res.render('booking', hotelTemplateData); 
});


app.post('/submit-contact', (req, res) => {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'All fields are required' 
        });
    }
   
    const data = fs.readFileSync('contacts.json');
    let contacts = data.length > 0 ? JSON.parse(data) : [];
    
    const newContact = { 
        id: Date.now().toString(), 
        name, 
        email, 
        message,
        timestamp: new Date().toISOString()
    };
   
    contacts.push(newContact);
    
    try {
        fs.writeFileSync('contacts.json', JSON.stringify(contacts, null, 2));
        
        res.status(201).json({ 
            status: 'success', 
            message: 'Your message has been submitted successfully!' 
        });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to submit your message. Please try again.' 
        });
    }
});


app.get('/user/:username', (req, res) => {
    res.json({ 
        status: 'success', 
        message: `Profile for user: ${req.params.username}` 
    });
});


app.post('/process-booking', (req, res) => {
    
    res.json({
        status: 'success',
        message: 'Booking processed successfully'
    });
});


app.get('/rooms', (req, res) => {
    
    res.render('rooms', hotelTemplateData);
});

app.get('/dining', (req, res) => {
    
    res.render('dining', hotelTemplateData);
});


const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err.stack
    });
};


const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
};


app.use(notFoundHandler);
app.use(errorHandler);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});