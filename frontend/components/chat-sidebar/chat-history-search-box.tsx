"use client";

import { Dispatch, SetStateAction, useState } from "react";

interface SearchBoxProps {
  setQuery: Dispatch<SetStateAction<string>>;
}

export function SearchBox({ setQuery }: SearchBoxProps) {
  const [searchActive, setSearchActive] = useState(false);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="hidden md:block">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (inputValue.length) {
            setQuery(inputValue);
            setSearchActive(true);
          }
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Search chats
        </label>
        <div className="relative items-center">
          <input
            id="search-chats"
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 pr-10 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            placeholder="Search chats"
            // required
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
          />
          {(!searchActive && (
            <button
              type="submit"
              className="absolute bottom-2 right-2.5 rounded-lg p-2 text-sm text-slate-500 hover:text-blue-700 focus:outline-none sm:text-base justify-center items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                aria-hidden="true"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M8 9h8"></path>
                <path d="M8 13h5"></path>
                <path d="M11.008 19.195l-3.008 1.805v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v4.5"></path>
                <path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path>
                <path d="M20.2 20.2l1.8 1.8"></path>
              </svg>
              <span className="sr-only">Search chats</span>
            </button>
          )) || (
            <button
              type="button"
              className="absolute bottom-2 right-2.5 rounded-lg p-2 text-sm text-slate-500 hover:text-blue-700 focus:outline-none sm:text-base justify-center items-center"
              onClick={() => {
                setQuery("");
                setInputValue("");
                setSearchActive(false);
              }}
            >
              <svg
                className="h-4 w-4"
                strokeWidth="2"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="sr-only">Search chats</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
