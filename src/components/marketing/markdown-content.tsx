import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content.trim()) return null;

  return (
    <div className={className ?? "prose-marketing"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="mt-10 text-2xl font-semibold tracking-[-0.02em] text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 text-xl font-semibold text-foreground">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mt-4 text-base leading-relaxed text-muted">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-bni underline-offset-2 hover:underline"
              rel={href?.startsWith("http") ? "noreferrer" : undefined}
              target={href?.startsWith("http") ? "_blank" : undefined}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
