const mongoose = require("mongoose");

//schema
const categorySchema = new mongoose.Schema(
    {
        title:{
            type:String,
            required:[true,"Please provide a title for this category"]

        },
        imageUrl:{
            type:String,
            default:"https://similarpng.com/good-food-logo-design-on-transparent-background-png/"
        }
    },
    {timestamps:true}
);

//export
module.exports = mongoose.model("Category", categorySchema);
