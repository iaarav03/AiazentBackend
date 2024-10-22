import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
  username: { type: String },
  profileImage: { type: String },
  shortBio: { type: String },
  email: { type: String, required: true },
  password: { type: String },
  isAdmin:{
    type:Boolean,
    default:false


  },
  socialLogins: {
    google: { type: String },
    facebook: { type: String },
    linkedin: { type: String }
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  }],
  twoFactorAuth: { type: Boolean, default: false },
  courses: [{ type: String }],
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  likedAgents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  }]
});
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, { expiresIn:'7d' });
  return token;
};
const User = mongoose.model('User', userSchema);

export default User;