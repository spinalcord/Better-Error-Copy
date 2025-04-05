# BetterErrorCopy for VS Code

A VS Code extension that formats the problems list in a more readable Markdown format with code snippets, making it easier to share and document issues.

## Features

- Converts VS Code problems (errors, warnings, etc.) into a clean Markdown format
- Includes code snippets with context lines around each problem with language-specific syntax highlighting
- Highlights the exact line with the problem
- Multiple output formats (detailed, compact)
- Optional emoji indicators for different severity levels
- Summary statistics showing error/warning counts
- Status bar indicator showing real-time error and warning counts
- Advanced filtering options (by severity, file pattern, or message content)
- Export as HTML with syntax highlighting
- Save problems directly to Markdown or HTML files
- Shows function/class context for each problem when available
- Identification of most problematic files in the codebase

## Commands

The extension provides multiple commands in the Problems panel:

1. **Copy Problems as Markdown**: The standard format with code snippets
2. **Copy Problems (Compact Format)**: A more concise format without code snippets
3. **Copy Errors Only**: Copy only errors (ignoring warnings, hints, and info)
4. **Copy Problems with Custom Filter...**: Interactive dialog to set custom filters
5. **Copy Problems as HTML**: Generate HTML output with syntax highlighting
6. **Save Problems to File...**: Save the problems report to a Markdown or HTML file

## Status Bar Indicator

The extension adds a status bar item that shows the current count of errors and warnings in your workspace. Clicking the status bar item copies all problems as Markdown.

## Usage

1. Open a project with some errors/warnings/problems in VS Code
2. Right-click in the "Problems" panel and select one of the commands
3. Paste the formatted Markdown into your document, issue tracker, or chat

You can also access these commands from the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).

## Interactive Filtering

The "Copy Problems with Custom Filter..." command allows you to:

1. Choose the output format (standard or compact)
2. Filter by severity (errors, warnings, etc.)
3. Filter by file pattern (e.g., "*.ts", "src/*.js")
4. Filter by message content (e.g., "undefined variable")

This is useful for focusing on specific types of problems in large codebases.

## Example Output

### Standard Format

```markdown
# VS Code Problems Report

## Summary
- 🔴 **Errors:** 2
- 🟠 **Warnings:** 3
- 🔵 **Information:** 0
- ⚪ **Hints:** 1
- **Total Files:** 2
- **Total Problems:** 6
- **Most Problems:** src/main.rs (4 problems, 67% of total)

Generated on: 4/5/2025 at 10:30:45 AM

## File: src/main.rs

#### 🔴 Error 
**src/main.rs** (Line 4, Col 1) in `fn main()`: 'println' macro is undefined
```rs
 1: fn main() {
 2:     // This should print to the console
 3:     // But there's an error
>4:     println!("asdfsdf")
 5:     
 6:     // More code here
 7:     let x = 5;
 8: }
```

#### 🟠 Warning 
**src/main.rs** (Line 15, Col 1): Unused macro invocation
```rs
 11: fn other_function() {
 12:     // These function calls are not used
 13:     foobar!("asdfsdf");
 14:     foobar!("asdfsdf");
>15:     foobar!("asdfsdf")
 16: }
 17:
 18: fn used_function() {
 19:     // This is actually used
```
```

### HTML Export

The HTML export feature generates a styled HTML page with proper syntax highlighting for code snippets, making it perfect for sharing via email or other HTML-compatible channels.

## Extension Settings

This extension contributes the following settings:

* `bettererrorcopy.contextLines`: Number of context lines before and after the problem (default: 4)
* `bettererrorcopy.groupByFile`: Group problems by file (if false, group by severity) (default: true)
* `bettererrorcopy.addSummary`: Add a summary section with problem counts (default: true)
* `bettererrorcopy.useEmoji`: Use emoji icons for different severity levels (default: true)
* `bettererrorcopy.addTimestamp`: Add a timestamp to the report (default: true)
* `bettererrorcopy.addSystemInfo`: Add system information to the report (default: false)

## Development

### Prerequisites

- Node.js and npm
- Visual Studio Code

### Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Open the project in VS Code
4. Press F5 to launch the extension in a new VS Code window

### Build

```bash
npm run compile
```

### Package

To create a VSIX package:

```bash
npx @vscode/vsce package
```

## License

MIT