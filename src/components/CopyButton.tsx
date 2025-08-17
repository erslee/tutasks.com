import React from "react";

interface Task {
  number: string;
  description: string;
}

interface CopyButtonProps {
  task: Task;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function CopyButton({ 
  task, 
  onClick, 
  className = "",
  size = "md",
  showText = false
}: CopyButtonProps) {
  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const text = `${task.number} - ${task.description}`;
      navigator.clipboard.writeText(text);
    }
    
    const button = e.target as HTMLButtonElement;
    const originalContent = button.innerHTML;
    button.textContent = showText ? 'Copied!' : 'Copied!';
    
    setTimeout(() => {
      button.innerHTML = originalContent;
    }, 1000);
    
    if (onClick) {
      onClick(e);
    }
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm", 
    lg: "px-4 py-1 text-base"
  };

  const baseClasses = "bg-[#3bb0d6] text-white border-none rounded font-medium hover:bg-[#329bb8] transition-colors";
  const finalClassName = `${baseClasses} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={finalClassName}
      onClick={handleCopy}
      title="Copy task number and description"
    >
      {showText ? (
        <>
          <span role="img" aria-label="copy">📋</span> Copy
        </>
      ) : (
        <span role="img" aria-label="copy">📋</span>
      )}
    </button>
  );
}