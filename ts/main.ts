import * as csvParse from 'csv-parse';
import * as fs from 'fs';

//var myParser:csvParse.CsvParser = csvParse({delimiter: ','}, function(data, err) {
    //console.log(data);
//}) as csvParse.CsvParser;

fs.createReadStream('data/event.csv')
  .pipe(csvParse())
  .on('data', function (data : any) {
    console.log(data)
  })
