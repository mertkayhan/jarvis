import { useEffect, useRef, useState } from "react";
import MenuButton from "../MenuButton";
import { useEditorState } from "@tiptap/react";
import { useTiptapContext } from "../Provider";
import { UploadDialog } from "@/components/chat/upload-dialog";
import Button from "../ui/Button";

const ImageButton = () => {
  const { editor } = useTiptapContext();
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        active: ctx.editor.isActive("image"),
        disabled: !ctx.editor.isEditable,
      };
    },
  });
  const readFileAsync = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing input file."));
      };

      reader.readAsDataURL(file);
    });
  };

  // const { open, handleOpen, handleClose } = useModal();
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedImages.length === 0) {
      return;
    }
    const files = Promise.all(selectedImages.map(async (img) => {
      const file = await readFileAsync(img);
      return { type: "image", attrs: { src: file } };
      // console.log("url:", file);
      // editor.commands.setImage({
      //   src: file as string,
      // });
    }));
    files.then((f) => {
      console.log("f:", f);
      editor.commands.insertContent(f);
      // editor.commands.createParagraphNear()
      editor.chain().focus().createParagraphNear().run();
    })
    setSelectedImages([]);
    setSelectedPreviews([]);
  }, [selectedImages]);

  return (
    <>
      <UploadDialog
        setSelectedImages={setSelectedImages}
        setSelectedPreviews={setSelectedPreviews}
        ref={inputRef}
      >
        <MenuButton icon="Image" tooltip="Image" {...state} onClick={() => inputRef.current?.click()} />
      </UploadDialog>
    </>
  );
};

export default ImageButton;
