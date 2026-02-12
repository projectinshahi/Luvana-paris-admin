'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';

interface TipTapViewerProps {
  content: string;
}

const TipTapViewer = ({ content }: TipTapViewerProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    content,
    editable: false,
  });

  return (
    <div className="tiptap-viewer">
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tiptap-viewer .ProseMirror {
          outline: none;
          overflow-wrap: break-word;
        }
        .tiptap-viewer .ProseMirror p {
          margin-bottom: 0.75rem;
        }
        .tiptap-viewer .ProseMirror ul,
        .tiptap-viewer .ProseMirror ol {
          padding-left: 1.5rem;
        }
        .tiptap-viewer .ProseMirror ul li {
          list-style-type: disc;
        }
        .tiptap-viewer .ProseMirror ol li {
          list-style-type: decimal;
        }
        .tiptap-viewer .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 1rem 0;
        }
        .tiptap-viewer .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.75rem 0;
        }
        .tiptap-viewer .ProseMirror h3 {
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }
        .tiptap-viewer .ProseMirror a {
          color: #3182ce;
          text-decoration: underline;
        }
        .tiptap-viewer .ProseMirror blockquote {
          border-left: 3px solid #e2e8f0;
          padding-left: 1rem;
          margin-left: 1rem;
          color: #4a5568;
        }
        .tiptap-viewer .ProseMirror img {
          max-width: 100%;
          height: auto;
        }
        .tiptap-viewer .ProseMirror [data-align="center"] {
          text-align: center;
        }
        .tiptap-viewer .ProseMirror [data-align="right"] {
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export default TipTapViewer;