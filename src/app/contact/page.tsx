"use client";
import { ThemedButton } from "@/components/Themed";
import { useState } from "react";
import { TailWindColorThemeClasses as tw } from "@/constants/ColorTheme";

export default function Contact() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  return (
    <main className={`${tw.BG_PRIMARY} py-14`}>
      <div className={`mx-auto max-w-screen-md px-12 py-8 md:px-4 lg:py-16`}>
        <h2 className={`mb-4 text-center text-4xl font-extrabold tracking-tight ${tw.TEXT_PRIMARY} `}>
          Want to hire me?
        </h2>
        <p className={`mb-8 text-center font-light ${tw.TEXT_SECONDARY} h-screen w-full text-2xl md:text-xl lg:mb-16`}>
          Send an email to{" "}
          <a className={`${tw.TEXT_TERTIARY}`} href="mailto:lukasasorensen@gmail.com">
            lukasasorensen@gmail.com
          </a>
        </p>

        {/* form for when backend is setup */}
        {/* <form action="#" className={`space-y-8`}>
          <div>
            <label htmlFor="email" className={`mb-2 block text-sm font-medium ${tw.TEXT_PRIMARY} `}>
              Your email
            </label>
            <input
              type="email"
              id="email"
              className={`focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm ${tw.TEXT_PRIMARY} shadow-sm dark:border-gray-600 dark:bg-gray-700  dark:placeholder-gray-400`}
              placeholder="email@example.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="subject" className={`mb-2 block text-sm font-medium ${tw.TEXT_PRIMARY} `}>
              Subject
            </label>
            <input
              type="text"
              id="subject"
              className={`focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light" placeholder="Let us know how we can help you block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm ${tw.TEXT_PRIMARY} shadow-sm dark:border-gray-600 dark:bg-gray-700  dark:placeholder-gray-400`}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className={`sm:col-span-2`}>
            <label
              htmlFor="message"
              className={`mb-2 block text-sm font-medium ${tw.TEXT_PRIMARY} dark:text-gray-400`}
            >
              Your message
            </label>
            <textarea
              id="message"
              rows={6}
              className={`focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Leave a comment... block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm ${tw.TEXT_PRIMARY} shadow-sm dark:border-gray-600 dark:bg-gray-700  dark:placeholder-gray-400`}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>
          <a className="float-right" href="mailto:lukasasorensen@gmail.com">
            <ThemedButton
              onClick={() => {
                window.location.href = `mailto:lukas@lukasasorensen?subject=${subject}&body=${message}`;
              }}
              color="secondary"
              text="Send Message"
            ></ThemedButton>
          </a>
        </form> */}
      </div>
    </main>
  );
}
