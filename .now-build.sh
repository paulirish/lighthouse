#!/usr/bin/env bash
echo "running node......."
node -e "
   console.log('🕒 Generating report for sample_v2.json...');
   const ReportGenerator = require('./lighthouse-core/report/report-generator');
   const lhr = require('./lighthouse-core/test/results/sample_v2.json');

   const html = ReportGenerator.generateReportHtml(lhr);
   const filename = './dist/index.html';
   fs.writeFileSync(filename, html, {encoding: 'utf-8'});
   console.log('✅', filename, 'written.')
"
