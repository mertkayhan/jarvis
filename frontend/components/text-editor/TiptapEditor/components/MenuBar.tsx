import React, { memo, useState } from "react";

import { Toolbar, ToolbarDivider } from "./ui/Toolbar";

import BoldButton from "./controls/BoldButton";
import ItalicButton from "./controls/ItalicButton";
import UndoButton from "./controls/UndoButton";
import RedoButton from "./controls/RedoButton";
// import ClearFormatButton from "./controls/ClearFormatButton";
import UnderlineButton from "./controls/UnderlineButton";
import AlignPopover from "./controls/AlignPopover";
import HeadingDropdown from "./controls/HeadingDropdown";
// import BlockquoteButton from "./controls/BlockquoteButton";
import BulletListButton from "./controls/BulletListButton";
import OrderedListButton from "./controls/OrderedList";
import MoreMarkDropdown from "./controls/MoreMarkPopover";
import LinkButton from "./controls/LinkButton";
// import CodeBlockButton from "./controls/CodeBlockButton";
import ImageButton from "./controls/ImageButton2";
// import YoutubeButton from "./controls/YoutubeButton";
import TextColorButton from "./controls/TextColorButton";
import TextHighlightButton from "./controls/TextHighlightButton";
import InsertDropdown from "./controls/InsertDropdown";
import MenuButton from "./MenuButton";
import { useTiptapContext } from "./Provider";


const MenuBar = () => {
  return (
    <div className="rte-menu-bar">
      <Toolbar dense>
        <UndoButton />
        <RedoButton />
        {/* <ClearFormatButton /> */}

        <ToolbarDivider />

        <HeadingDropdown />

        <ToolbarDivider />

        <BoldButton />
        <ItalicButton />
        <UnderlineButton />
        <MoreMarkDropdown />

        <ToolbarDivider />

        <TextColorButton />
        <TextHighlightButton />

        <ToolbarDivider />

        <AlignPopover />
        <BulletListButton />
        <OrderedListButton />

        <ToolbarDivider />

        {/* <BlockquoteButton /> */}
        <LinkButton />
        <ImageButton />
        {/* <YoutubeButton /> */}
        {/* <CodeBlockButton /> */}
        <InsertDropdown />
        <TableDropdown />

      </Toolbar>
    </div>
  );
};

export default memo(MenuBar);

function TableDropdown() {
  const { editor } = useTiptapContext();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const isHighlighted = (row: number, col: number, hoverRow: number, hoverCol: number) => {
    return row <= hoverRow && col <= hoverCol;
  };

  const createTableHandler = (hoverRow: number, hoverCol: number) => {
    console.log("row:", hoverRow, "col:", hoverCol);
    if (hoverRow >= 0 && hoverCol >= 0) {
      editor.chain().focus().insertTable({ rows: hoverRow + 1, cols: hoverCol + 1, withHeaderRow: false }).run();
      editor.commands.createParagraphNear();
    }
  }
  return (
    <MenuButton
      tooltip="Table"
      hideText={false}
      icon="Table"
      type="popover"
    >
      <div className="grid grid-rows-8 grid-cols-7 gap-1">
        <div className="col-span-7 items-center text-center justify-center">
          {hoveredIndex && <span>{`${Math.floor(hoveredIndex / 7) + 1} x ${(hoveredIndex % 7) + 1}`}</span> || <span></span>}
        </div>
        {Array.from({ length: 49 }).map((_, index) => {
          const row = Math.floor(index / 7);
          const col = index % 7;
          const hoverRow = hoveredIndex !== null ? Math.floor(hoveredIndex / 7) : -1;
          const hoverCol = hoveredIndex !== null ? hoveredIndex % 7 : -1;

          return (
            <div
              key={index}
              className={`flex items-center justify-center cursor-pointer w-8 h-8 border ${isHighlighted(row, col, hoverRow, hoverCol) ? "bg-blue-200" : "hover:bg-gray-200"
                } ${(index === 0) ? "cursor-default" : "cursor-pointer" // Prevent pointer on the first cell
                }`}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                if (index !== 0) {
                  createTableHandler(hoverRow, hoverCol);
                }
              }}
            >
              <span className="sr-only">{`${row + 1}x${col + 1}`}</span>
            </div>
          );
        })}
      </div>
    </MenuButton >
  )
}