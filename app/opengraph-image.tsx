import { ImageResponse } from "next/og";

export const alt = "Money View - Financial Income Tracker";
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

export default function Image() {
    return new ImageResponse(
        <div
            style={{
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#020617",
                backgroundImage:
                    "linear-gradient(to bottom right, #1e1b4b, #020617, #164e63)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    borderRadius: "24px",
                    background: "linear-gradient(to right, #9333ea, #0891b2)",
                    marginBottom: "40px",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                }}
            >
                <svg
                    width="80"
                    height="80"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8ZM14.4 12.8H17.6V14.4H15.2V16H17.6V17.6H15.2V19.2H14.4V12.8Z"
                        fill="white"
                    />
                </svg>
            </div>
            <div
                style={{
                    fontSize: "80px",
                    fontWeight: "bold",
                    color: "white",
                    letterSpacing: "-2px",
                    marginBottom: "10px",
                }}
            >
                Money View
            </div>
            <div
                style={{
                    fontSize: "32px",
                    color: "#94a3b8",
                    maxWidth: "800px",
                    textAlign: "center",
                    lineHeight: "1.4",
                }}
            >
                Track and visualize your income with beautiful charts and
                analytics.
            </div>
        </div>,
        {
            ...size,
        },
    );
}
