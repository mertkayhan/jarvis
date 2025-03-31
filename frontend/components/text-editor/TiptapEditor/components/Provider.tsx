import {
  createContext,
  HTMLAttributes,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { BubbleMenu, Content, EditorContent, type Editor } from "@tiptap/react";
import useTiptapEditor, { type UseTiptapEditorOptions } from "../hooks/useTiptapEditor";
import clsx from "clsx";
import CodeMirrorEditor from "@/components/text-editor/SourceEditor/Editor";
import { Toolbar } from "./ui/Toolbar";
import MenuButton from "./MenuButton";

type TiptapContextType = {
  editor: Editor;
  contentElement: RefObject<Element>;
  isFullScreen: boolean;
  isResizing: boolean;
  isSourceMode: boolean;
  toggleFullScreen: () => void;
  toggleSourceMode: () => void;
  setIsResizing: (value: boolean) => void;
};

const TiptapContext = createContext<TiptapContextType>({} as TiptapContextType);
export const useTiptapContext = () => useContext(TiptapContext);

type TiptapProviderProps = {
  slotBefore?: ReactNode;
  slotAfter?: ReactNode;
  editorOptions: UseTiptapEditorOptions;
  editorProps?: HTMLAttributes<HTMLDivElement>;
  children?: ReactNode;
  initialContent?: string | Content
};

export const TiptapProvider = ({
  children,
  editorOptions,
  editorProps,
  slotBefore,
  slotAfter,
  initialContent
}: TiptapProviderProps) => {
  const contentElement = useRef<HTMLDivElement>(null);
  const editor = useTiptapEditor({ ...editorOptions, initialContent: initialContent as string });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (editorOptions.autofocus) {
      editor?.chain().focus('end');
    }
  }, [editorOptions]);

  if (!editor) {
    return null;
  }

  const focusEditorViaContainer = (event: React.MouseEvent) => {
    const target = event.target as Element;
    const content = contentElement.current;
    if (content && target.contains(content)) {
      content.style.display = "flex";
      setTimeout(() => {
        content.style.display = "";
      }, 0);
    }
  };

  const editorContent = (
    <div className={clsx("rte-editor", isFullScreen && "rte-editor--fullscreen")}>
      {slotBefore}
      <div className="rte-editor__container" onMouseDown={focusEditorViaContainer}>
        {isSourceMode ? (
          <CodeMirrorEditor initialContent={editor.getHTML() || ""} />
        ) : (
          <>
            <BubbleMenu
              editor={editor}
              tippyOptions={{ duration: 100 }}
              shouldShow={({ editor, view, state, oldState, from, to }) => {
                const { selection } = state;
                // @ts-ignore
                const cellSelected = Boolean(selection["$anchorCell"]);
                return (editor.isActive('table') || editor.isActive('tableCell') || editor.isActive('tableHeader') || editor.isActive('tableRow')) && cellSelected;
              }}
            >
              <Toolbar dense>
                <div className="flex flex-1 border bg-background rounded-lg">
                  <MenuButton tooltip="Row options" icon="Row" type="dropdown" >
                    <MenuButton hideText={false} text="Insert row" tooltip={false} onClick={() => { editor.chain().focus().addRowAfter().run() }} />
                    <MenuButton hideText={false} text="Delete row" tooltip={false} onClick={() => { editor.chain().focus().deleteRow().run() }} />
                  </MenuButton>
                  <MenuButton tooltip="Column options" icon="Column" type="dropdown" >
                    <MenuButton hideText={false} text="Insert column" tooltip={false} onClick={() => { editor.chain().focus().addColumnAfter().run() }} />
                    <MenuButton hideText={false} text="Remove column" tooltip={false} onClick={() => { editor.chain().focus().deleteColumn().run() }} />
                  </MenuButton>
                  <MenuButton tooltip="Remove table" icon="TableOff" onClick={() => { editor.chain().focus().deleteTable().run() }} />
                </div>
              </Toolbar>
            </BubbleMenu>
            <EditorContent ref={contentElement} editor={editor} className="rte-editor__content" />
          </>
        )}
      </div>
      {children}
      {slotAfter}
    </div >
  );

  return (
    <TiptapContext.Provider
      value={{
        editor,
        contentElement,
        isFullScreen,
        isResizing,
        isSourceMode,
        setIsResizing,
        toggleFullScreen: () => setIsFullScreen((prev) => !prev),
        toggleSourceMode: () => setIsSourceMode((prev) => !prev),
      }}
    >
      {editorContent}
    </TiptapContext.Provider>
  );
};

export default TiptapProvider;
