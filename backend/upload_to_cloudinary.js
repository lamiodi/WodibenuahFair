import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: 'dwmz4youk',
  api_key: '668429968817415',
  api_secret: '-g0Cevf6a2n6zePb-QB3569y2XE'
});

const run = async () => {
  const mdContent = fs.readFileSync('../cloudinary_upload_list.md', 'utf8');
  
  const lines = mdContent.split('\n');
  const files = [];
  for (const line of lines) {
    if (line.includes('| `')) {
      const match = line.match(/\| `([^`]+)`/);
      if (match && match[1]) {
        files.push(match[1]);
      }
    }
  }

  console.log(`Found ${files.length} files to upload.`);

  const urlMapping = {};
  
  for (const file of files) {
    const filePath = path.resolve(process.cwd(), '../', file);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    
    console.log(`Uploading ${file}...`);
    
    try {
      const ext = path.extname(file).toLowerCase();
      const resourceType = ['.mp4', '.mov'].includes(ext) ? 'video' : 'image';
      
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: resourceType,
        folder: 'wodifair',
        use_filename: true,
        unique_filename: false,
        timeout: 120000 // 2 minutes timeout for large files
      });
      
      console.log(`✅ Uploaded to: ${result.secure_url}`);
      
      let relativePath = file.replace('wodifair-app/public', '');
      if (!relativePath.startsWith('/')) relativePath = '/' + relativePath;
      
      urlMapping[relativePath] = result.secure_url;
    } catch (err) {
      console.error(`❌ Failed to upload ${file}:`, err.message || err);
    }
  }
  
  fs.writeFileSync('../cloudinary_mapping.json', JSON.stringify(urlMapping, null, 2));
  console.log('Finished uploading. Mapping saved to cloudinary_mapping.json.');
};

run();
