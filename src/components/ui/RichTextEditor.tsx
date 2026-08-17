'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import { useRef, useState, type ChangeEvent } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Quote,
  ImageIcon,
} from 'lucide-react';
import { uploadEditorImage } from '@/lib/actions/upload-editor-media';

export function RichTextEditor({
  name,
  defaultValue = '',
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    // Evita el mismatch de hidratación: TipTap no intenta renderizar
    // contenido durante el SSR de Next.js, lo arma recién en el cliente.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      TiptapImage.configure({ HTMLAttributes: { class: 'rounded-md' } }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none px-3.5 py-2.5 text-ink focus:outline-none min-h-[140px]',
        'data-placeholder': placeholder ?? '',
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  return (
    <div className="overflow-hidden rounded-md border border-line bg-paper focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/30">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      {/* El form action lee esto por FormData — el contenido real vive
          en el estado de TipTap, este input solo lo espeja. */}
      <input type="hidden" name={name} value={html} readOnly />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const item = (active: boolean) =>
    `rounded p-1.5 transition-colors ${
      active ? 'bg-teal/10 text-teal-dark' : 'text-ink hover:bg-line/60'
    } disabled:opacity-50`;

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del enlace:', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  async function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const result = await uploadEditorImage(fd);
    setUploading(false);

    if ('url' in result) {
      editor.chain().focus().setImage({ src: result.url }).run();
    } else {
      window.alert(result.error);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-line/10 px-2 py-1.5">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={item(editor.isActive('bold'))}
        title="Negrita"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={item(editor.isActive('italic'))}
        title="Cursiva"
      >
        <Italic size={16} />
      </button>

      <span className="mx-1 h-4 w-px bg-line" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={item(editor.isActive('heading', { level: 2 }))}
        title="Título"
      >
        <Heading2 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={item(editor.isActive('heading', { level: 3 }))}
        title="Subtítulo"
      >
        <Heading3 size={16} />
      </button>

      <span className="mx-1 h-4 w-px bg-line" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={item(editor.isActive('bulletList'))}
        title="Lista"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={item(editor.isActive('orderedList'))}
        title="Lista numerada"
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={item(editor.isActive('blockquote'))}
        title="Cita"
      >
        <Quote size={16} />
      </button>

      <span className="mx-1 h-4 w-px bg-line" />

      <button type="button" onClick={setLink} className={item(editor.isActive('link'))} title="Enlace">
        <Link2 size={16} />
      </button>
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className={item(false)}
        title="Insertar imagen"
      >
        <ImageIcon size={16} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
    </div>
  );
}
