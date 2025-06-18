import dotenv from 'dotenv';
import connectDB from './db/index.js';
dotenv.config({
    path:'./env'
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process with failure
});












// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     } catch (error) {
//         console.error('Error connecting to MongoDB:', error);
        
//     }
// })()