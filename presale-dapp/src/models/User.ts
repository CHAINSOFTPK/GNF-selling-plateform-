import mongoose, { Document } from 'mongoose';

export interface IUserDocument extends Document {
    walletAddress: string;
    joinedAt: Date;
    totalPurchases: number;
    referredBy?: string;
}

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    totalPurchases: {
        type: Number,
        default: 0
    },
    referredBy: {
        type: String,
        lowercase: true
    }
});

const User = mongoose.model<IUserDocument>('User', userSchema);

export default User;
