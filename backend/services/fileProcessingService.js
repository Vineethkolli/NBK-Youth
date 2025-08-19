import xlsx from 'xlsx';
import { generateEmbedding } from './embeddingService.js';
import ProcessedData from '../models/ProcessedData.js';
import Record from '../models/Record.js';
import { google } from 'googleapis';

const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  }),
});

export const processFile = async (recordId) => {
  try {
    const record = await Record.findById(recordId);
    if (!record) {
      throw new Error('Record not found');
    }

    // Update status to processing
    record.status = 'processing';
    await record.save();

    // Download file from Google Drive
    const fileId = extractFileIdFromUrl(record.processingFileUrl);
    const fileBuffer = await downloadFileFromDrive(fileId);

    // Extract text based on file type
    let extractedText = '';
    let structuredData = {};

    if (record.processingFileUrl.includes('.xlsx') || record.processingFileUrl.includes('.xls')) {
      const result = await processExcelFile(fileBuffer, record.recordYear, record.fileName);
      extractedText = result.text;
      structuredData = result.data;
      console.log('Extracted text from Excel:', extractedText);
      console.log('Structured data from Excel:', structuredData);
    } else if (record.processingFileUrl.includes('.pdf')) {
      const result = await processPdfFile(fileBuffer);
      extractedText = result.text;
      console.log('Extracted text from PDF:', extractedText);
    }

    // Chunk the text
    const chunks = chunkText(extractedText);
    console.log('Chunks:', chunks);

    // Generate embeddings for each chunk
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk, idx) => {
        const embedding = await generateEmbedding(chunk);
        console.log(`Embedding for chunk ${idx}:`, embedding);
        return {
          text: chunk,
          embedding,
          metadata: {
            recordYear: record.recordYear,
            fileName: record.fileName,
            chunkIndex: idx
          }
        };
      })
    );
    console.log('Chunks with embeddings:', chunksWithEmbeddings);

    // Calculate totals from structured data
    const totals = calculateTotalsFromAnyFormat(structuredData);
    console.log('Totals:', totals);

    // Save processed data
    await ProcessedData.create({
      recordId: record._id,
      recordYear: record.recordYear,
      fileName: record.fileName,
      chunks: chunksWithEmbeddings,
      structuredData,
      totalIncome: totals.income,
      totalExpense: totals.expense,
      entryCount: totals.count,
      extractedFields: totals.fields
    });

    // Update record status
    record.status = 'ready';
    record.processedDate = new Date();
    await record.save();

    return { success: true, message: 'File processed successfully' };
  } catch (error) {
    console.error('File processing error:', error);

    // Update record status to error
    await Record.findByIdAndUpdate(recordId, {
      status: 'error',
      errorMessage: error.message
    });

    throw error;
  }
};

const extractFileIdFromUrl = (url) => {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
};

const downloadFileFromDrive = async (fileId) => {
  const response = await drive.files.get({
    fileId,
    alt: 'media'
  }, { responseType: 'stream' });

  return new Promise((resolve, reject) => {
    const chunks = [];
    response.data.on('data', chunk => chunks.push(chunk));
    response.data.on('end', () => resolve(Buffer.concat(chunks)));
    response.data.on('error', reject);
  });
};

// Robust Excel processing: auto-detect header row, skip leading blanks, handle merged cells
const processExcelFile = async (buffer, recordYear, fileName) => {
  const workbook = xlsx.read(buffer, { type: 'buffer', cellStyles: true });

  let allData = [];
  let allText = '';
  let extractedFields = new Set();

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    // Unmerge merged cells by filling merged ranges with the top-left value
    if (worksheet['!merges']) {
      worksheet['!merges'].forEach((merge) => {
        const start = xlsx.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
        const value = worksheet[start] ? worksheet[start].v : '';
        for (let R = merge.s.r; R <= merge.e.r; ++R) {
          for (let C = merge.s.c; C <= merge.e.c; ++C) {
            const cell = xlsx.utils.encode_cell({ r: R, c: C });
            if (!worksheet[cell]) worksheet[cell] = { t: 's', v: value };
          }
        }
      });
    }

    // Convert to array of arrays (rows)
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
      blankrows: false,
      header: 1
    });

    // Find the first non-empty row to use as header
    let headerRowIdx = jsonData.findIndex(row => Array.isArray(row) && row.some(cell => (cell || '').toString().trim() !== ''));
    if (headerRowIdx === -1 || headerRowIdx === jsonData.length - 1) return; // No data
    const headers = jsonData[headerRowIdx].map(h => (h || '').toString().trim());
    headers.forEach(h => extractedFields.add(h));

    // Data rows: all rows after header
    const rows = jsonData.slice(headerRowIdx + 1).filter(rowArr => Array.isArray(rowArr) && rowArr.some(cell => (cell || '').toString().trim() !== ''));
    const normalizedRows = rows.map(rowArr => {
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = (rowArr[idx] || '').toString().trim();
      });
      rowObj._sheetName = sheetName;
      rowObj._recordYear = recordYear;
      rowObj._fileName = fileName;
      return rowObj;
    });
    allData = allData.concat(normalizedRows);

    // Create comprehensive text representation
    const sheetText = normalizedRows
      .map((row, rowIndex) => {
        const rowText = Object.entries(row)
          .filter(([key, value]) => value && !key.startsWith('_'))
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ');
        return rowText ? `Row ${rowIndex + 1}: ${rowText}` : '';
      })
      .filter(line => line.trim().length > 0)
      .join('\n');

    allText += `\n--- Sheet: ${sheetName} (${recordYear}) ---\n${sheetText}`;
  });

  return {
    text: allText.trim(),
    data: allData,
    fields: Array.from(extractedFields)
  };
};

const processPdfFile = async (buffer) => {
  // For now, return empty data for PDF files
  // You can implement PDF parsing later if needed
  return {
    text: 'PDF processing not implemented yet',
    data: {}
  };
};

const chunkText = (text, maxTokens = 500) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

// Enhanced calculation to work with any Excel format
const calculateTotalsFromAnyFormat = (data) => {
  const totals = {};
  let count = 0;
  const fields = new Set();

  if (Array.isArray(data)) {
    data.forEach(row => {
      count++;
      Object.entries(row).forEach(([key, value]) => {
        fields.add(key);
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
          if (!totals[key]) totals[key] = 0;
          totals[key] += num;
        }
      });
    });
  }

  // Try to identify income and expense fields intelligently
  const incomeFields = Array.from(fields).filter(field => 
    /income|amount|paid|received|collection|contribution|donation/i.test(field)
  );
  const expenseFields = Array.from(fields).filter(field => 
    /expense|cost|spent|expenditure|payment|bill/i.test(field)
  );

  // Calculate totals for identified fields
  let income = 0;
  let expense = 0;

  incomeFields.forEach(field => {
    if (totals[field]) income += totals[field];
  });

  expenseFields.forEach(field => {
    if (totals[field]) expense += totals[field];
  });

  // If no specific fields found, try common field names
  if (income === 0 && expense === 0) {
    income = totals['income'] || totals['Income'] || totals['amount'] || totals['Amount'] || 0;
    expense = totals['expense'] || totals['Expense'] || totals['cost'] || totals['Cost'] || 0;
  }

  return { 
    ...totals, 
    income, 
    expense, 
    count,
    fields: Array.from(fields),
    incomeFields,
    expenseFields
  };
};