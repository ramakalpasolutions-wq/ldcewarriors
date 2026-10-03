"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

const WHATSAPP_NUMBER = "9666887998";

const t = {
  navy: "#1B2A4A",
  navyLight: "#243656",
  navyDark: "#12203A",
  gold: "#E8A838",
  goldDark: "#D4922A",
  goldLight: "#F0C060",
  teal: "#2A9D8F",
  bg: "#F5F3EF",
  card: "#FFFFFF",
  text: "#1A1D23",
  muted: "#6B7280",
  border: "#E5E7EB",
};

export default function JoinFamilyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleJoinFamily = (e) => {
    e.preventDefault();

    const message = encodeURIComponent(
      `🙏 *New LDCE Family Member*\n\n` +
        `*Name:* ${name}\n` +
        `*Email:* ${email}\n` +
        `*Phone:* ${phone}\n\n` +
        `I would like to be a part of the LDCE Warriors Family and want to utilize the all full length lectures.\n\n` +
        `Please guide me.\n` +
        `Thank you.`
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />

      <main
        style={{
          flex: 1,
          padding: "clamp(40px, 6vw, 80px) 16px",
        }}
      >
        <div
          style={{
            maxWidth: "560px",
            margin: "0 auto",
          }}
        >
          {/* Main Card */}
          <div
            style={{
              background: t.card,
              borderRadius: "20px",
              border: `1px solid ${t.border}`,
              boxShadow: "0 10px 30px rgba(27, 42, 74, 0.08)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: `linear-gradient(
                  135deg,
                  ${t.navyDark} 0%,
                  ${t.navy} 50%,
                  ${t.navyLight} 100%
                )`,
                padding: "clamp(28px, 4vw, 36px) 24px",
                textAlign: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: t.gold,
                  background: "rgba(232, 168, 56, 0.12)",
                  border: "1px solid rgba(232, 168, 56, 0.25)",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "14px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: t.gold,
                  }}
                />

                Join Family
              </div>

              <h1
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "clamp(24px, 4vw, 32px)",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  lineHeight: 1.2,
                  margin: "0 0 8px",
                }}
              >
                Join Our Family ⭐
              </h1>

              <p
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  maxWidth: "420px",
                  margin: "0 auto",
                }}
              >
                Fill in your registered details to connect on WhatsApp.
                We will activate your access instantly!
              </p>
            </div>

            {/* Small separator */}
            <div
              style={{
                height: "12px",
                background: "rgba(27, 42, 74, 0.03)",
                borderBottom: `1px solid ${t.border}`,
              }}
            />

            {/* Form */}
            <form
              onSubmit={handleJoinFamily}
              style={{
                padding: "clamp(24px, 4vw, 36px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                }}
              >
                {/* Full Name */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: t.navy,
                      marginBottom: "6px",
                    }}
                  >
                    Full Name{" "}
                    <span
                      style={{
                        color: "#E53E3E",
                      }}
                    >
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: `1px solid ${t.border}`,
                      background: "#FAF9F6",
                      color: t.text,
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = t.goldDark;
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(232, 168, 56, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = t.border;
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: t.navy,
                      marginBottom: "6px",
                    }}
                  >
                    Email (Registered Account){" "}
                    <span
                      style={{
                        color: "#E53E3E",
                      }}
                    >
                      *
                    </span>
                  </label>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: `1px solid ${t.border}`,
                      background: "#FAF9F6",
                      color: t.text,
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = t.goldDark;
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(232, 168, 56, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = t.border;
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: t.navy,
                      marginBottom: "6px",
                    }}
                  >
                    Phone Number{" "}
                    <span
                      style={{
                        color: "#E53E3E",
                      }}
                    >
                      *
                    </span>
                  </label>

                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: `1px solid ${t.border}`,
                      background: "#FAF9F6",
                      color: t.text,
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = t.goldDark;
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(232, 168, 56, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = t.border;
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* WhatsApp Button */}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    marginTop: "8px",
                    borderRadius: "12px",
                    background: "#25D366",
                    color: "#FFFFFF",
                    fontSize: "15px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: "0 6px 20px rgba(37, 211, 102, 0.35)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(37, 211, 102, 0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(37, 211, 102, 0.35)";
                  }}
                >
                  <svg
                    style={{
                      width: "22px",
                      height: "22px",
                    }}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>

                  Connect on WhatsApp to Activate
                </button>
              </div>
            </form>

            {/* Footer Note */}
            <div
              style={{
                borderTop: `1px solid ${t.border}`,
                padding: "16px 24px",
                background: "#FAF9F6",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: t.muted,
                  fontSize: "12px",
                  margin: 0,
                }}
              >
                Don't have an account yet?{" "}
                <Link
                  href="/auth/register"
                  style={{
                    color: t.navy,
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}