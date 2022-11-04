if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const { response } = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET

app.set('view engine', 'ejs')
app.set('views',path.join(__dirname, '/views'))
app.set('layout', 'layouts/layout')

app.use(express.static(path.join(__dirname, '../../../')));
app.set('views',path.join(__dirname, '../../', '/views'))

app.use(expressLayouts)
const bodyParser = require('body-parser')
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(bodyParser.text({ limit: '200mb' }));
app.use(express.json())

const mongoose = require('mongoose')
mongoose.connect(process.env.DATEBASE_URL, {
	
})
const connection = mongoose.connection;

connection.once("open", function(res) {
	console.log("Connected to Mongoose!")
	connectedToDB = true
}); 

const User = require('../../models/user')

// Document routes
app.get('/', (req,res) => {
  try {
    let token = req.headers.cookie.split('=')[1];
    let user_token = jwt.verify(token, JWT_SECRET);
    if (user_token) {
      User.findById(user_token.id, (err, user) => {
        if (err || !user) {
          res.redirect('/login')
        } else {
          let items = user.items;
          res.render('home.ejs');
        }
      })
    } else {
      console.log('no token')
      res.redirect('/login')
    }
  } catch(err) {
    console.log(err)
    res.redirect('/login')
  }


})
app.get('/login', (req,res) => {
  res.render('login.ejs')
})

// Login routes
app.post('/api/auth/login', async (req,res) => {
  let body = JSON.parse(req.body)
  let user = await User.findOne({name: body.name, email: body.email});
  if (user) {
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name
      },
      JWT_SECRET, { expiresIn: "30days"}
    )

    res.cookie("token", token, {
        httpOnly: true
    })
      
    return res.json({ status: 'ok', success: true, code: 200, data: token })
  } else {
      user = await User.create({
        name: body.name,
        email: body.email,
        items: []
      });
      const token = jwt.sign(
        {
          id: user._id,
          name: user.name
        },
        JWT_SECRET, { expiresIn: "30days"}
      )
  
      res.cookie("token", token, {
          httpOnly: true
      })
        
      return res.json({ status: 'ok', success: true, code: 200, data: token })

  };
});

// Logic routes
app.post('/api/item/create', async (req,res) => {
  let body = (req.body)
  let token = req.headers.cookie.split('=')[1];
  let user_token = jwt.verify(token, JWT_SECRET);
  
  // check if link is legit
  var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
  var regex = new RegExp(expression);
  if (!body.link.match(regex)) {
    body.link = ""
  }

  // check if name is legit
  console.log(body.name.length)
  if (body.name.length < 1  || body.name.length > 50) {
    return res.json({success: false, code: 400, message: "Name must be between 1 and 50 characters"})
  }

  try {
    let user = await User.findOne({id:user_token.id});
    if (user) {
      user.items.push({
        name: body.name,
        link: body.link,
      });
      await user.save();
      // await setHistory(user.items[user.items.length-1].id, body.token, "created", "item", body.token);
      res.json({
        success: true,
        item: user.items[user.items.length - 1]
      });
    } else {
      res.json({
        success: false,
      });
    }
  } catch(err) {
    console.log(err)
    if (err) {
      res.json({
        success: false,
      });
    }
  }
  
});

app.get('/api/items/get', async (req,res) => {
  let token = req.headers.cookie.split('=')[1];
  let user_token = jwt.verify(token, JWT_SECRET);
  try {
    let user = await User.findOne({id:user_token.id});
    if (user) {
      res.json({
        success: true,
        items: user.items
      });
    } else {
      res.json({
        success: false,
      });
    }
  } catch(err) {
    console.log(err)
    if (err) {
      res.json({
        success: false,
      });
    }
  }
  
})

app.post('/api/item/delete', async (req,res) => {
  let body = JSON.parse(req.body)
  let token = req.headers.cookie.split('=')[1];
  let user_token = jwt.verify(token, JWT_SECRET);
  try {
    let user = await User.findOne({id:user_token.id});
    if (user) {
      console.log(user.items[0].id, body.item_id)
      user.items = user.items.filter(item => item.id != body.item_id);
      await user.save();
      // await setHistory(body.id, body.token, "deleted", "item", body.token);
      res.json({
        success: true,
      });
    } else {
      res.json({
        success: false,
      });
    }
  } catch(err) {
    console.log(err)
    if (err) {
      res.json({
        success: false,
      });
    }
  }
  
});

async function setHistory(item_id, user_id, action, part, by) {
  let user = await User.findById(user_id);
  if (user) {
    for (let i=0;i<user.items.length;i++) {
      if (user.items[i].id == item_id) {
        user.items[i].history.push({
          user: by,
          action: action,
          part: part,
          date: new Date()
        })
        user.save();
      } else {

      }
    }
  }
}

app.get("*", (req,res) => {
    res.redirect('/')
})

 
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Listening on port', port);
});