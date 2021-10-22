import * as path from 'path';
const fs = require('fs');

import { EXTENSIONS_TO_LINT } from './constants';


const ESLINT_TO_GITHUB_LEVELS = [
  'notice',
  'warning',
  'failure'
];

export async function eslint(filesList: string[]) {
  const { CLIEngine } = (await import(
    path.join(process.cwd(), 'node_modules/eslint')
  )) as typeof import('eslint');

  const filteredFilesList = filesList.filter((value) => fs.existsSync(value));

  const cli = new CLIEngine({ extensions: [...EXTENSIONS_TO_LINT] });
  const report = cli.executeOnFiles(filteredFilesList);
  // fixableErrorCount, fixableWarningCount are available too
  const { results, errorCount, warningCount } = report;

  let annotations: any[] = [];

  for (const result of results) {
    const block: any[] = [];
    const { filePath, messages } = result;
    const filename = filteredFilesList.find(file => filePath.endsWith(file));
    if (!filename) continue;
    if (annotations.length + messages.length >= 50 ) {
      console.warn('Only showing the first 50 results');
      break;
    }
    for (const msg of messages) {
      const {
        line,
        severity,
        ruleId,
        message,
        endLine,
        column,
        endColumn
      } = msg;
      if (annotations.length >= 50) {
        console.warn('Only showing the first 50 messages');
        break;
      }
      block.push({
        path: filename,
        start_line: line || 0,
        end_line: endLine || line || 0,
        start_column: column || 0,
        end_column: endColumn || column || 0,
        annotation_level: 'notice', //ESLINT_TO_GITHUB_LEVELS[severity],
        title: (ruleId || 'ESLint').substr(0, 255),
        raw_details: '',
        message: message.substr(0, 512)
      });
    }
   annotations = annotations.concat(block);
  }

  return {
    conclusion: (errorCount > 0
      ? 'failure'
      : 'success') as string,
    output: {
      title: `${errorCount} error(s), ${warningCount} warning(s) found in ${filteredFilesList.length} file(s)`,
      summary: `${errorCount} error(s), ${warningCount} warning(s) found in ${filteredFilesList.length} file(s)`,
      annotations
    }
  };
}
