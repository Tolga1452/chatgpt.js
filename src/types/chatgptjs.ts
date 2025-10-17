import { ServerOptions } from '@modelcontextprotocol/sdk/server';
import { McpServer, ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Implementation, ToolAnnotations, ToolAnnotationsSchema } from '@modelcontextprotocol/sdk/types.js';
import { Express } from 'express';
import { z, ZodRawShape } from 'zod';

type KnownKeys<T> = {
    [P in keyof T as string extends P
    ? never
    : number extends P
    ? never
    : symbol extends P
    ? never
    : P]: T[P];
};

export type KnownToolAnnotationKey = keyof KnownKeys<z.infer<typeof ToolAnnotationsSchema>>;

export interface BaseAppOptions {
    mcpPath?: string;
    server?: Express;
    port?: number;
    widgetsDir?: string;
    debug?: boolean;
};

export interface AppMcpOptions {
    serverInfo: Implementation;
    serverOptions?: ServerOptions;
};

export interface AppOptionsWithMcp extends BaseAppOptions {
    mcp: McpServer;
};

export interface AppOptionsWithoutMcp extends BaseAppOptions {
    mcp: AppMcpOptions;
};

export type AppOptions = AppOptionsWithMcp | AppOptionsWithoutMcp;

export interface ToolInvocation {
    invoking?: string;
    invoked?: string;
};

export interface ToolData<InputSchema extends ZodRawShape = ZodRawShape, OutputSchema extends ZodRawShape = ZodRawShape> {
    name: string;
    title?: string;
    description?: string;
    invocation?: ToolInvocation;
    inputSchema?: InputSchema;
    outputSchema?: OutputSchema;
    outputWidget?: string;
    annotations?: ToolAnnotations;
    widgetAccessible?: boolean;
    callback: ToolCallback<InputSchema>;
};

export interface WidgetCsp {
    connectDomains?: string[];
    resourceDomains?: string[];
};

export interface WidgetData {
    name: string;
    description?: string;
    html: string;
    enableBorder?: boolean;
    csp?: WidgetCsp;
    domain?: string;
};

export type WidgetUri = `ui://widget/${string}.html`;

export interface OpenAiMcpToolMeta extends Record<string, unknown> {
    'openai/toolInvocation/invoking'?: string;
    'openai/toolInvocation/invoked'?: string;
    'openai/outputTemplate'?: WidgetUri;
    'openai/widgetAccessible'?: boolean;
};

export interface OpenAiMcpTool {
    title?: string;
    description?: string;
    _meta?: OpenAiMcpToolMeta;
    annotations?: ToolAnnotations;
};

export interface OpenAiMcpWidgetCsp {
    connect_domains?: string[];
    resource_domains?: string[];
};

export interface OpenAiMcpWidgetMeta extends Record<string, unknown> {
    'openai/widgetDescription'?: string;
    'openai/widgetPrefersBorder'?: boolean;
    'openai/widgetCSP'?: OpenAiMcpWidgetCsp;
    'openai/widgetDomain'?: string;
};

export interface OpenAiMcpWidget extends Record<string, unknown> {
    uri: WidgetUri;
    mimeType: 'text/html+skybridge';
    text: string;
    blob: string;
    _meta?: OpenAiMcpWidgetMeta;
};
