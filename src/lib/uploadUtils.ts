import fs from 'fs';
import path from 'path';

/**
 * Sanitizes a string to make it safe for filesystem directory names
 */
export function sanitizeFolderName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Gets the absolute filesystem path for an employee's uploads directory
 */
export function getEmployeeUploadDir(employeeName: string, employeeId: string): { absoluteDir: string; relativeDir: string } {
  const cleanName = sanitizeFolderName(employeeName) || 'staff';
  const cleanId = sanitizeFolderName(employeeId) || 'id';
  const folderName = `${cleanName}_${cleanId}`;
  
  const relativeDir = `/uploads/${folderName}`;
  const absoluteDir = path.join(process.cwd(), 'public', 'uploads', folderName);

  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }

  return { absoluteDir, relativeDir };
}

/**
 * Saves a Base64 or Buffer file to the employee's folder
 */
export async function saveEmployeeFile({
  employeeName,
  employeeId,
  fileName,
  dataUrlOrBuffer,
}: {
  employeeName: string;
  employeeId: string;
  fileName: string;
  dataUrlOrBuffer: string | Buffer;
}): Promise<{ relativeFilePath: string; fileSizeFormatted: string; fileType: 'image' | 'pdf' | 'doc' }> {
  const { absoluteDir, relativeDir } = getEmployeeUploadDir(employeeName, employeeId);

  let fileBuffer: Buffer;
  let extension = path.extname(fileName).toLowerCase() || '.png';

  if (typeof dataUrlOrBuffer === 'string') {
    if (dataUrlOrBuffer.startsWith('data:')) {
      const matches = dataUrlOrBuffer.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('pdf')) extension = '.pdf';
        else if (mime.includes('jpeg') || mime.includes('jpg')) extension = '.jpg';
        else if (mime.includes('png')) extension = '.png';
        else if (mime.includes('webp')) extension = '.webp';
        
        fileBuffer = Buffer.from(matches[2], 'base64');
      } else {
        fileBuffer = Buffer.from(dataUrlOrBuffer, 'utf8');
      }
    } else {
      fileBuffer = Buffer.from(dataUrlOrBuffer, 'utf8');
    }
  } else {
    fileBuffer = dataUrlOrBuffer;
  }

  const cleanBaseName = sanitizeFolderName(path.basename(fileName, path.extname(fileName))) || 'document';
  const uniqueFileName = `${Date.now()}_${cleanBaseName}${extension}`;
  const absoluteFilePath = path.join(absoluteDir, uniqueFileName);

  await fs.promises.writeFile(absoluteFilePath, fileBuffer);

  const bytes = fileBuffer.length;
  const fileSizeFormatted = bytes > 1024 * 1024 
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` 
    : `${(bytes / 1024).toFixed(0)} KB`;

  const fileType = extension === '.pdf' ? 'pdf' : (extension === '.doc' || extension === '.docx') ? 'doc' : 'image';
  const relativeFilePath = `${relativeDir}/${uniqueFileName}`;

  return {
    relativeFilePath,
    fileSizeFormatted,
    fileType,
  };
}

/**
 * Safely deletes a file from the server uploads folder
 */
export async function deleteUploadedFile(relativeFilePath?: string): Promise<boolean> {
  if (!relativeFilePath || !relativeFilePath.startsWith('/uploads/')) {
    return false;
  }

  try {
    const absolutePath = path.join(process.cwd(), 'public', relativeFilePath.replace(/^\//, ''));
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
      return true;
    }
  } catch (err) {
    console.error('Failed to delete file from disk:', relativeFilePath, err);
  }
  return false;
}
