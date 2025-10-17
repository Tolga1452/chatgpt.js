import { WidgetData, OpenAiMcpWidget } from '../types/chatgptjs.js';

export class Widget {
    public readonly data: Partial<WidgetData>;

    public constructor(data?: Partial<WidgetData>) {
        if (data) {
            if (typeof data !== 'object' || data === null) throw new TypeError('data must be an object');
            if ('name' in data && (typeof data.name !== 'string' || data.name.trim().length === 0)) throw new TypeError('data.name must be a non-empty string');
            if ('description' in data && (typeof data.description !== 'string' || data.description.trim().length === 0)) throw new TypeError('data.description must be a non-empty string');
            if ('html' in data && (typeof data.html !== 'string' || data.html.trim().length === 0)) throw new TypeError('data.html must be a non-empty string');
            if ('enableBorder' in data && typeof data.enableBorder !== 'boolean') throw new TypeError('data.enableBorder must be a boolean');

            if ('csp' in data) {
                if (typeof data.csp !== 'object' || data.csp === null) throw new TypeError('data.csp must be an object');
                if ('connectDomains' in data.csp && !Array.isArray(data.csp.connectDomains)) throw new TypeError('data.csp.connectDomains must be an array of non-empty strings');
                if ('connectDomains' in data.csp && Array.isArray(data.csp.connectDomains) && !data.csp.connectDomains.every(domain => typeof domain === 'string' && domain.trim().length > 0)) throw new TypeError('data.csp.connectDomains must be an array of non-empty strings');
                if ('resourceDomains' in data.csp && !Array.isArray(data.csp.resourceDomains)) throw new TypeError('data.csp.resourceDomains must be an array of non-empty strings');
                if ('resourceDomains' in data.csp && Array.isArray(data.csp.resourceDomains) && !data.csp.resourceDomains.every(domain => typeof domain === 'string' && domain.trim().length > 0)) throw new TypeError('data.csp.resourceDomains must be an array of non-empty strings');
            };

            if ('domain' in data && (typeof data.domain !== 'string' || data.domain.trim().length === 0)) throw new TypeError('data.domain must be a non-empty string');

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

    public setHtml(html: string): this {
        if (typeof html !== 'string' || html.trim().length === 0) throw new TypeError('html must be a non-empty string');

        this.data.html = html;

        return this;
    };

    public enableBorder(): this {
        this.data.enableBorder = true;

        return this;
    };

    public addConnectDomains(...domains: string[]): this {
        if (!Array.isArray(domains)) throw new TypeError('domains must be an array of non-empty strings');
        if (!domains.every(domain => typeof domain === 'string' && domain.trim().length > 0)) throw new TypeError('domains must be an array of non-empty strings');

        if (!this.data.csp) this.data.csp = {};
        if (!this.data.csp.connectDomains) this.data.csp.connectDomains = [];

        this.data.csp.connectDomains.push(...domains.filter(domain => !this.data.csp!.connectDomains!.includes(domain)));

        return this;
    };

    public addResourceDomains(...domains: string[]): this {
        if (!Array.isArray(domains)) throw new TypeError('domains must be an array of non-empty strings');
        if (!domains.every(domain => typeof domain === 'string' && domain.trim().length > 0)) throw new TypeError('domains must be an array of non-empty strings');

        if (!this.data.csp) this.data.csp = {};
        if (!this.data.csp.resourceDomains) this.data.csp.resourceDomains = [];

        this.data.csp.resourceDomains.push(...domains.filter(domain => !this.data.csp!.resourceDomains!.includes(domain)));

        return this;
    };

    public setDomain(domain: string): this {
        if (typeof domain !== 'string' || domain.trim().length === 0) throw new TypeError('domain must be a non-empty string');

        this.data.domain = domain;

        return this;
    };

    public toMcp(): Partial<OpenAiMcpWidget> {
        const widget: Partial<OpenAiMcpWidget> = {
            mimeType: 'text/html+skybridge',
            _meta: {}
        };

        if ('name' in this.data) widget.uri = `ui://widget/${this.data.name}.html`;
        if ('description' in this.data) widget._meta!['openai/widgetDescription'] = this.data.description;
        if ('html' in this.data) widget.text = this.data.html;
        if ('enableBorder' in this.data) widget._meta!['openai/widgetPrefersBorder'] = this.data.enableBorder;
        if ('csp' in this.data && this.data.csp) {
            widget._meta!['openai/widgetCSP'] = {};

            if ('connectDomains' in this.data.csp) widget._meta!['openai/widgetCSP']!.connect_domains = this.data.csp.connectDomains;
            if ('resourceDomains' in this.data.csp) widget._meta!['openai/widgetCSP']!.resource_domains = this.data.csp.resourceDomains;
        };
        if ('domain' in this.data) widget._meta!['openai/widgetDomain'] = this.data.domain;

        return widget;
    };
};
