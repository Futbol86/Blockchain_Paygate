const mongoose = require('mongoose');
const {Schema} = mongoose;

const luckySpinHistorySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'users' },
    spin_value: Number,
    create_date: Date,
});

mongoose.model('lucky_spin_historys', luckySpinHistorySchema);