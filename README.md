# Better Error Copy for VS Code

A VS Code extension that formats the problems list in a more readable Markdown format with code snippets when you copy it, making it easier to share and document issues.

## Copy Error in a Nutshell
Ctrl + Shift + P
![](https://github.com/spinalcord/Better-Error-Copy/blob/master/images/exampl2.png?raw=true)

## Features

- Converts VS Code problems (errors, warnings, etc.) into a clean Markdown format
- Includes code snippets with context lines around each problem with language-specific syntax highlighting
- Highlights the exact line with the problem
- Multiple output formats (detailed, compact)
- Optional emoji indicators for different severity levels
- Summary statistics showing error/warning counts
- Status bar indicator showing real-time error and warning counts
- Advanced filtering options (by severity, file pattern, or message content)
- Export as HTML
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

## Example Output (In any Markdown-Render)

![](https://github.com/spinalcord/Better-Error-Copy/blob/master/images/example.png?raw=true)

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
