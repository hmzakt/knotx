"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowUpRight,
  Check,
  X,
  Zap,
  Mail,
  Phone,
  MapPin,
  Minus,
  Plus
} from "lucide-react";

export default function Home() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");

  const benefits = [
    {
      number: "01",
      title: "Flexible Learning Schedule",
      description:
        "Fit your coursework around your existing commitments and obligations.",
    },
    {
      number: "02",
      title: "Expert Instruction",
      description:
        "Learn from industry experts who have hands-on experience in design and development.",
    },
    {
      number: "03",
      title: "Diverse Course Offerings",
      description:
        "Explore a wide range of design and development courses covering various topics.",
    },
    {
      number: "04",
      title: "Updated Curriculum",
      description:
        "Access courses with up-to-date content reflecting the latest trends and industry practices.",
    },
    {
      number: "05",
      title: "Practical Projects and Assignments",
      description:
        "Develop a portfolio showcasing your skills and abilities to potential employers.",
    },
    {
      number: "06",
      title: "Interactive Learning Environment",
      description:
        "Collaborate with fellow learners, exchanging ideas and feedback to enhance your understanding.",
    },
  ];

  const freeFeatures = [
    { text: "Access to selected free courses.", included: true },
    { text: "Limited course materials and resources.", included: true },
    { text: "Basic community support.", included: true },
    { text: "No certification upon completion.", included: true },
    { text: "Ad-supported platform.", included: true },
    { text: "Access to exclusive Pro Plan community forums.", included: false },
    { text: "Early access to new courses and updates.", included: false },
  ];

  const proFeatures = [
    { text: "Unlimited access to all courses.", included: true },
    { text: "Unlimited course materials and resources.", included: true },
    { text: "Priority support from instructors.", included: true },
    { text: "Course completion certificates.", included: true },
    { text: "Ad-free experience.", included: true },
    { text: "Access to exclusive Pro Plan community forums.", included: true },
    { text: "Early access to new courses and updates.", included: true },
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
        "You’ll have access to community forums and can reach out to instructors for guidance.",
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

  return (
    <div className="min-h-screen bg-background text-foreground font-vietnam">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 max-w-6xl mx-auto">
          <div className="w-full md:w-1/2 text-center md:text-left">
            <div className="inline-flex items-center gap-3 bg-muted border border-border px-6 py-3 rounded-lg shadow-sm">
              <div className="bg-primary/20 p-3 rounded-md">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                <span className="text-primary">Unlock</span>{" "}
                <span className="text-foreground">Your Creative Potential</span>
              </h1>
            </div>
            <div className="mt-6">
              <h2 className="text-xl md:text-2xl font-medium">
                with Online Design and Development Courses.
              </h2>
              <p className="text-lg text-muted-foreground mt-3">
                Learn from Industry Experts and Enhance Your Skills.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-4 text-base rounded-lg shadow-md">
                  Explore Courses
                </Button>
                <Button
                  variant="outline"
                  className="border-border bg-muted hover:bg-muted/70 text-foreground font-medium px-6 py-4 text-base rounded-lg"
                >
                  View Pricing
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex justify-center md:justify-end">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/8ab6dfbc5c2221ad4a139dbe05e4b5f8c437751c?width=1548"
              alt="Learning illustration"
              className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto object-cover rounded-xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Benefits</h2>
            <p className="text-gray-400 max-w-2xl">
              Why learners choose us for their design and development journey.
            </p>
          </div>
          <Button className="bg-gray-900 hover:bg-gray-800 border border-gray-800">
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <Card
              key={i}
              className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md hover:border-emerald-500 transition group h-full"
            >
              <div className="text-right mb-4">
                <span className="text-4xl font-bold text-gray-700 group-hover:text-emerald-400 transition">
                  {b.number}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{b.title}</h3>
              <p className="text-sm text-gray-400">{b.description}</p>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-700 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Our Pricing</h2>
            <p className="text-gray-400 max-w-2xl">
              Choose a plan that fits your goals. Upgrade anytime as you grow.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-2 rounded-lg flex shadow-sm">
            <Button
              variant={activeTab === "monthly" ? "default" : "ghost"}
              className={`px-6 py-2 rounded-md ${activeTab === "monthly"
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:text-white"
                }`}
              onClick={() => setActiveTab("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={activeTab === "yearly" ? "default" : "ghost"}
              className={`px-6 py-2 rounded-md ${activeTab === "yearly"
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:text-white"
                }`}
              onClick={() => setActiveTab("yearly")}
            >
              Yearly
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Free */}
          <Card className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow hover:shadow-md flex flex-col h-full">
            <h3 className="text-lg font-semibold text-center mb-4">Free Plan</h3>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-base text-gray-400">/month</span>
            </div>
            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
              {freeFeatures.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 border border-gray-700 rounded-md"
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
            <Button className="mt-6 bg-primary hover:bg-primary/90 text-white rounded-lg">
              Get Started
            </Button>
          </Card>

          {/* Pro */}
          <Card className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow hover:shadow-md flex flex-col h-full">
            <h3 className="text-lg font-semibold text-center mb-4">Pro Plan</h3>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold">$79</span>
              <span className="text-base text-gray-400">/month</span>
            </div>
            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
              {proFeatures.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 border border-gray-700 rounded-md"
                >
                  <div className="bg-emerald-500 p-2 rounded-md">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-gray-300">{f.text}</span>
                </div>
              ))}
            </div>
            <Button className="mt-6 bg-primary hover:bg-primary/90 text-white rounded-lg">
              Get Started
            </Button>
          </Card>

          {/* Example Third Card */}
          <Card className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow hover:shadow-md flex flex-col h-full">
            <h3 className="text-lg font-semibold text-center mb-4">Enterprise</h3>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold">Custom</span>
              <span className="text-base text-gray-400">/plan</span>
            </div>
            <p className="text-gray-400 text-center flex-1">
              Contact us for tailored solutions for teams and organizations.
            </p>
            <Button className="mt-6 bg-primary hover:bg-primary/90 text-white rounded-lg">
              Contact Sales
            </Button>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <Card
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-md hover:border-emerald-500 transition cursor-pointer"
              onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{f.question}</h3>
                {openFAQ === i ? (
                  <Minus className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Plus className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              {openFAQ === i && (
                <p className="mt-3 text-gray-400 leading-relaxed">{f.answer}</p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-10 px-4 mt-16 border-t border-gray-800">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo + Contact */}
          <div className="space-y-4">
            <div className="bg-primary p-2 rounded-md w-10 h-10 flex items-center justify-center text-white font-bold">
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
                className="bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
              >
                F
              </Button>
              <Button
                size="icon"
                className="bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
              >
                T
              </Button>
              <Button
                size="icon"
                className="bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
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
