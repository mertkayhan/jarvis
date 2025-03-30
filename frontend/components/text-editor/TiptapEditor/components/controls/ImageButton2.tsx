// import React, { ChangeEvent, Fragment, useCallback, useRef, useState } from "react";
import { useState } from "react";
import MenuButton from "../MenuButton";
import { useEditorState } from "@tiptap/react";
import { useTiptapContext } from "../Provider";
// import Dialog from "@/components/TiptapEditor/components/ui/Dialog";
// import MediaLibrary from "@/components/MediaLibrary";
// import useModal from "@/components/TiptapEditor/hooks/useModal";
import { UploadDialog } from "@/components/chat/upload-dialog";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
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

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <MenuButton icon="Image" tooltip="Image" {...state} />
        </DialogTrigger>
        <DialogContent className="flex flex-col w-full h-80 items-center justify-center">
          <UploadDialog selectedBlobs={selectedImages} setSelectedBlobs={setSelectedImages} imagePreviews={selectedPreviews} setImagePreviews={setSelectedPreviews} />
          <DialogFooter>
            <DialogClose>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log("click")

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
                }}
              >
                Save Changes
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageButton;
