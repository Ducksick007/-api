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
    extractedText: String,
    sender: String,
    receiver: String,
    senderlast: String,
    // phone: String,
    user: String
});

const userSchema = new mongoose.Schema({
    extractedText: String,
    user_id: String
});

const scanModel = mongoose.model('scan', scanSchema);

app.use(express.json());

app.post('/userDd', async (req, res) => {
    console.log(req.body);
    res.status(200).json({ message: 'ข้อมูลได้รับการส่งเรียบร้อย' });
});

app.post('/store-data', async (req, res) => {
    const extractedText = req.body.extracted_text;
    const body = req.body;
    // console.log(body, 1111111111111111111111111111111);
    try {
        let formatData = {}
        let sendBy = "FLASH"
        // console.log(sendBy.toUpperCase());
        if ("FLASH" === sendBy.toUpperCase()) {
            let rawdata = extractedText
            let name = rawdata.split("\n").filter(i => {
                if (i.search(/ผู้ส่ง/) === 0) {
                    return true
                }
            })

            let lastname = rawdata.split("\n").filter(i => {
                if (i.search(/ผู้รับ/) >= 0) {
                    return true
                }
            })

            let Tel = rawdata.split("\n").filter(i => {
                // console.log(i.search(/ตําบล/));
                if (i.search(/Tel/) >= 0) {
                    return true
                }
            })

            formatData = {
                extractedText: extractedText,
                sender: _.nth(name, 0) || "ไม่พบข้อมูล",
                receiver: _.nth(name, 1) || "ไม่พบข้อมูล",
                senderlast: _.nth(lastname, 1) || "ไม่พบข้อมูล",
                user: req.body.user
            }
        }
        const newData = new scanModel({ ...formatData });
        await newData.save();
        console.log(formatData);

        res.status(201).json({ message: 'ข้อมูลได้รับการบันทึกลงใน MongoDB สำเร็จ', ocrResult: extractedText})
    } catch (err) {ocrResult
        console.error(5000000);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลงใน MongoDB', error: err.message });
    }
});

app.get('/get-all-data', async (req, res) => {
    try {
        const allData = await scanModel.find();
        res.status(200).json(allData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก MongoDB', error: err.message });
    }
});

app.delete('/delete-data/:id', async (req, res) => {
    const recordId = req.params.id;

    try {
        const deletedRecord = await scanModel.findByIdAndRemove(recordId);

        if (!deletedRecord) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        }

        res.status(200).json({ message: 'ข้อมูลถูกลบออกไปเรียบร้อย', deletedRecord });
    } catch (err) {
        // console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลจาก MongoDB', error: err.message });
    }
});

app.put('/edit-data/:id', async (req, res) => {
    const newData = req.body;
    const recordId = req.params.id;

    try {
        const updatedRecord = await scanModel.findByIdAndUpdate(recordId, newData, { new: true });

        if (!updatedRecord) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        }

        res.status(200).json({ message: 'ข้อมูลได้รับการอัปเดตเรียบร้อย', updatedRecord });
    } catch (err) {
        // console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลใน MongoDB', error: err.message });
    }
});

app.get('/get-data/:id', async (req, res) => {
    const recordId = req.params.id;

    try {
        const record = await scanModel.findById(recordId);

        if (!record) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล' });
        }

        res.status(200).json(record);
    } catch (err) {
        // console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก MongoDB', error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Express server is running at http://localhost:${port}`);
});
