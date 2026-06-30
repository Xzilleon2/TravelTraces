import DOMPurify from "dompurify";

type AttributeHookData = {
  attrName: string;
  attrValue: string;
  keepAttr: boolean;
};

const allowedTextAlign = /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/i;

DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
  const attribute = data as unknown as AttributeHookData;
  if (attribute.attrName !== "style") return;

  const match = attribute.attrValue.match(allowedTextAlign);
  if (!match) {
    attribute.keepAttr = false;
    return;
  }
  attribute.attrValue = `text-align: ${match[1].toLowerCase()};`;
});

export function sanitizeRichHtml(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ["a", "b", "blockquote", "br", "div", "em", "i", "li", "ol", "p", "span", "strong", "u", "ul"],
    ALLOWED_ATTR: ["href", "rel", "target", "title", "class", "style"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });
}
