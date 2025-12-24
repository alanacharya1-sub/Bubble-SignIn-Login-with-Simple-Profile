const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const userModel = require("./models/user");
const jwt = require('jsonwebtoken');
const multer = require('multer');

const JWT_SECRET = process.env.JWT_SECRET || 'shhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser());

app.get('/', (req,res) =>{
    const token = req.cookies.token;
    if (token) {
        try {
            const data = jwt.verify(token, JWT_SECRET);
            userModel.findOne({ email: data.email }).then(user => {
                if (user && (!user.bio || !user.profilePicture)) {
                    res.redirect('/profile-setup');
                } else {
                    res.redirect('/profile');
                }
            }).catch(err => {
                res.render('index');
            });
            return;
        } catch (error) {
        }
    }
    res.render('index');
})
app.post('/create', async (req,res) =>{
    let {username, email, password, age} = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        let createdUser = await userModel.create({
            username,
            email,
            password: hash,
            age
        });
        let token = jwt.sign({email},JWT_SECRET);
        res.cookie('token',token);
        res.redirect('/profile-setup');
    } catch (error) {
        res.status(500).send("Error creating user");
    }
});

app.get('/logout', (req,res)=>{
    res.cookie("token", "", { maxAge: 1 });
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }
    
    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data;
        next();
    } catch (error) {
        res.cookie("token", "", { maxAge: 1 });
        res.redirect('/login');
    }
}

app.get('/recovery', (req, res) => {
    res.render('recovery');
});

app.post('/recovery', async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await userModel.findOne({ email: email });
        
        if (!user) {
            return res.send('No account found with this email');
        }

        const resetToken = jwt.sign({ email, reset: true }, JWT_SECRET, { expiresIn: '1h' });
        
        res.redirect(`/reset-password?token=${resetToken}`);
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during recovery');
    }
});

app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({ email: req.user.email });
        if (!user) {
            return res.redirect('/login');
        }
        
        res.render('profile', { user });
    } catch (error) {
        console.error(error);
        res.redirect('/login');
    }
});

app.get('/profile-setup', isLoggedIn, (req, res) => {
    res.render('profile-setup');
});

app.post('/profile-setup', isLoggedIn, upload.single('profilePicture'), async (req, res) => {
    try {
        const { bio } = req.body;
        
        const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;
        
        await userModel.updateOne(
            { email: req.user.email },
            { 
                bio: bio,
                profilePicture: profilePicture
            }
        );
        
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error setting up profile! You have to check again');
    }
});

app.get("/login", (req,res)=>{
    res.render('login');
});

app.get("/forgot-password", (req,res)=>{
    res.render('forgot-password');
});

app.get("/find-account", (req,res)=>{
    res.render('find-account');
});

app.get("/reset-password", (req,res)=>{
    const { token } = req.query;
    res.render('reset-password', { token });
});
app.post("/login", async (req,res)=>{
    let user = await userModel.findOne({email: req.body.email})
    if(!user) return res.send("Something is Wrong")

    bcrypt.compare(req.body.password,user.password, async function(err,result){
        if (result){
            let token = jwt.sign({email: user.email}, JWT_SECRET);
            res.cookie('token',token);
            
            if (!user.bio || !user.profilePicture) {
                res.redirect("/profile-setup");
            } else {
                res.redirect("/profile");
            }
        }
        else res.send("Something Wrong!!!!");
    })
});

app.post("/forgot-password", async (req,res)=>{
    const { email } = req.body;
    
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.send("No account found with this email");
    }
    
    const resetToken = jwt.sign({ email, reset: true }, JWT_SECRET, { expiresIn: '1h' });
    
    res.redirect(`/reset-password?token=${resetToken}`);
});

app.post("/find-account", async (req,res)=>{
    const { identifier } = req.body;
    
    const user = await userModel.findOne({
        $or: [
            { username: identifier },
            { email: identifier }
        ]
    });
    
    if (!user) {
        return res.send("No account found with this username or email");
    }
    
    res.send(`Account found! Username: ${user.username}. You can reset your password using your email: ${user.email.substring(0, 2) + '***' + user.email.split('@')[1]}`);
});

app.post("/reset-password", async (req,res)=>{
    const { token, newPassword, confirmNewPassword } = req.body;
    
    if (newPassword !== confirmNewPassword) {
        return res.send("Passwords do not match");
    }
    
    if (newPassword.length < 6) {
        return res.send("Password must be at least 6 characters");
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded.reset) {
            return res.send("Invalid reset token");
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        await userModel.updateOne(
            { email: decoded.email },
            { password: hashedPassword }
        );
        
        res.redirect('/profile');
        
    } catch (error) {
        res.send("Invalid or expired reset token");
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});