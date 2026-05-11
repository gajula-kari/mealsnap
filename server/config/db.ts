import mongoose from 'mongoose'

async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection failed:', (err as Error).message)
    process.exit(1)
  }
}

export default connectDB
