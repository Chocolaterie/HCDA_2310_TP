const mongoose = require('mongoose');

// Un modele category
const Category = mongoose.model('Category', { title : String}, "categories");

// Déclarer le modele Article
// 1 : Le nom de module - 2 : Les attributs du model - 3: Le nom de table/collection 
const Article = mongoose.model("Article", { 
    id: Number, 
    title : String, 
    content : String, 
    author : String, 
    category : { type: mongoose.Schema.Types.ObjectId, ref: 'Category' } }, 
    "articles");

// -- Modèle User (utilisé pour l'authentification)
const User = mongoose.model("User", { email: String, password : String }, "users");

module.exports = {
   Article, 
   User,
   Category
};