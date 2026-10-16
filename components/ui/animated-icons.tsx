"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedIconProps {
    className?: string;
    size?: number;
}

/**
 * Animated Wallet Icon with a floating coin and subtle shimmer
 */
export function AnimatedWalletIcon({ className = "", size = 22 }: AnimatedIconProps) {
    return (
        <motion.div
            className={`relative flex items-center justify-center shrink-0 ${className}`}
            whileHover={{ scale: 1.08, rotate: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible"
            >
                {/* Wallet Base */}
                <motion.rect
                    x="2"
                    y="5"
                    width="20"
                    height="15"
                    rx="3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-90"
                />
                {/* Wallet Flap */}
                <motion.path
                    d="M14 10.5H21.5V14.5H14C12.9 14.5 12 13.6 12 12.5C12 11.4 12.9 10.5 14 10.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="fill-current/15"
                />
                {/* Wallet Clasp / Dot */}
                <motion.circle
                    cx="15.5"
                    cy="12.5"
                    r="1.2"
                    fill="currentColor"
                    animate={{
                        scale: [1, 1.25, 1],
                        opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                {/* Floating Coin at Top */}
                <motion.circle
                    cx="12"
                    cy="2.5"
                    r="2.2"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    fill="currentColor"
                    className="opacity-70 text-amber-500"
                    animate={{
                        y: [0, -3, 0],
                        opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </svg>
        </motion.div>
    );
}

/**
 * Animated Trending Up Icon with an arrow that surges upward
 */
export function AnimatedTrendUpIcon({ className = "", size = 20 }: AnimatedIconProps) {
    return (
        <motion.div
            className={`relative flex items-center justify-center shrink-0 ${className}`}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible"
            >
                {/* Wave Path */}
                <motion.path
                    d="M3 17L9 11L13 15L21 7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0.9, opacity: 0.8 }}
                    animate={{ pathLength: [0.9, 1, 0.9], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Arrowhead */}
                <motion.path
                    d="M15 7H21V13"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                        x: [0, 1.5, 0],
                        y: [0, -1.5, 0],
                    }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
            </svg>
        </motion.div>
    );
}

/**
 * Animated Trending Down Icon with an arrow that glides downward
 */
export function AnimatedTrendDownIcon({ className = "", size = 20 }: AnimatedIconProps) {
    return (
        <motion.div
            className={`relative flex items-center justify-center shrink-0 ${className}`}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible"
            >
                {/* Wave Path Down */}
                <motion.path
                    d="M3 7L9 13L13 9L21 17"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0.9, opacity: 0.8 }}
                    animate={{ pathLength: [0.9, 1, 0.9], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Arrowhead Down */}
                <motion.path
                    d="M15 17H21V11"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                        x: [0, 1.5, 0],
                        y: [0, 1.5, 0],
                    }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
            </svg>
        </motion.div>
    );
}

/**
 * Animated Clock / Hourglass Icon with rotating hands
 */
export function AnimatedClockIcon({ className = "", size = 20 }: AnimatedIconProps) {
    return (
        <motion.div
            className={`relative flex items-center justify-center shrink-0 ${className}`}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="9.2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="opacity-90"
                />
                {/* Center dot */}
                <circle cx="12" cy="12" r="1.3" fill="currentColor" />
                {/* Hour hand */}
                <line
                    x1="12"
                    y1="12"
                    x2="12"
                    y2="7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                {/* Minute hand with subtle smooth rotation */}
                <motion.line
                    x1="12"
                    y1="12"
                    x2="16.5"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{ originX: "12px", originY: "12px" }}
                />
            </svg>
        </motion.div>
    );
}

/**
 * Animated Checkmark with expanding halo ripple
 */
export function AnimatedCheckIcon({ className = "", size = 20 }: AnimatedIconProps) {
    return (
        <motion.div
            className={`relative flex items-center justify-center shrink-0 ${className}`}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="9.2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="opacity-90"
                />
                {/* Checkmark */}
                <motion.path
                    d="M8 12.2L10.8 15L16.2 9"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0.9 }}
                    animate={{
                        pathLength: [0.85, 1, 0.85],
                        scale: [0.98, 1.04, 0.98],
                    }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ originX: "12px", originY: "12px" }}
                />
            </svg>
        </motion.div>
    );
}

/**
 * Animated Layers / Stacks for Secondary Income
 */
export function AnimatedLayersIcon({ className = "", size = 20 }: AnimatedIconProps) {
    return (
        <motion.div
            className={`relative flex items-center justify-center shrink-0 ${className}`}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Top layer */}
                <motion.path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                        y: [0, -1.5, 0],
                    }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Middle layer */}
                <motion.path
                    d="M2 12L12 17L22 12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-80"
                />
                {/* Bottom layer */}
                <motion.path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-60"
                />
            </svg>
        </motion.div>
    );
}

/**
 * Animated Rupee Currency Badge
 */
export function AnimatedRupeeIcon({ className = "", size = 22 }: AnimatedIconProps) {
    return (
        <motion.div
            className={`relative flex items-center justify-center shrink-0 ${className}`}
            animate={{
                scale: [1, 1.05, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="opacity-25"
                />
                {/* Indian Rupee Symbol */}
                <path
                    d="M6 6H17M6 10H15M6 10C8.5 10 11.5 9 11.5 6C11.5 3 6 3 6 3M10 14L15.5 21M6 14H10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </motion.div>
    );
}

/**
 * Animated Pulse Ring for highlights
 */
export function AnimatedPulseRing({ color = "bg-primary" }: { color?: string }) {
    return (
        <span className="relative flex h-2 w-2 shrink-0">
            <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}
            />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
        </span>
    );
}
