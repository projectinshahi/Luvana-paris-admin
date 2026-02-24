'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap p-2 gap-1 border-b border-gray-200">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 px-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'bg-white'}`}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 px-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'bg-white'}`}
      >
        Italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 px-2 rounded ${editor.isActive('underline') ? 'bg-gray-200' : 'bg-white'}`}
      >
        Underline
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1 px-2 rounded ${editor.isActive('strike') ? 'bg-gray-200' : 'bg-white'}`}
      >
        Strike
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1 px-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'bg-white'}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1 px-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'bg-white'}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1 px-2 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'bg-white'}`}
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 px-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'bg-white'}`}
      >
        Bullet List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 px-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : 'bg-white'}`}
      >
        Ordered List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1 px-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'bg-white'}`}
      >
        Left
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1 px-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'bg-white'}`}
      >
        Center
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1 px-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'bg-white'}`}
      >
        Right
      </button>
    </div>
  );
};

const TipTapEditor = ({ content, onChange }: TipTapEditorProps) => {
  const [editorContent, setEditorContent] = useState(content);

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
    content: editorContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditorContent(html);
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && content !== editorContent) {
      editor.commands.setContent(content);
      setEditorContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border rounded-md overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="p-4 min-h-[250px] focus:outline-none prose max-w-none" />
      <style jsx global>{`
        .ProseMirror {
          min-height: 250px;
          outline: none;
          padding: 0.5rem;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          margin-left: 1rem;
        }
        .ProseMirror ol li {
          display: list-item;
          list-style-position: outside;
          padding-left: 0.5rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
          margin-left: 1rem;
        }
        .ProseMirror ul li {
          display: list-item;
          list-style-position: outside;
          padding-left: 0.5rem;
        }
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
        }
        .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 1em;
        }
      `}</style>
    </div>
  );
};

export default TipTapEditor;