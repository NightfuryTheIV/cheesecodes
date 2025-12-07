const API_URL = 'http://localhost:3000/api';
// Attendre que la page soit complètement chargée
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page chargée, initialisation...');
    
    // Ajouter des IDs aux inputs s'ils n'existent pas
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs[0]) dateInputs[0].id = 'checkin';
    if (dateInputs[1]) dateInputs[1].id = 'checkout';
    
    const selectInput = document.querySelector('select');
    if (selectInput) selectInput.id = 'adults';
});

// Fonction de recherche de chambres
async function searchRooms(event) {
    event.preventDefault();
    console.log('searchRooms call');
    
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    const adultsInput = document.getElementById('adults');
    
    console.log('Elements found:', { checkinInput, checkoutInput, adultsInput });
    
    if (!checkinInput || !checkoutInput || !adultsInput) {
        alert('⚠️ Error: Form elements not found⚠️');
        return;
    }
    
    const checkin = checkinInput.value;
    const checkout = checkoutInput.value;
    const adults = adultsInput.value;
    
    console.log('Valeurs:', { checkin, checkout, adults });
    
    if (!checkin || !checkout) {
        alert('⚠️ Please select the check-in and check-out dates.⚠️');
        return;
    }
    
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    
    if (checkoutDate <= checkinDate) {
        alert('⚠️ The check-out date must be after the check-in date.⚠️');
        return;
    }
    
    try {
        const url = `${API_URL}/rooms/search?checkin=${checkin}&checkout=${checkout}&adults=${adults}`;
        console.log('Call API:', url);
        
        const response = await fetch(url);
        const rooms = await response.json();
        
        console.log('Rooms found:', rooms);
        
        if (rooms.error) {
            alert('❌ Error: ' + rooms.error+"❌");
            return;
        }
        
        if (rooms.length === 0) {
            alert('❌ No rooms available for these dates.❌');
        } else {
            const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
            alert(`✅ ${rooms.length} room(s) available(s) pour ${nights} nights(s) !`);
            document.querySelector('.rooms-section').scrollIntoView({behavior: 'smooth'});
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message + '\n\nMake sure the server is started (node ​​server.js)');
    }
}

// Fonction de réservation
async function bookRoom(roomType) {
    console.log('bookRoom call with:', roomType);
    
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    const adultsInput = document.getElementById('adults');
    
    if (!checkinInput || !checkoutInput || !adultsInput) {
        alert('⚠️ Error: Form elements not found⚠️');
        return;
    }
    
    const checkin = checkinInput.value;
    const checkout = checkoutInput.value;
    const adults = adultsInput.value;
    
    if (!checkin || !checkout) {
        alert('⚠️ Please search first using your dates of stay!⚠️');
        document.querySelector('.search-box').scrollIntoView({behavior: 'smooth'});
        return;
    }
    
    const guestName = prompt('Your full name:');
    if (!guestName) return;
    
    const guestEmail = prompt('Your email:');
    if (!guestEmail) return;
    
    const guestPhone = prompt('Your phone:');
    if (!guestPhone) return;
    
    const typeMap = {
        'Standard': 'standard',
        'Deluxe': 'premium',
        'Présidentielle': 'presidential'
    };
    
    const booking = {
        roomType: typeMap[roomType] || 'standard',
        checkin: checkin,
        checkout: checkout,
        adults: adults,
        guestName,
        guestEmail,
        guestPhone
    };
    
    console.log('Send reservation:', booking);
    
    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
        
        const result = await response.json();
        console.log('Result:', result);
        
        if (result.success) {
            alert(`✅ Reservation confirmed!\n\nNumber: ${result.bookingId}\nTotal: £${result.booking.totalPrice} for ${result.booking.nights} night(s)\n\nConfirmation sent to ${guestEmail}`);
        } else {
            alert('❌ Error: ' + (result.error || 'Error unknown'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error: ' + error.message);
    }
}

// Fonctions pour la modal de connexion
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    alert('Connection under construction');
    closeLoginModal();
}

// Fermer la modal si clic en dehors
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) {
        closeLoginModal();
    }
}
// Variable globale pour l'utilisateur connecté
let currentUser = null;

// Charger l'utilisateur depuis le localStorage au démarrage
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Ajouter des IDs aux inputs s'ils n'existent pas
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs[0]) dateInputs[0].id = 'checkin';
    if (dateInputs[1]) dateInputs[1].id = 'checkout';
    
    const selectInput = document.querySelector('select');
    if (selectInput) selectInput.id = 'adults';
    
    // Charger l'utilisateur connecté
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateLoginButton();
    }
});

// Mettre à jour le bouton de connexion
function updateLoginButton() {
    const loginBtn = document.getElementById('login');
    if (currentUser) {
        loginBtn.textContent = `👤 ${currentUser.name}`;
        loginBtn.onclick = showUserMenu;
    } else {
        loginBtn.textContent = 'Log in';
        loginBtn.onclick = openLoginModal;
    }
}

// Menu utilisateur
function showUserMenu() {
    const menu = confirm(`Hi ${currentUser.name} !\n\nDo you want to:\n- OK: View my reservations\n- Cancel: Log out`);
    
    if (menu) {
        showMyBookings();
    } else {
        logout();
    }
}

// Afficher les réservations de l'utilisateur
async function showMyBookings() {
    try {
        const response = await fetch(`${API_URL}/users/${currentUser.email}/bookings`);
        const bookings = await response.json();
        
        if (bookings.length === 0) {
            alert('You have no reservation.');
            return;
        }
        
        let message = '📋 My Réservations :\n\n';
        bookings.forEach((b, i) => {
            message += `${i + 1}. ${b.roomName}\n`;
            message += `   From ${new Date(b.checkin).toLocaleDateString()} to ${new Date(b.checkout).toLocaleDateString()}\n`;
            message += `   ${b.nights} night(s) - £${b.totalPrice}\n`;
            message += `   Statut : ${b.status}\n\n`;
        });
        
        alert(message);
    } catch (error) {
        alert('Error loading reservations : ' + error.message);
    }
}

// Déconnexion
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateLoginButton();
    alert('✅ You are disconnected');
}

// Fonction de recherche de chambres
async function searchRooms(event) {
    event.preventDefault();
    console.log('searchRooms call');
    
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    const adultsInput = document.getElementById('adults');
    
    if (!checkinInput || !checkoutInput || !adultsInput) {
        alert('⚠️ Error: Form elements not found');
        return;
    }
    
    const checkin = checkinInput.value;
    const checkout = checkoutInput.value;
    const adults = adultsInput.value;
    
    if (!checkin || !checkout) {
        alert('⚠️ Please select the check-in and check-out dates');
        return;
    }
    
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    
    if (checkoutDate <= checkinDate) {
        alert('⚠️ The check-out date must be after the check-in date.');
        return;
    }
    
    try {
        const url = `${API_URL}/rooms/search?checkin=${checkin}&checkout=${checkout}&adults=${adults}`;
        const response = await fetch(url);
        const rooms = await response.json();
        
        if (rooms.error) {
            alert('❌ Error: ' + rooms.error);
            return;
        }
        
        if (rooms.length === 0) {
            alert('❌ No rooms available for these dates.');
        } else {
            const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
            alert(`✅ ${rooms.length} room(s) available for ${nights} night(s) !`);
            document.querySelector('.rooms-section').scrollIntoView({behavior: 'smooth'});
        }
    } catch (error) {
        alert('❌ Erreur: ' + error.message);
    }
}

// Fonction de réservation
async function bookRoom(roomType) {
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    const adultsInput = document.getElementById('adults');
    
    if (!checkinInput || !checkoutInput || !adultsInput) {
        alert('⚠️ Error: Form elements not found');
        return;
    }
    
    const checkin = checkinInput.value;
    const checkout = checkoutInput.value;
    const adults = adultsInput.value;
    
    if (!checkin || !checkout) {
        alert('⚠️ Please search first using your dates of stay!');
        document.querySelector('.search-box').scrollIntoView({behavior: 'smooth'});
        return;
    }
    
    // Si l'utilisateur est connecté, utiliser ses infos
    let guestName, guestEmail, guestPhone;
    
    if (currentUser) {
        guestName = currentUser.name;
        guestEmail = currentUser.email;
        guestPhone = currentUser.phone;
        
        const confirm = window.confirm(`Book using your information?\n\nName: ${guestName}\nEmail: ${guestEmail}\nPhone: ${guestPhone}`);
        if (!confirm) return;
    } else {
        // Proposer de se connecter ou créer un compte
        const shouldLogin = window.confirm('Do you want to log in or create an account to book faster?\n\nOK = Log in/Create an account\nCancel = Continue without an account');
        
        if (shouldLogin) {
            openLoginModal();
            return;
        }
        
        guestName = prompt('Your full name:');
        if (!guestName) return;
        
        guestEmail = prompt('Your email:');
        if (!guestEmail) return;
        
        guestPhone = prompt('Your phone:');
        if (!guestPhone) return;
    }
    
    const typeMap = {
        'Standard': 'standard',
        'Deluxe': 'premium',
        'Présidentielle': 'presidential'
    };
    
    const booking = {
        roomType: typeMap[roomType] || 'standard',
        checkin: checkin,
        checkout: checkout,
        adults: adults,
        guestName,
        guestEmail,
        guestPhone
    };
    
    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Reservation confirmed!\n\nNumber: ${result.bookingId}\nTotal: £${result.booking.totalPrice} for ${result.booking.nights} night(s)\n\nConfirmation sent to${guestEmail}`);
        } else {
            alert('❌ Error: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ============ GESTION DE LA MODAL DE CONNEXION ============

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateLoginButton();
            closeLoginModal();
            alert(`✅ Hi ${currentUser.name} !`);
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        alert('❌ Connection error: ' + error.message);
    }
}

// Fonction pour créer un compte
function showRegisterForm() {
    closeLoginModal();
    
    const name = prompt('Your full name:');
    if (!name) return;
    
    const email = prompt('Your email:');
    if (!email) return;
    
    const phone = prompt('Your phone:');
    if (!phone) return;
    
    const password = prompt('Choose a password:');
    if (!password) return;
    
    const confirmPassword = prompt('Confirm your password:');
    if (password !== confirmPassword) {
        alert('❌ The passwords do not match');
        return;
    }
    
    registerUser(name, email, phone, password);
}

async function registerUser(name, email, phone, password) {
    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateLoginButton();
            alert(`✅ Account successfully created! Welcome ${name} !`);
        } else {
            alert('❌ ' + result.error);
        }
    } catch (error) {
        alert('❌Error creating account: ' + error.message);
    }
}

// Fermer la modal si clic en dehors
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) {
        closeLoginModal();
    }
}