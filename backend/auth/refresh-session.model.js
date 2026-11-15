import mongoose from 'mongoose';

const RefreshSessionSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0,
  },
}, {
  collection: 'refresh_sessions',
});

const RefreshSession = mongoose.model('RefreshSession', RefreshSessionSchema);
export default RefreshSession;
