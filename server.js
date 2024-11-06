const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;
var _ = require('lodash');

mongoose.connect('mongodb+srv://admin:1234@lnwproject.bznn3r3.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function () {
    console.log('Connected to MongoDB');
});

const scanSchema = new mongoose.Schema({
    product_option: String,
    recipient: Object,
    sender: Object,
    shopee_order_no: String,
    user: String
});

const scanModel = mongoose.model('scan', scanSchema);

app.use(express.json());

app.post('/store-data', async (req, res) => {
    const body = req.body;
    console.log({ ...body.data,user: body.user });
    try {
        const newData = new scanModel({ ...body.data,user: body.user });
        await newData.save();

        res.status(201).json({ message: 'ข้อมูลได้รับการบันทึกลงใน MongoDB สำเร็จ'})
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลงใน MongoDB', error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Express server is running at http://localhost:${port}`);
});
