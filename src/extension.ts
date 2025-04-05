// src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  // Main command to copy problems as markdown
  let copyProblemsCommand = vscode.commands.registerCommand(
    'bettererrorcopy.copyProblemsAsMarkdown',
    async () => {
      try {
        const markdown = await generateProblemsMarkdown();
        await vscode.env.clipboard.writeText(markdown);
        vscode.window.showInformationMessage('Problems copied to clipboard as Markdown');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to copy problems: ${error}`);
      }
    }
  );

  // Compact format command
  let copyProblemsCompactCommand = vscode.commands.registerCommand(
    'bettererrorcopy.copyProblemsCompact',
    async () => {
      try {
        const markdown = await generateProblemsMarkdown(true);
        await vscode.env.clipboard.writeText(markdown);
        vscode.window.showInformationMessage('Problems copied to clipboard in compact format');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to copy problems: ${error}`);
      }
    }
  );

  // Errors only command
  let copyErrorsOnlyCommand = vscode.commands.registerCommand(
    'bettererrorcopy.copyErrorsOnly',
    async () => {
      try {
        const markdown = await generateProblemsMarkdown(false, [vscode.DiagnosticSeverity.Error]);
        await vscode.env.clipboard.writeText(markdown);
        vscode.window.showInformationMessage('Errors copied to clipboard as Markdown');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to copy errors: ${error}`);
      }
    }
  );

  // Command with interactive filter
  let copyWithFilterCommand = vscode.commands.registerCommand(
    'bettererrorcopy.copyWithFilter',
    async () => {
      try {
        // Get filter options
        const options = await showFilterOptions();
        if (!options) return; // User cancelled
        
        const markdown = await generateProblemsMarkdown(
          options.compact,
          options.severities,
          options.filePattern,
          options.messagePattern
        );
        await vscode.env.clipboard.writeText(markdown);
        vscode.window.showInformationMessage('Filtered problems copied to clipboard');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to copy problems: ${error}`);
      }
    }
  );

  // HTML export command
  let exportAsHtmlCommand = vscode.commands.registerCommand(
    'bettererrorcopy.exportAsHtml',
    async () => {
      try {
        const markdown = await generateProblemsMarkdown();
        const html = convertMarkdownToHtml(markdown);
        await vscode.env.clipboard.writeText(html);
        vscode.window.showInformationMessage('Problems copied to clipboard as HTML');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to export as HTML: ${error}`);
      }
    }
  );

  // Save to file command
  let saveToFileCommand = vscode.commands.registerCommand(
    'bettererrorcopy.saveToFile',
    async () => {
      try {
        const options = {
          filters: {
            'Markdown': ['md'],
            'HTML': ['html'],
            'Text': ['txt']
          },
          title: 'Save Problems Report'
        };
        
        const uri = await vscode.window.showSaveDialog(options);
        if (!uri) return;
        
        const fileExt = path.extname(uri.fsPath).toLowerCase();
        let content = '';
        
        if (fileExt === '.html') {
          const markdown = await generateProblemsMarkdown();
          content = convertMarkdownToHtml(markdown);
        } else {
          content = await generateProblemsMarkdown();
        }
        
        await fs.promises.writeFile(uri.fsPath, content);
        vscode.window.showInformationMessage(`Problems saved to ${uri.fsPath}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to save to file: ${error}`);
      }
    }
  );

  // Status bar item to show problem counts
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'bettererrorcopy.copyProblemsAsMarkdown';
  statusBarItem.tooltip = 'Click to copy problems as Markdown';
  context.subscriptions.push(statusBarItem);

  // Update status bar with problem counts
  function updateStatusBar() {
    const diagnostics = getAllDiagnostics();
    const errorCount = diagnostics.filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Error).length;
    const warningCount = diagnostics.filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Warning).length;
    
    if (errorCount > 0 || warningCount > 0) {
      statusBarItem.text = `$(error) ${errorCount} $(warning) ${warningCount}`;
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  }

  // Update status bar when diagnostics change
  vscode.languages.onDidChangeDiagnostics(() => {
    updateStatusBar();
  });

  // Initial update
  updateStatusBar();

  // Register all commands
  context.subscriptions.push(copyProblemsCommand);
  context.subscriptions.push(copyProblemsCompactCommand);
  context.subscriptions.push(copyErrorsOnlyCommand);
  context.subscriptions.push(copyWithFilterCommand);
  context.subscriptions.push(exportAsHtmlCommand);
  context.subscriptions.push(saveToFileCommand);
}

async function showFilterOptions(): Promise<{
  compact: boolean;
  severities: vscode.DiagnosticSeverity[] | null;
  filePattern: string | null;
  messagePattern: string | null;
} | undefined> {
  // Ask for format type
  const formatOptions = ['Standard (with code snippets)', 'Compact (no code snippets)'];
  const formatSelection = await vscode.window.showQuickPick(formatOptions, {
    placeHolder: 'Select output format'
  });
  if (!formatSelection) return undefined;
  const compact = formatSelection === formatOptions[1];
  
  // Ask for severity filter
  const severityOptions = [
    'All severities',
    'Errors only',
    'Warnings only',
    'Errors and warnings',
    'Information only',
    'Hints only'
  ];
  const severitySelection = await vscode.window.showQuickPick(severityOptions, {
    placeHolder: 'Filter by severity'
  });
  if (!severitySelection) return undefined;
  
  let severities: vscode.DiagnosticSeverity[] | null = null;
  switch (severitySelection) {
    case 'Errors only':
      severities = [vscode.DiagnosticSeverity.Error];
      break;
    case 'Warnings only':
      severities = [vscode.DiagnosticSeverity.Warning];
      break;
    case 'Errors and warnings':
      severities = [vscode.DiagnosticSeverity.Error, vscode.DiagnosticSeverity.Warning];
      break;
    case 'Information only':
      severities = [vscode.DiagnosticSeverity.Information];
      break;
    case 'Hints only':
      severities = [vscode.DiagnosticSeverity.Hint];
      break;
    default:
      severities = null; // All severities
  }
  
  // Ask for file pattern
  const filePattern = await vscode.window.showInputBox({
    placeHolder: 'Filter by file pattern (e.g., *.ts, src/*.js) or leave empty for all',
    prompt: 'Enter a glob pattern to filter files'
  });
  if (filePattern === undefined) return undefined;
  
  // Ask for message pattern
  const messagePattern = await vscode.window.showInputBox({
    placeHolder: 'Filter by message content (case insensitive) or leave empty for all',
    prompt: 'Enter text to filter problem messages'
  });
  if (messagePattern === undefined) return undefined;
  
  return {
    compact,
    severities,
    filePattern: filePattern || null,
    messagePattern: messagePattern || null
  };
}

function convertMarkdownToHtml(markdown: string): string {
  // Simple conversion of markdown to HTML
  // A more robust solution would use a proper markdown parser
  
  // Escape HTML
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Headers
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Lists
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, language, code) => {
    return `<pre><code class="language-${language}">${code}</code></pre>`;
  });
  
  // Wrap in a styled document
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VS Code Problems Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 { color: #333; }
    h2 { color: #444; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h3 { color: #555; }
    h4 { color: #666; }
    pre {
      background-color: #f6f8fa;
      border-radius: 3px;
      padding: 16px;
      overflow: auto;
    }
    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 85%;
    }
    .error { color: #d73a49; }
    .warning { color: #e36209; }
    .info { color: #0366d6; }
    .hint { color: #6f42c1; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

async function generateProblemsMarkdown(
  compact: boolean = false,
  severityFilter: vscode.DiagnosticSeverity[] | null = null,
  filePattern: string | null = null,
  messagePattern: string | null = null
): Promise<string> {
  let diagnostics = getAllDiagnostics();
  const config = vscode.workspace.getConfiguration('bettererrorcopy');
  const contextLines = compact ? 1 : config.get<number>('contextLines', 4);
  const groupByFile = config.get<boolean>('groupByFile', true);
  const addSummary = config.get<boolean>('addSummary', true);
  const useEmoji = config.get<boolean>('useEmoji', true);
  const addTimestamp = config.get<boolean>('addTimestamp', true);
  const addSystemInfo = config.get<boolean>('addSystemInfo', false);

  // Apply severity filter if provided
  if (severityFilter) {
    diagnostics = diagnostics.filter(d => severityFilter.includes(d.diagnostic.severity));
  }
  
  // Apply file pattern filter if provided
  if (filePattern) {
    const minimatch = (pattern: string, value: string): boolean => {
      // Simple glob matching (this is a very simplified version)
      // In a real implementation, you'd use a proper glob matching library
      pattern = pattern.replace(/\./g, '\\.');
      pattern = pattern.replace(/\*/g, '.*');
      pattern = pattern.replace(/\?/g, '.');
      const regex = new RegExp(`^${pattern}$`, 'i');
      return regex.test(value);
    };
    
    diagnostics = diagnostics.filter(d => {
      const relativePath = vscode.workspace.asRelativePath(d.uri);
      return minimatch(filePattern, relativePath);
    });
  }
  
  // Apply message pattern filter if provided
  if (messagePattern) {
    const pattern = messagePattern.toLowerCase();
    diagnostics = diagnostics.filter(d => 
      d.diagnostic.message.toLowerCase().includes(pattern)
    );
  }

  if (diagnostics.length === 0) {
    return '## No problems found matching your criteria';
  }

  let markdownParts: string[] = [];
  
  // Add a header with summary if requested
  if (addSummary) {
    markdownParts.push(generateSummary(diagnostics, useEmoji));
  } else {
    markdownParts.push('# VS Code Problems Report\n');
  }

  // Add timestamp if enabled
  if (addTimestamp) {
    const now = new Date();
    markdownParts.push(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}\n`);
  }

  // Add system info if enabled
  if (addSystemInfo) {
    markdownParts.push(`## System Information
- VS Code: ${vscode.version}
- OS: ${process.platform} ${process.arch}
- Workspace: ${vscode.workspace.name || 'No workspace'}
`);
  }

  // Add filters applied section if any filters are active
  if (severityFilter || filePattern || messagePattern) {
    markdownParts.push(`## Filters Applied`);
    
    if (severityFilter) {
      const severityNames = severityFilter.map(s => getSeverityText(s)).join(', ');
      markdownParts.push(`- Severity: ${severityNames} only`);
    }
    
    if (filePattern) {
      markdownParts.push(`- File Pattern: \`${filePattern}\``);
    }
    
    if (messagePattern) {
      markdownParts.push(`- Message Contains: "${messagePattern}"`);
    }
    
    markdownParts.push('');
  }
  
  if (groupByFile) {
    // Group diagnostics by file
    const fileGroups = groupDiagnosticsByFile(diagnostics);
    
    for (const [file, fileDiagnostics] of fileGroups) {
      const relativePath = vscode.workspace.asRelativePath(file);
      markdownParts.push(`## File: ${relativePath}\n`);
      
      for (const diagnostic of fileDiagnostics) {
        markdownParts.push(await formatDiagnostic(diagnostic, contextLines, compact, useEmoji));
      }
    }
  } else {
    // Group diagnostics by severity
    markdownParts.push(...await formatDiagnosticsBySeverity(diagnostics, contextLines, compact, useEmoji));
  }

  return markdownParts.join('\n');
}

function generateSummary(
  diagnostics: Array<{
    uri: vscode.Uri;
    diagnostic: vscode.Diagnostic;
  }>,
  useEmoji: boolean
): string {
  // Count problems by severity
  const errorCount = diagnostics.filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Error).length;
  const warningCount = diagnostics.filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Warning).length;
  const infoCount = diagnostics.filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Information).length;
  const hintCount = diagnostics.filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Hint).length;
  
  // Count unique files
  const uniqueFiles = new Set(diagnostics.map(d => d.uri.toString())).size;
  
  // Identify most problematic file
  const fileGroups = groupDiagnosticsByFile(diagnostics);
  let mostProblematicFile = { file: '', count: 0 };
  for (const [file, fileDiagnostics] of fileGroups) {
    if (fileDiagnostics.length > mostProblematicFile.count) {
      mostProblematicFile = { 
        file: vscode.workspace.asRelativePath(file), 
        count: fileDiagnostics.length 
      };
    }
  }
  
  // Create emoji markers if enabled
  const errorEmoji = useEmoji ? "🔴 " : "";
  const warningEmoji = useEmoji ? "🟠 " : "";
  const infoEmoji = useEmoji ? "🔵 " : "";
  const hintEmoji = useEmoji ? "⚪ " : "";
  
  let summary = `# VS Code Problems Report

## Summary
- ${errorEmoji}**Errors:** ${errorCount}
- ${warningEmoji}**Warnings:** ${warningCount}
- ${infoEmoji}**Information:** ${infoCount}
- ${hintEmoji}**Hints:** ${hintCount}
- **Total Files:** ${uniqueFiles}
- **Total Problems:** ${diagnostics.length}
`;

  // Add most problematic file if there is one
  if (mostProblematicFile.count > 0) {
    const percentage = Math.round((mostProblematicFile.count / diagnostics.length) * 100);
    summary += `- **Most Problems:** ${mostProblematicFile.file} (${mostProblematicFile.count} problems, ${percentage}% of total)\n`;
  }

  return summary;
}

function getAllDiagnostics(): Array<{
  uri: vscode.Uri;
  diagnostic: vscode.Diagnostic;
}> {
  const result: Array<{
    uri: vscode.Uri;
    diagnostic: vscode.Diagnostic;
  }> = [];

  // Collect all diagnostics from all files
  for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
    for (const diagnostic of diagnostics) {
      result.push({ uri, diagnostic });
    }
  }

  return result;
}

function groupDiagnosticsByFile(diagnostics: Array<{
  uri: vscode.Uri;
  diagnostic: vscode.Diagnostic;
}>): Map<string, Array<{
  uri: vscode.Uri;
  diagnostic: vscode.Diagnostic;
}>> {
  const result = new Map<string, Array<{
    uri: vscode.Uri;
    diagnostic: vscode.Diagnostic;
  }>>();

  for (const item of diagnostics) {
    const key = item.uri.toString();
    if (!result.has(key)) {
      result.set(key, []);
    }
    result.get(key)!.push(item);
  }

  // Sort diagnostics within each file by severity, then line number
  for (const [key, items] of result) {
    result.set(key, items.sort((a, b) => {
      if (a.diagnostic.severity !== b.diagnostic.severity) {
        return a.diagnostic.severity - b.diagnostic.severity;
      }
      return a.diagnostic.range.start.line - b.diagnostic.range.start.line;
    }));
  }

  return result;
}

async function formatDiagnosticsBySeverity(
  diagnostics: Array<{
    uri: vscode.Uri;
    diagnostic: vscode.Diagnostic;
  }>,
  contextLines: number,
  compact: boolean,
  useEmoji: boolean
): Promise<string[]> {
  const result: string[] = [];
  
  // Group by severity
  const errorDiagnostics = diagnostics.filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Error);
  const warningDiagnostics = diagnostics.filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Warning);
  const infoDiagnostics = diagnostics.filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Information);
  const hintDiagnostics = diagnostics.filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Hint);
  
  // Add sections for each severity level
  if (errorDiagnostics.length > 0) {
    const emoji = useEmoji ? "🔴 " : "";
    result.push(`## ${emoji}Errors (${errorDiagnostics.length})\n`);
    for (const diagnostic of errorDiagnostics) {
      result.push(await formatDiagnostic(diagnostic, contextLines, compact, useEmoji));
    }
  }
  
  if (warningDiagnostics.length > 0) {
    const emoji = useEmoji ? "🟠 " : "";
    result.push(`## ${emoji}Warnings (${warningDiagnostics.length})\n`);
    for (const diagnostic of warningDiagnostics) {
      result.push(await formatDiagnostic(diagnostic, contextLines, compact, useEmoji));
    }
  }
  
  if (infoDiagnostics.length > 0) {
    const emoji = useEmoji ? "🔵 " : "";
    result.push(`## ${emoji}Information (${infoDiagnostics.length})\n`);
    for (const diagnostic of infoDiagnostics) {
      result.push(await formatDiagnostic(diagnostic, contextLines, compact, useEmoji));
    }
  }
  
  if (hintDiagnostics.length > 0) {
    const emoji = useEmoji ? "⚪ " : "";
    result.push(`## ${emoji}Hints (${hintDiagnostics.length})\n`);
    for (const diagnostic of hintDiagnostics) {
      result.push(await formatDiagnostic(diagnostic, contextLines, compact, useEmoji));
    }
  }
  
  return result;
}

async function formatDiagnostic(
  { uri, diagnostic }: { uri: vscode.Uri; diagnostic: vscode.Diagnostic },
  contextLines: number,
  compact: boolean,
  useEmoji: boolean
): Promise<string> {
  const severityText = getSeverityText(diagnostic.severity);
  const severityEmoji = useEmoji ? getSeverityEmoji(diagnostic.severity) : "";
  const lineNumber = diagnostic.range.start.line + 1; // 1-based line number for display
  const colNumber = diagnostic.range.start.character + 1; // 1-based column number
  const relativePath = vscode.workspace.asRelativePath(uri);
  
  // Show code location and scope if available
  let codeLocation = "";
  try {
    const document = await vscode.workspace.openTextDocument(uri);
    const scopeRange = getCodeBlockScope(document, diagnostic.range.start.line);
    if (scopeRange) {
      const scopeLine = document.lineAt(scopeRange.start.line).text.trim();
      if (scopeLine) {
        codeLocation = ` in \`${scopeLine}\``;
      }
    }
  } catch (error) {
    // Skip if we can't get the scope
  }
  
  // For compact mode, omit the code snippet
  if (compact) {
    return `#### ${severityEmoji}${severityText}
**${relativePath}** (Line ${lineNumber}, Col ${colNumber})${codeLocation}: ${diagnostic.message.split('\n')[0]}`;
  }
  
  // Get the code snippet with context
  const codeSnippet = await getCodeSnippet(uri, diagnostic.range, contextLines);
  
  // Extract file extension for syntax highlighting
  const fileExtension = path.extname(uri.fsPath).substring(1);
  
  return `#### ${severityEmoji}${severityText} 
**${relativePath}** (Line ${lineNumber}, Col ${colNumber})${codeLocation}: ${diagnostic.message.split('\n')[0]}
\`\`\`${fileExtension}
${codeSnippet}
\`\`\``;
}

// Function to get the scope of a code block (e.g. function, class, etc.)
function getCodeBlockScope(document: vscode.TextDocument, line: number): vscode.Range | null {
  // This is a simplified implementation
  // A more robust implementation would use language-specific parsing
  
  // Look up for function/class/method definitions (max 10 lines up)
  for (let i = line; i >= Math.max(0, line - 10); i--) {
    const lineText = document.lineAt(i).text.trim();
    
    // Check for common patterns that indicate scope start
    if (lineText.match(/^(function|class|def|const|let|var|module|interface|impl)\s+\w+/)) {
      return new vscode.Range(i, 0, i, lineText.length);
    }
  }
  
  return null;
}

function getSeverityText(severity: vscode.DiagnosticSeverity): string {
  switch (severity) {
    case vscode.DiagnosticSeverity.Error:
      return 'Error';
    case vscode.DiagnosticSeverity.Warning:
      return 'Warning';
    case vscode.DiagnosticSeverity.Information:
      return 'Information';
    case vscode.DiagnosticSeverity.Hint:
      return 'Hint';
    default:
      return 'Unknown';
  }
}

function getSeverityEmoji(severity: vscode.DiagnosticSeverity): string {
  switch (severity) {
    case vscode.DiagnosticSeverity.Error:
      return '🔴 ';
    case vscode.DiagnosticSeverity.Warning:
      return '🟠 ';
    case vscode.DiagnosticSeverity.Information:
      return '🔵 ';
    case vscode.DiagnosticSeverity.Hint:
      return '⚪ ';
    default:
      return '';
  }
}

async function getCodeSnippet(
  uri: vscode.Uri,
  range: vscode.Range,
  contextLines: number
): Promise<string> {
  try {
    // Check if file exists and is readable
    await fs.promises.access(uri.fsPath, fs.constants.R_OK);
    
    // Get the document content
    const document = await vscode.workspace.openTextDocument(uri);
    
    // Calculate the range to show
    const startLine = Math.max(0, range.start.line - contextLines);
    const endLine = Math.min(document.lineCount - 1, range.end.line + contextLines);
    
    // Format the code snippet
    const lines: string[] = [];
    const lineNumberWidth = String(endLine + 1).length;
    
    for (let i = startLine; i <= endLine; i++) {
      const lineText = document.lineAt(i).text;
      const linePrefix = i === range.start.line ? '>' : ' ';
      const paddedLineNumber = String(i + 1).padStart(lineNumberWidth, ' ');
      lines.push(`${linePrefix}${paddedLineNumber}: ${lineText}`);
    }
    
    return lines.join('\n');
  } catch (error) {
    return `[Unable to load code from ${uri.fsPath}: ${error}]`;
  }
}

export function deactivate() {}