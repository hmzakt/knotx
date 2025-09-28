"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PlaneTakeoff,
  Target,
  Users,
  BookOpen,
  Brain,
  Trophy,
  ArrowRight,
  CheckCircle,
  Star,
  MessageCircle,
  BarChart3,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouteLoading } from "@/contexts/RouteLoadingContext";
import { motion } from "framer-motion";

export default function About() {
  const { start } = useRouteLoading();

  const values = [
    {
      icon: <Target className="w-8 h-8 text-emerald-500" />,
      title: "Student-First Approach",
      description: "Every feature is designed with DGCA students' needs at the forefront, ensuring maximum relevance and effectiveness.",
    },
    {
      icon: <Zap className="w-8 h-8 text-emerald-500" />,
      title: "Innovation & Excellence",
      description: "We continuously innovate to provide cutting-edge tools and resources that give students a competitive edge.",
    },
    {
      icon: <Users className="w-8 h-8 text-emerald-500" />,
      title: "Community Support",
      description: "Building a supportive community where students can learn, grow, and succeed together in their aviation journey.",
    },
  ];

  const currentFeatures = [
    {
      icon: <BookOpen className="w-6 h-6 text-emerald-500" />,
      title: "Structured Test Series",
      description: "Comprehensive test series designed to mirror real DGCA exam conditions",
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
      title: "Practice Papers",
      description: "Curated practice papers with detailed explanations and analytics",
    },
  ];

  const upcomingFeatures = [
    {
      icon: <Brain className="w-6 h-6 text-emerald-500" />,
      title: "AI Help Chat",
      description: "24/7 AI-powered assistance for instant doubt resolution",
    },
    {
      icon: <Trophy className="w-6 h-6 text-emerald-500" />,
      title: "Leaderboard",
      description: "Compete with peers and track your progress on the leaderboard",
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-emerald-500" />,
      title: "Community Forums",
      description: "Connect with fellow students and share knowledge",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-emerald-500" />,
      title: "Advanced Analytics",
      description: "Detailed performance insights and personalized study recommendations",
    },
  ];

  const stats = [
    { number: "1000+", label: "Students Helped" },
    { number: "50+", label: "Practice Papers" },
    { number: "10+", label: "Test Series" },
    { number: "95%", label: "Success Rate" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-emerald-900/30 text-foreground font-vietnam">
      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-16 md:py-24">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
          {/* Left content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-3 bg-black/80 backdrop-blur-sm border border-emerald-700 px-6 py-3 rounded-xl shadow-lg">
                <div className="bg-emerald-500/20 p-3 rounded-lg">
                  <PlaneTakeoff className="w-6 h-6 text-emerald-500" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  <span className="text-emerald-500">About</span>{" "}
                  <span className="text-foreground">Knotx</span>
                </h1>
              </div>

              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                Empowering DGCA Students Through
                <span className="text-emerald-500"> Smart Practice</span>
              </h2>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Knotx was born from a simple observation: DGCA exam preparation lacked 
                structured, effective practice resources. As a computer science student 
                passionate about aviation, I created Knotx with one clear mission - to 
                make practice easier and more effective for every DGCA student.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/explore" onClick={() => start("nav")}>
                  <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                    Explore Our Platform
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/" onClick={() => start("nav")}>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 font-medium px-8 py-4 text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Back to Home
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right visual */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-black/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-emerald-700/50">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 rounded-xl p-4 border border-emerald-700 shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg mb-2 shadow-sm"></div>
                      <div className="h-2 bg-emerald-600 rounded mb-1"></div>
                      <div className="h-2 bg-emerald-700 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-black/50 backdrop-blur-sm relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>
        </div>
        <div className="relative container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Our <span className="text-emerald-500">Mission</span> & Vision
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to revolutionize DGCA exam preparation through technology, 
              making it more accessible, effective, and engaging for students worldwide.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200 dark:border-emerald-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-emerald-500 p-3 rounded-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Our Mission</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  To provide DGCA students with comprehensive, structured practice resources 
                  that bridge the gap between theoretical knowledge and exam success. We believe 
                  that with the right tools and guidance, every student can achieve their aviation dreams.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full bg-gradient-to-br from-black/50 to-slate-900/50 border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-emerald-500 p-3 rounded-lg">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Our Vision</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  To become the leading platform for DGCA exam preparation, empowering 
                  thousands of students to achieve their aviation career goals through 
                  innovative technology, personalized learning, and a supportive community.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gradient-to-r from-emerald-900/10 to-black/20 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-black/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Our <span className="text-emerald-500">Core Values</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              These principles guide everything we do at Knotx, ensuring we stay true to our mission.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full text-center hover:shadow-lg transition-shadow bg-card border-border">
                  <div className="flex justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-black/70 backdrop-blur-sm relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-32 left-32 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-32 right-32 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>
        </div>
        <div className="relative container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              What We <span className="text-emerald-500">Offer</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Currently available features and exciting upcoming additions to enhance your learning experience.
            </p>
          </motion.div>

          {/* Current Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h3 className="text-2xl font-semibold mb-8 text-center">Currently Available</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentFeatures.map((feature, index) => (
                <Card key={index} className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700">
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-500 p-2 rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-semibold mb-8 text-center">Coming Soon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingFeatures.map((feature, index) => (
                <Card key={index} className="p-6 bg-emerald-900/20 border-emerald-700">
                  <div className="text-center">
                    <div className="bg-emerald-500 p-3 rounded-lg mx-auto mb-4 w-fit">
                      {feature.icon}
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-emerald-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
              The numbers speak for themselves - we're making a real difference in students' lives.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-emerald-100 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-black to-emerald-900/20 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-black/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Your <span className="text-emerald-500">Aviation Journey?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of students who are already using Knotx to achieve their DGCA exam goals. 
              Start practicing today and take the first step towards your aviation career.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/explore" onClick={() => start("nav")}>
                <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-4 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  Start Practicing Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/" onClick={() => start("nav")}>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 font-medium px-8 py-4 text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
