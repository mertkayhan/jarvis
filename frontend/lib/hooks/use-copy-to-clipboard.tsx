'use client'

import * as React from 'react';
import { marked } from 'marked';

export interface useCopyToClipboardProps {
    timeout?: number
}

export function useCopyToClipboard({
    timeout = 2000,
}: useCopyToClipboardProps) {
    const [isCopied, setIsCopied] = React.useState<Boolean>(false);
    const markdownToTabDelimited = (markdown: string) => {
        let renderer = new marked.Renderer();

        // Custom rendering for tables
        renderer.table = (tbl) => {
            const header = tbl.header.map((col) => col.text.trim()).join("\t");
            const rows = tbl.rows.map((row) => { return row.map((col) => col.text.trim()).join("\t") }).join("\n");
            const headerInline = marked.parseInline(header);
            const rowsInline = marked.parseInline(rows);
            return `\n${headerInline}\n${rowsInline}`;
        };

        // Use default rendering for other elements
        renderer.heading = ({ text }) => {
            return `\n${text}\n`;
        };

        renderer.code = (code) => {
            return `\n${code.text}\n`;
        };

        renderer.paragraph = (text) => {
            return `\n${text.text}\n`;
        };

        renderer.list = (body) => {
            const items = body.items.map((item) => item.text).join("\n");
            const inline = marked.parseInline(items) as string;
            return inline;
        };

        renderer.listitem = (text) => {
            return `- ${text.text}\n`;
        };

        // Convert Markdown to custom formatted text
        marked.use({
            gfm: true,
            renderer: renderer
        });
        const formattedText = marked.parse(markdown);

        return formattedText;
    };

    const copyToClipboard = async (value: string) => {
        if (typeof window === 'undefined' || !navigator.clipboard?.writeText) {
            return
        }

        if (!value) {
            return
        }

        let val = value;
        try {
            val = await markdownToTabDelimited(value);
        } catch (error) {
            console.error(error);
        } finally {
            navigator.clipboard.writeText(val).then(() => {
                setIsCopied(true)

                setTimeout(() => {
                    setIsCopied(false)
                }, timeout)
            });
        }
    }

    return { isCopied, copyToClipboard }
}
