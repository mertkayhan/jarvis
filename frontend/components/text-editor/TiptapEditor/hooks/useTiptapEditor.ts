import { Ref, useEffect, useImperativeHandle, useRef } from "react";
import { Content, Editor, useEditor, type UseEditorOptions } from "@tiptap/react";
import useForceUpdate from "./useForceUpdate";
import { TiptapEditorRef } from "../components/Editor";

export type UseTiptapEditorOptions = UseEditorOptions & {
  ref?: Ref<TiptapEditorRef>;
  placeholder?: {
    paragraph?: string;
    imageCapton?: string;
  };
  initialContent?: string | Content;
};

export default function useTiptapEditor({
  ref,
  placeholder,
  initialContent,
  ...editorOptions
}: UseTiptapEditorOptions) {
  const forceUpdate = useForceUpdate();
  const editor = useEditor(editorOptions, [initialContent]);

  useImperativeHandle(
    ref,
    () => ({
      getInstance: () => editor,
    }),
    [editor]
  );

  useEffect(() => {
    const isEditable = editorOptions.editable;
    if (!editor || editor.isEditable === isEditable) return;
    editor.setOptions({ editable: Boolean(isEditable) });
    forceUpdate();
  }, [editor, editorOptions.editable]);

  useEffect(() => {
    if (!editor) return;
    // @ts-ignore
    editor.setOptions({ editorProps: { placeholder } });
    forceUpdate();
  }, [editor, placeholder]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, []);

  return editor;
}
