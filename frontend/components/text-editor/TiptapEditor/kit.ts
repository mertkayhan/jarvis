import Table from "@tiptap/extension-table";
import {
  CharacterCount,
  CodeBlock,
  ImageFigure,
  Link,
  ListKeymap,
  Placeholder,
  StarterKit,
  Subscript,
  Superscript,
  TextAlign,
  Underline,
  Selection,
  ImageCaption,
  Youtube,
  Image,
  TextStyle,
  Color,
  Highlight,
} from "./extensions";
import TableCell from "@tiptap/extension-table-cell";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import BubbleMenu from "@tiptap/extension-bubble-menu";

const ExtensionKit = [
  StarterKit.configure({
    horizontalRule: false,
    hardBreak: false,
    codeBlock: false,
  }),

  Placeholder.configure({
    includeChildren: true,
    showOnlyCurrent: true,
    placeholder: "Write something...",
  }),
  Selection,
  CharacterCount,
  Underline,
  Superscript,
  Subscript,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  ListKeymap,
  Link,
  Image.configure({ allowBase64: true }),
  ImageFigure,
  CodeBlock,
  Youtube,
  Table,
  TableCell,
  TableRow,
  TableHeader,
  BubbleMenu.configure({
    shouldShow: ({ editor, view, state, oldState, from, to }) => {
      return editor.isActive('table') || editor.isActive('tableCell') || editor.isActive('tableHeader') || editor.isActive('tableRow');
    },
  }),
];

export default ExtensionKit;
