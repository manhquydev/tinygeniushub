"use client";

import type { OnMount } from "@monaco-editor/react";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { BlogImageUploadButton } from "@/components/blog/blog-image-upload-button";

const Editor = dynamic(() => import("@monaco-editor/react").then((module) => module.Editor), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 450,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1e1e1e",
        color: "#888",
        borderRadius: 8,
      }}
    >
      Dang tai editor...
    </div>
  ),
});

interface BlogMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

type EditorInstance = Parameters<OnMount>[0];
type MonacoInstance = Parameters<OnMount>[1];

export function BlogMarkdownEditor({ value, onChange, height = 500 }: BlogMarkdownEditorProps) {
  const editorRef = useRef<EditorInstance | null>(null);
  const monacoRef = useRef<MonacoInstance | null>(null);

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  function insertText(text: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const selection = editor.getSelection();
    if (!selection) {
      return;
    }

    editor.executeEdits("markdown-toolbar", [
      {
        range: selection,
        text,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  }

  function wrapSelection(prefix: string, suffix: string, fallbackText: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!selection || !model) {
      return;
    }

    const selectedText = model.getValueInRange(selection);
    const output = `${prefix}${selectedText || fallbackText}${suffix}`;
    editor.executeEdits("markdown-toolbar", [
      {
        range: selection,
        text: output,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  }

  function handleInsertImage(markdownTag: string) {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) {
      return;
    }

    const position = editor.getPosition();
    if (!position) {
      return;
    }

    editor.executeEdits("image-upload", [
      {
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: `\n${markdownTag}\n`,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="ghost-button" onClick={() => insertText("## ")}>
          H2
        </button>
        <button type="button" className="ghost-button" onClick={() => insertText("### ")}>
          H3
        </button>
        <button type="button" className="ghost-button" onClick={() => wrapSelection("**", "**", "text")}>
          Bold
        </button>
        <button type="button" className="ghost-button" onClick={() => wrapSelection("*", "*", "text")}>
          Italic
        </button>
        <button type="button" className="ghost-button" onClick={() => wrapSelection("`", "`", "code")}>
          Code
        </button>
        <button type="button" className="ghost-button" onClick={() => insertText("[text](url)")}>
          Link
        </button>
        <BlogImageUploadButton onInsert={handleInsertImage} />
        <button type="button" className="ghost-button" onClick={() => insertText("> ")}>
          Quote
        </button>
        <button type="button" className="ghost-button" onClick={() => insertText("- ")}>
          List
        </button>
        <button type="button" className="ghost-button" onClick={() => insertText("\n---\n")}>
          ---
        </button>
      </div>

      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
        <Editor
          height={height}
          defaultLanguage="markdown"
          value={value}
          onMount={onMount}
          onChange={(val) => onChange(val ?? "")}
          theme="vs-dark"
          options={{
            wordWrap: "on",
            lineNumbers: "on",
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 22,
            scrollBeyondLastLine: false,
            renderWhitespace: "none",
            padding: { top: 16, bottom: 16 },
            quickSuggestions: false,
            folding: true,
            foldingHighlight: false,
          }}
        />
      </div>
    </div>
  );
}
