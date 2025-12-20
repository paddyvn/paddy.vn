import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Extension } from "@tiptap/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePickerDialog } from "./ImagePickerDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  List,
  ListOrdered,
  Code,
  Undo,
  Redo,
  ChevronDown,
  Baseline,
  ImageIcon,
  Video,
  Table as TableIcon,
  IndentDecrease,
  IndentIncrease,
  RemoveFormatting,
  FolderOpen,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#d946ef",
  "#000000", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb", "#f3f4f6",
];

const IndentExtension = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => Number(element.getAttribute("data-indent") || 0),
            renderHTML: (attributes) => {
              const level = Number(attributes.indent || 0);
              if (!level) return {};
              return {
                "data-indent": String(level),
                style: `margin-left: ${level * 1.5}rem;`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const clamp = (n: number) => Math.max(0, Math.min(8, n));

    const updateIndent = (delta: number) =>
      ({ tr, state, dispatch }: any) => {
        const { from, to } = state.selection;
        state.doc.nodesBetween(from, to, (node: any, pos: number) => {
          if (!node.isTextblock) return;
          if (node.type.name !== "paragraph" && node.type.name !== "heading") return;
          const current = Number(node.attrs.indent || 0);
          const next = clamp(current + delta);
          if (next !== current) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
          }
        });

        if (tr.docChanged) {
          dispatch?.(tr);
          return true;
        }
        return false;
      };

    return {
      indent: () => updateIndent(1),
      outdent: () => updateIndent(-1),
    } as any;
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [hexColor, setHexColor] = useState("#000000");
  const [hexBgColor, setHexBgColor] = useState("#eab308");
  const [imageOpen, setImageOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  // TipTap should NOT be re-created when RHF updates `value` (it breaks toolbar commands).
  // We keep our own mirror + a one-time initial value.
  const initialContentRef = useRef<string>(value || "");
  const lastHtmlRef = useRef<string>(value || "");

  const editor = useEditor(
    {
      editable: true,
      extensions: [
        StarterKit.configure({
          // We add Underline separately; disable any underline coming from StarterKit to avoid duplicate extension names
          underline: false as any,
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
        }),
        IndentExtension,
        Underline.configure({
          HTMLAttributes: {
            class: "underline",
          },
        }),
        Link.extend({
          name: "customLink",
        }).configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline",
          },
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        TextStyle,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
        Image.configure({
          HTMLAttributes: {
            class: "max-w-full h-auto rounded-lg",
          },
        }),
        Youtube.configure({
          HTMLAttributes: {
            class: "w-full aspect-video rounded-lg",
          },
        }),
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: "border-collapse border border-border",
          },
        }),
        TableRow,
        TableHeader.configure({
          HTMLAttributes: {
            class: "border border-border bg-muted font-semibold p-2",
          },
        }),
        TableCell.configure({
          HTMLAttributes: {
            class: "border border-border p-2",
          },
        }),
      ],
      // Only set initial content here (do not bind to `value`, otherwise TipTap re-inits).
      content: initialContentRef.current,
      editorProps: {
        transformPastedHTML: (html) => {
          // Normalize pasted <br> into real paragraphs so formatting applies per-line.
          return html.replace(/<br\s*\/?\s*>/gi, "</p><p>");
        },
        transformPastedText: (text) => {
          // Turn single newlines into paragraph breaks (double newline) on paste.
          return text.replace(/\r\n/g, "\n").replace(/\n/g, "\n\n");
        },
        attributes: {
          class:
            "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none text-sm [&_p]:text-sm [&_li]:text-sm [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_li::marker]:text-muted-foreground",
          "data-placeholder": placeholder || "",
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        lastHtmlRef.current = html;
        onChange(html);
      },
    },
    []
  );

  useEffect(() => {
    if (!editor) return;

    const next = value || "";
    if (next === lastHtmlRef.current) return;

    // Update editor content without firing onUpdate (prevents feedback loops)
    editor.commands.setContent(next, { emitUpdate: false });
    lastHtmlRef.current = next;
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("customLink").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("customLink").setLink({ href: linkUrl }).run();
    }
    setLinkUrl("");
    setLinkOpen(false);
  }, [editor, linkUrl]);

  if (!editor) {
    return null;
  }

  const getCurrentBlockType = () => {
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    if (editor.isActive("heading", { level: 4 })) return "h4";
    if (editor.isActive("heading", { level: 5 })) return "h5";
    if (editor.isActive("heading", { level: 6 })) return "h6";
    return "paragraph";
  };

  const setBlockType = (type: string) => {
    // Block formatting (heading/paragraph) applies to the whole current block.
    // If the user selected only part of a paragraph, we first split the block
    // at the selection boundaries so the change affects only that part.
    const { from, to, empty } = editor.state.selection;

    const sameParent = editor.state.selection.$from.parent === editor.state.selection.$to.parent;
    const parentIsParagraph = editor.state.selection.$from.parent.type.name === "paragraph";

    if (!empty && sameParent && parentIsParagraph) {
      const start = editor.state.selection.$from.start();
      const end = editor.state.selection.$to.end();

      // Split at end first, then at start. Guard against splitting at boundaries.
      if (to > start && to < end) {
        editor.chain().focus().setTextSelection(to).splitBlock().run();
      }
      if (from > start && from < end) {
        editor.chain().focus().setTextSelection(from).splitBlock().run();
      }
    }

    if (type === "paragraph") {
      editor.chain().focus().setTextSelection(from).setParagraph().run();
      return;
    }

    const level = parseInt(type.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6;
    editor.chain().focus().setTextSelection(from).setHeading({ level }).run();
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background flex flex-col max-h-[400px]">
      {/* Toolbar - Sticky */}
      <div className="flex items-center gap-0.5 p-2 border-b bg-muted/30 overflow-x-auto flex-shrink-0 sticky top-0 z-10">
        {/* Block Type Select */}
        <Select value={getCurrentBlockType()} onValueChange={setBlockType}>
          <SelectTrigger className="h-8 w-[120px] text-xs border-0 bg-transparent hover:bg-muted">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
            <SelectItem value="h4">Heading 4</SelectItem>
            <SelectItem value="h5">Heading 5</SelectItem>
            <SelectItem value="h6">Heading 6</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("bold") && "bg-muted")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" strokeWidth={3} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("italic") && "bg-muted")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("underline") && "bg-muted")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        {/* Text Color */}
        <Popover open={colorOpen} onOpenChange={setColorOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-1.5 gap-0.5"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-sm font-semibold leading-none">A</span>
                <div 
                  className="h-0.5 w-4 rounded-full" 
                  style={{ backgroundColor: editor.getAttributes("textStyle").color || "#000000" }}
                />
              </div>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-3">
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="background">Background</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="space-y-3">
                {/* Hex Input */}
                <div className="flex items-center gap-2">
                  <div 
                    className="h-8 w-8 rounded border"
                    style={{ backgroundColor: hexColor }}
                  />
                  <Input
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                    onBlur={() => {
                      if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
                        editor.chain().focus().setColor(hexColor).run();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && /^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
                        editor.chain().focus().setColor(hexColor).run();
                        setColorOpen(false);
                      }
                    }}
                    placeholder="#000000"
                    className="h-8"
                  />
                </div>
                {/* Preset Colors */}
                <div className="grid grid-cols-7 gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-6 w-6 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setHexColor(color);
                        setColorOpen(false);
                      }}
                    />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="background" className="space-y-3">
                {/* Hex Input */}
                <div className="flex items-center gap-2">
                  <div 
                    className="h-8 w-8 rounded border"
                    style={{ backgroundColor: hexBgColor }}
                  />
                  <Input
                    value={hexBgColor}
                    onChange={(e) => setHexBgColor(e.target.value)}
                    onBlur={() => {
                      if (/^#[0-9A-Fa-f]{6}$/.test(hexBgColor)) {
                        editor.chain().focus().toggleHighlight({ color: hexBgColor }).run();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && /^#[0-9A-Fa-f]{6}$/.test(hexBgColor)) {
                        editor.chain().focus().toggleHighlight({ color: hexBgColor }).run();
                        setColorOpen(false);
                      }
                    }}
                    placeholder="#eab308"
                    className="h-8"
                  />
                </div>
                {/* Preset Colors */}
                <div className="grid grid-cols-7 gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-6 w-6 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().toggleHighlight({ color }).run();
                        setHexBgColor(color);
                        setColorOpen(false);
                      }}
                    />
                  ))}
                </div>
                {/* Remove highlight button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setColorOpen(false);
                  }}
                >
                  Remove highlight
                </Button>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive({ textAlign: "left" }) && "bg-muted")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive({ textAlign: "center" }) && "bg-muted")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive({ textAlign: "right" }) && "bg-muted")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link */}
        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", editor.isActive("customLink") && "bg-muted")}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="flex gap-2">
              <Input
                placeholder="Enter URL..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setLink()}
              />
              <Button type="button" size="sm" onClick={setLink}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("bulletList") && "bg-muted")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const { from } = editor.state.selection;
            editor.chain().focus().setTextSelection(from).toggleBulletList().run();
          }}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("orderedList") && "bg-muted")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const { from } = editor.state.selection;
            editor.chain().focus().setTextSelection(from).toggleOrderedList().run();
          }}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {/* Indent/Outdent */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const { from } = editor.state.selection;
            editor.chain().focus().setTextSelection(from).run();

            // If selection is in a list, decrease indent using list command
            if (editor.can().liftListItem("listItem")) {
              editor.chain().focus().setTextSelection(from).liftListItem("listItem").run();
            } else {
              // Otherwise use custom outdent for paragraphs/headings
              const chain = editor.chain().focus().setTextSelection(from) as any;
              if (chain.outdent) chain.outdent().run();
            }
          }}
        >
          <IndentDecrease className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const { from } = editor.state.selection;
            editor.chain().focus().setTextSelection(from).run();

            // If selection is in a list, increase indent using list command
            if (editor.can().sinkListItem("listItem")) {
              editor.chain().focus().setTextSelection(from).sinkListItem("listItem").run();
            } else {
              // Otherwise use custom indent for paragraphs/headings
              const chain = editor.chain().focus().setTextSelection(from) as any;
              if (chain.indent) chain.indent().run();
            }
          }}
        >
          <IndentIncrease className="h-4 w-4" />
        </Button>

        {/* Clear Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const { from } = editor.state.selection;
            editor.chain().focus().setTextSelection(from).clearNodes().unsetAllMarks().run();
          }}
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>

        {/* Image */}
        <Popover open={imageOpen} onOpenChange={setImageOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">Insert Image</p>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setIsUploadingImage(true);
                  try {
                    const { supabase } = await import("@/integrations/supabase/client");
                    const fileExt = file.name.split(".").pop();
                    const fileName = `editor-${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from("product-images")
                      .upload(fileName, file);
                    
                    if (uploadError) throw uploadError;
                    
                    const publicUrl = supabase.storage.from("product-images").getPublicUrl(fileName).data.publicUrl;
                    editor.chain().focus().setImage({ src: publicUrl }).run();
                    setImageOpen(false);
                  } catch (error) {
                    console.error("Upload failed:", error);
                  } finally {
                    setIsUploadingImage(false);
                    if (imageInputRef.current) imageInputRef.current.value = "";
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setImageOpen(false);
                    setImagePickerOpen(true);
                  }}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Library
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={isUploadingImage}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploadingImage ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Video */}
        <Popover open={videoOpen} onOpenChange={setVideoOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <Video className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">Insert YouTube Video</p>
              <Input
                placeholder="Enter YouTube URL..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && videoUrl) {
                    editor.commands.setYoutubeVideo({ src: videoUrl });
                    setVideoUrl("");
                    setVideoOpen(false);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (videoUrl) {
                    editor.commands.setYoutubeVideo({ src: videoUrl });
                    setVideoUrl("");
                    setVideoOpen(false);
                  }
                }}
              >
                Insert Video
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Table */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-8 px-2 gap-1", editor.isActive("table") && "bg-muted")}
            >
              <TableIcon className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            >
              Insert table
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.can().addRowBefore()}
            >
              Insert row above
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
            >
              Insert row below
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.can().addColumnBefore()}
            >
              Insert column before
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
            >
              Insert column after
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.can().deleteRow()}
              className="text-destructive"
            >
              Delete row
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.can().deleteColumn()}
              className="text-destructive"
            >
              Delete column
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              className="text-destructive"
            >
              Delete table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Code */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("code") && "bg-muted")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content - Scrollable */}
      <div className="overflow-y-auto flex-1">
        <EditorContent editor={editor} />
      </div>

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        onSelect={(url) => {
          editor.chain().focus().setImage({ src: url }).run();
        }}
      />
    </div>
  );
}
