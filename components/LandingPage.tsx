"use client"

import { SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CheckSquare, 
  Mic, 
  Calendar, 
  Zap, 
  Brain, 
  Clock, 
  Users, 
  Star,
  ArrowRight,
  MessageSquare,
  Sparkles
} from "lucide-react"

export function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Task Parser</span>
            </div>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </SignInButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4 px-3 py-1">
            <Sparkles className="w-4 h-4 mr-1" />
            AI-Powered Task Management
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Task Parser
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Transform your thoughts into organized tasks with the power of AI
          </p>
          
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Simply speak or type your plans in natural language, and watch as our intelligent system 
            automatically parses, organizes, and schedules your tasks with precision.
          </p>

          <SignInButton mode="modal">
            <Button size="lg" className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700">
              Start Planning with Ease
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </SignInButton>
        </div>
      </section>

      {/* Problem Section */}
      <section className="w-full px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Problem We Solve
            </h2>
            <p className="text-lg text-gray-600">
              Traditional task management is broken. Here's why:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Time-Consuming Setup</h3>
                <p className="text-gray-600">
                  Manually creating tasks, setting dates, and organizing schedules takes forever
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Complex Interfaces</h3>
                <p className="text-gray-600">
                  Most apps require you to learn complicated systems instead of just telling them what you need
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Context Switching</h3>
                <p className="text-gray-600">
                  Jumping between different apps and tools breaks your flow and reduces productivity
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="w-full bg-white/50 px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Solution
            </h2>
            <p className="text-lg text-gray-600">
              Task Parser makes task management as natural as having a conversation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Natural Language Input</h3>
                    <p className="text-gray-600">
                      Just speak or type naturally: "Schedule a team meeting tomorrow at 2 PM and prepare the quarterly report by Friday"
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Parsing</h3>
                    <p className="text-gray-600">
                      Our advanced AI understands context, extracts tasks, dates, priorities, and locations automatically
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Organization</h3>
                    <p className="text-gray-600">
                      Tasks are automatically organized, scheduled, and synced with your calendar - no manual work required
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Results</h3>
                    <p className="text-gray-600">
                      From thought to organized schedule in seconds - spend more time doing, less time planning
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  <span className="text-sm opacity-90">Voice Input</span>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm italic">
                    "I need to call the dentist tomorrow morning, finish the project proposal by Wednesday, 
                    and schedule a team lunch next Friday at noon"
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <Brain className="w-4 h-4" />
                  <span>AI Processing...</span>
                </div>
                <div className="space-y-2">
                  <div className="bg-white/10 rounded p-2 text-sm">
                    ✓ Call dentist - Tomorrow 9:00 AM
                  </div>
                  <div className="bg-white/10 rounded p-2 text-sm">
                    ✓ Project proposal - Due Wednesday
                  </div>
                  <div className="bg-white/10 rounded p-2 text-sm">
                    ✓ Team lunch - Next Friday 12:00 PM
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features designed for modern productivity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Mic className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Voice Input</h3>
                <p className="text-gray-600 text-sm">Speak your tasks naturally and watch them get organized instantly</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Brain className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">AI Parsing</h3>
                <p className="text-gray-600 text-sm">Advanced AI understands context, dates, priorities, and locations</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Calendar className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Calendar Sync</h3>
                <p className="text-gray-600 text-sm">Seamlessly sync with Google Calendar and other calendar apps</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <CheckSquare className="w-8 h-8 text-orange-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Smart Organization</h3>
                <p className="text-gray-600 text-sm">Automatic categorization, priority setting, and scheduling</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Zap className="w-8 h-8 text-yellow-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-gray-600 text-sm">From thought to organized task in seconds, not minutes</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <MessageSquare className="w-8 h-8 text-red-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Feedback System</h3>
                <p className="text-gray-600 text-sm">Built-in feedback system to continuously improve your experience</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of users who have revolutionized their task management with AI
          </p>

          <SignInButton mode="modal">
            <Button size="lg" className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700">
              Start Planning with Ease
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </SignInButton>

          <p className="text-sm text-gray-500 mt-4">
            Free to start • No credit card required • Setup in seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t bg-gray-50 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Task Parser</span>
          </div>
          <p className="text-center text-gray-500 text-sm mt-2">
            AI-powered task management made simple
          </p>
        </div>
      </footer>
    </div>
  )
}
