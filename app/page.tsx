import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Heart, Camera, BookOpen, Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Camera className="h-6 w-6" />,
      title: 'Capture Moments',
      description: 'Easily capture and store your precious memories with photos, notes, and voice recordings'
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Organize Stories',
      description: 'Create beautiful timelines and collections to organize your memories by themes, dates, or people'
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Rediscover Magic',
      description: 'Get gentle reminders and suggestions to revisit and relive your most cherished moments'
    },
  ]

  return (
    <>
      {/* Skip link for accessibility */}
      <Link href="#main-content" className="skip-link">
        Skip to main content
      </Link>
      
      <div id="main-content" className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 py-20 sm:py-32">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
          <div className="relative">
            <div className="text-center">
              <Badge variant="secondary" className="mb-6 px-4 py-2">
                <Heart className="h-3 w-3 mr-2 text-red-500" />
                Your Personal Memory Companion
              </Badge>
              
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                <span className="block">Capture Life's</span>
                <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Beautiful Moments
                </span>
              </h1>
              
              <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto sm:text-xl">
                Memora helps you preserve, organize, and rediscover your most precious memories. 
                Create a digital sanctuary for your life's most meaningful moments.
              </p>
              
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button size="lg" className="px-8 py-3 text-base" asChild>
                  <Link href="/dashboard">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8 py-3 text-base" asChild>
                  <Link href="/about">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-32" aria-labelledby="features-heading">
          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to preserve your memories
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make memory keeping effortless and joyful
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-primary py-20 sm:py-32" aria-labelledby="cta-heading">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
          <div className="relative text-center">
            <Brain className="mx-auto h-16 w-16 text-primary-foreground/80 mb-6" />
            <h2 id="cta-heading" className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to start preserving your memories?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90 max-w-2xl mx-auto">
              Join thousands of people who trust Memora to keep their most precious moments safe and organized.
            </p>
            <div className="mt-10">
              <Button size="lg" variant="secondary" className="px-8 py-3 text-base" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

// Add metadata for this page
export const metadata = {
  title: 'Home',
  description: 'Memora - Your personal memory companion. Capture, organize, and rediscover your most precious moments.',
  openGraph: {
    title: 'Memora - Your Personal Memory Companion',
    description: 'Capture, organize, and rediscover your most precious moments with Memora.',
    type: 'website',
  },
}