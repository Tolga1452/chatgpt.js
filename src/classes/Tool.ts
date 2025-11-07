import { ZodRawShape } from 'zod';
import { KnownToolAnnotationKey, OpenAiMcpTool, ToolData } from '../types/chatgptjs.js';
import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

export class Tool<InputSchema extends ZodRawShape = ZodRawShape, OutputSchema extends ZodRawShape = ZodRawShape> {
    public readonly data: Partial<ToolData<InputSchema, OutputSchema>>;

    public constructor(data?: Partial<ToolData<InputSchema, OutputSchema>>) {
        if (data) {
            if (typeof data !== 'object' || data === null) throw new TypeError('data must be an object');
            if ('name' in data && (typeof data.name !== 'string' || data.name.trim().length === 0)) throw new TypeError('data.name must be a non-empty string');
            if ('description' in data && (typeof data.description !== 'string' || data.description.trim().length === 0)) throw new TypeError('data.description must be a non-empty string');
            if ('inputSchema' in data && typeof data.inputSchema !== 'object') throw new TypeError('data.inputSchema must be an object');
            if ('outputSchema' in data && typeof data.outputSchema !== 'object') throw new TypeError('data.outputSchema must be an object');
            if ('outputWidget' in data && (typeof data.outputWidget !== 'string' || data.outputWidget.trim().length === 0)) throw new TypeError('data.outputWidget must be a non-empty string');
            if ('widgetAccessible' in data && typeof data.widgetAccessible !== 'boolean') throw new TypeError('data.widgetAccessible must be a boolean');
            if ('callback' in data && typeof data.callback !== 'function') throw new TypeError('data.callback must be a function');

            this.data = data;
        } else this.data = {};
    };

    public setName(name: string): this {
        if (typeof name !== 'string' || name.trim().length === 0) throw new TypeError('name must be a non-empty string');

        this.data.name = name;

        return this;
    };

    public setDescription(description: string): this {
        if (typeof description !== 'string' || description.trim().length === 0) throw new TypeError('description must be a non-empty string');

        this.data.description = description;

        return this;
    };

    public setInvoking(message: string): this {
        if (typeof message !== 'string' || message.trim().length === 0) throw new TypeError('message must be a non-empty string');
        if (message.length > 64) throw new RangeError('message must be at most 64 characters long');

        if (!this.data.invocation) this.data.invocation = {};

        this.data.invocation.invoking = message;

        return this;
    };

    public setInvoked(message: string): this {
        if (typeof message !== 'string' || message.trim().length === 0) throw new TypeError('message must be a non-empty string');
        if (message.length > 64) throw new RangeError('message must be at most 64 characters long');

        if (!this.data.invocation) this.data.invocation = {};

        this.data.invocation.invoked = message;

        return this;
    };

    public setInputSchema<NewInputSchema extends ZodRawShape>(inputSchema: NewInputSchema): Tool<NewInputSchema, OutputSchema> {
        if (typeof inputSchema !== 'object' || inputSchema === null) throw new TypeError('inputSchema must be an object');

        return new Tool<NewInputSchema, OutputSchema>({
            ...this.data as unknown as ToolData<NewInputSchema, OutputSchema>,
            inputSchema
        });
    };

    public setOutputSchema<NewOutputSchema extends ZodRawShape>(outputSchema: NewOutputSchema): Tool<InputSchema, NewOutputSchema> {
        if (typeof outputSchema !== 'object' || outputSchema === null) throw new TypeError('outputSchema must be an object');

        return new Tool<InputSchema, NewOutputSchema>({
            ...this.data as unknown as ToolData<InputSchema, NewOutputSchema>,
            outputSchema
        });
    };

    public setOutputWidget(name: string): this {
        if (typeof name !== 'string' || name.trim().length === 0) throw new TypeError('name must be a non-empty string');

        this.data.outputWidget = name;

        return this;
    };

    public setAnnotation<Key extends KnownToolAnnotationKey>(key: Key, value: ToolAnnotations[Key]): this;
    public setAnnotation(key: string, value: unknown): this;
    public setAnnotation(key: string, value: unknown): this {
        if (typeof key !== 'string' || key.trim().length === 0) throw new TypeError('key must be a non-empty string');
        if (this.data.annotations === undefined) this.data.annotations = {};

        this.data.annotations[key] = value;

        return this;
    };

    public widgetAccessible(): this {
        this.data.widgetAccessible = true;

        return this;
    };

    public setCallback(callback: ToolCallback<InputSchema>): this {
        if (typeof callback !== 'function') throw new TypeError('callback must be a function');

        this.data.callback = callback;

        return this;
    };

    public toMcp(): OpenAiMcpTool<InputSchema, OutputSchema> {
        const tool: OpenAiMcpTool<InputSchema, OutputSchema> = {
            _meta: {}
        };

        if ('title' in this.data) tool.title = this.data.title;
        if ('description' in this.data) tool.description = this.data.description;
        if ('inputSchema' in this.data) tool.inputSchema = this.data.inputSchema;
        if ('outputSchema' in this.data) tool.outputSchema = this.data.outputSchema;

        if ('invocation' in this.data && this.data.invocation) {
            if ('invoking' in this.data.invocation) tool._meta!['openai/toolInvocation/invoking'] = this.data.invocation.invoking;
            if ('invoked' in this.data.invocation) tool._meta!['openai/toolInvocation/invoked'] = this.data.invocation.invoked;
        };

        if ('outputWidget' in this.data) tool._meta!['openai/outputTemplate'] = `ui://widget/${this.data.outputWidget}.html`;
        if ('annotations' in this.data) tool.annotations = this.data.annotations;
        if ('widgetAccessible' in this.data) tool._meta!['openai/widgetAccessible'] = this.data.widgetAccessible;

        return tool;
    };
};
