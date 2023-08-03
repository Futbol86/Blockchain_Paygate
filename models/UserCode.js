const mongoose = require('mongoose');
const {Schema} = mongoose;

const userCodeSchema = new Schema({
    email: String,
    register_code: String,
    forgot_password_code: String,
    create_date: Date,
});

mongoose.model('user_codes', userCodeSchema);