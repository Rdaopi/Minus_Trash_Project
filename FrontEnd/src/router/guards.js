import { jwtDecode } from 'jwt-decode';

export function requireOperator(to, from, next) {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    console.log('Checking operator/admin access:');
    console.log('- Token exists:', !!token);
    console.log('- User role from localStorage:', userRole);
    
    if (!token) {
        console.warn('No token found, redirecting to auth');
        next('/auth');
        return;
    }

    try {
        const decoded = jwtDecode(token);
        console.log('- Decoded token:', decoded);
        console.log('- Token role:', decoded.role);
        
        // Verifica sia il ruolo decodificato dal token che quello in localStorage
        if (decoded && (decoded.role === 'operatore_comunale' || decoded.role === 'amministratore' || 
            userRole === 'operatore_comunale' || userRole === 'amministratore')) {
            console.log('Access granted: user is operator or admin');
            next();
        } else {
            console.warn('Access denied: operator or admin role required');
            console.log('- Token role:', decoded.role);
            console.log('- localStorage role:', userRole);
            next('/profile');
        }
    } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        next('/auth');
    }
} 