"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"

interface CZCharacterProps {
  isKicking: boolean
  direction: "left" | "right"
  priority?: boolean
  style?: React.CSSProperties
}

export default function CZCharacter({ isKicking, direction, priority = false, style = {} }: CZCharacterProps) {
  const [kickFrame, setKickFrame] = useState(0)

  // Handle kick animation
  useEffect(() => {
    if (!isKicking) {
      setKickFrame(0)
      return
    }

    // Kick animation frames - more frames for smoother animation
    const kickAnimation = setInterval(() => {
      setKickFrame((prev) => {
        if (prev >= 3) {
          clearInterval(kickAnimation)
          return 0
        }
        return prev + 1
      })
    }, 80) // Faster animation

    return () => clearInterval(kickAnimation)
  }, [isKicking])

  return (
    <div className="relative w-full h-full">
      {/* Main CZ character with larger size and head */}
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(1.2) ${direction === "left" ? "scaleX(-1)" : ""}`,
          filter: "drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.8)) contrast(1.05) brightness(1.05)", // Enhanced shadow and contrast
          ...style,
        }}
      >
        <Image
          src="/images/cz-character.png"
          alt="CZ Character"
          fill
          style={{
            objectFit: "contain",
            imageRendering: "pixelated",
          }}
          className="select-none"
          priority={priority}
        />
      </div>

      {/* Visible leg/foot for kicking */}
      {isKicking && (
        <div
          className="absolute bottom-[-5%] left-[50%] w-[30%] h-[25%]"
          style={{
            transform: `translateX(${direction === "left" ? "-80%" : "-20%"}) rotate(${kickFrame * 25}deg)`,
            transformOrigin: "top center",
            transition: "transform 0.05s ease-out",
            zIndex: 5,
          }}
        >
          {/* Leg */}
          <div
            className="absolute top-0 left-1/2 w-[6px] h-[70%] bg-blue-800"
            style={{
              transform: "translateX(-50%)",
              borderRadius: "3px",
              boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.5)", // Added shadow to leg
            }}
          ></div>

          {/* Foot */}
          <div
            className="absolute bottom-0 left-1/2 w-[12px] h-[30%] bg-black"
            style={{
              transform: `translateX(-50%) rotate(${kickFrame * 10}deg)`,
              borderRadius: "3px",
              transformOrigin: "top center",
              boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.5)", // Added shadow to foot
            }}
          ></div>
        </div>
      )}

      {/* Kick effect visualization */}
      {isKicking && kickFrame > 0 && (
        <div
          className="absolute"
          style={{
            bottom: `${-5 + kickFrame * 5}%`,
            left: `${direction === "left" ? 30 - kickFrame * 10 : 70 + kickFrame * 10}%`,
            width: "20px",
            height: "20px",
            opacity: 1 - kickFrame * 0.2,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)",
              animation: "pulse 0.3s ease-out",
            }}
          ></div>
        </div>
      )}
    </div>
  )
}
