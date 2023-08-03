const mongoose = require('mongoose');
const {Schema} = mongoose;

const walletSchema = new Schema({
    name: {type: Schema.Types.ObjectId, ref: 'coins'},
    wallet: String,
    privateKey: String,
})

mongoose.model('wallets', walletSchema);
