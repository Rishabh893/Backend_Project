import mongoose ,{schema} from 'mongoose'
const userSchema=new schema({
    username

})
export const User=mongoose.model("User",userSchema)