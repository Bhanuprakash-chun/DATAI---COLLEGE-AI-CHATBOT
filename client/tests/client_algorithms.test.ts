import assert from 'node:assert';
import { BM25Index } from '../src/lib/search/bm25.ts';
import { profileColumnData } from '../src/lib/parsers/spreadsheet-parser.ts';
import { detectFileType } from '../src/lib/parsers/index.ts';

console.log('--- Running DatAI Client Algorithm Tests ---');

// 1. Test File Type Detection
console.log('1. Testing detectFileType...');
assert.strictEqual(detectFileType('report.pdf', 'application/pdf'), 'pdf');
assert.strictEqual(detectFileType('data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), 'xlsx');
assert.strictEqual(detectFileType('metrics.csv', 'text/csv'), 'csv');
assert.strictEqual(detectFileType('contract.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), 'docx');
assert.strictEqual(detectFileType('photo.png', 'image/png'), 'image');
assert.strictEqual(detectFileType('notes.md', 'text/markdown'), 'md');
assert.strictEqual(detectFileType('config.json', 'application/json'), 'json');
console.log('✓ detectFileType passed all checks.');

// 2. Test Column Profiling
console.log('2. Testing profileColumnData...');
const numCol = profileColumnData('revenue', [100, 250, null, 400, 50]);
assert.strictEqual(numCol.name, 'revenue');
assert.strictEqual(numCol.type, 'INTEGER');
assert.strictEqual(numCol.nullCount, 1);
assert.strictEqual(numCol.min, 50);
assert.strictEqual(numCol.max, 400);
assert.strictEqual(numCol.sum, 800);
assert.strictEqual(numCol.mean, 200);

const textCol = profileColumnData('region', ['North', 'South', 'North', 'East', '']);
assert.strictEqual(textCol.name, 'region');
assert.strictEqual(textCol.type, 'TEXT');
assert.strictEqual(textCol.uniqueCount, 3);
assert.strictEqual(textCol.nullCount, 1);
console.log('✓ profileColumnData passed all checks.');

// 3. Test BM25 Inverted Index
console.log('3. Testing BM25Index...');
const bm25 = new BM25Index();
bm25.buildIndex([
  {
    id: 'chunk_1',
    fileId: 'f1',
    fileName: 'contract.txt',
    chunkIndex: 0,
    text: 'Either party may terminate this agreement with sixty days written notice.',
    pageNumber: 1,
  },
  {
    id: 'chunk_2',
    fileId: 'f1',
    fileName: 'contract.txt',
    chunkIndex: 1,
    text: 'Client shall pay vendor net thirty days from invoice date.',
    pageNumber: 2,
  },
  {
    id: 'chunk_3',
    fileId: 'f2',
    fileName: 'report.txt',
    chunkIndex: 0,
    text: 'Revenue grew by twenty percent in second quarter driven by software expansion.',
    pageNumber: 1,
  },
]);

const searchRes1 = bm25.search('terminate agreement notice', 2);
assert.strictEqual(searchRes1.length > 0, true);
assert.strictEqual(searchRes1[0].chunk.id, 'chunk_1');

const searchRes2 = bm25.search('revenue quarter growth', 2);
assert.strictEqual(searchRes2.length > 0, true);
assert.strictEqual(searchRes2[0].chunk.id, 'chunk_3');
console.log('✓ BM25Index passed retrieval tests.');

console.log('\n========================================');
console.log('ALL CLIENT ALGORITHM TESTS PASSED!');
console.log('========================================\n');
