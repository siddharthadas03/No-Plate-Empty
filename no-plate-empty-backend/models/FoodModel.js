const mongoose = require("mongoose");

//schema
const FoodSchema = new mongoose.Schema(
   
   {
    title:{
        type:String,
        required:[true,"Please provide a title for this food"]
    },
    decription:{
        type:String,
        required:[true,"Please provide a decription for this food"] 
    },
    imageUrl:{
        type:String,
        default:"https://similarpng.com/good-food-logo-design-on-transparent-background-png/"
    },
    foodTags:{
        type:String,
    },
    catagory:{
        type:String,
    },
    code:{
        type:String,
    },
    quantity: {
        type: Number,
        min: [0, "Quantity cannot be negative"],
        default: 0
    },
    unit: {
        type: String,
        trim: true,
        default: "items"
    },
    isAvailable:{
        type:Boolean,
        default:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        index:true,
    },
    Doner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Doner",
        index:true,
    },
    expireTime:{
        type:Date,
    },
    rating:{
        type:Number,
        default:5,
        min:1,
        max:5
    },
    ratingCount:{
        type:Number,
        default:0
    }
   },
    {timestamps:true}
);

//export
module.exports = mongoose.model("Foods", FoodSchema);
