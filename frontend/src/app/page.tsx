"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  Minus,
  Plus,
  PlaneTakeoff,
  CrownIcon,
} from "lucide-react";

import BeamsBackground from "@/components/kokonutui/beams-background";
import Link from "next/link";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";
import { BookOpenCheck, FileText, Users, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PaymentModal from "../components/PaymentModal";

type Offer = {
  id: number;
  title: string;
  icon: React.ReactNode;
  details: string;
};

const offers: Offer[] = [
  {
    id: 1,
    title: "Structured test-series",
    icon: <BookOpenCheck className="w-12 h-12 text-emerald-600" />,
    details:
      "Our test-series is carefully structured to mimic real exam conditions and improve performance step by step.",
  },
  {
    id: 2,
    title: "Strictly prepared papers",
    icon: <FileText className="w-12 h-12 text-emerald-600" />,
    details:
      "All papers are curated by subject experts and follow the latest guidelines, ensuring maximum relevance.",
  },
  {
    id: 3,
    title: "Guidance and support",
    icon: <Users className="w-12 h-12 text-emerald-600" />,
    details:
      "Get personalized mentorship and support from experienced faculty to resolve doubts quickly.",
  },
  {
    id: 4,
    title: "Detailed analytics attempts",
    icon: <BarChart className="w-12 h-12 text-emerald-600" />,
    details:
      "Track your progress with detailed analytics for every attempt, identify strengths and weaknesses instantly.",
  },
];



export default function Home() {
  const { start, stop } = useRouteLoading();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
    const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; data: any }>({
    isOpen: false,
    data: null,
  });

  const paperFeatures = [
    { text: "Multiple attempts for each paper", included: true },
    { text: "Analytics for each attempt", included: true },
    { text: "Each paper valid for 1 month*", included: true },
    { text: "Community support", included: false },
    { text: "Mentor guidance", included: false },
  ];

  const seriesFeatures = [
    { text: "Structured set of papers", included: true },
    { text: "Detailed analytics for each attempt", included: true },
    { text: "Each series valid for 6 months*", included: true },
    { text: "Basic community support", included: true },
    { text: "Mentor guidance", included: false },
  ];

  const proFeatures = [
    { text: "Unlimited access to all courses.", included: true },
    { text: "Attempt any Paper or Test-Series on platform", included: true },
    { text: "Analytics for each attempt", included: true },
    { text: "Community Support", included: true },
    { text: "Mentor guidance", included: true },
  ];

  const faqs = [
    {
      question: "Can I enroll in multiple courses at once?",
      answer:
        "Absolutely! You can enroll in multiple courses simultaneously and access them at your convenience.",
    },
    {
      question: "What kind of support can I expect from instructors?",
      answer:
        "You'll have access to community forums and can reach out to instructors for guidance.",
    },
    {
      question:
        "Are the courses self-paced or do they have specific start and end dates?",
      answer: "Most courses are self-paced, allowing you to learn at your own speed.",
    },
    {
      question: "Are there any prerequisites for the courses?",
      answer:
        "No prerequisites are required. Courses are designed for both beginners and professionals.",
    },
    {
      question: "Can I download the course materials for offline access?",
      answer:
        "Yes, most materials are available for offline access after enrollment.",
    },
  ];

  // helper that scrolls to the pricing section
  const scrollToPricing = () => {
    const el = document.getElementById("pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-vietnam">
      <BeamsBackground>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 max-w-6xl mx-auto">
            {/* Left content */}
            <div className="w-full md:w-1/2 text-center md:text-left">
              <div className="inline-flex items-center gap-3 bg-muted border border-border px-6 py-3 rounded-lg shadow-sm">
                <div className="bg-emerald-500/20 p-3 rounded-md mr-5">
                  <PlaneTakeoff className="w-6 h-6 text-emerald-500" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  <span className="text-emerald-500">KnotX - </span>{" "}
                  <span className="text-foreground">Your Flight companion</span>
                </h1>
              </div>

              <div className="mt-6">
                <h2 className="text-xl md:text-2xl font-medium">
                  Structured practise modules for you
                </h2>
                <p className="text-lg text-muted-foreground mt-3">
                  Prepared with feedback by learners and guidance of tutors
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link href="/explore" onClick={() => start("nav")} onMouseDown={() => start("nav")}>
                    <Button className="w-full cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-4 text-base rounded-lg shadow-md">
                      Explore Courses
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    onClick={scrollToPricing}
                    className="cursor-pointer border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 font-medium px-6 py-4 text-base rounded-lg"
                  >
                    View Pricing
                  </Button>
                </div>
              </div>
            </div>

            {/* Right image */}
            <div className="w-full md:w-1/2 flex justify-center md:justify-end">
              <img
                src="herocover.png"
                alt="Learning illustration"
                className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto object-cover transition-transform duration-300 hover:scale-110"
              />
            </div>
          </div>
        </section>
      </BeamsBackground>

      {/* Benefits - Fixed Section */}
      <section className="py-16 bg-white dark:bg-neutral-950 relative">
        <h2 className="text-3xl font-bold text-center text-emerald-700 mb-10">
          What we offer
        </h2>

        {/* items-start prevents grid children from stretching to the row's tallest item */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 lg:px-20 items-start">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="self-start bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 shadow-md flex flex-col items-center text-center relative overflow-hidden rounded-2xl p-6"
            >
              {offer.icon}
              <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
                {offer.title}
              </h3>

              <button
                aria-expanded={expanded === offer.id}
                onClick={() =>
                  setExpanded((prev) => (prev === offer.id ? null : offer.id))
                }
                className="mt-6 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition"
              >
                {expanded === offer.id ? "Show Less" : "Learn More"}
              </button>

              <AnimatePresence initial={false}>
                {expanded === offer.id && (
                  <motion.div
                    key={`details-${offer.id}`}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28 }}
                    className="mt-4 text-sm text-neutral-700 dark:text-neutral-200 w-full"
                  >
                    {offer.details}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing - added id="pricing" so we can scroll to it */}
      <section id="pricing" className="container mx-auto px-10 md:px-20 py-20">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Our Pricing</h2>
            <p className="text-gray-400 max-w-2xl">
              Choose a plan that fits your goals. Upgrade anytime as you grow.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/*Papers*/}
          <Card className="bg-card border border-border p-6 rounded-xl shadow hover:shadow-md flex flex-col h-full">
            <h3 className="text-lg font-semibold text-center mb-4">Papers</h3>
            <div className="text-center mb-6">
              <span>Starting </span>
              <span className="text-4xl font-bold">₹300</span>
              <span className="text-base text-gray-400"></span>
            </div>
            <div className="flex-1 bg-muted border border-border rounded-lg p-4 space-y-3">
              {paperFeatures.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 border border-border rounded-md"
                >
                  <div
                    className={`p-2 rounded-md ${f.included ? "bg-emerald-500" : "border border-gray-600"
                      }`}
                  >
                    {f.included ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <X className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-300">{f.text}</span>
                </div>
              ))}
            </div>
            <span className="text-base text-gray-400">*from date of purchase</span>
            <Link href="/explore" onClick={() => start("nav")} onMouseDown={() => start("nav")}>
              <Button className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg w-full">
                Get Started
              </Button>
            </Link>
          </Card>

          {/*Series*/}
          <Card className="bg-card border border-border p-6 rounded-xl shadow hover:shadow-md flex flex-col h-full">
            <h3 className="text-lg font-semibold text-center mb-4">Test Series</h3>
            <div className="text-center mb-6">
              <span>Starting </span>
              <span className="text-4xl font-bold">₹1500</span>
              <span className="text-base text-gray-400"></span>
            </div>
            <div className="flex-1 bg-muted border border-border rounded-lg p-4 space-y-3">
              {seriesFeatures.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 border border-border rounded-md"
                >
                  <div
                    className={`p-2 rounded-md ${f.included ? "bg-emerald-500" : "border border-gray-600"
                      }`}
                  >
                    {f.included ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <X className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-300">{f.text}</span>
                </div>
              ))}
            </div>
            <span className="text-base text-gray-400">*from date of purchase</span>
            <Link href="/explore">
              <Button className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg w-full">
                Get Started
              </Button>
            </Link>
          </Card>

          {/*Pro*/}
          <Card className="bg-card border border-border p-6 rounded-xl shadow hover:shadow-md flex flex-col h-full">
            <h3 className="text-lg font-semibold text-center mb-4">Pro</h3>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold">₹8000*</span>
              <span className="text-base text-gray-400">/year</span>
            </div>
            <div className="flex-1 bg-muted border border-border rounded-lg p-4 space-y-3">
              {proFeatures.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 border border-border rounded-md"
                >
                  <div
                    className={`p-2 rounded-md ${f.included ? "bg-emerald-500" : "border border-gray-600"
                      }`}
                  >
                    {f.included ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <X className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-300">{f.text}</span>
                </div>
              ))}
            </div>
            <span className="text-base text-gray-400">*from date of purchase</span>
            <Button className="mt-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
            onClick={() =>
              setPaymentModal({
                isOpen: true,
                data: {
                  type: "all-access",
                  itemName: "KnotX Pro - All Access (1 Year)",
                  itemDescription:
                    "Unlimited access to all test series, papers, and premium features for 12 months.",
                  baseAmount: 800000, // amount in paise (₹8000)
                  currency: "INR",
                  durationDays: 365,
                },
              })
            }
            >
              <CrownIcon/>Get Pro
            </Button>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-10 md:px-20 py-20">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <Card
              key={i}
              className="bg-card border border-border rounded-lg p-6 shadow-md hover:border-emerald-500 transition cursor-pointer"
              onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{f.question}</h3>
                {openFAQ === i ? (
                  <Minus className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Plus className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              {openFAQ === i && (
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {f.answer}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, data: null })}
        onPaymentSuccess={() => {
          // Optionally, you can add routing or a toast here
          console.log("Payment successful for All Access");
        }}
        paymentData={paymentModal.data}
      />

      {/* Footer */}
      <footer className="bg-card py-10 px-4 mt-16 border-t border-border">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo + Contact */}
          <div className="space-y-4">
            <div className="bg-emerald-500 p-2 rounded-md w-10 h-10 flex items-center justify-center text-white font-bold">
              S
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> hello@skillbridge.com
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> +91 91813 23 2309
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Somewhere in the World
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-2">Home</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>Benefits</li>
              <li>Our Courses</li>
              <li>Testimonials</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">About Us</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>Company</li>
              <li>Achievements</li>
              <li>Our Goals</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-2">Social</h4>
            <div className="flex gap-3">
              <Button
                size="icon"
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg"
              >
                F
              </Button>
              <Button
                size="icon"
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg"
              >
                T
              </Button>
              <Button
                size="icon"
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg"
              >
                in
              </Button>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-gray-500">
          © 2023 Skillbridge. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
