import { parseMarkdownBlocks } from "@/app/components/markdownContent";
import type { BlogPost } from "@/app/lib/blog";

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function inlineMarkdown(text: string) {
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_)/g;
  let html = "";
  let position = 0;
  for (const match of text.matchAll(pattern)) {
    html += escapeEmailHtml(text.slice(position, match.index));
    if (match[2] && match[3]) {
      html += `<a href="${escapeEmailHtml(match[3])}" target="_blank" rel="noopener noreferrer" style="color:#94505d">${escapeEmailHtml(match[2])}</a>`;
    } else if (match[4]) {
      html += `<strong><em>${escapeEmailHtml(match[4])}</em></strong>`;
    } else if (match[5] || match[7]) {
      html += `<strong style="color:#94505d">${escapeEmailHtml(match[5] ?? match[7])}</strong>`;
    } else {
      html += `<em>${escapeEmailHtml(match[6] ?? match[8])}</em>`;
    }
    position = match.index + match[0].length;
  }
  return html + escapeEmailHtml(text.slice(position));
}

function markdownEmail(content: string) {
  return parseMarkdownBlocks(content).map((block) => {
    if (block.type === "heading") {
      const level = block.level + 1;
      return `<h${level} style="color:#94505d;line-height:1.35;margin:30px 0 14px">${inlineMarkdown(block.text)}</h${level}>`;
    }
    if (block.type === "unordered-list" || block.type === "ordered-list") {
      const tag = block.type === "unordered-list" ? "ul" : "ol";
      return `<${tag} style="padding-left:24px">${block.items.map((item) => `<li style="margin-bottom:8px">${inlineMarkdown(item)}</li>`).join("")}</${tag}>`;
    }
    if (block.type === "paragraph" || block.type === "quote") {
      const text = inlineMarkdown(block.text).replace(/\n/g, "<br>");
      return block.type === "quote"
        ? `<blockquote style="border-left:3px solid #b76e79;padding:14px 20px;margin:24px 0;background:#fbf7f7">${text}</blockquote>`
        : `<p style="margin:0 0 20px">${text}</p>`;
    }
    return "";
  }).join("");
}

function shell(title: string, body: string, footer: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeEmailHtml(title)}</title></head><body style="margin:0;background:#f8f5f5;color:#333;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:28px 12px"><table role="presentation" align="center" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #eadbdd;border-radius:12px"><tr><td style="padding:32px 28px;border-bottom:1px solid #eadbdd"><p style="margin:0;color:#94505d;font-size:25px;font-weight:700">Au mot juste</p><p style="margin:9px 0 0;font-size:12px;letter-spacing:2px;color:#777">LE CARNET DE LORENA</p></td></tr><tr><td style="padding:32px 28px;font-size:17px;line-height:1.8;overflow-wrap:anywhere">${body}</td></tr><tr><td style="padding:24px 28px;background:#fbf7f7;font-size:13px;line-height:1.7;color:#666">${footer}</td></tr></table></td></tr></table></body></html>`;
}

export function renderConfirmationEmail(actionUrl: string) {
  const subject = "Confirmez votre inscription";
  const introduction = "Confirmez votre inscription pour recevoir les nouveaux articles directement dans votre boîte mail, à chaque publication.";
  const html = shell(subject, `<p style="margin:0 0 24px">${introduction}</p><a href="${escapeEmailHtml(actionUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#94505d;border-radius:6px;color:#fff;padding:12px 22px;text-decoration:none;font-weight:700">Confirmer mon inscription</a>`, "Lien valable 24 heures.");
  return { subject, html, text: `${introduction}\n\nConfirmer mon inscription : ${actionUrl}\n\nLien valable 24 heures.` };
}

export function renderArticleEmail(article: Pick<BlogPost, "title" | "content" | "cover_image_url" | "cover_image_source">, origin: string, unsubscribeUrl: string) {
  let image = "";
  try {
    const url = new URL(article.cover_image_url || "", origin);
    if (article.cover_image_url && ["http:", "https:"].includes(url.protocol)) {
      image = `<img src="${escapeEmailHtml(url.toString())}" alt="" width="584" style="display:block;width:100%;height:auto;border-radius:6px;margin:0 0 26px">`;
      if (article.cover_image_source) image += `<p style="font-size:11px;color:#777;margin:-18px 0 24px">${escapeEmailHtml(article.cover_image_source)}</p>`;
    }
  } catch { /* An optional image must not prevent reading the article. */ }
  const subject = article.title;
  const html = shell(subject, `${image}<h1 style="font-size:30px;line-height:1.25;margin:0 0 24px;color:#222">${escapeEmailHtml(article.title)}</h1>${markdownEmail(article.content)}<p style="margin:32px 0 0">À bientôt,<br><strong>Lorena</strong></p>`, `Vous recevez cet article parce que vous êtes inscrit·e au carnet d’Au mot juste.<br><a href="${escapeEmailHtml(unsubscribeUrl)}" target="_blank" rel="noopener noreferrer" style="color:#94505d">Me désinscrire</a>`);
  return { subject, html, text: `${article.title}\n\n${article.content}\n\nÀ bientôt,\nLorena\n\nMe désinscrire : ${unsubscribeUrl}` };
}
