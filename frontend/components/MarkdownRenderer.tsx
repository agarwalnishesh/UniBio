import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Simple Markdown renderer for chat messages.
 * Supports: **bold**, *italic*, `code`, ```code blocks```, lists, and links.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const renderMarkdown = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let keyIndex = 0;

    // Split by code blocks first
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);
    
    let i = 0;
    while (i < parts.length) {
      const part = parts[i];
      
      // Check if this is a code block (language is at i, content at i+1)
      if (i + 2 < parts.length && text.includes('```')) {
        const beforeCode = parts[i];
        if (beforeCode) {
          elements.push(...renderInlineMarkdown(beforeCode, keyIndex));
          keyIndex++;
        }
        
        const lang = parts[i + 1];
        const code = parts[i + 2];
        
        if (code !== undefined) {
          elements.push(
            <pre key={`code-${keyIndex}`} className="bg-slate-800 text-slate-100 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">
              <code>{code.trim()}</code>
            </pre>
          );
          keyIndex++;
          i += 3;
          continue;
        }
      }
      
      if (part) {
        elements.push(...renderInlineMarkdown(part, keyIndex));
        keyIndex++;
      }
      i++;
    }

    return elements;
  };

  const renderInlineMarkdown = (text: string, baseKey: number): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    
    // Split into lines for block-level processing
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      const lineKey = `${baseKey}-line-${lineIndex}`;
      
      // Check for list items
      if (line.match(/^[\s]*[-*•]\s/)) {
        const listContent = line.replace(/^[\s]*[-*•]\s/, '');
        elements.push(
          <div key={lineKey} className="flex gap-2 ml-2">
            <span className="text-brand-500">•</span>
            <span>{renderInlineText(listContent, lineKey)}</span>
          </div>
        );
      }
      // Check for numbered lists
      else if (line.match(/^[\s]*\d+\.\s/)) {
        const match = line.match(/^[\s]*(\d+)\.\s(.*)$/);
        if (match) {
          elements.push(
            <div key={lineKey} className="flex gap-2 ml-2">
              <span className="text-brand-500 font-medium">{match[1]}.</span>
              <span>{renderInlineText(match[2], lineKey)}</span>
            </div>
          );
        }
      }
      // Check for headers
      else if (line.match(/^#{1,3}\s/)) {
        const match = line.match(/^(#{1,3})\s(.*)$/);
        if (match) {
          const level = match[1].length;
          const headerText = match[2];
          const sizeClass = level === 1 ? 'text-base font-bold' : level === 2 ? 'text-sm font-semibold' : 'text-sm font-medium';
          elements.push(
            <div key={lineKey} className={`${sizeClass} mt-2 mb-1`}>
              {renderInlineText(headerText, lineKey)}
            </div>
          );
        }
      }
      // Regular paragraph
      else if (line.trim()) {
        elements.push(
          <span key={lineKey}>
            {renderInlineText(line, lineKey)}
          </span>
        );
      }
      
      // Add line break if not last line and line has content
      if (lineIndex < lines.length - 1) {
        elements.push(<br key={`${lineKey}-br`} />);
      }
    });

    return elements;
  };

  const renderInlineText = (text: string, baseKey: string | number): React.ReactNode => {
    // Process inline markdown: **bold**, *italic*, `code`, [links](url)
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let partKey = 0;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={`${baseKey}-b-${partKey}`} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        partKey++;
        continue;
      }

      // Italic: *text* (but not **)
      const italicMatch = remaining.match(/^\*([^*]+?)\*/);
      if (italicMatch) {
        parts.push(<em key={`${baseKey}-i-${partKey}`} className="italic">{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        partKey++;
        continue;
      }

      // Inline code: `text`
      const codeMatch = remaining.match(/^`([^`]+?)`/);
      if (codeMatch) {
        parts.push(
          <code key={`${baseKey}-c-${partKey}`} className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        partKey++;
        continue;
      }

      // Links: [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+?)\]\(([^)]+?)\)/);
      if (linkMatch) {
        parts.push(
          <a 
            key={`${baseKey}-a-${partKey}`} 
            href={linkMatch[2]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        partKey++;
        continue;
      }

      // Plain text (take one character at a time until we find a special char)
      const nextSpecial = remaining.search(/[*`\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Special char at start but didn't match patterns, treat as regular text
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
      partKey++;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  return (
    <div className={`markdown-content ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
