import pytesseract as tess
from PIL import Image
from flask import Flask, render_template, request, jsonify
import requests
from flask_cors import CORS
app = Flask(__name__)
CORS(app, resources={r"/extract-text": {"origins": "http://localhost:4000"}})

# Set the path to the Tesseract executable
tess.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

@app.route('/', methods=['POST'])
def home():
    return render_template('index.html')

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_sender_and_receiver(ocr_text):
    sender_start = ocr_text.find("ผู้ส่ง (Sender)")
    receiver_start = ocr_text.find("ผู้รับ (Receiver)")

    if sender_start != -1 and receiver_start != -1:
        sender_text = ocr_text[sender_start:receiver_start]
        receiver_text = ocr_text[receiver_start:]
        return sender_text, receiver_text
    else:
        return None, None

@app.route('/extract-text', methods=['POST'])
def extract_text():
    try:

        
        # Check if a file was uploaded
        if 'image' not in request.files:
            return jsonify({'message': 'No file part'}), 400

        file = request.files['image']

        # Check if the file is empty
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400

        # Check if the file is an allowed type
        if not allowed_file(file.filename):
            return jsonify({'message': 'File type not allowed'}), 400

        # Read the uploaded image
        image = Image.open(file)

        # Extract text from the image
        text = tess.image_to_string(image, lang='tha+eng')
        custom_config = r'tha+eng'

        # Extract sender and receiver data
        sender_data, receiver_data = extract_sender_and_receiver(text)

        # Send the extracted text to the Express API
        data = {'extracted_text': text, 'sender_data': sender_data, 'receiver_data': receiver_data,"user": request.form['user']}
        requests.post('http://localhost:3000/userDd', json=request.form)
        response = requests.post('http://localhost:3000/store-data', json=data)
      
        if response.status_code == 201:
                print (response.status_code)
                ocr_result = response.json().get('ocrResult')
                
                # Prepare the HTML result for sender and receiver data
                sender_result_html = format_data_as_html(sender_data)
                receiver_result_html = format_data_as_html(receiver_data)

                # Format the OCR result with line breaks
                ocr_result_html = format_ocr_result(ocr_result)

                return jsonify({
                    'message': 'OCR process successful',
                    'ocrResultHTML': ocr_result_html,  # Update the key
                    'senderResultHTML': sender_result_html,
                    'receiverResultHTML': receiver_result_html
                }), 200
        else:
                return jsonify({'message': 'Failed to send data to Express'}), 500

    except Exception as e:
        return jsonify({'message': 'Error processing image', 'error': str(e.message)}), 500

# แก้ไข format_data_as_html เพื่อแยกบรรทัด
def format_data_as_html(data):
    if not data:
        return "<p>No data available</p>"

    # Split the data into lines
    lines = data.split('\n')

    # Initialize variables
    name = ""
    address = ""
    phone = ""

    # Extract data
    for line in lines:
        if line.startswith("Name: "):
            name = line[6:]
        elif line.startswith("Address: "):
            address = line[9:]
        elif line.startswith("Tel: "):
            phone = line[5:]

    # Create HTML
    html = f"<p><strong>Name:</strong> {name}</p>"
    html += f"<p><strong>Address:</strong> {address}</p>"
    html += f"<p><strong>Phone:</strong> {phone}</p>"

    return html

# เพิ่มฟังก์ชันสำหรับแยกบรรทัดใน ocrResult
def format_ocr_result(ocr_result):
    if not ocr_result:
        return "<p>No OCR result available</p>"

    #Split the ocr_result by newlines and remove empty lines
    lines = [line.strip() for line in ocr_result.split('\n') if line.strip()]

    #Create HTML with line breaks and extra spacing
    html = "<div class='result-box' id='ocrResultHTML'>"
    for i, line in enumerate(lines):
        cleaned_line = ' '.join(line.split())  #ลบช่องว่างที่ไม่จำเป็น
        html += f"บรรทัดที่ {i + 1}: {cleaned_line}<br>"
    html += "</div>"

    return html

if __name__ == '__main__':
    app.run(debug=True)