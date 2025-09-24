const mongoose = require("mongoose");

const ConnectDB= async()=>{

await mongoose.connect(process.env.DBURI || "mongodb+srv://ansaritools3_db_user:<db_password>@cluster0.fjybaeb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log('Connected!'))
  .catch(() => console.log('Not Connected!'))
}

module.exports=ConnectDB