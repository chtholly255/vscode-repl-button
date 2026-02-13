# VSCode REPL Button

在编辑器右上角添加一个按钮，一键打开当前语言对应的 REPL，并自动载入当前代码。

## 功能特性

- 仅当当前编辑器语言受支持时，按钮才显示在右上角（`editor/title` 区域）。
- 内置支持常见脚本语言（可直接用）：
  - Python
  - JavaScript
  - TypeScript
  - Ruby
  - Lua
  - Perl
  - R
  - PHP
- 支持用户通过配置覆盖默认命令，或新增任意语言。
- 对未保存或已修改但未保存的文件，会自动写入临时文件后载入，确保 REPL 能执行当前内容。

## 安装与运行（开发模式）

1. 安装依赖：

   ```bash
   npm install
   ```

2. 编译插件：

   ```bash
   npm run compile
   ```

3. 在 VSCode 中按 `F5` 启动 Extension Development Host。

## 使用方法

1. 打开一个受支持语言的文件。
2. 在编辑器右上角点击 **终端图标按钮**（命令：`Open REPL with Current Code`）。
3. 插件会新建一个终端并执行对应语言命令，进入 REPL 并载入当前代码。

> 也可以通过命令面板执行：`Open REPL with Current Code`。

## 配置

配置项：`replButton.languageCommands`

- 类型：`object`
- 作用：`languageId -> command template`
- 你可以：
  - 覆盖默认语言命令
  - 新增任意语言命令

### 可用占位符

- `{file}`：当前文件路径（未保存/已修改时为临时文件路径）
- `{workspaceFolder}`：当前工作区根目录
- `{tempFile}`：与 `{file}` 相同（便于命名语义）
- `{tempDir}`：系统临时目录
- `{code}`：当前编辑器完整文本内容

> 占位符会自动做 shell 转义。

### 配置示例

在 `settings.json` 中：

```json
{
  "replButton.languageCommands": {
    "python": "python -i {file}",
    "javascript": "node -i -e \"require(process.argv[1])\" {file}",
    "typescript": "tsx --tsconfig ./tsconfig.json {file}",
    "shellscript": "bash -i {file}",
    "julia": "julia --project -i {file}"
  }
}
```

上面示例演示了：
- 覆盖内置的 JavaScript/TypeScript 命令
- 新增 `shellscript` 和 `julia` 两种语言支持

## 默认语言命令

默认命令定义在源码 `src/extension.ts` 的 `DEFAULT_LANGUAGE_COMMANDS` 中，可通过配置覆盖。

## 常见问题

### 1) 为什么按钮没出现？

- 当前文件语言不在支持列表里。
- 你可在 `replButton.languageCommands` 中添加该语言的 `languageId` 命令。

### 2) 为什么 REPL 打不开？

- 对应解释器/命令未安装，或不在系统 PATH。
- 配置命令语法错误，可先在终端单独验证命令。

### 3) 为什么载入的不是最新内容？

- 插件对未保存内容会写入临时文件并执行，正常情况下应为最新内容。
- 若命令本身没引用 `{file}`（或 `{tempFile}`），请在配置中修正模板。

## 建议

不同语言 REPL 的“载入文件”方式并不完全统一。若你想达到最佳体验，请为团队常用语言定制最适合的命令模板。
