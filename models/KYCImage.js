const mongoose = require('mongoose');
const {Schema} = mongoose;

const kycImageSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'users'},
    img_path: String,
    create_date: Date,
});

mongoose.model('kyc_images', kycImageSchema);