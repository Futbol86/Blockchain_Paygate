const mongoose = require('mongoose');
const {Schema} = mongoose;

const userStakingSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
    kdg_coin_send: Number,
    kdg_coin_receive: Number,
    txId: String,
    is_pay: Boolean,
    start_date: Date,
    end_date: Date,
});

mongoose.model('user_stakings', userStakingSchema);