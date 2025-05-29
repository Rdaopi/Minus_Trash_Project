import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../modules/auth/models/User.js';

const createAdminUser = async () => {
    try {
        // Connect to MongoDB Atlas
        const uri = process.env.MONGODB_URI_LOCAL;
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB Atlas');

        // Check if admin already exists
        const adminExists = await User.findOne({ role: 'amministratore' });
        if (adminExists) {
            console.log('Un amministratore esiste già nel sistema.');
            process.exit(0);
        }

        // Admin credentials
        const adminData = {
            username: 'admin',
            email: 'admin@admin.com',
            password: 'Admin@123!', // This will be hashed
            fullName: {
                name: 'Admin',
                surname: 'System'
            },
            role: 'amministratore',
            authMethods: {
                local: true,
                google: {
                    enabled: false
                }
            }
        };

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);
        adminData.password = hashedPassword;

        // Create admin user
        const admin = new User(adminData);
        await admin.save();

        console.log('Amministratore creato con successo!');
        console.log('Email:', adminData.email);
        console.log('Password:', 'Admin@123!');
        console.log('Per favore, cambia la password dopo il primo accesso.');

    } catch (error) {
        console.error('Errore durante la creazione dell\'amministratore:', error);
    } finally {
        await mongoose.connection.close();
    }
};

// Run the script
createAdminUser(); 