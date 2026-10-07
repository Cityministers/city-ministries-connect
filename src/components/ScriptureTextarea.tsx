import { useRef, type TextareaHTMLAttributes } from "react";
import { ScriptureDetectorPill } from "@/components/ScriptureDetectorPill";
import { cn } from "@/lib/utils";

export function ScriptureTextarea({
  value, onValueChange, onAttach, className, ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (text: string) => void;
  onAttach?: (reference: string, verseText: string) => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="overflow-hidden rounded-xl bg-ink ring-1 ring-mist/20 focus-within:ring-lemon/60">
      <textarea
        {...props}
        ref={input}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn("block w-full resize-y border-0 bg-transparent px-4 py-3 text-base text-sand outline-none placeholder:text-mist/40", className)}
      />
      <ScriptureDetectorPill
        text={value}
        maxLength={props.maxLength}
        onAttach={onAttach}
        onInsert={(next) => {
          onValueChange(next);
          requestAnimationFrame(() => {
            input.current?.focus();
            input.current?.setSelectionRange(next.length, next.length);
          });
        }}
      />
    </div>
  );
}