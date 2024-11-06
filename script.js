let rawdata = response.ocrResultHTML
let name = rawdata.split("\n").filter(i => {
    // console.log(i.search(/คุณ/));
    if (i.search(/คุณ/) === 0) {
        return true
    }
})

let address = rawdata.split("\n").filter(i => {
    // console.log(i.search(/เลขที่/));
    if (i.search(/เลขที่/) >= 0) {
        return true
    }
})

let address2 = rawdata.split("\n").filter(i => {
    console.log(i.search(/ตําบล/));
    if (i.search(/ตําบล/) >= 0) {
        return true
    }
})

let number = address[0].split(" ")

let body = {
    sender: name[0],
    address: number[3] + " " + number[4] + " " + number[5] + address2[0]
}
console.log(body);