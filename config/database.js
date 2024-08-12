const mongoose = require('mongoose')

// this will connect to the local system database

const connectDb = async (dburi) =>{
try{
    await mongoose.connect(`${dburi}/scholibNew`,{
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


// this will connect to atlas database 

// const connectDb = async (dburi) =>{
//     try{
//         await mongoose.connect("mongodb+srv://ujjwal:nsptxi0EoSXU2HeH@cluster0.gqecxkc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
//         console.log('mongodb connected successfully')
    
//     }
//     catch (error){
//     console.log(error)
//     console.log('mongodb failed to connect')
//     }
//     }

module.exports = connectDb;
