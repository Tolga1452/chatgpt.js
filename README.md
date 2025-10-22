> [!CAUTION]
> This library is still in early development. Things may change rapidly and there may be bugs. Use at your own risk.
> 
> Also I would appreciate contributions for the documentation and the library itself!

# ChatGPT.js

A TypeScript/JavaScript library for building ChatGPT Apps easily. It only takes ~30 lines of code to create a simple ChatGPT App with a widget!

## What does it do?

`chatgpt.js` combines Model Context Protocol, React, Esbuild, Express, and ChatGPT Apps SDK to provide an easy way to build ChatGPT Apps.

## Installation

```bash
npm install chatgpt.js @chatgpt.js/react
```

`@chatgpt.js/react` is optional but you will probably need it since it is required unless you want to add widgets manually.

## Usage

You can use `chatgpt.js` in many ways, but here is the recommended way to use it:

**Project Structure:**

```
my-chatgpt-app/
└── src/
    ├── index.ts
    └── widgets/
        └── my-widget/
            ├── data.ts
            ├── index.tsx
            └── index.css (optional)
```

`src/index.ts`
```ts
import { App } from 'chatgpt.js';

// Create the app instance, it's as simple as that!
const app = new App({
    mcp: {
        serverInfo: {
            name: 'my-mcp',
            version: '1.0.0'
        }
    },
    widgetsDir: 'src/widgets'
});

// Register a tool, this one is also super simple!
app.registerTool(tool => tool
    .setName('my_tool')
    .setDescription('This is my first tool!')
    .setInvoking('This is the invoking message.')
    .setInvoked('This is the invoked message.')
    .setOutputWidget('my-widget')
    .setAnnotation('readOnlyHint', true)
    .setCallback(input => {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Hello from my tool!'
                }
            ]
        }
    })
);

// Finally, register widgets and start the server
app.registerWidgets().then(() => app.listen());
```

- `widgetsDir` is the directory where your widgets (components) are located. Even if you compile your code to a different directory, you don't need to change this path since `chatgpt.js` automatically handles both TypeScript and JavaScript files. This is recommended to work with CSS files in TypeScript projects.
- When registering a tool, if you use `setOutputWidget`, make sure the widget name matches the name you set in the widget's data file.
- Currently, the `setCallback` function works the same as how MCP SDK handles it. Read more about it in the [MCP documentation](https://github.com/modelcontextprotocol/typescript-sdk).

> [!IMPORTANT]
> Each widget folder must have the following files:
> - `data.ts` (or `data.js`): This file is where you define your widget's data using the `Widget` class from `chatgpt.js`.
> - `index.tsx` (or `index.jsx`): This file is where you define your widget's component using React.
> 
> If you would like to use a CSS file for your widget, it must be named `index.css`. `chatgpt.js` will automatically handle it for you. (CSS used in the widget's component file will only apply to the component, not the whole widget)

`src/widgets/my-widget/data.ts`
```ts
import { Widget } from 'chatgpt.js';

// This is where you define your widget's data
export default new Widget()
    .setName('my-widget')
    .setDescription('This is my first widget!')
    .enableBorder();
```

> [!IMPORTANT]
> In the widget's component file, `chatgpt.js` automatically imports React for you, so it is not recommended to import React again.

`src/widgets/my-widget/index.tsx`
```tsx
// We will use some hooks from @chatgpt.js/react
import { requestDisplayMode, useDisplayMode, useLocale, useMaxHeight, useSafeArea, useTheme, useUserAgent, useWidgetState } from '@chatgpt.js/react';

function Widget() {
    const [widgetState, setWidgetState] = useWidgetState();

    const theme = useTheme();
    const userAgent = useUserAgent();
    const locale = useLocale();
    const maxHeight = useMaxHeight();
    const displayMode = useDisplayMode();
    const safeArea = useSafeArea();

    return (
        <div
            style={{
                maxHeight: maxHeight ?? 500
            }}
        >
            <h1>My First Widget</h1>
            <div>
                <button onClick={() => setWidgetState({ thisIsA: 'test' })}>Set Widget State</button>
                <button onClick={() => requestDisplayMode('inline')}>Inline{displayMode === 'inline' ? ' (Current)' : ''}</button>
                <button onClick={() => requestDisplayMode('pip')}>Picture-in-Picture{displayMode === 'pip' ? ' (Current)' : ''}</button>
                <button onClick={() => requestDisplayMode('fullscreen')}>Fullscreen{displayMode === 'fullscreen' ? ' (Current)' : ''}</button>
            </div>
            <div>
                <p>Widget State: {JSON.stringify(widgetState ?? {})}</p>
                <p>Theme: {theme}</p>
                <p>User Agent: {JSON.stringify(userAgent)}</p>
                <p>Locale: {locale}</p>
                <p>Max Height: {maxHeight}</p>
                <p>Display Mode: {displayMode}</p>
                <p>Safe Area: {JSON.stringify(safeArea)}</p>
            </div>
        </div>
    );
};
```

It is not required, but to keep things fancy for your first widget, we'll add some CSS!

`src/widgets/my-widget/index.css`
```css
body {
    background-color: #1a1a1a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    margin: 0;
    padding: 20px;
}

h1 {
    color: #ffffff;
    margin-top: 0;
}

button {
    background-color: #2d2d2d;
    color: #e0e0e0;
    border: 1px solid #444;
    padding: 8px 16px;
    margin: 4px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

button:hover {
    background-color: #3d3d3d;
}

button:active {
    background-color: #4d4d4d;
}

div {
    margin-bottom: 16px;
}

p {
    margin: 8px 0;
    line-height: 1.5;
}
```

And we're done! Now you can run your app and start using it in ChatGPT.

## Advanced Usage

### Customizing the App

You can customize various options of the `App` by passing options to the constructor. Here are some of the available options:

- `mcpPath`: The path where the MCP server will be available. Defaults to `/mcp`.
- `port`: The port where the server will listen on. Defaults to `8000`.
- `widgetsDir`: The directory where your widgets are located. Defaults to `{process.cwd()}/widgets`.
- `debug`: Enables debug mode. Defaults to `false`.
  - Currently, debug mode only creates a `index.debug.html` for your each widget after they are bundled, in the same directory as the widget.

### Custom MCP

The `mcp` option in the `App` constructor acts the same way as how you would configure your MCP server with the [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk). You can either pass an `McpServer` class or simply configure it using the `serverInfo` and `serverOptions` options.

1. Using `McpServer` class:
```ts
import { App } from 'chatgpt.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const mcp = new McpServer(
    {
        name: 'my-mcp',
        version: '1.0.0'
    },
    {
        debouncedNotificationMethods: [
            'notifications/tools/list_changed'
        ]
    }
);

const app = new App({ mcp });
```

2. Using `serverInfo` and `serverOptions`:
```ts
import { App } from 'chatgpt.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const app = new App({
    mcp: {
        serverInfo: {
            name: 'my-mcp',
            version: '1.0.0'
        },
        serverOptions: {
            debouncedNotificationMethods: [
                'notifications/tools/list_changed'
            ]
        }
    }
});
```

### Custom Server

`chatgpt.js` uses Express.js to create the server. If you want to customize the server, you can simply pass your own `Express` instance to the `App` constructor.

> [!WARNING]
> If your custom server already has an endpoint for the path that's configured as `mcpPath` (defaults to `/mcp`), `chatgpt.js` will skip creating the MCP endpoint. If the endpoint is missing, it will be created automatically with the needed handlers.

```ts
import { App } from 'chatgpt.js';
import express from 'express';

const customServer = express();

customServer.get('/custom-endpoint', (req, res) => {
    // Your custom logic here
});

const app = new App({
    mcp: {
        serverInfo: {
            name: 'my-mcp',
            version: '1.0.0'
        }
    },
    server: customServer
});
```

### Registering Widgets Manually

When you use the `registerWidgets` method, `chatgpt.js` automatically scans the `widgetsDir` for widgets, bundles them, and registers them for you. This process requires `@chatgpt.js/react` to be installed as currently you can only register widgets that are built with React.

However, if you want to add widgets manually (for example, if you are not using React), you can do so by using the `registerWidget` method. This method works the same as the `registerTool` method and the usage is the same as defining the widget's data using the `Widget` class. The only difference is that you need to pass your own HTML using the `setHtml` method.

Recommended HTML structure for widgets:
```html
<div id="my-manual-widget-root"></div>
<style>{ Your CSS }</style>
<script type="module">${Your Script}</script>
```

```ts
import { App } from 'chatgpt.js';

const app = new App({
    mcp: {
        serverInfo: {
            name: 'my-mcp',
            version: '1.0.0'
        }
    }
});

app.registerWidget(widget => widget
    .setName('my-manual-widget')
    .setDescription('This is my manually registered widget!')
    .enableBorder()
    .setHtml(/* Your HTML */)
);

app.listen();
```
