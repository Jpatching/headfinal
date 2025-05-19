import type { ReactNode } from "react"

interface GameTextProps {
  children: ReactNode
  variant?: "title" | "subtitle" | "heading" | "subheading"
  color?: "white" | "yellow" | "blue"
  className?: string
}

export default function GameText({ children, variant = "heading", color = "white", className = "" }: GameTextProps) {
  // Base styles
  const baseStyles = "font-extrabold tracking-tight"
  let textColor = ""
  let textShadow = ""
  let fontSize = ""

  // Set text color
  if (color === "white") {
    textColor = "text-white"
  } else if (color === "yellow") {
    textColor = "text-yellow-400"
  } else if (color === "blue") {
    textColor = "text-blue-900"
  }

  // Set text shadow based on variant
  if (variant === "title") {
    textShadow =
      "style={{ textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}"
    fontSize = "text-3xl md:text-4xl"
  } else if (variant === "subtitle") {
    textShadow =
      "style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}"
    fontSize = "text-2xl md:text-3xl"
  } else if (variant === "heading") {
    textShadow =
      "style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}"
    fontSize = "text-xl md:text-2xl"
  } else if (variant === "subheading") {
    textShadow =
      "style={{ textShadow: '1px 1px 0 #000, -0.5px -0.5px 0 #000, 0.5px -0.5px 0 #000, -0.5px 0.5px 0 #000, 0.5px 0.5px 0 #000' }}"
    fontSize = "text-lg md:text-xl"
  }

  return (
    <div
      className={`${baseStyles} ${textColor} ${fontSize} ${className}`}
      style={{
        textShadow:
          variant === "title"
            ? "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
            : variant === "subtitle"
              ? "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
              : variant === "heading"
                ? "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
                : "1px 1px 0 #000, -0.5px -0.5px 0 #000, 0.5px -0.5px 0 #000, -0.5px 0.5px 0 #000, 0.5px 0.5px 0 #000",
      }}
    >
      {children}
    </div>
  )
}
