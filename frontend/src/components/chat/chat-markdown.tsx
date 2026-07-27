"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMarkdownProps = {
  content: string;
};

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="chat-markdown text-[15px] leading-relaxed text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="text-foreground/85">{children}</li>,
          strong: ({ children }) => (
            <span className="font-semibold text-foreground">{children}</span>
          ),
          h1: ({ children }) => (
            <h3 className="mb-2 mt-1 text-base font-semibold text-foreground">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-2 mt-1 text-base font-semibold text-foreground">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-2 mt-1 text-sm font-semibold text-foreground">{children}</h4>
          ),
          code: ({ className, children }) => {
            const inline = !className;
            if (inline) {
              return (
                <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-[#f0d08a]">
                  {children}
                </code>
              );
            }
            return (
              <code className="block overflow-x-auto rounded-xl bg-black/40 p-3 font-mono text-[13px] text-violet-100">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="mb-3 last:mb-0">{children}</pre>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[#e2b96f] underline underline-offset-2 hover:text-[#f0d08a]"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
