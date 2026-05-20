import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mappingPath = path.join(__dirname, '../cloudinary_mapping.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

let deletedCount = 0;

for (const localPath of Object.keys(mapping)) {
  // localPath looks like "/images/IMG_8966.jpg"
  // We need to resolve it relative to wodifair-app/public
  const absolutePath = path.join(__dirname, '../wodifair-app/public', localPath);
  
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
    console.log(`Deleted: ${localPath}`);
    deletedCount++;
  } else {
    // Try to handle edge cases like URI encoding
    const decodedPath = decodeURI(localPath);
    const decodedAbsolutePath = path.join(__dirname, '../wodifair-app/public', decodedPath);
    if (fs.existsSync(decodedAbsolutePath)) {
      fs.unlinkSync(decodedAbsolutePath);
      console.log(`Deleted: ${decodedPath}`);
      deletedCount++;
    } else {
      console.log(`Could not find to delete: ${localPath}`);
    }
  }
}

console.log(`\nSuccessfully deleted ${deletedCount} local media files.`);
