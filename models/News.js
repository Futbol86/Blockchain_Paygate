const mongoose = require('mongoose');
const {Schema} = mongoose;

const newsSchema = new Schema({
    title_vi: String,
    title_en: String,
    content_vi: String,
    content_en: String,
    meta_vi: String,
    meta_en: String,
    thumbURL_vi: String,
    thumbURL_en: String,
    create_date: Date,
});

newsSchema.index({title_vi: 'text', title_en: 'text'});
mongoose.model('news', newsSchema);