import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Use this for any user-generated or database-stored HTML before rendering with dangerouslySetInnerHTML.
 */
export const sanitizeHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Text formatting
      'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's', 'del', 'ins', 'sub', 'sup', 'mark',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Lists
      'ul', 'ol', 'li',
      // Links and media
      'a', 'img',
      // Block elements
      'blockquote', 'pre', 'code', 'hr', 'div', 'span',
      // Tables
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      // Other
      'figure', 'figcaption', 'iframe'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'target', 'rel', 'width', 'height',
      'style', 'colspan', 'rowspan', 'scope',
      'frameborder', 'allowfullscreen', 'allow'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    // Allow YouTube and Vimeo embeds
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  });
};
