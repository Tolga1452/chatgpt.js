import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AppOptions, WidgetData, OpenAiMcpWidget, ToolData } from '../types/chatgptjs.js';
import { resolve, isAbsolute, relative, join } from 'path';
import express, { Express } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { Tool } from './Tool.js';
import { Widget } from './Widget.js';
import { pathToFileURL } from 'url';
import { build, Plugin } from 'esbuild';

export class App {
    public readonly mcp: McpServer;
    public readonly mcpPath: string;
    public readonly server: Express;
    public readonly port: number;
    public readonly widgetsDir: string;
    public readonly debug: boolean;

    public constructor(options: AppOptions) {
        if (typeof options !== 'object' || options === null) throw new TypeError('options must be an object');

        if ('mcp' in options) {
            if (!(options.mcp instanceof McpServer) && (typeof options.mcp !== 'object' || options.mcp === null)) throw new TypeError('options.mcp must be an object or an instance of McpServer');

            if (!(options.mcp instanceof McpServer)) {
                if (typeof options.mcp.serverInfo !== 'object' || options.mcp.serverInfo === null) throw new TypeError('options.mcp.serverInfo must be an object');
                if ('serverOptions' in options.mcp && (typeof options.mcp.serverOptions !== 'object' || options.mcp.serverOptions === null)) throw new TypeError('options.mcp.serverOptions must be an object');
            };
        };

        if ('mcpPath' in options && (typeof options.mcpPath !== 'string' || options.mcpPath.trim().length === 0)) throw new TypeError('options.mcpPath must be a non-empty string');
        if ('server' in options && !(options.server instanceof express)) throw new TypeError('options.server must be an instance of Express');

        if ('port' in options) {
            if (typeof options.port !== 'number' || !Number.isInteger(options.port)) throw new TypeError('options.port must be an integer');
            if (options.port <= 0 || options.port >= 65536) throw new RangeError('options.port must be an integer between 1 and 65535');
        };

        if ('widgetsDir' in options && (typeof options.widgetsDir !== 'string' || options.widgetsDir.trim().length === 0)) throw new TypeError('options.widgetsDir must be a non-empty string');
        if ('debug' in options && typeof options.debug !== 'boolean') throw new TypeError('options.debug must be a boolean');

        this.mcp = options.mcp instanceof McpServer ? options.mcp : new McpServer(options.mcp.serverInfo, options.mcp.serverOptions);
        this.mcpPath = options.mcpPath ?? '/mcp';

        if (!this.mcpPath.startsWith('/')) this.mcpPath = `/${this.mcpPath}`;

        this.server = options.server ?? express();

        this.server.use(express.json());

        if (!this.server._router || !this.server._router.stack.some((layer: any) => layer.route && layer.route.path === this.mcpPath && layer.route.methods && layer.route.methods.post)) {
            this.server.post(this.mcpPath, async (req, res) => {
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined,
                    enableJsonResponse: true
                });

                res.on('close', () => transport.close());

                await this.mcp.connect(transport);
                await transport.handleRequest(req, res, req.body);
            });
        };

        this.port = options.port ?? 8000;

        const widgetsDirPath = options.widgetsDir ?? resolve(process.cwd(), 'widgets');

        this.widgetsDir = isAbsolute(widgetsDirPath) ? widgetsDirPath : resolve(widgetsDirPath);
        this.debug = options.debug ?? false;
    };

    public listen(): void {
        this.server.listen(this.port, () => console.log(`\x1b[32mMCP server is listening on http://localhost:${this.port}${this.mcpPath}\x1b[0m`));
    };

    public registerTool(tool: ((tool: Tool) => Tool) | Tool | ToolData): void {
        const _tool = typeof tool === 'function' ? tool(new Tool()) : tool instanceof Tool ? tool : new Tool(tool);

        if (!(_tool instanceof Tool)) throw new TypeError('tool must be a ToolData object or an instance of Tool');

        if (!_tool.data.name) throw new Error('Tool name is not set');
        if (!_tool.data.callback) throw new Error('Tool callback is not set');

        const mcpData = _tool.toMcp();

        this.mcp.registerTool(_tool.data.name, mcpData, _tool.data.callback);
    };

    public registerWidget(widget: ((widget: Widget) => Widget) | Widget | WidgetData): void {
        const _widget = typeof widget === 'function' ? widget(new Widget()) : widget instanceof Widget ? widget : new Widget(widget);

        if (!(_widget instanceof Widget)) throw new TypeError('widget must be a WidgetData object or an instance of Widget');

        if (!_widget.data.name) throw new Error('Widget name is not set');
        if (!_widget.data.html) throw new Error('Widget html is not set');

        const mcpData = _widget.toMcp();

        this.mcp.registerResource(_widget.data.name, mcpData.uri!, {}, async () => ({ contents: [mcpData as OpenAiMcpWidget] }));
    };

    public async registerWidgets(): Promise<void> {
        if (!existsSync(this.widgetsDir)) throw new Error(`widgetsDir ${relative(process.cwd(), this.widgetsDir)} does not exist`);

        const widgets = readdirSync(this.widgetsDir).filter(dirent => dirent !== 'dist');
        const found: { dir: string, data: Widget, script: string, css: string | undefined, extension: 'jsx' | 'tsx' }[] = [];

        for (const widget of widgets) {
            const path = join(this.widgetsDir, widget);

            if (!readdirSync(path, { withFileTypes: true }).some(dirent => !dirent.isDirectory())) continue;

            const dataExtension = existsSync(join(path, 'data.js')) ? 'js' : existsSync(join(path, 'data.ts')) ? 'ts' : null;

            if (!dataExtension) throw new Error(`${relative(process.cwd(), join(path, 'data.js'))} or ${relative(process.cwd(), join(path, 'data.ts'))} does not exist`);

            let data: Widget | { default: Widget } = await import(pathToFileURL(join(this.widgetsDir, widget, `data.${dataExtension}`)).href);

            if ('default' in data) data = data.default;

            if (!data || !(data instanceof Widget)) throw new TypeError(`${relative(process.cwd(), join(path, `data.${dataExtension}`))} does not export a valid Widget instance`);

            const scriptExtension = existsSync(join(path, 'index.jsx')) ? 'jsx' : existsSync(join(path, 'index.tsx')) ? 'tsx' : null;

            if (!scriptExtension) throw new Error(`${relative(process.cwd(), join(path, 'index.jsx'))} or ${relative(process.cwd(), join(path, 'index.tsx'))} does not exist`);

            let script = readFileSync(join(path, `index.${scriptExtension}`), 'utf-8');

            if (!script || typeof script !== 'string' || script.trim().length === 0) throw new Error(`${relative(process.cwd(), join(path, `index.${scriptExtension}`))} does not exist or is empty`);

            script += `import React, { createRoot } from '@chatgpt.js/react';\n\ncreateRoot(document.getElementById('widget-root-${data.data.name}')).render(<Widget />);`;

            const cssPath = join(path, 'index.css');

            let css = undefined;

            if (existsSync(cssPath)) css = readFileSync(cssPath, 'utf-8');

            found.push({ dir: widget, data, script, css, extension: scriptExtension });
        };

        console.log(`\x1b[33mBuilding ${found.length} widgets...\x1b[0m\n`);

        const start = Date.now();

        const vfs = new Map<string, { contents: string; loader: 'jsx' | 'tsx'; resolveDir: string }>();

        for (const { dir, script, extension } of found) {
            const base = resolve(this.widgetsDir, dir);
            const jsxPath = resolve(base, `index.${extension}`);

            vfs.set(jsxPath, { contents: script, loader: extension, resolveDir: base });
        };

        const vfsPlugin: Plugin = {
            name: 'virtual-fs',
            setup(build) {
                build.onResolve({ filter: /.*/ }, args => {
                    const full = isAbsolute(args.path) ? args.path : join(args.resolveDir, args.path);

                    if (vfs.has(full)) return { path: full };

                    return null;
                });

                build.onLoad({ filter: /.*/ }, args => {
                    const file = vfs.get(args.path);

                    if (file) {
                        return {
                            contents: file.contents,
                            loader: file.loader,
                            resolveDir: file.resolveDir
                        };
                    };

                    return null;
                });
            },
        };

        const result = await build({
            entryPoints: found.map(widget => join(this.widgetsDir, widget.dir, `index.${widget.extension}`)),
            bundle: true,
            format: 'esm',
            outdir: 'dist/widgets',
            outbase: this.widgetsDir,
            write: false,
            plugins: [vfsPlugin]
        });

        const scripts = result.outputFiles.map(f => ({ path: f.path, text: f.text }));

        for (const widget of found) {
            const script = scripts.find(s => s.path === resolve('dist/widgets', widget.dir, 'index.js'))?.text ?? '';
            const html = `<div id="widget-root-${widget.data.data.name}"></div>${widget.css ? `<style>${widget.css}</style>` : ''}<script type="module">${script}</script>`;

            widget.data.setHtml(html);

            if (this.debug) writeFileSync(resolve(this.widgetsDir, widget.dir, 'index.debug.html'), html, 'utf-8');

            this.registerWidget(widget.data);

            console.log(`\x1b[33m- ${widget.data.data.name}\x1b[0m`);
        };

        const end = Date.now();

        console.log(`\n\x1b[33mDone in ${end - start}ms\x1b[0m`);
    };
};
