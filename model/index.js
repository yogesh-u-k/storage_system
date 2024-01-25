import mongoose from "mongoose";

const storageToken = new mongoose.Schema({
    token:String,
    uploadedFiles:[String],
})

const StorageToken = mongoose.model("StorageToken",storageToken)
export  default StorageToken
