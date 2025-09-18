import React from 'react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Brain, 
  Zap, 
  Shield, 
  Code, 
  Database, 
  MessageSquare,
  Sparkles,
  Bot,
  Users,
  Github,
  ExternalLink,
  Clock,
  CheckCircle,
  Target
} from 'lucide-react'

export default function AboutPage() {
  const techStack = [
    { name: 'Next.js 14', category: 'Frontend', icon: Code, color: 'bg-blue-500/10 text-blue-500' },
    { name: 'TypeScript', category: 'Language', icon: Code, color: 'bg-blue-600/10 text-blue-600' },
    { name: 'Tailwind CSS', category: 'Styling', icon: Sparkles, color: 'bg-cyan-500/10 text-cyan-500' },
    { name: 'LiveKit WebRTC', category: 'Real-time', icon: Zap, color: 'bg-green-500/10 text-green-500' },
    { name: 'Python 3.13+', category: 'Backend', icon: Code, color: 'bg-yellow-500/10 text-yellow-500' },
    { name: 'Gemini AI', category: 'AI Engine', icon: Brain, color: 'bg-purple-500/10 text-purple-500' },
    { name: 'mem0.ai', category: 'Memory', icon: Database, color: 'bg-pink-500/10 text-pink-500' },
    { name: 'Qdrant', category: 'Vector DB', icon: Database, color: 'bg-red-500/10 text-red-500' }
  ]

  const features = [
    {
      title: 'Real-time Communication',
      description: 'WebRTC-powered instant messaging with LiveKit Cloud infrastructure',
      icon: Zap,
      status: 'completed'
    },
    {
      title: 'Persistent Memory',
      description: 'Cross-session conversation memory using vector embeddings and RAG',
      icon: Brain,
      status: 'completed'
    },
    {
      title: 'AI Chat Agent',
      description: 'Intelligent responses powered by Google Gemini AI with contextual awareness',
      icon: Bot,
      status: 'completed'
    },
    {
      title: 'Multi-user Rooms',
      description: 'Support for multiple users in the same conversation space',
      icon: Users,
      status: 'completed'
    },
    {
      title: 'Secure Architecture',
      description: 'Isolated memory spaces and encrypted real-time communication',
      icon: Shield,
      status: 'completed'
    },
    {
      title: 'Graceful Degradation',
      description: 'Fallback systems ensure functionality even when external APIs fail',
      icon: CheckCircle,
      status: 'completed'
    }
  ]

  const projectStats = [
    { label: 'Development Time', value: '4+ weeks', icon: Clock },
    { label: 'Code Lines', value: '2,500+', icon: Code },
    { label: 'Components', value: '15+', icon: Target },
    { label: 'Features', value: '15/15 Complete', icon: CheckCircle }
  ]

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              About Memora AI Chat
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A cutting-edge real-time AI chat system with persistent memory, 
              built using modern web technologies and microservices architecture.
            </p>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {projectStats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <Card key={index} className="border-border/50 hover:border-primary/20 transition-colors bg-card/50 backdrop-blur-sm text-center">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Architecture Overview */}
          <Card className="mb-16 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center space-x-3">
                <Code className="h-6 w-6 text-primary" />
                <span>System Architecture</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-lg">
                Memora uses a microservices architecture with the following key components:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Frontend Layer</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Next.js 14 with TypeScript for type safety</li>
                    <li>• shadcn/ui components with Tailwind CSS styling</li>
                    <li>• LiveKit client for real-time WebRTC communication</li>
                    <li>• Responsive design with dark/light theme support</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Backend Services</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Python LiveKit agents with modular services</li>
                    <li>• AI Service with Gemini API integration</li>
                    <li>• Memory Service with mem0.ai and Qdrant vector DB</li>
                    <li>• Message Handler for orchestrating responses</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 mt-6">
                <h4 className="font-medium mb-2">Data Flow:</h4>
                <p className="text-sm text-muted-foreground">
                  User Message → Frontend → LiveKit Cloud → Python Agent → AI Service → Memory Service → Response Generation → Real-time Delivery
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card className="mb-16 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center space-x-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <span>Technology Stack</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {techStack.map((tech, index) => {
                  const IconComponent = tech.icon
                  return (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${tech.color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tech.name}</p>
                        <p className="text-xs text-muted-foreground">{tech.category}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="mb-16 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center space-x-3">
                <Target className="h-6 w-6 text-primary" />
                <span>Key Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => {
                  const IconComponent = feature.icon
                  return (
                    <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{feature.title}</h3>
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center">
            <Card className="inline-block border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold">Ready to Experience AI Chat?</h2>
                  <p className="text-muted-foreground">
                    Start a conversation and see the power of persistent memory in action.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80">
                    <Link href="/dashboard">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Start Chatting
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/features">
                      <ExternalLink className="w-5 h-5 mr-2" />
                      View Features
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}