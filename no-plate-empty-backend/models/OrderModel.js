const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
   {
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Foods",
        required: true
    },
    requestedQuantity: {
        type: Number,
        required: true,
        min: 0.01,
        default: 1
    },
    unit: {
        type: String,
        trim: true,
        default: "items"
    }
   },
   { _id: false }
);

//schema
const OrderSchema = new mongoose.Schema(
   {
    foods:[
        {
             type:mongoose.Schema.Types.ObjectId,
                ref:"Foods"
        }
      
    ],
    items: [OrderItemSchema],
    NGO:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    donorProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doner"
    },
    donorLocation: {
        id: { type: String },
        latitude: { type: Number },
        latitudeDelta: { type: Number },
        longitude: { type: Number },
        longitudeDelta: { type: Number },
        address: { type: String },
        title: { type: String },
    },
    status:{
        type:String,
        enum:["pending","accepted","rejected","completed"],
        default:"pending"
    }
    
   },
   
    {timestamps:true}
);

//export
module.exports = mongoose.model("Order", OrderSchema);
