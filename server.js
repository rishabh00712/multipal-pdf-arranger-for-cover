import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { generateSpreadPdf } from './utils/generateSpreadPdf.js';
import AdmZip from 'adm-zip';

const app = express();
const PORT = 3000;

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, 'outputs');
const API_KEY = 'AIzaSyBBm6UR-JkDEL-vNqEG1YpHIBL3K95KzDI';

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Utility: Extract folder ID from Google Drive link
function extractFolderId(link) {
  const match = link.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// GET: Show input form
app.get('/', (req, res) => {
  res.render('index');
});
// POST: Handle Drive link, process PDFs, and send ZIP
app.post('/process-pdfs', async (req, res) => {
  const driveLink = req.body.driveLink;
  const folderId = extractFolderId(driveLink);

  if (!folderId) {
    return res.status(400).send('❌ Invalid Google Drive folder link.');
  }

  const listUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/pdf'&fields=files(id,name)&key=${API_KEY}`;

  try {
    const { data } = await axios.get(listUrl);
    const files = data.files;

    if (!files.length) {
      return res.send('❌ No PDF files found in the folder.');
    }

    console.log(`🔧 Found ${files.length} PDFs. Processing...`);

    const zip = new AdmZip();

    for (const file of files) {
      const cleanedName = file.name.replace(/\.pdf\.pdf$/, '.pdf');
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;

      try {
        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const originalBuffer = Buffer.from(response.data);
        const spreadBuffer = await generateSpreadPdf(originalBuffer);

        zip.addFile(`cover_page_${cleanedName}`, spreadBuffer);
        console.log(`✅ Added to ZIP: spread_${cleanedName}`);
      } catch (err) {
        console.error(`❌ Failed to process ${cleanedName}:`, err.message);
      }
    }

    const zipBuffer = zip.toBuffer();
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format
    const hh = String(hours).padStart(2, '0');

    const zipName = `spread_pdfs of ${mm}-${dd} at ${hh}-${minutes} ${ampm}.zip`;


    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    res.send(zipBuffer);
    console.log(`✅ The Zip is downloded`);
  } catch (err) {
    console.error('❗ Error fetching files:', err.message);
    res.status(500).send('Error while processing PDFs.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
