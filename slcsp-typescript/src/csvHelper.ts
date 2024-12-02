import fs from 'fs';
import { parseStream, writeToStream, ParserRow } from 'fast-csv';


/**  
* Reads/parses CSV by filename  
*  
* @template T, TransformedT
* @param {String} filePath  
* @param {Object} options  
* @return {Promise<TransformedT[]>} generic type 
*/  
export function readCSV<T extends ParserRow, TransformedT extends ParserRow>(
    filePath: string,
    options: {
      transform?(t: T): TransformedT;
      validate?(t: TransformedT): boolean
    } = {}
  ): Promise<TransformedT[]>  {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    const csvStream = parseStream<T, TransformedT>(stream, { headers: true });

    if (options.transform) {
      csvStream.transform(options.transform)
    }

    if (options.validate) {
      csvStream.validate(options.validate);
    }

    const results: TransformedT[] = [];

    csvStream
      .on('error', reject)
      .on('data', (row: TransformedT) => {
        results.push(row)
      })
      .on('end', () => resolve(results))
  });
};


/**  
* Prints CSV to stdout  
*  
* @param {ParserRow[]} data   
* @return {void}
*/ 
export function printCSV(data: ParserRow[]):void {
  writeToStream(process.stdout, data, { headers: true });
}