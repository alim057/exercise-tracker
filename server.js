const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongodb = require('mongodb')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
mongoose.connect(process.env.MLAB_URI)

var exerciseSchema = new Schema({
  username:{type:String,required:true,},
  description:{type:String,required:true},
  duration:{type:Number,required:true},
  date:{type:Date,required:false}
})

var userSchema = new Schema({
  username:{type:String,unique:true},
  exercise:{type:[exerciseSchema],required:false}
})
var USER = mongoose.model('USER',userSchema)



app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


app.post('/api/exercise/new-user',(req,res,next)=>{
  var userName = req.body.username
  var user = new USER({
    username:userName
  })
  user.save((err,data)=>{
    if(err){
      console.log('Error saving user to database')
      USER.findOne({username:userName}).then(result=>{
        res.send('user has been taken')
      })
    }else{
      res.json({username:user.username,_id:user._id})
    }
  })
})

app.get('/api/exercise/users',(req,res,next)=>{
  USER.find({}).then(result=>{
    res.send(result)
  })
})


app.post('/api/exercise/add',(req,res,next)=>{
  USER.findById(req.body.userId).then(result=>{
    req.username = result.username
    var exer = {
      username:req.username,
      description:req.body.description,
      duration:req.body.duration,
      date:req.body.date||new Date(),
      _id:req.body.userId
    }
    result.exercise.push(exer)
    result.save()
    res.send(exer)
  })
})

app.get('/api/exercise/log?',(req,res,next)=>{
  req.userId = req.query._id
  USER.findById(req.userId).then(record=>{
    res.send(record.exercise)
  })
})