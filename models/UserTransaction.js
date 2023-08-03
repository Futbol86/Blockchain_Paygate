const mongoose = require('mongoose');
const {Schema} = mongoose;

const userTransactionSchema = new Schema({
    userId: {type: Schema.Types.ObjectId, ref: 'users'},
    from: {type: Schema.Types.ObjectId, ref: 'users'},
    to: {type: Schema.Types.ObjectId, ref: 'users'},
    type: String,
    value: String,
    note: String,
    txId: String,
    create_date: Date,
});

mongoose.model('user_transactions', userTransactionSchema);