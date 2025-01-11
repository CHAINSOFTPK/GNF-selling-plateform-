import mongoose, { Document } from 'mongoose';

export interface IReferralDocument extends Document {
    referrer: string;
    referred: string;
    bonusAmount: number;
    timestamp: Date;
}

const referralSchema = new mongoose.Schema({
    referrer: {
        type: String,
        required: true,
        lowercase: true
    },
    referred: {
        type: String,
        required: true,
        lowercase: true
    },
    bonusAmount: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Referral = mongoose.model<IReferralDocument>('Referral', referralSchema);

export default Referral;