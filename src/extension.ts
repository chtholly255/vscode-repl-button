import * as os from 'os';
import * as vscode from 'vscode';

const DEFAULT_LANGUAGE_COMMANDS: Record<string, string> = {
  python: 'python -i {file}',
  javascript: 'node -i -e "require(process.argv[1])" {file}',
  typescript: 'ts-node -i -e "require(process.argv[1])" {file}',
  ruby: 'irb -r {file}',
  lua: 'lua -i {file}',
  perl: 'perl -d {file}',
  r: 'R --quiet --no-save -f {file}',
  php: 'php -a {file}'
};

export function activate(context: vscode.ExtensionContext) {
  const updateContext = () => {
    void vscode.commands.executeCommand('setContext', 'replButton.isSupported', isSupportedActiveEditor());
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('replButton.openRepl', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor.');
        return;
      }

      const languageId = editor.document.languageId;
      const commandTemplate = getLanguageCommands()[languageId];

      if (!commandTemplate) {
        vscode.window.showWarningMessage(`No REPL command configured for language: ${languageId}`);
        return;
      }

      const workspaceFolder =
        vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath ?? process.cwd();
      const sourceFile =
        editor.document.isUntitled || editor.document.isDirty
          ? await writeTempFile(editor.document.getText(), languageId)
          : editor.document.fileName;

      const command = fillTemplate(commandTemplate, {
        file: quoteShell(sourceFile),
        workspaceFolder: quoteShell(workspaceFolder),
        tempFile: quoteShell(sourceFile),
        tempDir: quoteShell(os.tmpdir()),
        code: quoteShell(editor.document.getText())
      });

      const terminal = vscode.window.createTerminal({
        name: `REPL: ${languageId}`,
        cwd: workspaceFolder
      });
      terminal.show(true);
      terminal.sendText(command, true);
    }),
    vscode.window.onDidChangeActiveTextEditor(updateContext),
    vscode.workspace.onDidOpenTextDocument(updateContext),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('replButton.languageCommands')) {
        updateContext();
      }
    })
  );

  updateContext();
}

function isSupportedActiveEditor(): boolean {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return false;
  }

  const languageId = editor.document.languageId;
  return Boolean(getLanguageCommands()[languageId]);
}

function getLanguageCommands(): Record<string, string> {
  const configured = vscode.workspace.getConfiguration('replButton').get<Record<string, string>>('languageCommands', {});
  return {
    ...DEFAULT_LANGUAGE_COMMANDS,
    ...configured
  };
}

function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(file|workspaceFolder|tempFile|tempDir|code)\}/g, (_, key: keyof typeof values) => values[key]);
}

function quoteShell(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

async function writeTempFile(content: string, languageId: string): Promise<string> {
  const extensionMap: Record<string, string> = {
    python: '.py',
    javascript: '.js',
    typescript: '.ts',
    ruby: '.rb',
    lua: '.lua',
    perl: '.pl',
    php: '.php',
    r: '.r'
  };

  const ext = extensionMap[languageId] ?? '.txt';
  const filename = `vscode-repl-button-${Date.now()}${ext}`;
  const uri = vscode.Uri.joinPath(vscode.Uri.file(os.tmpdir()), filename);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
  return uri.fsPath;
}

export function deactivate() {
  // no-op
}
