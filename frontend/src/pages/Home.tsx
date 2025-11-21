import { Button } from '@/components/ui/button'
import { Sparkles, BookOpen, Zap, Brain, ArrowRight, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="grid md:grid-cols-2 gap-8 p-6 md:p-12 lg:p-16 items-center">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-900 px-4 py-2 rounded-full w-fit text-sm font-medium">
            <Sparkles className="size-4" />
            AI-Powered Learning
          </div>
          <h1 className="font-bold text-4xl md:text-6xl lg:text-7xl leading-tight">
            Study Smarter<br />with <span className="text-yellow-500">Cogni</span>.lol
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-lg">
            Transform your PDFs into interactive courses with AI summaries. Learn faster, remember longer, and ace your exams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" variant="yellow" asChild className="text-lg px-8">
              <Link to="/courses">
                Get Started Free
                <ArrowRight className="size-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            No credit card required. Start learning in seconds.
          </p>
        </div>
        <div className="relative">
          <img
            src="https://as1.ftcdn.net/v2/jpg/02/95/95/40/1000_F_295954097_M5rS7QVO801luSnfLpKE4uIxI4jLvVF8.jpg"
            alt="Student learning with Cogni.lol"
            className="w-full h-full object-cover rounded-3xl"
          />
          <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl border-2 border-yellow-400">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-xl">
                <Brain className="size-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-bold text-lg">AI Summaries</p>
                <p className="text-sm text-muted-foreground">Instant insights</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need to <span className="text-yellow-500">excel</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Cogni.lol uses cutting-edge AI to transform your study materials into engaging, digestible content.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border-2 border-slate-200">
              <div className="bg-yellow-100 p-4 rounded-xl w-fit mb-4">
                <Zap className="size-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Upload your PDFs and get AI-generated summaries in seconds. No more hours of reading.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border-2 border-slate-200">
              <div className="bg-blue-100 p-4 rounded-xl w-fit mb-4">
                <Brain className="size-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered</h3>
              <p className="text-muted-foreground">
                Claude AI extracts key concepts and creates comprehensive summaries tailored to your learning.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border-2 border-slate-200">
              <div className="bg-green-100 p-4 rounded-xl w-fit mb-4">
                <BookOpen className="size-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Organized Courses</h3>
              <p className="text-muted-foreground">
                Keep all your study materials organized by course. Access everything in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Start learning in <span className="text-yellow-500">3 simple steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-yellow-500 text-white text-2xl font-bold rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Upload Your PDFs</h3>
              <p className="text-muted-foreground">
                Drag and drop your lecture notes, textbooks, or study guides.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-500 text-white text-2xl font-bold rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">AI Summarizes</h3>
              <p className="text-muted-foreground">
                Our AI instantly analyzes and creates comprehensive summaries.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-500 text-white text-2xl font-bold rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Study & Ace Exams</h3>
              <p className="text-muted-foreground">
                Review summaries, master concepts, and crush your tests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-yellow-50 py-16 md:py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by students from brisbane to the gold coast
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500 text-xl">★</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "Cog- Cogn- Cogni? is that what we called it?. Cogni is one of the best study tools i used to cram my assignment the day before it was due."
              </p>
              <p className="font-semibold">- William Qu, President and Leader of the Code Network QUT Now and Forever</p>
            </div>

            <div className="bg-white p-6 rounded-2xl">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500 text-xl">★</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "It boosted my GPA and made me a multi-billionaire at 19 years old."
              </p>
              <p className="font-semibold">- Yiming He, Professional Uber Eats Orderer</p>
            </div>

            <div className="bg-white p-6 rounded-2xl col-span-2 mx-auto w-1/2">
              <div className="flex gap-1 mb-3">
                {[...Array(1)].map((_, i) => (
                  <span key={i} className="text-yellow-500 text-xl">★</span>
                ))}
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="text-gray-300 text-xl">★</span>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "just study??"
              </p>
              <p className="font-semibold">- William Jackson, put a title here. Don't put it club treasuer please.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to transform your studying?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students who are learning smarter with Cogni.lol. Get started for free today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button size="lg" variant="yellow" asChild className="text-lg px-10">
              <Link to="/courses">
                Start Learning Now
                <ArrowRight className="size-5 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-500" />
              Free to start
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-500" />
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-500" />
              Unlimited courses
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
