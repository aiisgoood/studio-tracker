"use client";

import { DragEvent, useRef, useState } from "react";

/**
 * Drag-and-drop image support for an upload zone.
 * Spread `dropProps` on the target element; `dragging` is true while a file
 * is hovering so you can highlight the zone. Only the first image file is used.
 */
export function useImageDrop(onFile: (file: File) => void) {
  const [dragging, setDragging] = useState(false);
  // depth counter so child elements don't cause flicker on dragenter/leave
  const depth = useRef(0);

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    depth.current += 1;
    setDragging(true);
  }
  function onDragOver(e: DragEvent) {
    e.preventDefault(); // required so the drop event fires
  }
  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    depth.current -= 1;
    if (depth.current <= 0) {
      depth.current = 0;
      setDragging(false);
    }
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith("image/")
    );
    if (file) onFile(file);
  }

  return { dragging, dropProps: { onDragEnter, onDragOver, onDragLeave, onDrop } };
}
