# MedGemma Flask API

A Flask REST API for analyzing medical X-ray images using the MedGemma-1.5-4b-it model.

## Setup

### 1. Install Dependencies

```bash
conda activate medgemma2
pip install -r requirements-api.txt
```

### 2. Start the API Server

**Option A: Standard API (recommended for GPUs with 12GB+ VRAM)**
```bash
conda activate medgemma2
python api_stable.py
```

**Option B: Original API (uses device_map="balanced")**
```bash
conda activate medgemma2
python api.py
```

The API will be available at `http://localhost:5000`

### Troubleshooting: "Tensor on device meta" Error

If you encounter the error: `Tensor on device meta is not on the expected device cuda:0!`

**Solution 1: Use api_stable.py** - This version has more aggressive memory management and better device handling.

**Solution 2: Restart the server** - The model may need to be reloaded when this happens.

**Solution 3: Check GPU memory:**
```bash
nvidia-smi
```
If you're running out of VRAM, consider:
- Closing other GPU-intensive applications
- Reducing `max_new_tokens` in the model.generate() call
- Using a machine with more VRAM

## API Endpoints

### GET `/`
Get API information and available endpoints.

**Response:**
```json
{
  "name": "MedGemma X-ray Analysis API",
  "version": "1.0.0",
  "endpoints": {...}
}
```

### GET `/health`
Health check endpoint to verify the API is running and the model is loaded.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda:0"
}
```

### POST `/analyze`
Analyze an X-ray image.

**Content-Type Options:**
1. `multipart/form-data` - For file uploads
2. `application/json` - For base64 encoded images

**Parameters:**
- `image` (file, multipart) or `image_base64` (string, JSON) - The X-ray image
- `prompt` (string, optional) - Custom analysis prompt (default: "Describe this X-ray")

**Example Request (multipart/form-data):**
```bash
curl -X POST http://localhost:5000/analyze \
  -F "image=@xray.png" \
  -F "prompt=Describe this X-ray"
```

**Example Request (JSON with base64):**
```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "iVBORw0KGgoAAAANS...",
    "prompt": "Describe this X-ray"
  }'
```

**Response:**
```json
{
  "success": true,
  "description": "This is a chest X-ray image...",
  "prompt": "Describe this X-ray"
}
```

### POST `/analyze_stream`
A streaming version of `/analyze`.  The request format is identical but the
response body is returned token‑by‑token as the model decodes.  Useful for
front‑ends that want partial results immediately instead of waiting for the
full description.

**Content-Type Options:** same as `/analyze` (multipart or JSON/base64)

**Example curl (multipart form):**
```bash
curl -N -X POST http://localhost:5000/analyze_stream \
  -F "image=@xray.png" \
  -F "prompt=Describe this X-ray" \
  # -N tells curl not to buffer the response
```

**Client notes:**
- use `fetch()` with a `ReadableStream` or `axios` with `responseType: 'stream'`
- the response is plain text; you can wrap it in server-sent events if you
  prefer `text/event-stream`.

## Integration with Expo Go

### Example React Native/Expo Code

```javascript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const API_URL = 'http://YOUR_IP_ADDRESS:5000'; // Replace with your computer's IP

async function analyzeXray() {
  try {
    // Pick an image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;

    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Send to API
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: base64,
        prompt: 'Describe this X-ray',
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Analysis:', data.description);
      // Display the description in your UI
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Alternative: Using FormData (File Upload)

```javascript
async function analyzeXrayWithFormData() {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;

    // Create FormData
    const formData = new FormData();
    formData.append('image', {
      uri: result.assets[0].uri,
      type: 'image/jpeg',
      name: 'xray.jpg',
    });
    formData.append('prompt', 'Describe this X-ray');

    // Send to API
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    console.log('Analysis:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Testing

Run the test script:

```bash
conda activate medgemma2
python test_api.py
```

## Network Access

To access the API from your Expo Go app:

1. Make sure your phone and computer are on the same network
2. Find your computer's IP address:
   - Linux/Mac: `ip addr show` or `ifconfig`
   - Windows: `ipconfig`
3. Use `http://YOUR_IP_ADDRESS:5000` in your Expo app

## Production Deployment

For production use, consider:

1. **Use a production WSGI server** (e.g., Gunicorn):
   ```bash
   pip install gunicorn
   gunicorn -w 1 -b 0.0.0.0:5000 api:app --timeout 120
   ```

2. **Add authentication** to protect your API

3. **Deploy to a cloud service** (AWS, GCP, Azure, Heroku, etc.)

4. **Use HTTPS** for secure communication

5. **Add rate limiting** to prevent abuse

6. **Monitor and log** API usage

## Notes

- The model takes ~8GB of VRAM, so ensure your GPU has enough memory
- First request may be slower as the model loads into memory
- Subsequent requests will be faster as the model stays loaded
- Use `max_new_tokens` parameter in `analyze_image()` to control response length
- **Memory Management**: The API automatically cleans up GPU memory after each request
- **Meta Device Error**: If you see "Tensor on device meta" errors after several requests, use `api_stable.py` instead of `api.py`, or restart the server
- **Concurrent Requests**: The API uses `threaded=True` but be aware that the model processes one image at a time. For production, consider using a task queue (e.g., Celery, RQ)


## Flask sharing through LAN

*Flask* runs in the background in WSL, not exposing its IP. it needs a bridge to allow windows and devices inthe network to use it.

# replace 172.28.25.30 with whatever WSL IP the Flask log showed
netsh interface portproxy add v4tov4 `
    listenaddress=0.0.0.0 listenport=5000 `
    connectaddress=172.28.25.30 connectport=5000

# confirm it's there
netsh interface portproxy show all


# To remove the rule later:

netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=5000