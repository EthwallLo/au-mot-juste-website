import type { ReactNode } from "react";

function renderInlineMarkdown(text: string, keyPrefix: string) {
  const parts: ReactNode[] = [];
  const pattern =
    /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const key = `${keyPrefix}-${match.index}`;

    if (match[2] && match[3]) {
      parts.push(
        <a
          key={key}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#B76E79] underline-offset-4 hover:underline"
        >
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      parts.push(
        <strong key={key} className="font-semibold text-[#B76E79]">
          <em>{match[4]}</em>
        </strong>,
      );
    } else if (match[5] || match[7]) {
      parts.push(
        <strong key={key} className="font-semibold text-[#B76E79]">
          {match[5] ?? match[7]}
        </strong>,
      );
    } else if (match[6] || match[8]) {
      parts.push(
        <em key={key} className="italic">
          {match[6] ?? match[8]}
        </em>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

type MarkdownBlock =
  | {
      level: number;
      text: string;
      type: "heading";
    }
  | {
      text: string;
      type: "paragraph" | "quote";
    }
  | {
      items: string[];
      type: "ordered-list" | "unordered-list";
    };

function getBlockKey(block: MarkdownBlock, index: number) {
  if ("text" in block) {
    return `${index}-${block.type}-${block.text.slice(0, 16)}`;
  }

  return `${index}-${block.type}-${block.items[0]?.slice(0, 16) ?? ""}`;
}

function parseMarkdownBlocks(content: string) {
  const blocks: MarkdownBlock[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let paragraphLines: string[] = [];
  let quoteLines: string[] = [];
  let listItems: string[] = [];
  let listType: "ordered-list" | "unordered-list" | null = null;

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      text: paragraphLines.join("\n").trim(),
      type: "paragraph",
    });
    paragraphLines = [];
  }

  function flushQuote() {
    if (quoteLines.length === 0) {
      return;
    }

    blocks.push({
      text: quoteLines.join("\n").trim(),
      type: "quote",
    });
    quoteLines = [];
  }

  function flushList() {
    if (!listType || listItems.length === 0) {
      return;
    }

    blocks.push({
      items: listItems,
      type: listType,
    });
    listItems = [];
    listType = null;
  }

  function flushAll() {
    flushParagraph();
    flushQuote();
    flushList();
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushAll();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);

    if (heading) {
      flushAll();
      blocks.push({
        level: heading[1].length,
        text: heading[2],
        type: "heading",
      });
      continue;
    }

    const unorderedItem = line.match(/^[-*]\s+(.+)$/);

    if (unorderedItem) {
      flushParagraph();
      flushQuote();

      if (listType && listType !== "unordered-list") {
        flushList();
      }

      listType = "unordered-list";
      listItems.push(unorderedItem[1]);
      continue;
    }

    const orderedItem = line.match(/^\d+\.\s+(.+)$/);

    if (orderedItem) {
      flushParagraph();
      flushQuote();

      if (listType && listType !== "ordered-list") {
        flushList();
      }

      listType = "ordered-list";
      listItems.push(orderedItem[1]);
      continue;
    }

    const quote = line.match(/^>\s?(.+)$/);

    if (quote) {
      flushParagraph();
      flushList();
      quoteLines.push(quote[1]);
      continue;
    }

    flushQuote();
    flushList();
    paragraphLines.push(rawLine.trimEnd());
  }

  flushAll();
  return blocks;
}

export default function MarkdownContent({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-7 text-lg leading-9 text-gray-800">
      {blocks.map((block, index) => {
        const key = getBlockKey(block, index);

        if (block.type === "heading") {
          if (block.level === 1) {
            return (
              <h2 key={key} className="pt-4 text-3xl font-bold text-[#B76E79]">
                {renderInlineMarkdown(block.text, key)}
              </h2>
            );
          }

          if (block.level === 2) {
            return (
              <h3 key={key} className="pt-3 text-2xl font-bold text-[#B76E79]">
                {renderInlineMarkdown(block.text, key)}
              </h3>
            );
          }

          return (
            <h4 key={key} className="pt-2 text-xl font-semibold text-[#B76E79]">
              {renderInlineMarkdown(block.text, key)}
            </h4>
          );
        }

        if (block.type === "unordered-list" || block.type === "ordered-list") {
          const ListTag = block.type === "unordered-list" ? "ul" : "ol";

          return (
            <ListTag
              key={key}
              className={`space-y-2 pl-6 ${
                block.type === "unordered-list" ? "list-disc" : "list-decimal"
              }`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>
                  {renderInlineMarkdown(item, `${key}-${itemIndex}`)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={key}
              className="border-l-4 border-[#B76E79] bg-[#fbf7f7] px-5 py-4 text-base leading-8 text-gray-700"
            >
              {renderInlineMarkdown(block.text, key)}
            </blockquote>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={key} className="whitespace-pre-line">
              {renderInlineMarkdown(block.text, key)}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
