import fs from 'fs';
import path from 'path';
import { globSync } from 'glob'; // I can just do basic recursion

const mapping = JSON.parse(fs.readFileSync('../cloudinary_mapping.json', 'utf8'));

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const run = () => {
  const srcDir = path.resolve(process.cwd(), '../wodifair-app/src');
  const files = walkSync(srcDir);
  
  let replacedCount = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    for (const [localPath, cloudUrl] of Object.entries(mapping)) {
      // localPath might be "/images/IMG_0088.jpg"
      // Sometimes it's referenced without leading slash, or with URL encoding
      // We will just do a simple replaceAll for the exact string, and also encoded version
      const encodedLocal = encodeURI(localPath).replace(/%20/g, ' '); // just in case
      const encodedLocal2 = localPath.replace(/ /g, '%20');
      
      if (content.includes(localPath)) {
        content = content.split(localPath).join(cloudUrl);
        changed = true;
      }
      if (content.includes(encodedLocal2)) {
        content = content.split(encodedLocal2).join(cloudUrl);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
      replacedCount++;
    }
  }
  
  console.log(`Replaced Cloudinary URLs in ${replacedCount} files.`);
};

run();
