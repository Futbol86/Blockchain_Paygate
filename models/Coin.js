const mongoose = require('mongoose');
const {Schema} = mongoose;

const coinSchema = new Schema({
    name: String ,
    img: {type: Schema.Types.ObjectId, ref: 'uploads'},
    code: String,
    pair: [{type: Schema.Types.ObjectId, ref: 'coins'}],
    createDate: Date,
})

const Coins = mongoose.model('coins', coinSchema);
module.exports = Coins

