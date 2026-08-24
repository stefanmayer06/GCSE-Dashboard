function inlineMarkdown(text) {
  const tokens = String(text).split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g);
  return tokens.map((token, index) => {
    if (!token) return null;
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) {
      return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    }
    if (token.startsWith('`') && token.endsWith('`')) return <code key={index}>{token.slice(1, -1)}</code>;
    if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      return <em key={index}>{token.slice(1, -1)}</em>;
    }
    return <span key={index}>{token}</span>;
  });
}

function renderBlocks(content) {
  const lines = String(content ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (fence) {
      const code = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(<pre key={blocks.length}><code className={fence[1] ? `language-${fence[1]}` : undefined}>{code.join('\n')}</code></pre>);
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const Tag = `h${heading[1].length}`;
      blocks.push(<Tag key={blocks.length}>{inlineMarkdown(heading[2])}</Tag>);
      index += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      blocks.push(<blockquote key={blocks.length}>{inlineMarkdown(quote.join(' '))}</blockquote>);
      continue;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    if (unordered) {
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*[-*+]\s+(.+)$/);
        if (!item) break;
        items.push(<li key={items.length}>{inlineMarkdown(item[1])}</li>);
        index += 1;
      }
      blocks.push(<ul key={blocks.length}>{items}</ul>);
      continue;
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (ordered) {
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*\d+[.)]\s+(.+)$/);
        if (!item) break;
        items.push(<li key={items.length}>{inlineMarkdown(item[1])}</li>);
        index += 1;
      }
      blocks.push(<ol key={blocks.length}>{items}</ol>);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^\s*(#{1,6})\s+|^\s*```|^\s*>\s?|^\s*[-*+]\s+|^\s*\d+[.)]\s+/.test(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={blocks.length}>{inlineMarkdown(paragraph.join(' '))}</p>);
  }

  return blocks;
}

export default function MarkdownMessage({ content }) {
  return <div className="markdown-message">{renderBlocks(content)}</div>;
}
