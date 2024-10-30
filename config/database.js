const mongoose = require('mongoose')

const connectDb = async (dburi) =>{
try{
    await mongoose.connect(`${dburi}/scholibTesting`,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    console.log('mongodb connected successfully')

}
catch (error){
console.log(error)
console.log('mongodb failed to connect')
}
}


module.exports = connectDb;







// const mongoose = require('mongoose');

// const connectDb = async (dburi = "mongodb://127.0.0.1:27017", username='adminUsername', password='password123') => {
//     try {
//         // Construct the full MongoDB URI with username and password
//         const uri = `${dburi}/scholibNew?authSource=admin`;
        
//         await mongoose.connect(uri, {
//             user: username,
//             pass: password,
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         console.log('MongoDB connected successfully');
//     } catch (error) {
//         console.log(error);
//         console.log('MongoDB failed to connect');
//     }
// };

// module.exports = connectDb;

