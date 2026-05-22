import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB conectado com sucesso');
  } catch (error) {
    console.warn('⚠️ MongoDB não disponível - usando modo de teste sem persistência');
    console.warn('Instale MongoDB ou configure MONGODB_URI para funcionalidade completa');
  }
};

export default connectDB;
