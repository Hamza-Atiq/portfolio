"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type { SearchEntry } from "@/lib/content";

// The search code loads only when the box is first opened, so the page itself ships less JavaScript.
const SearchBox = dynamic(() => import("@/components/SearchBox"), {
  loading: () => <p className="small muted">Loading search…</p>,
});

/** A small search button in the top menu that opens the search box (FR-17). */
export default function SearchDialog({ index }: { index: SearchEntry[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  return (
    <>
      <button
        type="button"
        className="icon-button"
        aria-label="Search"
        title="Search"
        onClick={() => {
          setOpened(true);
          dialog.current?.showModal();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21" />
        </svg>
      </button>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-label="Search"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close(); // a click outside the box closes it
        }}
      >
        <div className="search-dialog-inner">
          <div className="search-dialog-head">
            <span className="kicker">Search</span>
            <button type="button" className="icon-button" aria-label="Close search" onClick={() => dialog.current?.close()}>
              ✕
            </button>
          </div>
          {opened && <SearchBox index={index} />}
        </div>
      </dialog>
    </>
  );
}
