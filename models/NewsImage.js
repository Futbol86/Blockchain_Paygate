const mongoose = require('mongoose');
const {Schema} = mongoose;

const newsImageSchema = new Schema({
    img_path: String,
    create_date: Date,
});

mongoose.model('news_images', newsImageSchema);