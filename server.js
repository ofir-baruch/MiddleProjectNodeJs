const express = require('express');
const app = express();
const db = require('mongoose');

const dbIsConnected = () => {console.log('db connected succssefully')};
db.connect('mongodb+srv://asaf11234:BZNG81SD@cluster0.n6qc0iy.mongodb.net/svShop',dbIsConnected());

app.use(express.static('client'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

const userSchema = db.Schema({
    userName: String,
    email: String,
    password: String
});

const productsSchema = db.Schema({
    productName: String,
    price: Number
});
const pendingOrdersSchema = db.Schema({
    userName: String,
    OrderedProducts: [String]
});

const userModel = db.model('user', userSchema);
const productModel = db.model('product', productsSchema);
const pendingModel = db.model('pendingOrder', pendingOrdersSchema);

async function middleware (req, res, next) {
    const { email, password} = req.body;
  
    try {
      const user = await userModel.findOne({ email });
    if(user && user.password === password) {
        req.userName = user.userName; // save username 
        next();
    } 
    else if (!user) {
      return res.status(401).json({error:'no email', message: 'Email not in the System'});
    }
    else {
      return res.status(401).json({error: 'wrong password', message:'wrong password'})
    }
    } catch (error) {
      return res.status(500).json({message: 'Network Error Has Occurred'});
    };
  };
  
function adminCheck(req, res, next) {
    const isAdmin = req.query.admin === 'true';
    if (!isAdmin) {
        return res.status(403).send('Access Denied');
    }
    next();
};

app.get('/' , (req, res) => {
    res.sendFile(__dirname + '/client/signIn.html');
});

app.post('/' ,middleware, (req, res) => {
    res.status(200).json({ message: 'User logged in successfully', userName: req.userName })
});

app.get('/signUp' , (req, res) => {
    res.sendFile(__dirname + '/client/signUp.html');
});

app.post('/signUp', async (req, res) => {
    const { userName, email, password } = req.body;
    try {
        const emailExist = await userModel.findOne({ email });
        if (emailExist) {
            return res.status(401).json({error: 'Email exist', message: 'Email Is Taken'});
        };
        const userNameExist = await userModel.findOne({ userName });
        if (userNameExist) {
            return res.status(401).json({error: 'userName exist', message: 'User Name Is Taken'});
        };
        const user = { userName, email, password };
        await userModel.insertMany([user]);
        res.status(201).json({message: 'User Added Successfully'});
    } catch(e) {
        console.log(e);
        res.status(500).json({message: 'Network Error Has Occurred'});
    };
});

app.get('/products', (req, res) => {
    res.sendFile(__dirname + '/client/products.html');
});

app.get('/products/superheroes', async (req, res) => {
    try {
        const superheroes = await productModel.find({});
        res.json(superheroes);
    } catch (e) {
        res.status(500).send(error);
    }
});

app.get('/buy', (req, res) => {
    res.sendFile(__dirname + '/client/cart.html');
});

app.post('/buy', async (req, res) => {
    const products = req.body.products.map(order => order.productName);
    const userName = req.body.userName; // Use the userName from the middleware

        const newOrder = new pendingModel({ userName, OrderedProducts: products });
        await pendingModel.insertMany([newOrder]);
        res.status(201).json({ message: 'Order saved successfully' });
});

app.get('/all', adminCheck, async (req, res) => {
    res.sendFile(__dirname + '/client/allOrders.html');
})

app.get('/all/data', async(req, res) => {
    const allOrders = await pendingModel.find({});
    res.json(allOrders)
})

app.post('/search',async (req, res) => {
    let searchTerm = req.body.searchTerm;
    const result = await productModel.find({ "productName": { $regex: new RegExp(searchTerm, 'i') } });
    res.json(result)
})

const PORT = 4000;
app.listen(PORT, () => {console.log(`server is up and running on port ${PORT}`)});
